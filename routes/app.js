'use strict';
var router = require('express').Router();
var AV = require('leanengine');
var request = require('request-json');
var appid = process.env.wx_appid;
var secret = process.env.wx_secret;
var partner_key = process.env.partner_key;
var WxUser = AV.Object.extend('WxUser');
var Problem = AV.Object.extend('Problem');
var chunyu = require('../routes/chunyu');
var multiparty = require('multiparty');
var fs = require('fs');
var async = require('async');

router.get('/points/:user_id', function (req, res) {
    let user_id = req.params.user_id;
    let user = AV.Object.createWithoutData('WxUser', user_id);
    user.fetch().then(function () {
        res.jsonp({ error: 0, msg: "", points: user.get('points') });
    });
});

router.get('/login/:user_id', function (req, res) {
    let time = Math.round(new Date().getTime() / 1000).toString();
    let user_id = req.params.user_id;
    chunyu.login(user_id, time);
    res.jsonp({ error: 0, msg: "" });
});

router.post('/add', function (req, res) {
    let num = req.body.num;
    let user = AV.Object.createWithoutData('WxUser', req.body.user_id);
    user.increment('points', -num);
    user.save().then(function (user) {
        let time = Math.round(new Date().getTime() / 1000).toString();
        let imglist = req.body.imglist.split(',');
        let data = { "content": req.body.content, "image": imglist, "age": req.body.age + "岁", "sex": "女" };
        chunyu.createFree(user.id, time, data).then(function (data) {
            res.jsonp({ error: 0, id: data });
        });
    });
});

router.get('/problem/:user_id/:problem_id', function (req, res) {
    let time = Math.round(new Date().getTime() / 1000).toString();
    let user_id = req.params.user_id;
    let problem_id = req.params.problem_id;
    chunyu.problemDetail(user_id, problem_id, time).then(function (data) {
        res.jsonp(data);
    });
});

router.get('/problemList/:user_id', function (req, res) {
    let time = Math.round(new Date().getTime() / 1000).toString();
    let user_id = req.params.user_id;
    chunyu.problemList(user_id, time).then(function (data) {
        res.jsonp(data);
    });
});
module.exports = router;