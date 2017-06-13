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
var multiparty = require('multiparty');
var PersonalFile = AV.Object.extend('PersonalFile');
var Order = AV.Object.extend('Order');
var Recharge = AV.Object.extend('Recharge');

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

function parseArray(arrStr) {
    var tempKey = 'arr23' + new Date().getTime();//arr231432350056527
    var arrayJsonStr = '{"' + tempKey + '":' + arrStr + '}';
    var arrayJson;
    if (JSON && JSON.parse) {
        arrayJson = JSON.parse(arrayJsonStr);
    } else {
        arrayJson = eval('(' + arrayJsonStr + ')');
    }
    return arrayJson[tempKey];
};

router.post('/add', function (req, res) {
    let num = req.body.num;
    let user = AV.Object.createWithoutData('WxUser', req.body.user_id);
    user.increment('points', -num);
    let order = new Order();
    order.set('price', 10);
    order.set('points', num);
    order.set('user', user);
    order.save();
    let time = Math.round(new Date().getTime() / 1000).toString();
    let imglist = req.body.imglist.split(',');
    let flag = 1;
    if (imglist[0] == '') {
        flag = 0;
    }
    let data = { "content": req.body.content, "image": imglist, "age": req.body.age + "岁", "sex": "女" };
    chunyu.createFree(user.id, time, data, flag).then(function (data) {
        res.jsonp({ error: 0, id: data });
    });
});

router.get('/problem/:user_id/:problem_id/:content_id', function (req, res) {
    let time = Math.round(new Date().getTime() / 1000).toString();
    let user_id = req.params.user_id;
    let problem_id = req.params.problem_id;
    let content_id = req.params.content_id
    chunyu.problemDetail(user_id, problem_id, content_id, time).then(function (data) {
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

router.post('/upload', function (req, res) {
    let form = new multiparty.Form();
    form.parse(req, function (err, fields, files) {
        var iconFile = files.iconImage[0];
        if (iconFile.size !== 0) {
            fs.readFile(iconFile.path, function (err, data) {
                if (err) {
                    return res.send('读取文件失败');
                }
                var theFile = new AV.File(iconFile.originalFilename, data);
                theFile.save().then(function (theFile) {
                    theFile.fetch().then(function () {
                        res.send({ img: theFile.get('url') });
                    });
                }).catch(console.error);
            });
        } else {
            res.send('请选择一个文件。');
        }
    });
});

router.post('/health/add', function (req, res) {
    let name = req.body.name;
    let age = req.body.age * 1;
    let user_id = req.body.user_id;
    let user = AV.Object.createWithoutData('WxUser', user_id);
    let person = new PersonalFile();
    person.set('name', name);
    person.set('age', age);
    if (typeof (user.id) != "undefined") {
        person.set('user', user);
        person.save().then(function () {
            res.jsonp({ error: 0 })
        });
    } else {
        res.jsonp({ error: 1, msg: "账号不存在" });
    }
});

router.get('/health/:user_id', function (req, res) {
    let user_id = req.params.user_id;
    let query = new AV.Query('PersonalFile');
    let user = AV.Object.createWithoutData('WxUser', user_id);
    query.equalTo('user', user);
    query.find().then(function (results) {
        if (results.length == 0) {
            res.jsonp({ error: 0, count: 0 });
        } else {
            res.jsonp({ error: 0, data: results });
        }
    });
});

router.get('/health/delete/:id', function (req, res) {
    let id = req.params.id;
    let person = AV.Object.createWithoutData('PersonalFile', id);
    person.destroy();
    res.jsonp({ error: 0 });
});

router.post('/doctor/list', function (req, res) {
    let clinic_no = req.body.clinic_no;
    let num = req.body.num * 1;
    let province = req.body.province;
    let city = req.body.city;
    let user_id = req.body.user_id;
    let time = Math.round(new Date().getTime() / 1000).toString();
    chunyu.doctorList(user_id, clinic_no, num, province, city, time).then(function (data) {
        res.jsonp(data);
    });
});

router.get('/doctor/detail/:user_id/:doctor_id', function (req, res) {
    let time = Math.round(new Date().getTime() / 1000).toString();
    chunyu.doctorDetail(req.params.user_id, req.params.doctor_id, time).then(function (data) {
        res.jsonp(data);
    });
});

router.post('/choice', function (req, res) {
    let user_id = req.body.user_id;
    let num = req.body.num * 1;
    let price = req.body.price * 1;
    let doctor_id = req.body.doctor_id;
    let user = AV.Object.createWithoutData('WxUser', user_id);
    user.increment('points', -num);
    let order = new Order();
    order.set('points', num);
    order.set('price', price / 100);
    order.set('user', user);
    let time = Math.round(new Date().getTime() / 1000).toString();
    let imglist = req.body.imglist.split(',');
    let data = { "content": req.body.content, "image": imglist, "age": req.body.age + "岁", "sex": "女", "dotcors": doctor_id };
    order.save().then(function (order) {
        chunyu.createPay(user_id, time, data, order.id, price).then(function (data) {
            chunyu.successNotice(user_id, data, time).then(function (data) {
                res.jsonp({ id: data.problems[0].problem_id });
            });
        });
    }, function (err) {
        console.log(err);
    });
});

router.post('/problem/add', function (req, res) {
    let user_id = req.body.user_id;
    let problem_id = req.body.problem_id;
    let content = req.body.content;
    let time = Math.round(new Date().getTime() / 1000).toString();
    chunyu.problemAdd(user_id, problem_id, content, time).then(function (data) {
        res.jsonp(data);
    });
});

router.post('/problem/imageadd', function (req, res) {
    let user_id = req.body.user_id;
    let problem_id = req.body.problem_id;
    let url = req.body.url;
    let time = Math.round(new Date().getTime() / 1000).toString();
    chunyu.problemImageAdd(user_id, problem_id, url, time).then(function (data) {
        res.jsonp(data);
    });
});

router.post('/recharge/add', function (req, res) {
    let user_id = req.body.user_id;
    let goods = req.body.goods;
    let price = req.body.price * 1;
    let user = AV.Object.createWithoutData('WxUser', user_id);
    let recharge = new Recharge();
    recharge.set('result', false);
    recharge.set('title', goods);
    recharge.set('source', "app");
    recharge.set('price', price);
    recharge.set('user', user);
    recharge.save().then(function (data) {
        res.jsonp({ id: data.id });
    });
});

module.exports = router;