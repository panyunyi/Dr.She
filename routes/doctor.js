'use strict';
var router = require('express').Router();
var AV = require('leanengine');
var request = require('request-json');
var appid = process.env.wx_appid;
var secret = process.env.wx_secret;
var async = require('async');
var Content = AV.Object.extend('Content');
var Doctor = AV.Object.extend('Doctor');
var chunyu = require('../routes/chunyu');
var fs = require('fs');
var file = "./public/city_list.json";

router.post('/reply', function (req, res) {
    let result = {
        "error": 0, // 0 代表成功,其它 代表异常
        "error_msg": "" //错误信息
    };
    let problem_id = req.body.problem_id;
    let doctorBody = req.body.doctor;
    let content = eval(req.body.content);
    let doctorQuery = new AV.Query('Doctor');
    doctorQuery.equalTo('id', doctorBody.id);
    doctorQuery.first().then(function (doctorobj) {
        if (typeof (doctorobj) == "undefined") {
            let doctor = new Doctor();
            doctor.set('id', doctorBody.id);
            doctor.set('name', doctorBody.name);
            doctor.set('title', doctorBody.title);
            doctor.set('education_background', doctorBody.education_background);
            doctor.set('image', doctorBody.image);
            doctor.set('hospital_grade', doctorBody.hospital_grade);
            doctor.set('clinic', doctorBody.clinic);
            doctor.set('good_at', doctorBody.good_at);
            doctor.set('level_title', doctorBody.level_title);
            doctor.set('clinic_no', doctorBody.clinic_no);
            doctor.set('hospital', doctorBody.hospital);
            doctor.save().then(function (data) {
                replySave(data);
            }, function (err) {
                console.log(err);
            });
        } else {
            replySave(doctorobj);
        }
    });
    function replySave(doctor_data) {
        let query = new AV.Query('Problem');
        query.equalTo('problem_id', problem_id);
        query.first().then(function (problem) {
            problem.set('has_answer', true);
            problem.save();
            async.mapSeries(content, function (one, callback) {
                if (one.type == "text") {
                    let line = unescape(one.text.replace(/\u/g, "%u"));
                    let reply = new Content();
                    reply.set('type', "text");
                    reply.set('askorreply', "d");
                    reply.set('text', line);
                    reply.set('problem', problem);
                    reply.set('user', problem.get('user'));
                    reply.set('atime', req.body.atime);
                    reply.set('doctor', doctor_data);
                    reply.save();
                }
                callback(null, one);
            }, function (err, oneres) {
                res.jsonp(result);
            });
        });
    }
});

router.post('/close', function (req, res) {
    let result = {
        "error": 0, // 0 代表成功,其它 代表异常
        "error_msg": "" //错误信息
    };
    console.log(req.body);
    res.jsonp(result);
});

router.get('/detail/:id/:purchase_num', function (req, res) {
    let sess = req.session;
    let id = req.params.id;
    let purchase_num = req.params.purchase_num;
    let time = Math.round(new Date().getTime() / 1000).toString();
    chunyu.doctorDetail(sess.objid, id, time).then(function (data) {
        let user = AV.Object.createWithoutData('WxUser', sess.objid);
        user.fetch().then(function (user) {
            res.render('doctor1', { doctor: data, purchase_num: purchase_num, mypoints: user.get('points') });
        });
    });
});

router.get('/list', function (req, res) {
    let sess = req.session;
    let time = Math.round(new Date().getTime() / 1000).toString();
    let province = req.query.province;
    let city = req.query.city;
    let city_list = JSON.parse(fs.readFileSync(file));
    chunyu.doctorList(sess.objid, "1", 0, province, city, time).then(function (data) {
        res.render('doctorlist', { doctors: data.doctors });
    });
});

module.exports = router;
