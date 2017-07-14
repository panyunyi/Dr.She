'use strict';
var router = require('express').Router();
var AV = require('leanengine');
var request = require('request-json');
var Todo = AV.Object.extend('Todo');
var sha1 = require('../routes/sha1');
var JPush = require('jpush-sdk');
var client = JPush.buildClient('c6bcfebb03c78c23a312f3fb', '749d3838a185f83489bbd66c');
// 查询 Todo 列表
router.get('/1', function (req, res, next) {

});

router.get('/', function (req, res1, next) {


});

// 新增 Todo 项目
router.post('/', function (req, res, next) {

});

module.exports = router;
