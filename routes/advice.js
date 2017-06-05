'use strict';
var router = require('express').Router();
var AV = require('leanengine');
var request = require('request-json');
var async = require('async');
var moment = require('moment');
var Advice = AV.Object.extend('Advice');

router.post('/add', function (req, res) {
    let sess = req.session;
    let user = AV.Object.createWithoutData('WxUser', sess.objid);
    let advice = new Advice();
    advice.set('image', req.body.image);
    advice.set('content', req.body.content);
    advice.set('user', user);
    advice.save().then(function () {
        res.send(1);
    }, function (err) {
        res.send(err);
    });
});

module.exports = router;

