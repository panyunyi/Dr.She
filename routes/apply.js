'use strict';
var router = require('express').Router();
var AV = require('leanengine');
var request = require('request-json');
var async = require('async');
var moment = require('moment');
var Business = AV.Object.extend('Business');
var Donate = AV.Object.extend('Donate');
var appid = process.env.wx_appid;
var secret = process.env.wx_secret;
var WxUser = AV.Object.extend('WxUser');

router.get('/', function (req, res) {
    let sess = req.session;
    let code = req.query.code;
    let state = req.query.state;
    let client = request.createClient('https://api.weixin.qq.com/sns/oauth2/');
    client.get('access_token?appid=' + appid + '&secret=' + secret + '&code=' + code + '&grant_type=authorization_code', function (err, res1, body) {
        if (body != "undefined" && typeof (body.openid) != "undefined") {
            client = request.createClient('https://api.weixin.qq.com/sns/');
            client.get('userinfo?access_token=' + body.access_token + '&openid=' + body.openid + '&lang=zh_CN', function (err2, res2, body2) {
                if (body2 != "undefined" && typeof (body2.openid) != "undefined") {
                    let openid = body2.openid;
                    let query = new AV.Query('WxUser');
                    query.equalTo('openid', openid);
                    query.count().then(function (count) {
                        if (count == 0) {
                            let wxuser = new WxUser();
                            wxuser.set('openid', openid);
                            wxuser.set('nickname', body2.nickname);
                            wxuser.set('sex', body2.sex == 1 ? "男" : "女");
                            wxuser.set('city', body2.city);
                            wxuser.set('province', body2.province);
                            wxuser.set('country', body2.country);
                            wxuser.set('headimgurl', body2.headimgurl);
                            wxuser.set('points', 2);
                            wxuser.set('unionid', body2.unionid);
                            wxuser.save().then(function (data) {
                                sess.objidid = data.id;
                                res.render('apply', { objid: data.id });
                            }, function (err) {
                                console.log(err);
                            });
                        } else if (count == 1) {
                            query.first().then(function (data) {
                                sess.objid = data.id;
                                data.set('unionid', body2.unionid);
                                data.save();
                                res.render('apply', { objid: data.id });
                            });
                        } else {
                            res.redirect('../advise');
                        }
                    });
                } else {
                    res.redirect('../advise');
                }
            });
        } else {
            res.redirect('../advise');
        }
    });
});

router.post('/msg', function (req, res) {
    let phone = req.body.phone;
    AV.Cloud.requestSmsCode({
        mobilePhoneNumber: phone,  // 目标手机号
        template: '注册',       // 控制台预设的模板名称
        sign: '星天使'             // 控制台预设的短信签名
    }).then(function () {
        //调用成功
        res.json({ code: code });
    }, function (err) {
        //调用失败
        console.log(err);
    });
});

router.post('/verify', function (req, res) {
    let phone = req.body.phone;
    let code = req.body.code;
    AV.Cloud.verifySmsCode(code, phone).then(function () {
        //验证成功
        res.jsonp({ code: 0 });
    }, function (err) {
        //验证失败
        res.jsonp({ code: 1, msg: "验证码不正确" });
    });
});

router.post('/add', function (req, res) {
    let userid = req.body.objid;
    let user = AV.Object.createWithoutData('WxUser', userid);
    let name = req.body.name;
    let phone = req.body.phone;
    let address = req.body.address;
    let company = req.body.company;
    let donateQuery = new AV.Query('Donate');
    donateQuery.equalTo('user', user);
    donateQuery.equalTo('title',"商户注册领取");
    donateQuery.count().then(function (count) {
        if (count == 0) {
            let business = new Business();
            business.set('name', company);
            business.set('phone', phone);
            business.set('address', address);
            business.set('connecter', name);
            business.set('user', user);
            business.save().then(function () {
                let donate = new Donate();
                donate.set('user', user);
                donate.set('points', 60);
                donate.set('source', "wechat");
                donate.set('title', "商户注册领取");
                donate.save().then(function () {
                    user.increment('points', 60);
                    user.save().then(function () {
                        res.jsonp({ code: 0 });
                    });
                });
            });
        } else {
            res.jsonp({ code: 1, msg: "您已领取过，无法重复领取。" });
        }
    });
});

router.get('/success', function (req, res) {
    res.render('success');
});
module.exports = router;

