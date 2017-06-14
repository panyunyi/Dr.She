'use strict';
var router = require('express').Router();
var AV = require('leanengine');
var request = require('request-json');
var appid = process.env.wx_appid;
var secret = process.env.wx_secret;
var partner_key = process.env.partner_key;
var chunyu = require('../routes/chunyu');
var async = require('async');
var moment = require('moment');
moment.locale('zh-cn');

router.get('/', function (req, res) {
    res.render('inquiry', { id: req.query.id });
});

router.get('/pooling/:id/:content_id', function (req, res) {
    let time = Math.round(new Date().getTime() / 1000).toString();
    let id = req.params.id;
    let content_id = req.params.content_id*1;
    let sess = req.session;
    let isreply = 0;
    let isclose = 0;
    let ispay = 0;
    chunyu.problemDetail(sess.objid, id, content_id, time).then(function (data) {
        if (typeof (data.doctor.id) != "undefined") {
            isreply = 1;
        }
        if (data.problem.status == "c" || data.problem.status == "p") {
            isclose = 1;
        }
        if (data.content.length > 0) {
            content_id = data.content[data.content.length - 1].id
        }
        let doctorimage = data.doctor.image;
        let clinic = { '1': "妇科", '2': "儿科", '3': "内科", '4': "皮肤性病科", '6': "营养科", '7': "骨伤科", '8': "男科", '9': "外科", '11': "肿瘤及防治科", '12': "中医科", '13': "口腔颌面科", '14': "耳鼻咽喉科", '15': "眼科", '16': "整形美容科", '17': "精神心理科", '21': "产科" };
        let doctorHtml = '<div class="block-left"><a href="http://weixin.chunyuyisheng.com/cooperation/wap/doctor/identified_info_page/?doctor_id=' + data.doctor.id + '&partner=chunyu_wap"><img src="' + data
            .doctor.image + '" class="doctor-avatar-small"></a></div><div class="block-right"><h6 class="doctor-title-small">' + data.doctor.name + '<span>' + data.doctor.hospital + '</span></h6> <span class="doctor-label">' + clinic[data.doctor.clinic * 1] + '</span><span class="doctor-label">' + data
                .doctor.level_title + '</span></div>';
        let contentHtml = '';
        async.mapSeries(data.content, function (one, callback) {
            let subcontent = eval(one.content);
            if (one.type == "p") {
                let time=new moment(one.created_time_ms).calendar();
                async.mapSeries(subcontent, function (subone, callback1) {
                    if (subone.type == "text") {
                        contentHtml += '<div class="qa-inquiry-list user"><p class="qa-first-time">' + time + '</p><div class="qa-list-wrap"><div class="qa-inquiry-content"><span>' + subone.text + '</span></div></div> <br></div>';
                    } else if (subone.type == "image") {
                        contentHtml += '<div class="qa-inquiry-list user"><div class="qa-list-wrap border"><div class="qa-inquiry-content"><img src="' + subone.file + '" class="qa-img"></div></div> <br> </div>';
                    }
                    callback1(null, one);
                }, function (err, subres) {
                    callback(null, one);
                });
            } else if (one.type == "d") {
                async.mapSeries(subcontent, function (subreply, callback2) {
                    if (subreply.type == "text") {
                        contentHtml += '<div class="qa-inquiry-list doctor"><div class="block-left"><a href="http://weixin.chunyuyisheng.com/cooperation/wap/doctor/identified_info_page/?doctor_id=' + data.doctor.id + '&partner=chunyu_wap"><img src="' + (typeof (doctorimage) == 'undefined' ? "../01.png" : doctorimage) + '" class="doctor-avatar-small"></a></div><div class="block-right"><div class="qa-list-wrap"><div class="qa-inquiry-content"><span>' + unescape(subreply.text.replace(/\u/g, "%u")) + '</span> </div></div></div></div>';
                    }
                    else if (subreply.type == "image") {
                        contentHtml += '<div class="qa-inquiry-list doctor"><div class="block-left"><a href="http://weixin.chunyuyisheng.com/cooperation/wap/doctor/identified_info_page/?doctor_id=' + data.doctor.id + '&partner=chunyu_wap"><img src="' + (typeof (doctorimage) == 'undefined' ? "../01.png" : doctorimage) + '" class="doctor-avatar-small"></a></div><div class="block-right"><div class="qa-list-wrap"><div class="qa-inquiry-content"><img src="' + subreply.file + '" class="qa-img"> </div></div></div></div>';
                    } else if (subreply.type == "audio") {
                        contentHtml += '<div class="qa-inquiry-list doctor"><div class="block-left"><a href="http://weixin.chunyuyisheng.com/cooperation/wap/doctor/identified_info_page/?doctor_id=' + data.doctor.id + '&partner=chunyu_wap"><img src="' + (typeof (doctorimage) == 'undefined' ? "../01.png" : doctorimage) + '" class="doctor-avatar-small"></a></div><div class="block-right"><div class="qa-list-wrap"><div class="qa-inquiry-content"><span class="audio-beautify"><i class="audio-icon"></i> <span class="audio-seconds right"><b></b>\'\'</span></span><audio src="' + subreply.file + '" controls="controls" preload="auto" class="hide" "></audio> </div></div></div></div>';
                    }
                    callback2(null, one);
                }, function (err, subreplyres) {
                    callback(null, one);
                });
            }
        }, function (err, contentres) {
            if (data.problem.interaction == 0 && typeof (data.doctor.id) != "undefined" && isclose != 1) {
                ispay = 1;
                contentHtml += '<div class="qa-inquiry-list doctor"><div class="block-left"><img src="../01.png" class="doctor-avatar-small"></div><div class="block-right"><div class="qa-list-wrap"><div class="qa-inquiry-content"><span>亲爱的，您好：我们已通知到' + data.doctor.hospital +'的'+data.doctor.name+ '医生。为您答题的医生均在医院临床一线工作，无法做到随问随答，请您耐心等待哦！您的问题得到回复后，我们会在第一时间给您推送消息~</span> </div></div></div></div>';
            }
            res.send({ content_id: content_id*1, doctor: doctorHtml, content: contentHtml, isreply: isreply, isclose: isclose, ispay: ispay, interaction: data.problem.interaction });
        });
    });
});

router.post('/add', function (req, res) {
    let time = Math.round(new Date().getTime() / 1000).toString();
    let sess = req.session;
    chunyu.problemAdd(sess.objid, req.body.id * 1, req.body.content, time).then(function (data) {
        res.send({ error: data.error });
    });
});

router.post('/imageadd', function (req, res) {
    let time = Math.round(new Date().getTime() / 1000).toString();
    let sess = req.session;
    chunyu.problemImageAdd(sess.objid, req.body.id * 1, req.body.image, time).then(function (data) {
        res.send({ error: data.error });
    });
});

router.get('/list/', function (req, res) {
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
                    one.problem.status = "已回复";
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
            res.render('allservice', { list: problems });
        });
    });
});
module.exports = router;