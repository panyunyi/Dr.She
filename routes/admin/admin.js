'use strict';
var router = require('express').Router();
var AV = require('leanengine');
var request = require('request-json');
var async = require('async');
var Todo = AV.Object.extend('Todo');

router.get('/login', function (req, res) {
    res.render('admin/login', { title: "Dr.She" });
});

router.get('/logout', function (req, res) {
    req.session.user = null;
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
                res.render('admin/index', { business: results[0], doctors: results[1], problems: results[2], users: results[3] });
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
        if (sess.url) {
            res.redirect("../" + sess.url);
        } else {
            res.redirect('../admin');
        }
    }, function (err) {
        res.render('admin/login', {
            title: "登录失败",
            errMsg: "帐号密码有误"
        });
    }).catch(next);
});

router.get('/users', function (req, res) {
    let sess = req.session;
    if (sess.user) {
        res.render('admin/users', { title: "Dr.She" });
    } else {
        sess.url = "admin/users";
        res.render('admin/login', {
            title: "登录失败",
            errMsg: "帐号密码有误"
        });
    }
});

router.get('/doctors', function (req, res) {
    let sess = req.session;
    if (sess.user) {
        res.render('admin/doctors', { title: "Dr.She" });
    } else {
        sess.url = "admin/doctors";
        res.render('admin/login', {
            title: "登录失败",
            errMsg: "帐号密码有误"
        });
    }
});

router.get('/problems', function (req, res) {
    let sess = req.session;
    if (sess.user) {
        res.render('admin/problems', { title: "Dr.She" });
    } else {
        sess.url = "admin/problems";
        res.render('admin/login', {
            title: "登录失败",
            errMsg: "帐号密码有误"
        });
    }
});

router.get('/images', function (req, res) {
    let sess = req.session;
    if (sess.user) {
        res.render('admin/images', { title: "Dr.She" });
    } else {
        sess.url = "admin/images";
        res.render('admin/login', {
            title: "登录失败",
            errMsg: "帐号密码有误"
        });
    }
});

router.get('/business', function (req, res) {
    let sess = req.session;
    if (sess.user) {
        res.render('admin/business', { title: "Dr.She" });
    } else {
        sess.url = "admin/business";
        res.render('admin/login', {
            title: "登录失败",
            errMsg: "帐号密码有误"
        });
    }
});

router.get('/donate', function (req, res) {
    let sess = req.session;
    if (sess.user) {
        res.render('admin/donate', { title: "Dr.She" });
    } else {
        sess.url = "admin/donate";
        res.render('admin/login', {
            title: "登录失败",
            errMsg: "帐号密码有误"
        });
    }
});

router.get('/keywords', function (req, res) {
    let sess = req.session;
    if (sess.user) {
        res.render('admin/keywords', { title: "Dr.She" });
    } else {
        sess.url = "admin/keywords";
        res.render('admin/login', {
            title: "登录失败",
            errMsg: "帐号密码有误"
        });
    }
});

router.get('/collect', function (req, res) {
    let sess = req.session;
    if (sess.user) {
        async.parallel([
            function (callback) {
                let query = new AV.Query('Problem');
                query.limit(1000);
                query.equalTo('is_collect', 0);
                query.count().then(function (count) {
                    callback(null, count);
                });
            },
            function (callback) {
                let query = new AV.Query('Problem');
                query.equalTo('is_collect', 1);
                query.count().then(function (count) {
                    callback(null, count);
                });
            },
            function (callback) {
                let query = new AV.Query('Problem');
                query.equalTo('is_collect', 2);
                query.count().then(function (count) {
                    callback(null, count);
                });
            }
        ],
            function (err, results) {
                res.render('admin/collect', {
                    content: results[0] + "个问题未采集", success: results[1] + "个问题已采集", fail: results[2] + "个问题采集失败",
                    count: results[0]
                });
            });
    } else {
        sess.url = "admin/collect";
        res.render('admin/login', {
            title: "登录失败",
            errMsg: "帐号密码有误"
        });
    }
});

router.get('/collect/go', function (req, res) {
    let query = new AV.Query('Problem');
    query.equalTo('is_collect', 0);
    let arr = [];
    query.count().then(function (count) {
        let num = Math.ceil(count / 1000);
        async.times(num, function (n, callback) {
            query.limit(1000);
            query.skip(1000 * n);
            query.find().then(function (donates) {
                async.map(donates, function (donate, callback1) {
                    if (typeof (donate) != "undefined") {
                        
                        arr.push(one);
                    }
                    callback1(null, donate);
                }, function (err, results) {
                    callback(null, n);
                });
            });
        }, function (err, donates) {
            res.jsonp({ "data": arr });
        });
    });
});

module.exports = router;
