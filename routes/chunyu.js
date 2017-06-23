'use strict';
var AV = require('leanengine');
const utils = require('utility');
var request = require('request');
var rp = require('request-promise');
var partner_key = process.env.partner_key;
var partner = process.env.partner;
var test_url = process.env.product_url;
var product_url = process.env.product_url;
var Problem = AV.Object.extend('Problem');
var Order = AV.Object.extend('Order');
var Content=AV.Object.extend('Content');

function chunyulogin(user_id, atime) {
    let sign = getSign(user_id, atime);
    let data = {
        "user_id": user_id,
        "password": "123",
        "partner": partner,
        "sign": sign,
        "atime": atime
    };
    var options = {
        method: 'POST',
        uri: test_url + '/cooperation/server/login',
        body: data,
        json: true // Automatically stringifies the body to JSON
    };

    return rp(options)
        .then(function (body) {
            return body;
            // POST succeeded...
        })
        .catch(function (err) {
            console.log(err);
            return result;
            // POST failed...
        });
}

function createFree(user_id, atime, ask, flag) {
    let result = 0;
    let sign = getSign(user_id, atime);
    let content = [
        { "type": "text", "text": ask.content },
        { "type": "patient_meta", "age": ask.age, "sex": ask.sex }
    ];
    let imgArrLen = 1;
    if (flag == 0) {
        imgArrLen += 1;
    }
    if (ask.image.length == imgArrLen) {
        content = [
            { "type": "text", "text": ask.content },
            { "type": "image", "file": ask.image[0] },
            { "type": "patient_meta", "age": ask.age, "sex": ask.sex }
        ];
    } else if (ask.image.length == imgArrLen + 1) {
        content = [
            { "type": "text", "text": ask.content },
            { "type": "image", "file": ask.image[0] },
            { "type": "image", "file": ask.image[1] },
            { "type": "patient_meta", "age": ask.age, "sex": ask.sex }
        ];
    } else if (ask.image.length == imgArrLen + 2) {
        content = [
            { "type": "text", "text": ask.content },
            { "type": "image", "file": ask.image[0] },
            { "type": "image", "file": ask.image[1] },
            { "type": "image", "file": ask.image[2] },
            { "type": "patient_meta", "age": ask.age, "sex": ask.sex }
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
        uri: test_url + '/cooperation/server/free_problem/create',
        body: data,
        json: true // Automatically stringifies the body to JSON
    };
    return rp(options)
        .then(function (body) {
            if (body.error == 0) {
                result = body.problem_id;
                let problem = new Problem();
                problem.set('problem_id', result);
                problem.set('status', 'n');
                problem.set('has_answer', false);
                problem.set('user_id', user_id);
                problem.set('ask',ask.content);
                problem.set('image',ask.image);
                let user = AV.Object.createWithoutData('WxUser', user_id);
                problem.set('user', user);
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

function problemDetail(user_id, problem_id, last, atime) {
    let result = { error: 1 };
    let sign = getSign(user_id, atime);
    let data = {
        "user_id": user_id,
        "partner": partner,
        "problem_id": problem_id,
        "sign": sign,
        "last_content_id": last,
        "atime": atime
    };
    //console.log(data);
    var options = {
        method: 'POST',
        uri: test_url + '/cooperation/server/problem/detail',
        body: data,
        json: true // Automatically stringifies the body to JSON
    };
    return rp(options)
        .then(function (body) {
            result["error"] = 0;
            result["content"] = body.content;
            result["doctor"] = body.doctor;
            result["problem"] = body.problem;
            return result;
            // POST succeeded...
        })
        .catch(function (err) {
            //console.log(err);
            return result;
            // POST failed...
        });
}

function problemView(user_id, problem_id, atime) {
    let result = { error: 1 };
    let sign = getSign(user_id, atime);
    let data = {
        "user_id": user_id,
        "partner": partner,
        "problem_id": problem_id,
        "sign": sign,
        "atime": atime
    };
    var options = {
        method: 'POST',
        uri: test_url + '/cooperation/server/problem/view',
        body: data,
        json: true // Automatically stringifies the body to JSON
    };
    return rp(options)
        .then(function (body) {
            return body;
            // POST succeeded...
        })
        .catch(function (err) {
            console.log(err);
            return result;
            // POST failed...
        });
}

function doctorDetail(user_id, doctor_id, atime) {
    let result = { error: 1 };
    let sign = getSign(user_id, atime);
    let data = {
        "user_id": user_id,
        "partner": partner,
        "doctor_id": doctor_id,
        "sign": sign,
        "atime": atime
    };
    //console.log(data);
    var options = {
        method: 'POST',
        uri: test_url + '/cooperation/server/doctor/detail',
        body: data,
        json: true // Automatically stringifies the body to JSON
    };
    return rp(options)
        .then(function (body) {
            result["error"] = 0;
            result["doctor"] = body;
            //console.log(result);
            return body;
            // POST succeeded...
        })
        .catch(function (err) {
            console.log(err);
            return result;
            // POST failed...
        });
}

function problemAdd(user_id, problem_id, line, atime) {
    let result = { error: 1 };
    let sign = getSign(user_id, atime);
    let content = [
        { "type": "text", "text": line }
    ];
    let data = {
        "user_id": user_id,
        "partner": partner,
        "problem_id": problem_id,
        "content": JSON.stringify(content),
        "sign": sign,
        "atime": atime
    };
    var options = {
        method: 'POST',
        uri: test_url + '/cooperation/server/problem_content/create',
        body: data,
        json: true // Automatically stringifies the body to JSON
    };
    return rp(options)
        .then(function (body) {
            let user = AV.Object.createWithoutData('WxUser', user_id);
            let newContent=new Content();
            newContent.set('askorreply','p');
            newContent.set('atime',atime*1);
            newContent.set('type','text');
            newContent.set('user',user);
            newContent.set('text',line);
            let problemQuery=new AV.Query('Problem');
            problemQuery.equalTo('problem_id',problem_id);
            problemQuery.first().then(function(problem){
                newContent.set('problem',problem);
                newContent.save().then(function(){
                    
                },function(err){
                    console.log(err);
                });
                return body;
            },function(err){
                console.log(err);
            });
            
            // POST succeeded...
        })
        .catch(function (err) {
            console.log(err);
            return result;
            // POST failed...
        });
}

function problemImageAdd(user_id, problem_id, image_url, atime) {
    let result = { error: 1 };
    let sign = getSign(user_id, atime);
    let content = [
        { "type": "image", "file": image_url }
    ];
    let data = {
        "user_id": user_id,
        "partner": partner,
        "problem_id": problem_id,
        "content": JSON.stringify(content),
        "sign": sign,
        "atime": atime
    };
    var options = {
        method: 'POST',
        uri: test_url + '/cooperation/server/problem_content/create',
        body: data,
        json: true // Automatically stringifies the body to JSON
    };
    return rp(options)
        .then(function (body) {
            let user = AV.Object.createWithoutData('WxUser', user_id);
            let newContent=new Content();
            newContent.set('askorreply','p');
            newContent.set('atime',atime*1);
            newContent.set('type','image');
            newContent.set('user',user);
            newContent.set('image',image_url);
            let problemQuery=new AV.Query('Problem');
            problemQuery.equalTo('problem_id',problem_id);
            problemQuery.first().then(function(problem){
                newContent.set('problem',problem);
                newContent.save();
                return body;
            });
            
            // POST succeeded...
        })
        .catch(function (err) {
            console.log(err);
            return result;
            // POST failed...
        });
}

function problemList(user_id, atime) {
    let result = { error: 1 };
    let sign = getSign(user_id, atime);
    let data = {
        "user_id": user_id,
        "partner": partner,
        "start_num": 0,
        "count": 100,
        "sign": sign,
        "atime": atime
    };
    var options = {
        method: 'POST',
        uri: test_url + '/cooperation/server/problem/list/my',
        body: data,
        json: true // Automatically stringifies the body to JSON
    };
    return rp(options)
        .then(function (body) {
            //result["error"]=0;
            //result["content"]=body.content;
            //console.log(result);
            return body;
            // POST succeeded...
        })
        .catch(function (err) {
            console.log(err);
            return result;
            // POST failed...
        });
}

function doctorList(user_id, clinic_no, num, province, city, atime) {
    let result = { error: 1 };
    let sign = getSign(user_id, atime);
    let data = {
        "clinic_no": clinic_no,
        "user_id": user_id,
        "partner": partner,
        "start_num": num,
        "count": 10,
        "sign": sign,
        "atime": atime
    };
    var options = {
        method: 'POST',
        uri: test_url + '/cooperation/server/doctor/get_clinic_doctors',
        body: data,
        json: true // Automatically stringifies the body to JSON
    };
    return rp(options)
        .then(function (body) {
            result["error"] = 0;
            result["doctors"] = body.doctors;
            //console.log(result);
            return result;
            // POST succeeded...
        })
        .catch(function (err) {
            console.log(err);
            return result;
            // POST failed...
        });
}

function deleteProblem(user_id, problem_id, atime) {
    let result = { error: 1 };
    let sign = getSign(user_id, atime);
    let data = {
        "user_id": user_id,
        "problem_id": problem_id,
        "partner": partner,
        "sign": sign,
        "atime": atime
    };
    var options = {
        method: 'POST',
        uri: test_url + '/cooperation/server/problem/delete',
        body: data,
        json: true // Automatically stringifies the body to JSON
    };
    return rp(options)
        .then(function (body) {
            //result["error"]=0;
            //result["content"]=body.content;
            //console.log(result);
            return body;
            // POST succeeded...
        })
        .catch(function (err) {
            console.log(err);
            return result;
            // POST failed...
        });
}

function createPay(user_id, atime, ask, partner_order_id, price) {
    let result = { error: 1 };
    let sign = getSign(user_id, atime);
    let content = [
        { "type": "text", "text": ask.content },
        { "type": "patient_meta", "age": ask.age, "sex": ask.sex }
    ];
    if (ask.image.length == 1 && ask.image[0] != '') {
        content = [
            { "type": "text", "text": ask.content },
            { "type": "image", "file": ask.image[0] },
            { "type": "patient_meta", "age": ask.age, "sex": ask.sex }
        ];
    } else if (ask.image.length == 2) {
        content = [
            { "type": "text", "text": ask.content },
            { "type": "image", "file": ask.image[0] },
            { "type": "image", "file": ask.image[1] },
            { "type": "patient_meta", "age": ask.age, "sex": ask.sex }
        ];
    } else if (ask.image.length == 3) {
        content = [
            { "type": "text", "text": ask.content },
            { "type": "image", "file": ask.image[0] },
            { "type": "image", "file": ask.image[1] },
            { "type": "image", "file": ask.image[2] },
            { "type": "patient_meta", "age": ask.age, "sex": ask.sex }
        ];
    }
    let data = {
        "user_id": user_id,
        "doctor_ids": ask.dotcors,
        "partner_order_id": partner_order_id,
        "price": price,
        "content": JSON.stringify(content),
        "partner": partner,
        "sign": sign,
        "atime": atime
    };
    var options = {
        method: 'POST',
        uri: test_url + '/cooperation/server/payment/create_record',
        body: data,
        json: true // Automatically stringifies the body to JSON
    };
    return rp(options)
        .then(function (body) {
            if (body.error == 0) {
                let chunyu_order_id = body.chunyu_order_id;
                let order = AV.Object.createWithoutData('Order', partner_order_id);
                order.set('chunyu_order_id', chunyu_order_id);
                order.save();
                return chunyu_order_id;
            }
            // POST succeeded...
        })
        .catch(function (err) {
            console.log(err);
            return result;
            // POST failed...
        });
}

function successNotice(user_id, chunyu_order_id, atime) {
    let result = { error: 1 };
    let sign = getSign(user_id, atime);
    let data = {
        "user_id": user_id,
        "chunyu_order_id": chunyu_order_id,
        "partner": partner,
        "sign": sign,
        "atime": atime
    };
    var options = {
        method: 'POST',
        uri: test_url + '/cooperation/server/payment/success_notice',
        body: data,
        json: true // Automatically stringifies the body to JSON
    };
    return rp(options)
        .then(function (body) {
            let problem = new Problem();
            problem.set('problem_id', body.problems[0].problem_id);
            problem.set('status', 'n');
            problem.set('has_answer', false);
            problem.set('user_id', user_id);
            let user = AV.Object.createWithoutData('WxUser', user_id);
            problem.set('user', user);
            problem.save();
            return body;
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
module.exports.problemDetail = problemDetail;
module.exports.doctorDetail = doctorDetail;
module.exports.problemAdd = problemAdd;
module.exports.problemList = problemList;
module.exports.doctorList = doctorList;
module.exports.deleteProblem = deleteProblem;
module.exports.createPay = createPay;
module.exports.successNotice = successNotice;
module.exports.problemImageAdd = problemImageAdd;
module.exports.problemView = problemView;