'use strict';
var router = require('express').Router();
var AV = require('leanengine');
var request = require('request-json');
var appid = process.env.wx_appid;
var secret = process.env.wx_secret;
var WxUser = AV.Object.extend('WxUser');
var Problem = AV.Object.extend('Problem');
var chunyu = require('../routes/chunyu');
var multiparty = require('multiparty');
var fs = require('fs');
var async = require('async');
var multiparty = require('multiparty');
var PersonalFile = AV.Object.extend('PersonalFile');
var Order = AV.Object.extend('Order');
var Recharge = AV.Object.extend('Recharge');
var WxUser = AV.Object.extend('WxUser');
var Business = AV.Object.extend('Business');
var BusinessClient = AV.Object.extend('BusinessClient');
var ClientFile = AV.Object.extend('ClientFile');
var Donate = AV.Object.extend('Donate');
var Goods = AV.Object.extend('Goods');
var moment = require('moment');
moment.locale('zh-cn');

//app用户注册/登录
router.post('/user/register', function (req, res) {
    let name = req.body.name;
    let phone = req.body.phone;
    let password = req.body.password;
    let query = new AV.Query('WxUser');
    query.equalTo('phone', phone);
    query.count().then(function (count) {
        if (count > 0) {
            res.jsonp({ error: 1, msg: "手机号已注册" });
        } else {
            let user = new WxUser();
            user.set('nickname', name);
            user.set('phone', phone);
            user.set('password', password);
            user.set('points', 2);
            user.save().then(function (data) {
                res.jsonp({ error: 0, msg: "", objectid: data.id });
            });
        }
    });
});

router.post('/user/login', function (req, res) {
    let phone = req.body.phone;
    let password = req.body.password;
    let query = new AV.Query('WxUser');
    query.equalTo('phone', phone);
    query.count().then(function (count) {
        if (count == 1) {
            query.equalTo('phone', phone);
            query.equalTo('password', password);
            query.count().then(function (count) {
                if (count == 1) {
                    query.first().then(function (data) {
                        res.jsonp({ error: 0, msg: "", name: data.get('nickname'), objectid: data.id });
                    });
                } else {
                    res.jsonp({ error: 1, msg: "密码不正确" });
                }
            });
        } else {
            res.jsonp({ error: 1, msg: "该手机未注册" });
        }
    });

});

//app微信登录
router.post('/wx/login', function (req, res) {
    let openid = req.body.openid;
    let nickname = req.body.nickname;
    let sex = req.body.sex;
    let city = req.body.city;
    let headimgurl = req.body.headimgurl;
    let province = req.body.province;
    let country = req.body.country;
    let userQuery = new AV.Query('WxUser');
    userQuery.equalTo('unionid', openid);
    userQuery.first().then(function (user) {
        if (typeof (user) != "undefined") {
            res.jsonp({ objectid: user.id });
        } else {
            let newuser = new WxUser();
            newuser.set('unionid', openid);
            newuser.set('nickname', nickname);
            newuser.set('sex', sex);
            newuser.set('city', city);
            newuser.set('headimgurl', headimgurl);
            newuser.set('province', province);
            newuser.set('country', country);
            newuser.set('points', 2);
            newuser.save().then(function (data) {
                res.jsonp({ objectid: data.id });
            });
        }
    });
});

//美容院相关
router.post('/business', function (req, res) {
    let user_id = req.body.user_id;
    let name = req.body.name;
    let phone = req.body.phone;
    let address = req.body.address;
    let area = req.body.area;
    let connecter = req.body.connecter;
    let user = AV.Object.createWithoutData('WxUser', user_id);
    user.set('points', 10);
    user.save();
    let business = new Business();
    business.set('user', user);
    business.set('name', name);
    business.set('phone', phone);
    business.set('address', address);
    business.set('area', area);
    business.set('connecter', connecter);
    business.save().then(function (data) {
        res.jsonp({ error: 0, msg: "", business_id: data.id });
    });
});

router.get('/business/:user_id', function (req, res) {
    let user_id = req.params.user_id;
    let user = AV.Object.createWithoutData('WxUser', user_id);
    let businessQuery = new AV.Query('Business');
    businessQuery.equalTo('user', user);
    businessQuery.first().then(function (data) {
        if (typeof (data) == "undefined") {
            res.jsonp({ count: 0 });
        } else {
            res.jsonp({ count: 1, business_id: data.id });
        }
    });
});

router.get('/business/clients/:business_id', function (req, res) {
    let business_id = req.params.business_id;
    let business = AV.Object.createWithoutData('Business', business_id);
    let clientsQuery = new AV.Query('BusinessClient');
    clientsQuery.equalTo('business', business);
    clientsQuery.equalTo('isDel', false);
    clientsQuery.find().then(function (clients) {
        if (clients.length > 0) {
            async.map(clients, function (client, callback) {
                let fileQuery = new AV.Query('ClientFile');
                fileQuery.equalTo('client', client);
                fileQuery.equalTo('isDel', false);
                fileQuery.descending('createdAt');
                fileQuery.count().then(function (count) {
                    if (count > 0) {
                        fileQuery.first().then(function (data) {
                            client.set('count', count);
                            client.set('last', data.get('createdAt'));
                            callback(null, client);
                        }, function (err) {
                            console.log(err);
                        });
                    } else {
                        client.set('count', 0);
                        callback(null, client);
                    }
                });
            }, function (err, resdata) {
                res.jsonp({ count: clients.length, clients: resdata });
            });
        } else {
            res.jsonp({ count: 0 });
        }
    });
});

router.get('/business/clients/:business_id/:name', function (req, res) {
    let business_id = req.params.business_id;
    let name = req.params.name;
    let business = AV.Object.createWithoutData('Business', business_id);
    let clientsQuery = new AV.Query('BusinessClient');
    clientsQuery.equalTo('business', business);
    clientsQuery.contains('name', name);
    clientsQuery.equalTo('isDel', false);
    clientsQuery.find().then(function (clients) {
        if (clients.length > 0) {
            async.map(clients, function (client, callback) {
                let fileQuery = new AV.Query('ClientFile');
                fileQuery.equalTo('client', client);
                fileQuery.equalTo('isDel', false);
                fileQuery.descending('createdAt');
                fileQuery.count().then(function (count) {
                    if (count == 0) {
                        client.set('count', 0);
                        callback(null, client);
                    } else {
                        fileQuery.first().then(function (data) {
                            client.set('count', count);
                            client.set('last', data.get('createdAt'));
                            callback(null, client);
                        });
                    }
                });
            }, function (err, resdata) {
                res.jsonp({ count: clients.length, clients: resdata });
            });
        } else {
            res.jsonp({ count: 0 });
        }
    });
});

router.post('/business/client/add', function (req, res) {
    let business_id = req.body.business_id;
    let name = req.body.name;
    let age = req.body.age * 1;
    let phone = req.body.phone;
    let area = req.body.area;
    let address = req.body.address;
    let business = AV.Object.createWithoutData('Business', business_id);
    let businessClient = new BusinessClient();
    businessClient.set('isDel', false);
    businessClient.set('name', name);
    businessClient.set('age', age);
    businessClient.set('phone', phone);
    businessClient.set('area', area);
    businessClient.set('address', address);
    businessClient.set('business', business);
    businessClient.save().then(function (data) {
        res.jsonp({ error: 0, msg: "", client_id: data.id });
    }, function (err) {
        console.log(err);
    });
});

router.get('/business/client/:client_id', function (req, res) {
    let client_id = req.params.client_id;
    let client = AV.Object.createWithoutData('BusinessClient', client_id);
    client.fetch().then(function () {
        let fileQuery = new AV.Query('ClientFile');
        fileQuery.equalTo('isDel', false);
        fileQuery.equalTo('client', client);
        fileQuery.find().then(function (results) {
            res.jsonp({ client: client, files: results });
        });
    });
});

router.post('/business/client/update', function (req, res) {
    let client_id = req.body.client_id;
    let name = req.body.name;
    let age = req.body.age * 1;
    let phone = req.body.phone;
    let area = req.body.area;
    let address = req.body.address;
    let client = AV.Object.createWithoutData('BusinessClient', client_id);
    client.set('name', name);
    client.set('age', age);
    client.set('phone', phone);
    client.set('area', area);
    client.set('address', address);
    client.save().then(function (data) {
        res.jsonp({ error: 0, msg: "", client_id: data.id });
    });
});

router.get('/business/client/delete/:client_id', function (req, res) {
    let client_id = req.params.client_id;
    let client = AV.Object.createWithoutData('BusinessClient', client_id);
    client.set('isDel', true);
    client.save().then(function () {
        let fileQuery = new AV.Query('ClientFile');
        fileQuery.equalTo('isDel', false);
        fileQuery.equalTo('client', client);
        fileQuery.find().then(function (files) {
            async.map(files, function (file, callback) {
                file.set('isDel', false);
                callback(null, file);
            }, function (err, files) {
                AV.Object.saveAll(files).then(function (files) {
                    res.jsonp({ error: 0, msg: "" });
                });
            });
        });
    });
});

router.get('/business/clientfile/:file_id', function (req, res) {
    let file_id = req.params.file_id;
    let file = AV.Object.createWithoutData('ClientFile', file_id);
    file.fetch().then(function () {
        res.jsonp({ file: file });
    });
});

router.get('/business/clientfile/delete/:file_id', function (req, res) {
    let file_id = req.params.file_id;
    let file = AV.Object.createWithoutData('ClientFile', file_id);
    file.set('isDel', true);
    file.save().then(function (data) {
        res.jsonp({ error: 0, msg: "" });
    });
});

router.post('/business/clientfile/add', function (req, res) {
    let business_id = req.body.business_id;
    let client_id = req.body.client_id;
    let checktime = new Date(req.body.checktime);
    let birthhistory = req.body.birthhistory;
    let abortionhistory = req.body.abortionhistory;
    let menstruationtime = new Date(req.body.menstruationtime);
    let secretion = req.body.secretion;
    let medicine = req.body.medicine;
    let feeling = req.body.feeling;
    let check = req.body.check;
    let images = req.body.images;
    let client = AV.Object.createWithoutData('BusinessClient', client_id);
    let business = AV.Object.createWithoutData('Business', business_id);
    let file = new ClientFile();
    file.set('isDel', false);
    file.set('client', client);
    file.set('business', business);
    file.set('birthhistory', birthhistory);
    file.set('abortionhistory', abortionhistory);
    file.set('menstruationtime', menstruationtime);
    file.set('secretion', eval(secretion));
    file.set('medicine', medicine);
    file.set('feeling', eval(feeling));
    file.set('check', check);
    file.set('checktime', checktime);
    file.set('images', images);
    file.save().then(function (data) {
        res.jsonp({ error: 0, msg: "", file_id: data.id });
    }, function (err) {
        console.log(err);
    });
});

router.post('/business/clientfile/update', function (req, res) {
    let file_id = req.body.file_id;
    let checktime = new Date(req.body.checktime);
    let birthhistory = req.body.birthhistory;
    let abortionhistory = req.body.abortionhistory;
    let menstruationtime = new Date(req.body.menstruationtime);
    let secretion = req.body.secretion;
    let medicine = req.body.medicine;
    let feeling = req.body.feeling;
    let check = req.body.check;
    let images = req.body.images;
    let file = AV.Object.createWithoutData('ClientFile', file_id);
    file.set('birthhistory', birthhistory);
    file.set('abortionhistory', abortionhistory);
    file.set('menstruationtime', menstruationtime);
    file.set('secretion', eval(secretion));
    file.set('medicine', medicine);
    file.set('feeling', eval(feeling));
    file.set('check', check);
    file.set('checktime', checktime);
    file.set('images', images);
    file.save().then(function (data) {
        res.jsonp({ error: 0, msg: "", file_id: data.id });
    });
});

//春雨接口
router.get('/points/:user_id', function (req, res) {
    let user_id = req.params.user_id;
    let user = AV.Object.createWithoutData('WxUser', user_id);
    user.fetch().then(function () {
        res.jsonp({ error: 0, msg: "", points: user.get('points') });
    });
});

router.get('/login/:user_id', function (req, res) {
    let time = Math.round(new Date().getTime() / 1000).toString();
    let user_id = req.params.user_id;
    chunyu.login(user_id, time).then(function (data) {
        res.jsonp({ error: 0, msg: "" });
    });
});

function parseArray(arrStr) {
    var tempKey = 'arr23' + new Date().getTime();//arr231432350056527
    var arrayJsonStr = '{"' + tempKey + '":' + arrStr + '}';
    var arrayJson;
    if (JSON && JSON.parse) {
        arrayJson = JSON.parse(arrayJsonStr);
    } else {
        arrayJson = eval('(' + arrayJsonStr + ')');
    }
    return arrayJson[tempKey];
};

router.post('/add', function (req, res) {
    let num = req.body.num;
    let user = AV.Object.createWithoutData('WxUser', req.body.user_id);
    user.increment('points', -num);
    let order = new Order();
    order.set('price', 10);
    order.set('points', num);
    order.set('user', user);
    order.save();
    let time = Math.round(new Date().getTime() / 1000).toString();
    let imglist = req.body.imglist.split(',');
    let flag = 1;
    if (imglist[0] == '') {
        flag = 0;
    }
    let data = { "content": req.body.content, "image": imglist, "age": req.body.age + "岁", "sex": "女" };
    chunyu.createFree(user.id, time, data, flag, "app").then(function (data) {
        res.jsonp({ error: 0, id: data });
    });
});

router.get('/problem/:user_id/:problem_id/:content_id', function (req, res) {
    let time = Math.round(new Date().getTime() / 1000).toString();
    let user_id = req.params.user_id;
    let problem_id = req.params.problem_id;
    let content_id = req.params.content_id
    chunyu.problemDetail(user_id, problem_id, content_id, time).then(function (data) {
        chunyu.problemView(user_id, problem_id, time).then(function (view) {
            res.jsonp(data);
        });
    });
});

router.get('/problemList/:user_id', function (req, res) {
    let time = Math.round(new Date().getTime() / 1000).toString();
    let user_id = req.params.user_id;
    chunyu.problemList(user_id, time).then(function (data) {
        res.jsonp(data);
    });
});

router.post('/upload', function (req, res) {
    let form = new multiparty.Form();
    form.parse(req, function (err, fields, files) {
        var iconFile = files.iconImage[0];
        if (iconFile.size !== 0) {
            fs.readFile(iconFile.path, function (err, data) {
                if (err) {
                    return res.send('读取文件失败');
                }
                var theFile = new AV.File(iconFile.originalFilename, data);
                theFile.save().then(function (theFile) {
                    theFile.fetch().then(function () {
                        res.send({ img: theFile.get('url') });
                    });
                }).catch(console.error);
            });
        } else {
            res.send('请选择一个文件。');
        }
    });
});

router.post('/health/add', function (req, res) {
    let name = req.body.name;
    let age = req.body.age * 1;
    let user_id = req.body.user_id;
    let user = AV.Object.createWithoutData('WxUser', user_id);
    let person = new PersonalFile();
    person.set('name', name);
    person.set('age', age);
    if (typeof (user.id) != "undefined") {
        person.set('user', user);
        person.save().then(function () {
            res.jsonp({ error: 0 })
        });
    } else {
        res.jsonp({ error: 1, msg: "账号不存在" });
    }
});

router.get('/health/:user_id', function (req, res) {
    let user_id = req.params.user_id;
    let query = new AV.Query('PersonalFile');
    let user = AV.Object.createWithoutData('WxUser', user_id);
    query.equalTo('user', user);
    query.find().then(function (results) {
        if (results.length == 0) {
            res.jsonp({ error: 0, count: 0 });
        } else {
            res.jsonp({ error: 0, data: results });
        }
    });
});

router.get('/health/delete/:id', function (req, res) {
    let id = req.params.id;
    let person = AV.Object.createWithoutData('PersonalFile', id);
    person.destroy();
    res.jsonp({ error: 0 });
});

router.post('/doctor/list', function (req, res) {
    let clinic_no = req.body.clinic_no;
    let num = req.body.num * 1;
    let province = req.body.province;
    let city = req.body.city;
    let user_id = req.body.user_id;
    let time = Math.round(new Date().getTime() / 1000).toString();
    chunyu.doctorList(user_id, clinic_no, num, province, city, time).then(function (data) {
        res.jsonp(data);
    });
});

router.get('/doctor/detail/:user_id/:doctor_id', function (req, res) {
    let time = Math.round(new Date().getTime() / 1000).toString();
    chunyu.doctorDetail(req.params.user_id, req.params.doctor_id, time).then(function (data) {
        res.jsonp(data);
    });
});

router.post('/choice', function (req, res) {
    let user_id = req.body.user_id;
    let num = req.body.num * 1;
    let price = req.body.price * 1;
    let doctor_id = req.body.doctor_id;
    let user = AV.Object.createWithoutData('WxUser', user_id);
    user.increment('points', -num);
    let order = new Order();
    order.set('points', num);
    order.set('price', price / 100);
    order.set('user', user);
    let time = Math.round(new Date().getTime() / 1000).toString();
    let imglist = req.body.imglist.split(',');
    let data = { "content": req.body.content, "image": imglist, "age": req.body.age + "岁", "sex": "女", "dotcors": doctor_id };
    order.save().then(function (order) {
        chunyu.createPay(user_id, time, data, order.id, price).then(function (data) {
            chunyu.successNotice(user_id, data, time, "app").then(function (data) {
                res.jsonp({ id: data.problems[0].problem_id });
            });
        });
    }, function (err) {
        console.log(err);
    });
});

router.post('/problem/add', function (req, res) {
    let user_id = req.body.user_id;
    let problem_id = req.body.problem_id;
    let content = req.body.content;
    let time = Math.round(new Date().getTime() / 1000).toString();
    chunyu.problemAdd(user_id, problem_id, content, time).then(function (data) {
        res.jsonp(data);
    });
});

router.post('/problem/imageadd', function (req, res) {
    let user_id = req.body.user_id;
    let problem_id = req.body.problem_id;
    let url = req.body.url;
    let time = Math.round(new Date().getTime() / 1000).toString();
    chunyu.problemImageAdd(user_id, problem_id, url, time).then(function (data) {
        res.jsonp(data);
    });
});

router.post('/recharge/add', function (req, res) {
    let user_id = req.body.user_id;
    let goods = req.body.goods;
    let price = req.body.price * 1;
    let source = req.body.source;
    let user = AV.Object.createWithoutData('WxUser', user_id);
    let recharge = new Recharge();
    recharge.set('result', false);
    recharge.set('title', goods);
    recharge.set('source', "app/" + source);
    recharge.set('price', price);
    recharge.set('total_fee', price * 100);
    recharge.set('user', user);
    recharge.save().then(function (data) {
        res.jsonp({ id: data.id });
    });
});

router.get('/donate/:user_id/:points/:title', function (req, res) {
    let user_id = req.params.user_id;
    let points = req.params.points * 1;
    let title = req.params.title;
    let user = AV.Object.createWithoutData('WxUser', user_id);
    user.increment(points);
    user.save().then(function () {
        let donate = new Donate();
        donate.set('user', user);
        donate.set('points', points);
        donate.set('source', "app");
        donate.set('title', title);
        donate.save();
        res.jsonp({ error: 0, msg: "" });
    });
});

//商城相关
router.get('/goods', function (req, res) {
    let type = req.query.type;
    let query = new AV.Query('Goods');
    query.equalTo('type', type);
    query.find().then(function (goods) {
        res.jsonp({ goods: goods });
    });
});

router.post('/goods/add', function (req, res) {
    let goods = req.body;
    async.map(goods, function (good, callback) {
        let goodobj = new Goods();
        goodobj.set('tid', good.tid);
        goodobj.set('type', good.type);
        goodobj.set('imgsrc', good.imgsrc);
        goodobj.set('price', good.price);
        goodobj.set('subject', good.subject);
        goodobj.set('sort', good.sort);
        goodobj.save().then(function () {
            callback(null, 1);
        })
    }, function (err, data) {
        res.jsonp(data.length);
    });
});

module.exports = router;