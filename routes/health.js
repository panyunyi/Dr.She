'use strict';
var router = require('express').Router();
var AV = require('leanengine');
var request=require('request-json');
var appid= process.env.wx_appid;
var secret= process.env.wx_secret;
var WxUser = AV.Object.extend('WxUser');

router.get('/', function(req, res) {
    res.render('health');
});

router.get('/add', function(req, res) {
    res.render('health_add');
});

module.exports = router;
