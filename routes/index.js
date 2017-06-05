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
var async = require('async');

router.get('/', function (req, res) {
    let sess = req.session;
    //sess.objid = '590b18d52f301e00582f024a';
    let time = Math.round(new Date().getTime() / 1000).toString();
    if (typeof (sess.objid) == "undefined") {
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
                                wxuser.save().then(function (data) {
                                    sess.objidid = data.id;
                                    chunyu.login(data.id, time);
                                    indexProblemList(req, res, 'index');
                                    //res.render('index', { objid: data.id });
                                }, function (err) {
                                    console.log(err);
                                });
                            } else if (count == 1) {
                                query.first().then(function (data) {
                                    sess.objid = data.id;
                                    chunyu.login(data.id, time);
                                    indexProblemList(req, res, 'index');
                                    //res.render('index', { objid: data.id});
                                });
                            } else {
                                res.send("用户信息有重复，为保证用户利益请及时联系客服。");
                            }
                        });
                    } else {
                        console.log(body);
                        res.send("已超时，请退出菜单重进。");
                    }
                });
            } else {
                console.log(body);
                res.send("已超时，请退出菜单重进。");
            }
        });
    } else {
        chunyu.login(sess.objid, time);
        indexProblemList(req, res, 'index');
        //res.render('index', { objid: sess.objid })
    }
});

function indexProblemList(req, res, service) {
    let time = Math.round(new Date().getTime() / 1000).toString();
    let sess = req.session;
    chunyu.problemList(sess.objid, time).then(function (data) {
        async.mapSeries(data, function (one, callback) {
            switch (one.problem.status) {
                case 'i':
                    one.problem.status = "未提问";
                    break;
                case 'n':
                    one.problem.status = "待回复";
                    break;
                case 'a':
                    one.problem.status = "待回复";
                    break;
                case 's':
                    one.problem.status = "医生已回复";
                    break;
                case 'c':
                    one.problem.status = "已关闭";
                    break;
                case 'v':
                    one.problem.status = "已查看";
                    break;
                case 'p':
                    one.problem.status = "系统举报";
                    break;
                case 'd':
                    one.problem.status = "已评价";
                    break;
            }
            callback(null, one);
        }, function (err, problems) {
            res.render(service, { list: problems });
        });
    });
}

router.get('/all_service', function (req, res) {
    let sess = req.session;
    let time = Math.round(new Date().getTime() / 1000).toString();
    if (typeof (sess.objid) == "undefined") {
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
                                wxuser.save().then(function (data) {
                                    sess.objidid = data.id;
                                    chunyu.login(data.id, time);
                                    indexProblemList(req, res, 'allservice');
                                }, function (err) {
                                    console.log(err);
                                });
                            } else if (count == 1) {
                                query.first().then(function (data) {
                                    sess.objid = data.id;
                                    indexProblemList(req, res, 'allservice');
                                });
                            } else {
                                res.send("用户信息有重复，为保证用户利益请及时联系客服。");
                            }
                        });
                    } else {
                        console.log(body);
                        res.send("已超时，请退出菜单重进。");
                    }
                });
            } else {
                console.log(body);
                res.send("已超时，请退出菜单重进。");
            }
        });
    } else {
        chunyu.login(sess.objid, time);
        indexProblemList(req, res, 'allservice');
    }
    
});

router.get('/mypoints', function (req, res) {
    let sess = req.session;
    let time = Math.round(new Date().getTime() / 1000).toString();
    if (typeof (sess.objid) == "undefined") {
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
                                wxuser.save().then(function (data) {
                                    sess.objidid = data.id;
                                    chunyu.login(data.id, time);
                                    res.render('mypoints', { points: data.get('points') });
                                }, function (err) {
                                    console.log(err);
                                });
                            } else if (count == 1) {
                                query.first().then(function (data) {
                                    sess.objid = data.id;
                                    res.render('mypoints', { points: data.get('points') });
                                });
                            } else {
                                res.send("用户信息有重复，为保证用户利益请及时联系客服。");
                            }
                        });
                    } else {
                        console.log(body);
                        res.send("已超时，请退出菜单重进。");
                    }
                });
            } else {
                console.log(body);
                res.send("已超时，请退出菜单重进。");
            }
        });
    } else {
        chunyu.login(sess.objid, time);
        let user = AV.Object.createWithoutData('WxUser', sess.objid);
        user.fetch().then(function () {
            res.render('mypoints', { points: user.get('points') });
        });
    }

});

router.get('/phone', function (req, res) {
    res.render('phone');
});

router.get('/advice', function (req, res) {
    let sess = req.session;
    let time = Math.round(new Date().getTime() / 1000).toString();
    if (typeof (sess.objid) == "undefined") {
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
                                wxuser.save().then(function (data) {
                                    sess.objidid = data.id;
                                    chunyu.login(data.id, time);
                                    res.render('advice');
                                }, function (err) {
                                    console.log(err);
                                });
                            } else if (count == 1) {
                                query.first().then(function (data) {
                                    sess.objid = data.id;
                                    res.render('advice');
                                });
                            } else {
                                res.send("用户信息有重复，为保证用户利益请及时联系客服。");
                            }
                        });
                    } else {
                        console.log(body);
                        res.send("已超时，请退出菜单重进。");
                    }
                });
            } else {
                console.log(body);
                res.send("已超时，请退出菜单重进。");
            }
        });
    } else {
        chunyu.login(sess.objid, time);
        res.render('advice');
    }
});

router.get('/upgrade', function (req, res) {
    res.render('upgrade');
});

router.get('/delete/:id', function (req, res) {
    let sess = req.session;
    let time = Math.round(new Date().getTime() / 1000).toString();
    chunyu.deleteProblem(sess.objid, req.params.id, time).then(function (data) {
        indexProblemList(req, res, 'index');
    });
});
module.exports = router;
