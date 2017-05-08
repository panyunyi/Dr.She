'use strict';
const utils=require('utility');
var request = require('request-json');
var partner_key = process.env.partner_key;
var partner = process.env.partner;
function chunyulogin(openid, atime) {
    console.log(partner);
    let sign=getSign(atime);
    console.log(sign);
    let data = {
        user_id: openid,
        password: '123',
        partner:partner,
        sign:sign,
        atime:atime
    };
    let client = request.createClient('https://test.chunyu.mobi/');
    console.log(data);
    client.post('cooperation/server/login/', data, function (err, res, body) {
        console.log(err);
        console.log(body);
        console.log(res);
    });
}

function getSign(user_id,atime){
    let sign=utils.md5(partner_key + atime + user_id).substr(8,16);
    return sign;
}
module.exports = chunyulogin;