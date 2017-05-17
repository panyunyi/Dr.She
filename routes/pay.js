'use strict';
var router = require('express').Router();
var AV = require('leanengine');
var request = require('request-json');
var appid = process.env.wx_appid;
var secret = process.env.wx_secret;
var partner_key = process.env.partner_key;
var chunyu = require('../routes/chunyu');
var async = require('async');
var moment=require('moment');

router.get('/', function (req, res) {
    let points=req.query.points;
    res.render('pay',{points:0,title:"充值"});
    // if(points>0){
    //     res.render('pay',{points:points,title:(points==2?"系统指派医生":"一题多问")});
    // }else{
    //     res.render('pay',{points:0,title:"充值"});
    // }
});

router.post('/recharge', function (req, res) {
    let time = Math.round(new Date().getTime() / 1000).toString();
    let sess = req.session;
    let points=req.body.points*1;
    let money=req.body.money*1;
    let user = AV.Object.createWithoutData('WxUser', sess.objid);
    user.increment('points',points);
    user.save().then(function(user){
        res.send({error:0});
    });
});

module.exports = router;

