'use strict';
var router = require('express').Router();
var AV = require('leanengine');
var request = require('request-json');
var appid = process.env.wx_appid;
var secret = process.env.wx_secret;
var partner_key = process.env.partner_key;
var WxUser = AV.Object.extend('WxUser');
var Problem = AV.Object.extend('Problem');
var chunyu=require('../routes/chunyu');
router.get('/', function (req, res) {
    let sess = req.session;
    let time=Math.round(new Date().getTime()/1000).toString();
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
                                wxuser.set('points',2);
                                wxuser.save().then(function (data) {
                                    chunyu.login(data.id,time);
                                    sess.objidid = data.id;
                                    res.render('index', { objid: data.id });
                                }, function (err) {
                                    console.log(err);
                                });
                            } else if (count == 1) {
                                query.first().then(function (data) {
                                    chunyu.login(data.id,time);
                                    sess.objid = data.id;
                                    res.render('index', { objid: data.id });
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
        chunyu.login(sess.objid,time);
        res.render('index', { objid: sess.objid })
    }
});

router.get('/ask', function (req, res) {
    let sess = req.session;
    sess.objid="590b18d52f301e00582f024a";
    console.log(sess.objid);
    res.render('ask');
});

router.post('/ask/add', function (req, res) {
    let sess = req.session;
    let time=Math.round(new Date().getTime()/1000).toString();
    let problem = new Problem();
    let data={"content":req.body.content,"image":"123","audio":"321","age":"28岁"};
    console.log(chunyu.createFree(sess.objid,time,data));
    res.jsonp({ id: 1 });
});

router.get('/inquiry', function (req, res) {
    res.render('inquiry');
});

router.get('/doctor', function (req, res) {
    res.render('doctor');
});

router.get('/all_service', function (req, res) {
    res.render('allservice');
});

router.get('/mypoints', function (req, res) {
    res.render('mypoints');
});

router.get('/phone', function (req, res) {
    res.render('phone');
});

router.get('/advice', function (req, res) {
    res.render('advice');
});

router.get('/searchdoctor', function (req, res) {
    res.render('searchdoctor');
});

router.get('/upgrade', function (req, res) {
    res.render('upgrade');
});

router.get('/test', function (req, res) {
    chunyulogin("A800130","1467098815");
});
module.exports = router;
