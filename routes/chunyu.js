'use strict';
var AV = require('leanengine');
const utils = require('utility');
var request = require('request');
var rp = require('request-promise');
var partner_key = process.env.partner_key;
var partner = process.env.partner;
var Problem = AV.Object.extend('Problem');

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
        { "type": "patient_meta", "age": ask.age, "sex": ask.sex}
    ];
    if(ask.image==2){
        content = [
            { "type": "text", "text": ask.content },
            { "type": "image", "file": ask.image[0] },
            { "type": "patient_meta", "age": ask.age, "sex": ask.sex}
        ];
    }else if(ask.image==3){
        content = [
            { "type": "text", "text": ask.content },
            { "type": "image", "file": ask.image[0] },
            { "type": "image", "file": ask.image[1] },
            { "type": "patient_meta", "age": ask.age, "sex": ask.sex}
        ];
    }else if(ask.image==4){
        content = [
            { "type": "text", "text": ask.content },
            { "type": "image", "file": ask.image[0] },
            { "type": "image", "file": ask.image[1] },
            { "type": "image", "file": ask.image[2] },
            { "type": "patient_meta", "age": ask.age, "sex": ask.sex}
        ];
    }
    let data = {
        "user_id": user_id,
        "partner": partner,
        "content": JSON.stringify(content),
        "sign": sign,
        "atime": atime
    };

    var options = {
        method: 'POST',
        uri: 'https://test.chunyu.mobi/cooperation/server/free_problem/create',
        body: data,
        json: true // Automatically stringifies the body to JSON
    };
    return rp(options)
        .then(function (body) {
            if(body.error==0){
                result=body.problem_id;
                let problem=new Problem();
                problem.set('problem_id',result);
                problem.set('status','n');
                problem.set('has_answer',false);
                problem.set('user_id',user_id);
                problem.save();
                return result;
            } 
            // POST succeeded...
        })
        .catch(function (err) {
            console.log(err);
            return result;
            // POST failed...
        });
}

function getSign(user_id, atime) {
    let sign = utils.md5(partner_key + atime + user_id);
    return sign.substr(8, 16);
}
module.exports.login = chunyulogin;
module.exports.createFree = createFree;