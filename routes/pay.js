'use strict';
var router = require('express').Router();
var AV = require('leanengine');
var request = require('request-json');
var appid = process.env.wx_appid;
var secret = process.env.wx_secret;
var chunyu = require('../routes/chunyu');
var async = require('async');
var moment = require('moment');
var WXPay = require('weixin-pay');
var pingpp_key = process.env.pingpp_key;
var pingpp = require('pingpp')(pingpp_key);
pingpp.setPrivateKeyPath("./public/rsa_key.pem");
var wxpay = WXPay({
    appid: appid,
    mch_id: '1262876201',
    partner_key: 'syyl1234syyl1234syyl1234syyl1234'
});

function getTokenAndSendMsg(data) {
    let client = request.createClient('https://api.weixin.qq.com/cgi-bin/');
    client.get('token?grant_type=client_credential&appid=' + appid + '&secret=' + secret, function (err, res, body) {
        let token = body.access_token;
        client = request.createClient('https://api.weixin.qq.com/cgi-bin/message/template/');
        client.post('send?access_token=' + token, data, function (err, res, body) {
            console.log(body);
        });
    });
}

router.post('/app/alipay', function (req, res) {
    let subject = req.body.subject;
    let body = req.body.body;
    let amount = req.body.amount * 1;
    let order_no = req.body.order_no;
    pingpp.charges.create({
        subject: subject,
        body: body,
        amount: amount,//订单总金额, 人民币单位：分（如订单总金额为 1 元，此处请填 100）
        order_no: order_no,
        channel: "alipay",
        currency: "cny",
        client_ip: req.headers['x-real-ip'],
        app: { id: "app_urrbfHSGKuXLa90a" }
    }, function (err, charge) {
        // YOUR CODE
        console.log(err);
        res.jsonp(charge);
    });
});

router.post('/app/wxpay', function (req, res) {
    let subject = req.body.subject;
    let body = req.body.body;
    let amount = req.body.amount * 1;
    let order_no = req.body.order_no;
    pingpp.charges.create({
        subject: subject,
        body: body,
        amount: amount,//订单总金额, 人民币单位：分（如订单总金额为 1 元，此处请填 100）
        order_no: order_no,
        channel: "wx",
        currency: "cny",
        client_ip: req.headers['x-real-ip'],
        app: { id: "app_urrbfHSGKuXLa90a" }
    }, function (err, charge) {
        // YOUR CODE
        console.log(err);
        res.jsonp(charge);
    });
});

router.get('/', function (req, res) {
    let points = req.query.points;
    let name = req.query.name;
    let hospital = req.query.hospital;
    let purchase_num = req.query.purchase_num;
    let doctor_id = req.query.doctor_id;
    let sess = req.session;
    let user = AV.Object.createWithoutData('WxUser', sess.objid);
    user.fetch().then(function () {
        if (points == 2) {
            res.render('pay', { points: points, title: "快问医生", now: user.get('points'), hospital: hospital });
        }
        else if (points > 2) {
            res.render('pay1', { points: points - user.get('points'), title: name, now: user.get('points'), hospital: hospital, doctor_id: doctor_id, purchase_num: purchase_num });
        } else
            res.render('pay', { points: 0, title: "充值", now: user.get('points') });
    });
});

var Recharge = AV.Object.extend('Recharge');
router.post('/recharge', function (req, res) {
    let time = Math.round(new Date().getTime() / 1000).toString();
    let sess = req.session;
    let points = req.body.points * 1;
    let money = req.body.points * 1 * 5;
    let user = AV.Object.createWithoutData('WxUser', sess.objid);
    user.fetch().then(function (user) {
        let recharge = new Recharge();
        recharge.set('result', false);
        recharge.set('title', "积分充值");
        recharge.set('source', "wechat");
        recharge.set('price', money);
        recharge.set('user', user);
        recharge.save().then(function (data) {
            wxpay.getBrandWCPayRequestParams({
                openid: user.get('openid'),
                body: '星天使积分充值',
                detail: '星天使',
                out_trade_no: data.id,
                total_fee: money * 100,
                //total_fee: 1,
                spbill_create_ip: req.headers['x-real-ip'],
                notify_url: 'http://drshe.leanapp.cn/pay/wxpay/notify'
            }, function (err, result) {
                res.send({ payargs: result })
            });
        });
    });
});

router.post('/pingpp/notify', function (req, res) {
    let body=req.body;
    let order_no=body.data.object.order_no;
    let recharge = AV.Object.createWithoutData('Recharge', order_no);
    recharge.set('orderid',body.data.object.id);
    recharge.set('result',body.data.object.paid);
    recharge.save().then(function(){
        res.sendStatus(200);
    });
});

router.use('/wxpay/notify', wxpay.useWXCallback(function (msg, req, res, next) {
    // 处理商户业务逻辑

    // res.success() 向微信返回处理成功信息，res.fail()返回失败信息。
    let result_code = msg.result_code;
    let openid = msg.openid;
    let out_trade_no = msg.out_trade_no;
    let transaction_id = msg.transaction_id;
    let total_fee = msg.total_fee * 1;
    res.success();
    if (result_code == "SUCCESS") {
        let recharge = AV.Object.createWithoutData('Recharge', out_trade_no);
        if (typeof (recharge) == "undefined") {
            res.success();
        }
        recharge.set('orderid', transaction_id);
        recharge.set('result', true);
        recharge.set('total_fee', total_fee);
        recharge.save().then(function () {
            let userQuery = new AV.Query('WxUser');
            userQuery.equalTo('openid', openid);
            userQuery.first().then(function (user) {
                if (typeof (user) != "undefined") {
                    let points = total_fee / 500;
                    user.increment('points', points);
                    user.save().then(function () {
                        let data = {
                            touser: openid, template_id: "T8oqAWv2rv-4-_5cOgqubqbhNuGEUDEiIR9N2PAqt6M", url: '', "data": {
                                "first": {
                                    "value": "您好，您已经成功充值积分。",
                                    "color": "#173177"
                                },
                                "accountType": {
                                    "value": "积分",
                                    "color": "#173177"
                                },
                                "account": {
                                    "value": points,
                                    "color": "#173177"
                                },
                                "amount": {
                                    "value": total_fee / 100,
                                    "color": "#173177"
                                },
                                "result": {
                                    "value": "充值成功",
                                    "color": "#173177"
                                },
                                "remark": {
                                    "value": "备注：如有疑问请拨打客服电话400-600-0414联系我们。",
                                    "color": "#173177"
                                }
                            }
                        };
                        getTokenAndSendMsg(data);
                    });
                }
                res.success();
            });
        });
    } else {
        res.success();
    }
}));
module.exports = router;

