'use strict';
const utils = require('utility');
var request = require('request');
var partner_key = process.env.partner_key;
var partner = process.env.partner;

function chunyulogin(user_id, atime) {
    let sign = getSign(user_id, atime);
    let data = {
        "user_id": user_id,
        "password": "123",
        "partner": partner,
        "sign": sign,
        "atime": atime
    };
    request({
        method: 'POST',
        url: 'https://test.chunyu.mobi/cooperation/server/login',
        json: data
    }, function (err, res, body) {
        if (err) {
            console.error('Request failed with response code ' + res.statusCode);
        } else {
            console.log(body);
        }
    });
}

function createFree(user_id, atime,ask) {
    let result=0;
    let sign = getSign(user_id, atime);
    let content = [
        { "type": "text", "text": ask.content },
        { "type": "image", "file": ask.image },
        { "type": "audio", "file": ask.audio },
        { "type": "patient_meta", "age": ask.age, "sex": "女" }
    ];
    let data = {
        "user_id": user_id,
        "partner": partner,
        "content": JSON.stringify(content),
        "sign": sign,
        "atime": atime
    };
    request({
        method: 'POST',
        url: 'https://test.chunyu.mobi/cooperation/server/free_problem/create',
        json: data
    }, function (err, res, body) {
        if (err) {
            console.error('Request failed with response code ' + res.statusCode);
        } else {
            result=body;
            console.log(result);
        }
    });
    return result;
}
function getSign(user_id, atime) {
    let sign = utils.md5(partner_key + atime + user_id);
    return sign.substr(8, 16);
}
module.exports.login = chunyulogin;
module.exports.createFree = createFree;