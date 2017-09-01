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

router.get('/businessclient', function (req, res) {
    let sess = req.session;
    if (sess.user) {
        res.render('admin/businessclient', { title: "Dr.She" });
    } else {
        sess.url = "admin/businessclient";
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

function contains(arr, obj) {
    var i = arr.length;
    while (i--) {
        if (arr[i] === obj) {
            return true;
        }
    }
    return false;
}
function down(x, y) {
    return (x.total < y.total) ? 1 : -1

}
router.get('/charts', function (req, res) {
    let list = [];
    let tip = [];
    function getContent(callback) {
        let arr = [];
        let query = new AV.Query('Content');
        query.count().then(function (count) {
            let num = Math.ceil(count / 1000);
            async.times(num, function (n, callback) {
                query.limit(1000);
                query.skip(1000 * n);
                query.exists('text');
                query.find().then(function (contents) {
                    async.map(contents, function (content, callback1) {
                        if (typeof (content) != "undefined") {
                            arr.push(content);
                        }
                        callback1(null, content);
                    }, function (err, results) {
                        callback(null, n);
                    });
                });
            }, function (err, contents) {
                callback(null, arr);
            });
        });
    }

    function getKeys(contents, callback) {
        let keyQuery = new AV.Query('KeyWords');
        keyQuery.equalTo('isDel', false);
        keyQuery.limit(1000);
        keyQuery.find().then(function (keys) {
            async.map(keys, function (key, callback1) {
                let arr = key.get('words').split(',');
                if (!contains(tip, key.get('tip'))) {
                    tip.push(key.get('tip'));
                }
                let total = 0;
                let one = {};
                let problems = [];
                async.map(arr, function (a, callback2) {
                    async.map(contents, function (content, callback3) {
                        if (content.get('text').indexOf(a) >= 0) {
                            total++;
                            if(typeof(content.get('problem_id'))!="undefined"){
                                problems.push(content.get('problem_id'));
                            }
                            callback3(null, 1);
                        } else {
                            callback3(null, 0);
                        }
                    }, function (err, contents) {
                        callback2(null, a);
                    });
                }, function (err, arr) {
                    one['title'] = key.get('title');
                    one['tip'] = key.get('tip');
                    one['total'] = total;
                    one['problems'] = problems;
                    list.push(one);
                    callback1(null, one);
                });
            }, function (err, results) {
                callback(null, results);
            });
        });
    }

    async.waterfall([
        function (callback) {
            getContent(callback);
        },
        function (contents, callback) {
            getKeys(contents, callback);
        }
    ], function (err, results) {
        res.render('admin/charts', { list: list.sort(down), tip: tip });
    });
});

router.get('/article', function (req, res) {
    let sess = req.session;
    if (sess.user) {
        res.render('admin/article', { title: "Dr.She" });
    } else {
        sess.url = "admin/article";
        res.render('admin/login', {
            title: "登录失败",
            errMsg: "帐号密码有误"
        });
    }
});

router.get('/section', function (req, res) {
    let sess = req.session;
    if (sess.user) {
        res.render('admin/section', { title: "Dr.She" });
    } else {
        sess.url = "admin/section";
        res.render('admin/login', {
            title: "登录失败",
            errMsg: "帐号密码有误"
        });
    }
});

router.get('/illness', function (req, res) {
    let sess = req.session;
    if (sess.user) {
        res.render('admin/illness', { title: "Dr.She" });
    } else {
        sess.url = "admin/illness";
        res.render('admin/login', {
            title: "登录失败",
            errMsg: "帐号密码有误"
        });
    }
});

router.get('/recharge', function (req, res) {
    let sess = req.session;
    if (sess.user) {
        res.render('admin/recharge', { title: "Dr.She" });
    } else {
        sess.url = "admin/recharge";
        res.render('admin/login', {
            title: "登录失败",
            errMsg: "帐号密码有误"
        });
    }
});

module.exports = router;
