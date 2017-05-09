'use strict';
const utils=require('utility');
var request = require('request-json');
var partner_key = process.env.partner_key;
var partner = process.env.partner;
function chunyulogin(user_id, atime) {
    let sign=getSign(user_id,atime);
    console.log(sign);
    let data = {
        "user_id": user_id,
        "password": "123",
        "partner":partner,
        "sign":sign,
        "atime":atime
    };

    let client = request.createClient('https://test.chunyu.mobi');
    client.post('cooperation/server/login/', data, function (err, res, body) {
         console.log(body.error);
    });
}

function getSign(user_id,atime){
    let sign=utils.md5(partner_key + atime + user_id);
    return sign.substr(8,16);
}
module.exports = chunyulogin;