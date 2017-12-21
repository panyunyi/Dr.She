'use strict';
var router = require('express').Router();
var AV = require('leanengine');
var request = require('request-json');
var appid = process.env.wx_appid;
var secret = process.env.wx_secret;
var async = require('async');
var Content = AV.Object.extend('Content');
var Doctor = AV.Object.extend('Doctor');
var Refund = AV.Object.extend('Refund');
var chunyu = require('../routes/chunyu');
var fs = require('fs');
var file = "./public/city_list.json";
var push = require('../routes/push');

function getTokenAndSendMsg(data, response) {
    let result = {
        "error": 0, // 0 代表成功,其它 代表异常
        "error_msg": "" //错误信息
    };
    let client = request.createClient('https://api.weixin.qq.com/cgi-bin/');
    client.get('token?grant_type=client_credential&appid=' + appid + '&secret=' + secret, function (err, res, body) {
        let token = body.access_token;
        client = request.createClient('https://api.weixin.qq.com/cgi-bin/message/template/');
        client.post('send?access_token=' + token, data, function (err, res, body) {
            response.jsonp(result);
            // console.log("body:" + JSON.stringify(body));
        });
    });
}

router.get('/test', function (req, res) {
    console.log("test");
    push.push("医生有新的回复", "啊哈", "595ca1a2570c3500588ebee9", "598384274");
});

function getCount(content,callback1){
    let query=new AV.Query('Medicine');
    query.equalTo('isDel',false);
    query.limit(1000);
    query.find().then(function(results){
        async.map(results,function(result,callback){
            if(content.indexOf(result.get('name'))>0){
                result.increment('recommend',1);
                result.save().then(function(){
                    callback(null,1);
                });
            }else{
                callback(null,0);
            }
        },function(err,results){
            callback1(null,1);
        });
    });
}

router.post('/reply', function (req, res) {
    let result = {
        "error": 0, // 0 代表成功,其它 代表异常
        "error_msg": "" //错误信息
    };
    let problem_id = req.body.problem_id * 1;
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
        query.include('user');
        query.equalTo('problem_id', problem_id);
        query.first().then(function (problem) {
            problem.set('has_answer', true);
            problem.save();
            let replyContent = "";
            async.mapSeries(content, function (one, callback) {
                if (one.type == "text") {
                    let line = unescape(one.text.replace(/\u/g, "%u"));
                    let reply = new Content();
                    reply.set('type', "text");
                    reply.set('askorreply', "d");
                    reply.set('text', line);
                    reply.set('problem', problem);
                    reply.set('problem_id', problem_id.toString());
                    reply.set('user', problem.get('user'));
                    reply.set('atime', req.body.atime);
                    reply.set('doctor', doctor_data);
                    reply.save().then(function () {
                        replyContent = line;
                        getCount(line,callback);
                        //callback(null, one);
                    });
                }
                if (one.type == "audio") {
                    let reply = new Content();
                    reply.set('type', "audio");
                    reply.set('askorreply', "d");
                    reply.set('audio', one.file);
                    reply.set('problem', problem);
                    reply.set('problem_id', problem_id.toString());
                    reply.set('user', problem.get('user'));
                    reply.set('atime', req.body.atime);
                    reply.set('doctor', doctor_data);
                    reply.save().then(function () {
                        replyContent = "一条语音消息";
                        callback(null, one);
                    });
                }
                if (one.type == "image") {
                    let reply = new Content();
                    reply.set('type', "text");
                    reply.set('askorreply', "d");
                    reply.set('image', one.file);
                    reply.set('problem', problem);
                    reply.set('problem_id', problem_id.toString());
                    reply.set('user', problem.get('user'));
                    reply.set('atime', req.body.atime);
                    reply.set('doctor', doctor_data);
                    reply.save().then(function () {
                        replyContent = "一张图片消息";
                        callback(null, one);
                    });
                }

            }, function (err, oneres) {
                if (problem.get('source') == "app") {
                    push.push("医生有新的回复", replyContent, problem.get('user').id, problem_id);
                }
                let time = Math.round(new Date().getTime() / 1000).toString();
                chunyu.problemDetail(problem.get('user_id'), problem_id, 1, time).then(function (data) {
                    if (data.problem.status == "s" && problem.get('source') == "wechat") {
                        isView(problem.get('user').get('openid'), problem_id, data.problem.ask, replyContent, res);
                    } else {
                        res.jsonp(result);
                    }
                });
            });
        });
    }
    function isView(openid, problem_id, ask, reply, res) {
        let data = {
            touser: openid, template_id: "ctlB51MI2w3vIjS50cSONDoSEi1k0FX6jyPftNHjHbs", url: 'http://drshe.leanapp.cn/inquiry?id=' + problem_id, "data": {
                "first": {
                    "value": "医生已为您答复。",
                    "color": "#173177"
                },
                "keyword1": {
                    "value": ask,
                    "color": "#173177"
                },
                "keyword2": {
                    "value": reply,
                    "color": "#173177"
                },
                "remark": {
                    "value": "点击前往查看",
                    "color": "#173177"
                }
            }
        };
        getTokenAndSendMsg(data, res);
    }
});

router.post('/close', function (req, res) {
    let result = {
        "error": 0, // 0 代表成功,其它 代表异常
        "error_msg": "" //错误信息
    };
    let problem_id = req.body.problem_id * 1;
    let user_id = req.body.user_id;
    let user = AV.Object.createWithoutData('WxUser', user_id);
    let problem = AV.Object.createWithoutData('Problem', problem_id);
    let msg = req.body.msg;
    let status = req.body.status;
    let price = 0;
    if (typeof (req.body.price) != "undefined") {
        price = req.body.price * 1;
    }
    let sign = req.body.sign;
    let atime = req.body.atime * 1;
    let refund = new Refund();
    refund.set('problem_id', problem_id);
    refund.set('user', user);
    refund.set('msg', msg);
    refund.set('status', status);
    refund.set('price', price);
    refund.set('sign', sign);
    refund.set('atime', atime);
    refund.save().then(function () {
        problem.set('isrefund', true);
        problem.save().then(function () {
            res.jsonp(result);
        });
    });
});

router.get('/detail/:id/:purchase_num', function (req, res) {
    let sess = req.session;
    let id = req.params.id;
    let purchase_num = req.params.purchase_num;
    let time = Math.round(new Date().getTime() / 1000).toString();
    chunyu.doctorDetail(sess.objid, id, time).then(function (data) {
        let user = AV.Object.createWithoutData('WxUser', sess.objid);
        user.fetch().then(function (user) {
            res.render('doctor', { doctor: data, purchase_num: purchase_num, mypoints: user.get('points') });
        });
    });
});

router.get('/list', function (req, res) {
    let sess = req.session;
    let time = Math.round(new Date().getTime() / 1000).toString();
    let province = req.query.province;
    let city = req.query.city;
    let city_list = JSON.parse(fs.readFileSync(file));
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
                                wxuser.set('unionid', body2.unionid);
                                wxuser.set('points', 2);
                                wxuser.save().then(function (data) {
                                    sess.objidid = data.id;
                                    chunyu.login(data.id, time).then(function () {
                                        chunyu.doctorList(sess.objid, "1", 0, province, city, time).then(function (data) {
                                            res.render('doctorlist', { doctors: data.doctors, cities: city_list });
                                        });
                                    });
                                }, function (err) {
                                    console.log(err);
                                });
                            } else if (count == 1) {
                                query.first().then(function (data) {
                                    sess.objid = data.id;
                                    chunyu.doctorList(sess.objid, "1", 0, province, city, time).then(function (data) {
                                        res.render('doctorlist', { doctors: data.doctors, cities: city_list });
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
    } else {
        chunyu.login(sess.objid, time).then(function () {
            chunyu.doctorList(sess.objid, "1", 0, province, city, time).then(function (data) {
                res.render('doctorlist', { doctors: data.doctors, cities: city_list });
            });
        });
    }
});

router.get('/more', function (req, res) {
    let sess = req.session;
    let time = Math.round(new Date().getTime() / 1000).toString();
    let province = req.query.province;
    let city = req.query.city;
    let clinic_no = req.query.clinic_no;
    let start = req.query.start;
    chunyu.doctorList(sess.objid, clinic_no, start, province, city, time).then(function (data) {
        res.jsonp({ doctors: data.doctors });
    });
});
module.exports = router;
