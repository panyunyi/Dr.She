'use strict';
var router = require('express').Router();
var AV = require('leanengine');
var request = require('request-json');
var Todo = AV.Object.extend('Todo');
var sha1 = require('../routes/sha1');
var JPush = require('jpush-sdk');
var client = JPush.buildClient('c6bcfebb03c78c23a312f3fb', '749d3838a185f83489bbd66c');
var async = require('async');
var appid = process.env.wx_appid;
var secret = process.env.wx_secret;
var fs = require('fs');
var ejsExcel = require("ejsexcel");
var moment = require('moment');

function exportExcel(filename, data) {
    let exlBuf = fs.readFileSync("./public/upload/users.xlsx");
    //用数据源(对象)data渲染Excel模板
    ejsExcel.renderExcelCb(exlBuf, data, function (err, exlBuf2) {
        if (err) {
            console.error(err);
            return;
        }
        fs.writeFileSync("./public/upload/1.xlsx", exlBuf2);
        console.log(filename);
    });
}

function getTokenAndGetUser(list) {
    console.log(list.length);
    let num = 0;
    let client = request.createClient('https://api.weixin.qq.com/cgi-bin/');
    client.get('token?grant_type=client_credential&appid=' + appid + '&secret=' + secret, function (err, res, body) {
        let token = body.access_token;
        //client = request.createClient('https://api.weixin.qq.com/cgi-bin/user/info?access_token=' + token);
        async.map(list, function (one, callback1) {
            client.get('https://api.weixin.qq.com/cgi-bin/user/info?access_token=' + token + '&openid=' + one.openid, function (err, res, body) {
                //console.log(body);
                num++;
                if (typeof (body) == "undefined") {
                    console.log(one.openid);
                }
                if (typeof (one) == "undefined") {
                    console.log(one.openid);
                }
                let time = new moment(one.createdAt);
                let a = { openid: one.openid, nickname: one.nickname, sex: one.sex,number:one.number, subscribe: body.subscribe?"关注":"取消", createdAt: time.format('YYYY-MM-DD HH:mm:ss'), source: "wechat" };
                callback1(null, a);
            });
        }, function (err, list) {
            exportExcel("1",list);
        });
    });
}
// 查询 Todo 列表
router.get('/1', function (req, res, next) {
    let innerQuery = new AV.Query('WxUser');
    innerQuery.equalTo('emp', 1);
    let query = new AV.Query('Problem');
    query.equalTo('source', 'wechat');
    query.doesNotMatchQuery('user', innerQuery);
    let arr = [];
    let undefinedcount = 0;
    query.count().then(function (count) {
        let num = Math.ceil(count / 1000);
        async.times(num, function (n, callback) {
            query.limit(1000);
            query.skip(1000 * n);
            query.include('user');
            query.find().then(function (problems) {
                async.map(problems, function (problem, callback1) {
                    if (typeof (problem) != "undefined") {
                        if (typeof (problem.get('user')) == "undefined") {
                            undefinedcount++;
                            callback1(null, 1);
                        } else {
                            let openid = problem.get('user').get('openid');
                            arr.push({
                                openid: openid, nickname: problem.get('user').get('nickname'), sex: problem.get('user').get('sex'),
                                createdAt: problem.get('user').get('createdAt')
                            });
                            callback1(null, 1);
                            // if (openid != "" && arr.indexOf(openid) == -1) {
                            //     arr.push(openid);
                            //     callback1(null, 1);
                            // } else {
                            //     callback1(null, 1);
                            // }
                        }
                    } else {
                        callback1(null, 1);
                    }
                }, function (err, problems) {
                    callback(null, n);
                });
            });
        }, function (err, problems) {
            let list2 = [];
            let listMap = {};
            for (let i = 0, len = arr.length, openid, nickname, sex, createdAt, key; i < len; i++) {
                openid = arr[i].openid;
                nickname = arr[i].nickname;
                sex = arr[i].sex;
                createdAt = arr[i].createdAt;
                key = openid + ';' + nickname + ';' + sex + ';' + createdAt; // key为id和name的组合，值为number
                if (!!listMap[key]) {
                    listMap[key]++;
                } else {
                    listMap[key] = 1;
                }
            }
            for (let item in listMap) {
                list2.push({
                    openid: item.split(';')[0],
                    nickname: item.split(';')[1],
                    sex: item.split(';')[2],
                    createdAt: item.split(';')[3],
                    number: listMap[item]
                })
            }
            let newarr = getTokenAndGetUser(list2);
            res.jsonp({ list2: list2 });
            //res.jsonp({ count1: arr.length, count2: list2.length, list2: list2, undefinedcount: undefinedcount });
        });
    });
});

router.get('/2', function (req, res1, next) {
    let innerQuery = new AV.Query('WxUser');
    innerQuery.equalTo('emp', 1);
    let query = new AV.Query('Problem');
    query.equalTo('source', 'app');
    let arr = [];
    let undefinedcount = 0;
    query.doesNotMatchQuery('user', innerQuery);
    query.count().then(function (count) {
        let num = Math.ceil(count / 1000);
        async.times(num, function (n, callback) {
            query.limit(1000);
            query.skip(1000 * n);
            query.include('user');
            query.find().then(function (problems) {
                async.map(problems, function (problem, callback1) {
                    if (typeof (problem) != "undefined") {
                        if (typeof (problem.get('user')) == "undefined") {
                            undefinedcount++;
                            callback1(null, 1);
                        } else {
                            arr.push({
                                nickname: problem.get('user').get('nickname'), createdAt: problem.get('user').get('createdAt')});
                            callback1(null, 1);
                        }
                    } else {
                        callback1(null, 1);
                    }
                }, function (err, problems) {
                    callback(null, n);
                });
            });
        }, function (err, problems) {
            let list2 = [];
            let listMap = {};
            for (let i = 0, len = arr.length, nickname, createdAt, key; i < len; i++) {
                nickname = arr[i].nickname;
                createdAt = arr[i].createdAt;
                key = nickname + ';' + createdAt; // key为id和name的组合，值为number
                if (!!listMap[key]) {
                    listMap[key]++;
                } else {
                    listMap[key] = 1;
                }
            }
            for (let item in listMap) {
                list2.push({
                    nickname: item.split(';')[0],
                    createdAt: item.split(';')[1],
                    source:'app',
                    number: listMap[item]
                })
            }
            exportExcel2('2',list2);
            res.jsonp({ list2: list2 });
            //res.jsonp({ count1: arr.length, count2: list2.length, list2: list2, undefinedcount: undefinedcount });
        });
    });
});
function exportExcel2(filename, data) {
    let exlBuf = fs.readFileSync("./public/upload/users2.xlsx");
    //用数据源(对象)data渲染Excel模板
    ejsExcel.renderExcelCb(exlBuf, data, function (err, exlBuf2) {
        if (err) {
            console.error(err);
            return;
        }
        fs.writeFileSync("./public/upload/2.xlsx", exlBuf2);
        console.log(filename);
    });
}
// 新增 Todo 项目
router.get('/3', function (req, res, next) {
    let query=new AV.Query('WxUser');
    query.exists('phone');
    query.limit(1000);
    query.find().then(function(results){
        async.map(results,function(result,callback){
            callback(null,result.get('phone'));
        },function(err,results){
            res.jsonp(results);
        });
    });
});

module.exports = router;
