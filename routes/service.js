'use strict';
var router = require('express').Router();
var AV = require('leanengine');
var request = require('request-json');
var async = require('async');
var moment = require('moment');
var appid = process.env.wx_appid;
var secret = process.env.wx_secret;
var WxUser = AV.Object.extend('WxUser');
var O2O = AV.Object.extend('O2O');
var Service = AV.Object.extend('Service');

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
    let phone = req.body.phone;
    let error = req.body.error;
    let count = req.body.count * 1;
    let express = req.body.express;
    let expressid = req.body.expressid;
    let sender = req.body.sender;
    let address = req.body.address;
    let buy = req.body.buy;
    let productid = req.body.productid;
    let notice = req.body.notice;
    let service = new Service();
    service.set('isDel', false);
    service.set('user', user);
    service.set('phone', phone);
    service.set('error', error);
    service.set('express', express);
    service.set('address', address);
    service.set('status', 0);
    service.set('wheretobuy', buy);
    service.set('count', count);
    service.set('sender', sender);
    service.set('productid', productid);
    service.set('notice', notice);
    service.set('expressid', expressid);
    let time = new moment();
    service.set('orderid', time.unix());
    let o2oQuery = new AV.Query('O2O');
    o2oQuery.equalTo('isDel', false);
    o2oQuery.equalTo('user', user);
    o2oQuery.first().then(function (o2o) {
        if (typeof (o2o) != "undefined") {
            service.set('o2o', o2o);
            service.save().then(function () {
                res.jsonp({ code: 0, msg: "" });
            }, function (err) {
                console.log(err);
            });
        } else {
            service.save().then(function () {
                res.jsonp({ code: 0, msg: "" });
            }, function (err) {
                console.log(err);
            });
        }
    });
});

router.post('/advice/add', function (req, res) {
    let service = AV.Object.createWithoutData('Service', req.body.service_id);
    service.set('score', req.body.score * 1);
    service.set('advice', req.body.content);
    service.save().then(function () {
        res.jsonp(1);
    }, function (err) {
        res.jsonp(err);
    });
});
module.exports = router;

