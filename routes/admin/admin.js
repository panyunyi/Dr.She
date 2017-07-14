'use strict';
var router = require('express').Router();
var AV = require('leanengine');
var request = require('request-json');
var async = require('async');
var Todo = AV.Object.extend('Todo');

router.get('/login', function (req, res) {
    res.render('admin/login', { title: "Dr.She" });
});

router.get('/', function (req, res, next) {
    if (req.session.user) {
        async.parallel([
            function (callback) {
                let query = new AV.Query('Business');
                query.count().then(function (count) {
                    callback(null, count);
                });
            },
            function (callback) {
                let query = new AV.Query('Doctor');
                query.count().then(function (count) {
                    callback(null, count);
                });
            },
            function (callback) {
                let query = new AV.Query('Problem');
                query.count().then(function (count) {
                    callback(null, count);
                });
            },
            function (callback) {
                let query = new AV.Query('WxUser');
                query.count().then(function (count) {
                    callback(null, count);
                });
            }
        ],
        function (err, results) {
            res.render('admin/index',{business:results[0],doctors:results[1],problems:results[2],users:results[3]});
        });        
    } else {
        res.redirect('../admin/login');
    }
});

router.post('/login', function (req, res, next) {
    let username = req.body.username;
    let password = req.body.password;
    AV.User.logIn(username, password).then(function (user) {
        let sess = req.session;
        sess.user = user.id;
        res.redirect('../admin');
    }, function (err) {
        res.render('admin/login', {
            title: "登录失败",
            errMsg: "帐号密码有误"
        });
    }).catch(next);
});

router.get('/users', function (req, res) {
    res.render('admin/users', { title: "Dr.She" });
});

module.exports = router;
