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
  let now = Date.now();
  let appKey = sha1.SHA1("A6940962555686" + "UZ" + "5F5E4F53-E1B1-149E-6ED2-C8457F9939D6" + "UZ" + now) + "." + now;
  push();
  function push() {
    let client = request.createClient('https://p.apicloud.com/api/push/');
    client.headers['X-APICloud-AppId'] = 'A6940962555686';
    client.headers['X-APICloud-AppKey'] = appKey;
    client.headers['Content-Type'] = 'application/json';
    let test = { data: 2 }
    let data = {
      "title": "消息标题",
      "content": JSON.stringify(test),
      "type": 1,
      "platform": 2,
      "userIds": "5951c6331b69e60062dd78d8"
    }
    client.post('message', data, function (err, res1, body) {
      res.jsonp(body);
    });
  }
});

router.get('/', function (req, res1, next) {
  client.push().setPlatform(JPush.ALL)
    .setAudience(JPush.alias('5951bfb7ac502e006c9136a6'))
    .setNotification('Hi, JPush', JPush.ios('', 'sound', 1,null,{data:1,data1:2}))
    .setOptions(null, 60, null, true, null)
    .send(function (err, res) {
      if (err) {
        if (err instanceof JPush.APIConnectionError) {
          console.log(err.message)
        } else if (err instanceof JPush.APIRequestError) {
          console.log(err.message)
        }
      } else {
        console.log('Sendno: ' + res.sendno)
        console.log('Msg_id: ' + res.msg_id)
        res1.jsonp('Sendno: ' + res.sendno + " Msg_id: " + res.msg_id);
      }
    });

});

// 新增 Todo 项目
router.post('/', function (req, res, next) {

});

module.exports = router;
