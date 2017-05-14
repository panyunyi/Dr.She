'use strict';
var router = require('express').Router();
var AV = require('leanengine');
var request=require('request-json');
var appid= process.env.wx_appid;
var secret= process.env.wx_secret;

router.post('/reply', function(req, res) {
    let result={
        "error": 0, // 0 代表成功,其它 代表异常
        "error_msg": "" //错误信息
    };
    console.log(req.body);
    let problem_id=req.body.problem_id;
    let content= eval("'" +req.body.content+ "'");
    content = unescape(content.replace(/\u/g, "%u"));
    let query=new AV.Query('Problem');
    query.equalTo('problem_id',problem_id);
    query.first().then(function(result){

    });
    res.jsonp(result);
});

router.post('/close', function(req, res) {
    let result={
        "error": 0, // 0 代表成功,其它 代表异常
        "error_msg": "" //错误信息
    };
    console.log(req.body);
    res.jsonp(result);
});

module.exports = router;
