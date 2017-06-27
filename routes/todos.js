'use strict';
var router = require('express').Router();
var AV = require('leanengine');
var request = require('request-json');
var Todo = AV.Object.extend('Todo');
var sha1 = require('../routes/sha1');
// 查询 Todo 列表
router.get('/', function (req, res, next) {
  let now = Date.now();
  let appKey = sha1.SHA1("A6940962555686" + "UZ" + "5F5E4F53-E1B1-149E-6ED2-C8457F9939D6" + "UZ" + now) + "." + now;
  push();
  function push() {
    let client = request.createClient('https://p.apicloud.com/api/push/');
    client.headers['X-APICloud-AppId'] = 'A6940962555686';
    client.headers['X-APICloud-AppKey'] = appKey;
    let data = {
      "values": {
        "title": "消息标题",
        "content": "消息内容",
        "type": 2, //– 消息类型，1:消息 2:通知
        "platform": 2, //0:全部平台，1：ios, 2：android
        //    "groupName" : "department", //推送组名，多个组用英文逗号隔开.默认:全部组。eg.group1,group2 .
        //    "userIds" : "testId" //推送用户id, 多个用户用英文逗号分隔，eg. user1,user2。
      }
    }
    client.post('message', data, function (err, res, body) {
      console.log("body:" +JSON.stringify(body));
    });
  }
});

// 新增 Todo 项目
router.post('/', function (req, res, next) {

});

module.exports = router;
