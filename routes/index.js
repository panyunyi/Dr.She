'use strict';
var router = require('express').Router();
var AV = require('leanengine');
var request = require('request-json');
var appid = process.env.wx_appid;
var secret = process.env.wx_secret;
var WxUser = AV.Object.extend('WxUser');
var Problem = AV.Object.extend('Problem');
var Donate = AV.Object.extend('Donate');
var chunyu = require('../routes/chunyu');
var async = require('async');
var signature = require('../routes/signature');
var moment = require('moment');
moment.locale('zh-cn');
var fs = require('fs');
var file = "./public/city_list.json";

router.get('/', function (req, res) {
    let sess = req.session;
    //sess.objid = '596d793ba22b9d006a38e5e4';
    let time = Math.round(new Date().getTime() / 1000).toString();
    //if (typeof (sess.objid) == "undefined") {
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
                            wxuser.set('unionid', body2.unionid);
                            wxuser.save().then(function (data) {
                                sess.objidid = data.id;
                                chunyu.login(data.id, time).then(function () {
                                    indexProblemList(req, res, 'index');
                                });
                                //res.render('index', { objid: data.id });
                            }, function (err) {
                                console.log(err);
                            });
                        } else if (count == 1) {
                            query.first().then(function (data) {
                                sess.objid = data.id;
                                if (typeof (data.get('unionid')) == "undefined") {
                                    data.set('unionid', body2.unionid);
                                    data.save().then(function () {
                                        chunyu.login(data.id, time).then(function () {
                                            indexProblemList(req, res, 'index');
                                        });
                                    });
                                } else {
                                    chunyu.login(data.id, time).then(function () {
                                        indexProblemList(req, res, 'index');
                                    });
                                }
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
    // } else {
    //     chunyu.login(sess.objid, time);
    //     indexProblemList(req, res, 'index');
    //     //res.render('index', { objid: sess.objid })
    // }
});

function indexProblemList(req, res, service) {
    let time = Math.round(new Date().getTime() / 1000).toString();
    let sess = req.session;
    chunyu.problemList(sess.objid, time).then(function (data) {
        async.mapSeries(data, function (one, callback) {
            one.problem.created_time = new moment(one.problem.created_time).format('YYYY年MM月DD日 HH:mm');
            if (typeof (one.problem.status) == "undefined") {
                console.log(data);
                callback(null, one);
            }
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
    //if (typeof (sess.objid) == "undefined") {
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
                            wxuser.set('unionid', body2.unionid);
                            wxuser.save().then(function (data) {
                                sess.objidid = data.id;
                                chunyu.login(data.id, time).then(function () {
                                    indexProblemList(req, res, 'allservice');
                                });
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
    // } else {
    //     chunyu.login(sess.objid, time).then(function () {
    //         indexProblemList(req, res, 'allservice');
    //     });
    // }

});

router.get('/mypoints', function (req, res) {
    let sess = req.session;
    let time = Math.round(new Date().getTime() / 1000).toString();
    //if (typeof (sess.objid) == "undefined") {
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
                            wxuser.set('unionid', body2.unionid);
                            wxuser.save().then(function (data) {
                                sess.objidid = data.id;
                                chunyu.login(data.id, time).then(function () {
                                    res.render('mypoints', { points: data.get('points') });
                                });
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
    // } else {
    //     chunyu.login(sess.objid, time).then(function () {
    //         let user = AV.Object.createWithoutData('WxUser', sess.objid);
    //         user.fetch().then(function () {
    //             res.render('mypoints', { points: user.get('points') });
    //         });
    //     });
    // }

});

router.get('/phone', function (req, res) {
    res.render('phone');
});

router.get('/articles', function (req, res) {
    let query = new AV.Query('Article');
    query.equalTo('wx', 1);
    query.find().then(function (results) {
        res.render('articles', { list: results });
    });

});

// router.get('/advise', function (req, res) {
//     let url = req.protocol + '://' + req.host + req.originalUrl; //获取当前url
//     signature.sign(url, function (signatureMap) {
//         signatureMap.appid = appid;
//         res.render('advise', signatureMap);
//     });
// });

router.get('/toc2', function (req, res) {
    let url = req.protocol + '://' + req.host + req.originalUrl; //获取当前url
    signature.sign(url, function (signatureMap) {
        signatureMap.appid = appid;
        signatureMap.objid = "";
        signatureMap.had = 0;
        res.render('toc', signatureMap);
    });
});

router.get('/apply', function (req, res) {
    let city_list = JSON.parse(fs.readFileSync(file));
    // return res.render('apply', { cities: city_list,objid:"596d793ba22b9d006a38e5e4" });
    let sess = req.session;
    //if (typeof (sess.objid) == "undefined") {
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
                            wxuser.set('unionid', body2.unionid);
                            wxuser.save().then(function (data) {
                                sess.objidid = data.id;
                                res.render('apply', { cities: city_list, objid: data.id });
                            }, function (err) {
                                console.log(err);
                            });
                        } else if (count == 1) {
                            query.first().then(function (data) {
                                sess.objid = data.id;
                                let o2oQuery = new AV.Query('O2O');
                                o2oQuery.equalTo('isDel', false);
                                o2oQuery.equalTo('user', data);
                                o2oQuery.count().then(function (count) {
                                    if (count == 0) {
                                        res.render('apply', { cities: city_list, objid: data.id });
                                    } else {
                                        res.render('success');
                                    }
                                });
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
});

router.get('/service', function (req, res) {
    let city_list = JSON.parse(fs.readFileSync(file));
    //return res.render('service', { objid:"596d793ba22b9d006a38e5e4" });
    let sess = req.session;
    //if (typeof (sess.objid) == "undefined") {
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
                            wxuser.set('unionid', body2.unionid);
                            wxuser.save().then(function (data) {
                                sess.objidid = data.id;
                                res.render('service', { objid: data.id });
                            }, function (err) {
                                console.log(err);
                            });
                        } else if (count == 1) {
                            query.first().then(function (data) {
                                sess.objid = data.id;
                                let o2oQuery = new AV.Query('O2O');
                                o2oQuery.equalTo('isDel', false);
                                o2oQuery.equalTo('user', data);
                                o2oQuery.count().then(function (count) {
                                    if (count == 0) {
                                        res.render('service', { objid: data.id });
                                    } else {
                                        res.render('service', { objid: data.id });
                                    }
                                });
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
});

router.get('/service/success', function (req, res) {
    res.render('servicesuccess');
});

router.get('/service/result', function (req, res) {
    let phone = req.query.phone;
    let query = new AV.Query('Service');
    query.equalTo('isDel', false);
    query.equalTo('phone',phone);
    query.limit(1000);
    query.find().then(function (services) {
        async.map(services, function (service, callback) {
            let one = {};
            let itemstr = "";
            let amount = 0;
            let itemsMapQuery = new AV.Query('ServiceItemMap');
            itemsMapQuery.equalTo('isDel', false);
            itemsMapQuery.equalTo('service', service);
            itemsMapQuery.include('item');
            itemsMapQuery.find().then(function (items) {
                async.map(items, function (item, callback1) {
                    itemstr += item.get('item').get('name') + " " + item.get('item').get('price') + "元,"
                    amount += item.get('item').get('price') * 1;
                    callback1(null, 1);
                }, function (err, items) {
                    let status = "";
                    if (service.get('status') == 0) {
                        status = "待厂家收货";
                    } else if (service.get('status') == 1) {
                        status = "待维修";
                    } else if (service.get('status') == 2) {
                        status = "维修完成待厂家寄回"
                    } else if (service.get('status') == 3) {
                        status = "已寄出。快递：中通" + service.get('delivery');
                    }
                    one = { amount: amount, device: service.get('devicetype'), items: itemstr.substring(0, itemstr.length - 1), status: status };
                    callback(null, one);
                });
            });
        }, function (err, services) {
            let o2oQuery = new AV.Query('O2O');
            o2oQuery.equalTo('isDel', false);
            o2oQuery.equalTo('phone', phone);
            o2oQuery.count().then(function (count) {
                res.render('serviceprogress', { services: services, flag: count });
            });
        });
    });
});

router.get('/toc/success', function (req, res) {
    res.render('tocsuccess');
});

router.get('/toc/use', function (req, res) {
    res.render('toc2');
});

router.post('/toc/add', function (req, res) {
    let phone = req.body.phone;
    let objid = req.body.objid;
    let user = AV.Object.createWithoutData('WxUser', objid);
    user.set('phone', phone);
    user.set('password', '123');
    user.save();
    res.jsonp({ code: 0, msg: "" });
});

router.get('/toc', function (req, res) {
    let sess = req.session;
    //sess.objid = "5965c0f1ac502e006cdaa8af";
    let time = Math.round(new Date().getTime() / 1000).toString();
    //if (typeof (sess.objid) == "undefined") {
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
                            wxuser.set('points', 7);
                            wxuser.set('unionid', body2.unionid);
                            wxuser.save().then(function (data) {
                                sess.objidid = data.id;
                                let donate = new Donate();
                                donate.set('points', 5);
                                donate.set('source', 'wechat');
                                donate.set('title', '迎新');
                                donate.set('user', data);
                                donate.save().then(function () {
                                    chunyu.login(data.id, time).then(function () {
                                        let url = req.protocol + '://' + req.host + req.originalUrl;
                                        //let url = "http://drshe.leanapp.cn/toc3"; //获取当前url
                                        signature.sign(url, function (signatureMap) {
                                            signatureMap.appid = appid;
                                            signatureMap.objid = data.id;
                                            signatureMap.had = 0;
                                            res.render('toc', signatureMap);
                                        });
                                    });
                                });
                            }, function (err) {
                                console.log(err);
                            });
                        } else if (count == 1) {
                            query.first().then(function (data) {
                                sess.objid = data.id;
                                let donateQuery = new AV.Query('Donate');
                                donateQuery.equalTo('user', data);
                                donateQuery.equalTo('title', '迎新');
                                donateQuery.count().then(function (count) {
                                    if (count == 0) {
                                        data.increment('points', 5);
                                        let donate = new Donate();
                                        donate.set('points', 5);
                                        donate.set('source', 'wechat');
                                        donate.set('title', '迎新');
                                        donate.set('user', data);
                                        donate.save().then(function () {
                                            chunyu.login(data.id, time).then(function () {
                                                let url = req.protocol + '://' + req.host + req.originalUrl;
                                                //let url = "http://drshe.leanapp.cn/toc3";
                                                signature.sign(url, function (signatureMap) {
                                                    signatureMap.appid = appid;
                                                    signatureMap.objid = data.id;
                                                    signatureMap.had = 0;
                                                    res.render('toc', signatureMap);
                                                });
                                            });
                                        });
                                    } else {
                                        let url = req.protocol + '://' + req.host + req.originalUrl;
                                        //let url ="http://drshe.leanapp.cn/toc3";
                                        signature.sign(url, function (signatureMap) {
                                            signatureMap.appid = appid;
                                            signatureMap.objid = data.id;
                                            signatureMap.had = 1;
                                            res.render('toc', signatureMap);
                                        });
                                    }
                                });
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
    // } else {
    //     let user = AV.Object.createWithoutData('WxUser', sess.objid);
    //     let donateQuery = new AV.Query('Donate');
    //     donateQuery.equalTo('user', user);
    //     donateQuery.equalTo('title', '迎新');
    //     donateQuery.count().then(function (count) {
    //         if (count == 0) {
    //             user.increment('points', 5);
    //             let donate = new Donate();
    //             donate.set('points', 5);
    //             donate.set('source', 'wechat');
    //             donate.set('title', '迎新');
    //             donate.set('user', user);
    //             donate.save().then(function () {
    //                 chunyu.login(user.id, time).then(function () {
    //                     let url = req.protocol + '://' + req.host + req.originalUrl; //获取当前url
    //                     signature.sign(url, function (signatureMap) {
    //                         signatureMap.appid = appid;
    //                         signatureMap.objid = sess.objid;
    //                         res.render('toc', signatureMap);
    //                     });
    //                 });
    //             });
    //         } else {
    //             res.render('tocsuccess');
    //         }
    //     });
    // }
});

router.get('/advice', function (req, res) {
    let sess = req.session;
    let time = Math.round(new Date().getTime() / 1000).toString();
    //if (typeof (sess.objid) == "undefined") {
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
                            wxuser.set('unionid', body2.unionid);
                            wxuser.save().then(function (data) {
                                sess.objidid = data.id;
                                chunyu.login(data.id, time).then(function () {
                                    res.render('advice');
                                });
                            }, function (err) {
                                console.log(err);
                            });
                        } else if (count == 1) {
                            query.first().then(function (data) {
                                sess.objid = data.id;
                                data.set('unionid', body2.unionid);
                                data.save();
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
    // } else {
    //     chunyu.login(sess.objid, time).then(function () {
    //         res.render('advice');
    //     });
    // }
});

router.get('/upgrade', function (req, res) {
    res.render('upgrade');
});

router.get('/index2', function (req, res) {
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
                                wxuser.set('unionid', body2.unionid);
                                wxuser.save().then(function (data) {
                                    sess.objidid = data.id;
                                    chunyu.login(data.id, time).then(function () {
                                        res.render('index2');
                                    });
                                }, function (err) {
                                    console.log(err);
                                });
                            } else if (count == 1) {
                                query.first().then(function (data) {
                                    sess.objid = data.id;
                                    data.set('unionid', body2.unionid);
                                    data.save();
                                    res.render('index2');
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
        chunyu.login(sess.objid, time).then(function () {
            res.render('index2');
        });
    }
});

router.get('/delete/:id', function (req, res) {
    let sess = req.session;
    let time = Math.round(new Date().getTime() / 1000).toString();
    chunyu.deleteProblem(sess.objid, req.params.id, time).then(function (data) {
        indexProblemList(req, res, 'index');
    });
});
module.exports = router;
