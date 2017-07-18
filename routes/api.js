'use strict';
var router = require('express').Router();
var AV = require('leanengine');
var request = require('request-json');
var Todo = AV.Object.extend('Todo');
var async=require('async');

router.get('/json/users', function (req, res, next) {
    let query=new AV.Query('WxUser');
    let arr=[];
    query.count().then(function(count){
        let num = Math.ceil(count / 1000);
        async.times(num, function (n, callback) {
            query.limit(1000);
            query.skip(1000 * n);
            query.find().then(function (users) {
                async.map(users, function (user, callback1) {
                    if(typeof(user)!="undefined"){
                        let one={nickname:user.get('nickname')?user.get('nickname'):"",sex:user.get('sex')?user.get('sex'):"",
                        phone:user.get('phone')?user.get('phone'):"",points:user.get('points'),city:user.get('city')?user.get('city'):""};
                        arr.push(one);
                    }
                    callback1(null,user);
                },function(err,results){
                    callback(null,n);
                });
        },function(err,users){

        });
    });
});

router.get('/', function (req, res1, next) {


});

// 新增 Todo 项目
router.post('/', function (req, res, next) {

});

module.exports = router;
