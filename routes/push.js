'use strict';
var JPush = require('jpush-sdk');
var client = JPush.buildClient('c6bcfebb03c78c23a312f3fb', '749d3838a185f83489bbd66c');

function push(title,msg,user,problemid) {
  console.log(msg);
  client.push().setPlatform(JPush.ALL)
    .setAudience(JPush.alias(user))
    .setNotification(title, JPush.ios(title, 'sound', 1, null, { problemid: problemid, msg: msg }))
    .setOptions(null, 60, null, true, null)
    .send(function (err, res) {
      if (err) {
        if (err instanceof JPush.APIConnectionError) {
          console.log(err.message)
        } else if (err instanceof JPush.APIRequestError) {
          console.log(err.message)
        }
      } else {
        return res.sendno;
      }
    });
}

module.exports.push = push;