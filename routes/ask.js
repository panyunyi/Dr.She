'use strict';
var router = require('express').Router();
var AV = require('leanengine');
var request = require('request-json');
var appid = process.env.wx_appid;
var secret = process.env.wx_secret;
var WxUser = AV.Object.extend('WxUser');
var Problem = AV.Object.extend('Problem');
var chunyu = require('../routes/chunyu');
var multiparty = require('multiparty');
var fs = require('fs');
var async = require('async');
var Order = AV.Object.extend('Order');

router.get('/', function (req, res) {
    let sess = req.session;
    let doctor_id = req.query.doctor_id;
    let image = req.query.image;
    let name = req.query.name;
    let hospital = req.query.hospital;
    let clinic = req.query.clinic;
    let title = req.query.title;
    let price = req.query.price;
    let user = AV.Object.createWithoutData('WxUser', sess.objid);
    user.fetch().then(function () {
        if (typeof (doctor_id) == "undefined") {
            res.render('ask', { points: user.get('points'), hasheader: false, price: 10, doctor_id: doctor_id, image: image, name: name, hospital: hospital, clinic: clinic, title: title });
        } else {
            res.render('ask', { points: user.get('points'), hasheader: true, price: price, doctor_id: doctor_id, image: image, name: name, hospital: hospital, clinic: clinic, title: title });
        }
    });
});

router.post('/add/free', function (req, res) {
    let sess = req.session;
    let num = req.body.num * 1;
    let user = AV.Object.createWithoutData('WxUser', sess.objid);
    user.increment('points', -num);
    let order = new Order();
    order.set('price', 10);
    order.set('points', num);
    order.set('user', user);
    order.save();
    let time = Math.round(new Date().getTime() / 1000).toString();
    let imglist = req.body.imglist.split(',');
    let data = { "content": req.body.content, "image": imglist, "age": req.body.age + "岁", "sex": "女" };
    chunyu.createFree(sess.objid, time, data, 0).then(function (data) {
        res.jsonp({ id: data });
    });
});

router.post('/add/pay', function (req, res) {
    let sess = req.session;
    let num = req.body.num * 1;
    let price = req.body.price * 1;
    let doctor_id = req.body.doctor_id;
    let user = AV.Object.createWithoutData('WxUser', sess.objid);
    user.increment('points', -num);
    let order = new Order();
    order.set('points', num);
    order.set('price', price / 100);
    order.set('user', user);
    let time = Math.round(new Date().getTime() / 1000).toString();
    let imglist = req.body.imglist.split(',');
    let data = { "content": req.body.content, "image": imglist, "age": req.body.age + "岁", "sex": "女", "dotcors": doctor_id };
    order.save().then(function (order) {
        chunyu.createPay(sess.objid, time, data, order.id, price).then(function (data) {
            chunyu.successNotice(sess.objid, data, time).then(function (data) {
                res.jsonp({ id: data.problems[0].problem_id });
            });
        });
    }, function (err) {
        console.log(err);
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

module.exports = router;