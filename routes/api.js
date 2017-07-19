'use strict';
var router = require('express').Router();
var AV = require('leanengine');
var request = require('request-json');
var Todo = AV.Object.extend('Todo');
var async = require('async');
var moment=require('moment');

router.get('/json/users', function (req, res, next) {
    let query = new AV.Query('WxUser');
    let arr = [];
    query.count().then(function (count) {
        let num = Math.ceil(count / 1000);
        async.times(num, function (n, callback) {
            query.limit(1000);
            query.skip(1000 * n);
            query.find().then(function (users) {
                async.map(users, function (user, callback1) {
                    if (typeof (user) != "undefined") {
                        let time=new moment(user.get('createdAt'));
                        let one = {
                            nickname: user.get('nickname') ? user.get('nickname') : "", sex: user.get('sex') ? user.get('sex') : "",
                            phone: user.get('phone') ? user.get('phone') : "", points: user.get('points'), city: user.get('city') ? user.get('city') : "",
                            createdAt:time.format('YYYY-MM-DD HH:mm:ss')
                        };
                        arr.push(one);
                    }
                    callback1(null, user);
                }, function (err, results) {
                    callback(null, n);
                });
            });
        }, function (err, users) {
            res.jsonp({ "data": arr });
        });
    });
});

router.get('/json/doctors', function (req, res, next) {
    let query = new AV.Query('Doctor');
    let arr = [];
    query.count().then(function (count) {
        let num = Math.ceil(count / 1000);
        async.times(num, function (n, callback) {
            query.limit(1000);
            query.skip(1000 * n);
            query.find().then(function (doctors) {
                async.map(doctors, function (doctor, callback1) {
                    if (typeof (doctor) != "undefined") {
                        let time=new moment(doctor.get('createdAt'));
                        let one = {
                            name: doctor.get('name') ? doctor.get('name') : "", hospital: doctor.get('hospital') ? doctor.get('hospital') : "",
                            hospital_grade: doctor.get('hospital_grade') ? doctor.get('hospital_grade') : "", level_title: doctor.get('level_title'),
                            title: doctor.get('title') ? doctor.get('title') : "",clinic:doctor.get('clinic')?doctor.get('clinic'):"",
                            good_at:doctor.get('good_at')?doctor.get('good_at'):"",education_background:doctor.get('education_background')?doctor.get('education_background'):"",
                            headimgurl:doctor.get('image'),
                            createdAt:time.format('YYYY-MM-DD HH:mm:ss')
                        };
                        arr.push(one);
                    }
                    callback1(null, doctor);
                }, function (err, results) {
                    callback(null, n);
                });
            });
        }, function (err, doctors) {
            res.jsonp({ "data": arr });
        });
    });
});

router.get('/json/problems', function (req, res, next) {
    let query = new AV.Query('Problem');
    let arr = [];
    query.count().then(function (count) {
        let num = Math.ceil(count / 1000);
        async.times(num, function (n, callback) {
            query.limit(1000);
            query.include('user');
            query.skip(1000 * n);
            query.find().then(function (problems) {
                async.map(problems, function (problem, callback1) {
                    if (typeof (problem) != "undefined") {
                        let time=new moment(problem.get('createdAt'));
                        let one = {
                            problem_id:problem.get('problem_id'),user:problem.get('user')?problem.get('user').get('nickname'):"",source:problem.get('source')?problem.get('source'):"",
                            createdAt:time.format('YYYY-MM-DD HH:mm:ss')
                        };
                        arr.push(one);
                    }
                    callback1(null, problem);
                }, function (err, results) {
                    callback(null, n);
                });
            });
        }, function (err, problems) {
            res.jsonp({ "data": arr });
        });
    });
});

router.get('/json/images', function (req, res, next) {
    let query = new AV.Query('_File');
    let arr = [];
    query.count().then(function (count) {
        let num = Math.ceil(count / 1000);
        async.times(num, function (n, callback) {
            query.limit(1000);
            query.skip(1000 * n);
            query.find().then(function (images) {
                async.map(images, function (image, callback1) {
                    if (typeof (image) != "undefined") {
                        let time=new moment(image.get('createdAt'));
                        let one = {
                            name:image.get('name'),url:image.get('url'),
                            createdAt:time.format('YYYY-MM-DD HH:mm:ss')
                        };
                        arr.push(one);
                    }
                    callback1(null, image);
                }, function (err, results) {
                    callback(null, n);
                });
            });
        }, function (err, images) {
            res.jsonp({ "data": arr });
        });
    });
});

// 新增 Todo 项目
router.post('/', function (req, res, next) {

});

module.exports = router;
