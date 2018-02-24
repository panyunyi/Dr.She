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
var ClientAttachFile = AV.Object.extend('ClientAttachFile');
var Donate = AV.Object.extend('Donate');
var Goods = AV.Object.extend('Goods');
var Advice = AV.Object.extend('Advice');
var Commet = AV.Object.extend('Commet');
var Thread = AV.Object.extend('Thread');
var ThreadViewsMap = AV.Object.extend('ThreadViewsMap');
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
                        let query2 = new AV.Query('Business');
                        query2.equalTo('user', data);
                        query2.equalTo('isDel', false);
                        query2.count().then(function (count2) {
                            res.jsonp({ error: 0, msg: "", name: data.get('nickname'), objectid: data.id, flag: count2 });
                        });
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

router.post('/user/login2', function (req, res) {
    let phone = req.body.phone;
    let query = new AV.Query('WxUser');
    query.equalTo('phone', phone);
    query.first().then(function (data) {
        if (typeof (data) == "undefined") {
            res.jsonp({ error: 1, msg: "该手机未注册" });
        } else {
            let query2 = new AV.Query('Business');
            query2.equalTo('user', data);
            query2.equalTo('isDel', false);
            query2.count().then(function (count2) {
                res.jsonp({ error: 0, msg: "", name: data.get('nickname'), objectid: data.id, flag: count2 });
            });
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
            let query2 = new AV.Query('Business');
            query2.equalTo('user', user);
            query2.equalTo('isDel', false);
            query2.count().then(function (count2) {
                res.jsonp({ objectid: user.id, flag: count2 });
            });
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
                res.jsonp({ objectid: data.id, flag: 0 });
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
    let pwd = req.body.pwd;
    let user = AV.Object.createWithoutData('WxUser', user_id);
    user.increment('points', 60);
    user.save();
    let business = new Business();
    business.set('user', user);
    business.set('name', name);
    business.set('phone', phone);
    business.set('address', address);
    business.set('area', area);
    business.set('connecter', connecter);
    business.set('pwd', pwd);
    business.save().then(function (data) {
        res.jsonp({ error: 0, msg: "", business_id: data.id });
    });
});

router.post('/business/update', function (req, res) {
    let business_id = req.body.business_id;
    let name = req.body.name;
    let phone = req.body.phone;
    let address = req.body.address;
    let area = req.body.area;
    let connecter = req.body.connecter;
    let business = AV.Object.createWithoutData('Business', business_id);
    business.set('name', name);
    business.set('phone', phone);
    business.set('address', address);
    business.set('area', area);
    business.set('connecter', connecter);
    business.save().then(function (data) {
        res.jsonp({ error: 0, msg: "", business_id: data.id });
    });
});

router.post('/business/pwd', function (req, res) {
    let business_id = req.body.business_id;
    let pwd = req.body.pwd;
    let business = AV.Object.createWithoutData('Business', business_id);
    business.set('pwd', pwd);
    business.save().then(function () {
        res.jsonp({ error: 0, msg: "" });
    }, function (err) {
        res.jsonp({ error: 1, msg: err });
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
            res.jsonp({
                count: 1, business_id: data.id, name: data.get('name'), phone: data.get('phone'), address: data.get('address'),
                connecter: data.get('connecter'), audit: data.get('audit')
            });
        }
    });
});

router.get('/business', function (req, res) {
    let user_id = req.query.user_id;
    let phone = req.query.phone;
    let pwd = req.query.pwd;
    let user = AV.Object.createWithoutData('WxUser', user_id);
    let businessQuery = new AV.Query('Business');
    businessQuery.equalTo('user', user);
    businessQuery.equalTo('phone', phone);
    businessQuery.equalTo('pwd', pwd);
    businessQuery.count().then(function (count) {
        if (count == 1) {
            res.jsonp({ error: 0, msg: "" });
        } else {
            res.jsonp({ error: 1, msg: "手机号或密码不正确" });
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
        //附件未删除
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

router.get('/business/clientattachfile/:client_id', function (req, res) {
    let client_id = req.params.client_id;
    let client = AV.Object.createWithoutData('BusinessClient', client_id);
    let query = new AV.Query('ClientAttachFile');
    query.equalTo('isDel', false);
    query.equalTo('client', client);
    query.first().then(function (file) {
        res.jsonp({ file: file });
    });
});

router.get('/business/allfile/:client_id/:file_id', function (req, res) {
    let client_id = req.params.client_id;
    let client = AV.Object.createWithoutData('BusinessClient', client_id);
    let query = new AV.Query('ClientAttachFile');
    query.equalTo('client', client);
    query.first().then(function (attachfile) {
        let file_id = req.params.file_id;
        let file = AV.Object.createWithoutData('ClientFile', file_id);
        file.fetch().then(function () {
            res.jsonp({ attachfile: attachfile, file: file });
        });
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

router.post('/business/clientattachfile/add', function (req, res) {
    let business_id = req.body.business_id;
    let client_id = req.body.client_id;
    let client = AV.Object.createWithoutData('BusinessClient', client_id);
    let business = AV.Object.createWithoutData('Business', business_id);
    let birthhistory = req.body.birthhistory;
    let abortionhistory = req.body.abortionhistory;
    let menstruationtime = new Date(req.body.menstruationtime);
    let secretion = req.body.secretion;
    let medicine = req.body.medicine;
    let feeling = req.body.feeling;
    let file = new ClientAttachFile();
    file.set('isDel', false);
    file.set('client', client);
    file.set('business', business);
    file.set('birthhistory', birthhistory);
    file.set('abortionhistory', abortionhistory);
    file.set('menstruationtime', menstruationtime);
    file.set('secretion', secretion);
    file.set('medicine', medicine);
    file.set('feeling', feeling);
    file.save().then(function (data) {
        res.jsonp({ error: 0, msg: "", file_id: data.id });
    }, function (err) {
        console.log(err);
    });
});

router.post('/business/clientattachfile/update', function (req, res) {
    let file_id = req.body.file_id;
    let birthhistory = req.body.birthhistory;
    let abortionhistory = req.body.abortionhistory;
    let menstruationtime = new Date(req.body.menstruationtime);
    let secretion = req.body.secretion;
    let medicine = req.body.medicine;
    let feeling = req.body.feeling;
    let file = AV.Object.createWithoutData('ClientAttachFile', file_id);
    file.set('birthhistory', birthhistory);
    file.set('abortionhistory', abortionhistory);
    file.set('menstruationtime', menstruationtime);
    file.set('secretion', secretion);
    file.set('medicine', medicine);
    file.set('feeling', feeling);
    file.save().then(function (data) {
        res.jsonp({ error: 0, msg: "", file_id: data.id });
    });
});

router.post('/business/clientfile/add', function (req, res) {
    let business_id = req.body.business_id;
    let client_id = req.body.client_id;
    let checktime = new Date(req.body.checktime);
    // let birthhistory = req.body.birthhistory;
    // let abortionhistory = req.body.abortionhistory;
    // let menstruationtime = new Date(req.body.menstruationtime);
    // let secretion = req.body.secretion;
    // let medicine = req.body.medicine;
    // let feeling = req.body.feeling;
    let check = req.body.check;
    let images = req.body.images;
    let client = AV.Object.createWithoutData('BusinessClient', client_id);
    let business = AV.Object.createWithoutData('Business', business_id);
    let file = new ClientFile();
    file.set('isDel', false);
    file.set('client', client);
    file.set('business', business);
    // file.set('birthhistory', birthhistory);
    // file.set('abortionhistory', abortionhistory);
    // file.set('menstruationtime', menstruationtime);
    // file.set('secretion', secretion);
    // file.set('medicine', medicine);
    // file.set('feeling', feeling);
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
    // let birthhistory = req.body.birthhistory;
    // let abortionhistory = req.body.abortionhistory;
    // let menstruationtime = new Date(req.body.menstruationtime);
    // let secretion = req.body.secretion;
    // let medicine = req.body.medicine;
    // let feeling = req.body.feeling;
    let check = req.body.check;
    let images = req.body.images;
    let file = AV.Object.createWithoutData('ClientFile', file_id);
    // file.set('birthhistory', birthhistory);
    // file.set('abortionhistory', abortionhistory);
    // file.set('menstruationtime', menstruationtime);
    // file.set('secretion', secretion);
    // file.set('medicine', medicine);
    // file.set('feeling', feeling);
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
    //user.increment('points', -num);
    // let order = new Order();
    // order.set('price', 10);
    // order.set('points', num);
    // order.set('user', user);
    // order.save();
    let time = Math.round(new Date().getTime() / 1000).toString();
    let imglist = req.body.imglist.split(',');
    let flag = 1;
    if (imglist[0] == '') {
        flag = 0;
    }
    let data = { "content": req.body.content, "image": imglist, "age": req.body.age + "岁", "sex": "女" };
    chunyu.createFree(user.id, time, data, flag, "app").then(function (data) {
        getCount(req.body.content, res, { error: 0, id: data });
        //res.jsonp({ error: 0, id: data });
    });
});

router.get('/problem/:user_id/:problem_id/:content_id', function (req, res) {
    let result = { error: 1 };
    let time = Math.round(new Date().getTime() / 1000).toString();
    let user_id = req.params.user_id;
    let problem_id = req.params.problem_id;
    let content_id = req.params.content_id
    chunyu.problemDetail(user_id, problem_id, content_id, time).then(function (data) {
        chunyu.problemView(user_id, problem_id, time).then(function (view) {
            let query = new AV.Query('KeyWords2');
            query.equalTo('isDel', false);
            query.find().then(function (keys) {
                async.map(data.content, function (content, callback) {
                    let arr = JSON.parse(content.content);
                    //console.log(arr);
                    async.map(arr, function (line, callback1) {
                        if (line.text) {
                            keys.forEach(function (key) {
                                if (line.text.indexOf(key.get('name')) > 0) {
                                    //console.log(line);
                                    content["key"] = key.get('name');
                                }
                            });
                        }
                        callback1(null, 1);
                    }, function (err, resline) {
                        callback(null, 1);
                    });
                    //callback(null,1);
                }, function (err, rescontent) {
                    result["error"] = 0;
                    result["content"] = data.content;
                    result["doctor"] = data.doctor;
                    result["problem"] = data.problem;
                    res.jsonp(result);
                });
            });
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
                        //res.jsonp({ img: theFile.get('url') });
                        res.send({ img: theFile.get('url') });
                    });
                }).catch(console.error);
            });
        } else {
            res.send('请选择一个文件。');
        }
    });
});

router.post('/upload1', function (req, res) {
    let stream = req.body.imageData;
    let name = req.body.name;
    let data = { base64: stream };
    let file = new AV.File(name, data);
    file.save().then(function (theFile) {
        theFile.fetch().then(function () {
            res.jsonp({ img: theFile.get('url') });
        });
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
                getCount(req.body.content, res, { id: data.problems[0].problem_id });
                //res.jsonp({ id: data.problems[0].problem_id });
            });
        });
    }, function (err) {
        console.log(err);
    });
});

function getCount(content, res, data) {
    let query = new AV.Query('Medicine');
    query.equalTo('isDel', false);
    query.limit(1000);
    query.find().then(function (results) {
        async.map(results, function (result, callback) {
            if (content.indexOf(result.get('name')) > 0) {
                result.increment('recommend', 1);
                result.save().then(function () {
                    callback(null, 1);
                });
            } else {
                callback(null, 0);
            }
        }, function (err, results) {
            res.jsonp(data);
        });
    });
}

router.post('/problem/add', function (req, res) {
    let user_id = req.body.user_id;
    let problem_id = req.body.problem_id;
    let content = req.body.content;
    let time = Math.round(new Date().getTime() / 1000).toString();
    chunyu.problemAdd(user_id, problem_id, content, time).then(function (data) {
        getCount(content, res, data);
        //res.jsonp(data);
    });
});

router.post('/problem/delete', function (req, res) {
    let user_id = req.body.user_id;
    let problem_id = req.body.problem_id;
    let time = Math.round(new Date().getTime() / 1000).toString();
    chunyu.deleteProblem(user_id, problem_id, time).then(function (data) {
        res.jsonp(data);
    });
});

router.post('/problem/imageadd', function (req, res) {
    let user_id = req.body.user_id;
    let problem_id = req.body.problem_id;
    let url = req.body.url;
    let time = Math.round(new Date().getTime() / 1000).toString();
    chunyu.problemImageAdd(user_id, problem_id, url, time).then(function (data) {
        res.jsonp({ error: 0 });
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

//我要求助
router.post('/advice/add', function (req, res) {
    let content = req.body.content;
    let phone = req.body.phone;
    let user_id = req.body.user_id;
    let image = req.body.image;
    let user = AV.Object.createWithoutData('WxUser', user_id);
    let advice = new Advice();
    advice.set('source', 'app');
    advice.set('content', content);
    advice.set('phone', phone);
    advice.set('user', user);
    advice.set('image', image);
    advice.save();
    res.jsonp({ error: 0 });
});

//评论
router.post('/commet/add', function (req, res) {
    let msg = req.body.msg;
    let goods_id = req.body.goods_id;
    let user_id = req.body.user_id;
    let score = req.body.score * 1;
    let user = AV.Object.createWithoutData('WxUser', user_id);
    let goods = AV.Object.createWithoutData('Goods', goods_id);
    let commet = new Commet();
    commet.set('commet', msg);
    commet.set('goods', goods);
    commet.set('user', user);
    commet.set('score', score);
    commet.set('isDel', false);
    commet.save();
    res.jsonp({ error: 0 });
});

router.get('/commet', function (req, res) {
    let goods_id = req.query.goods_id;
    let goods = AV.Object.createWithoutData('Goods', goods_id);
    let query = new AV.Query('Commet');
    query.equalTo('isDel', false);
    query.equalTo('goods', goods);
    query.include('user');
    query.find().then(function (commets) {
        async.map(commets, function (commet, callback) {
            let one = {
                name: commet.get('user') ? commet.get('user').get('nickname') : "", headimgurl: commet.get('user') ? commet.get('user').get('headimgurl') : "",
                score: commet.get('score') ? commet.get('score') : 0, commet: commet.get('commet') ? commet.get('commet') : "", createdAt: commet.get('createdAt')
            };
            callback(null, one);
        }, function (err, results) {
            res.jsonp({ commets: results });
        });
    });
});

router.get('/posts', function (req, res) {
    let query = new AV.Query('Posts');
    query.limit(1000);
    query.find().then(function (posts) {
        res.jsonp({ posts: posts });
    });
});

router.get('/article', function (req, res) {
    let query = new AV.Query('Article');
    let name = req.query.name;
    let sectionQuery = new AV.Query('Section');
    sectionQuery.equalTo('name', name);
    sectionQuery.first().then(function (data) {
        if (typeof (data) != "undefined") {
            query.equalTo('section', data);
            query.descending('updatedAt');
            query.equalTo('isDel', false);
            query.limit(1000);
            query.find().then(function (articles) {
                res.jsonp({ count: articles.length, article: articles });
            });
        } else {
            res.jsonp({ error: 1, msg: "未找到此版块" });
        }
    });
});

//推荐文章
router.get('/recommend/words', function (req, res) {
    let user_id = req.query.user_id;
    let user = AV.Object.createWithoutData('WxUser', user_id);
    let keysquery = new AV.Query('UserKeywordsMap');
    keysquery.equalTo('user', user);
    keysquery.equalTo('isDel', false);
    keysquery.limit(1000);
    keysquery.include('keywords');
    keysquery.find().then(function (words) {
        async.map(words, function (word, callback) {
            let one = { key: word.get('keywords').id, word: word.get('keywords').get('title') };
            callback(null, one);
        }, function (err, results) {
            res.jsonp({ count: results.length, words: results });
        });
    });
});

router.get('/recommend/article', function (req, res) {
    let key = req.query.key;
    if (key == 1) {
        let articlequery = new AV.Query('Article');
        articlequery.equalTo('isDel', false);
        articlequery.limit(1000);
        articlequery.descending('createdAt');
        articlequery.include('section');
        articlequery.include('problem');
        articlequery.find().then(function (articles) {
            async.map(articles, function (article, callback) {
                let one = {
                    title: article.get('title'), section: article.get('section').get('name'), url: article.get('url'),
                    writer: article.get('writer') ? article.get('writer') : "",
                    updatedAt: article.get('problem') ? article.get('problem').get('createdAt') : article.get('createdAt')
                };
                callback(null, one);
            }, function (err, results) {
                res.jsonp({ count: results.length, articles: results });
            });
        });
    } else {
        let keywords = AV.Object.createWithoutData('KeyWords', key);
        let query = new AV.Query('ArticleKeysMap');
        query.equalTo('keywords', keywords);
        query.equalTo('isDel', false);
        query.include('article');
        query.include('article.section');
        query.find().then(function (articles) {
            async.map(articles, function (article, callback) {
                let one = {
                    title: article.get('article').get('title'), section: article.get('article').get('section').get('name'), url: article.get('article').get('url'),
                    writer: article.get('article').get('writer') ? article.get('article').get('writer') : "", updatedAt: article.get('article').get('createdAt')
                };
                callback(null, one);
            }, function (err, results) {
                res.jsonp({ count: results.length, articles: results });
            });
        });
    }
});

//精选医嘱病症类型
router.get('/recommend/illness', function (req, res) {
    let query = new AV.Query('Illness');
    query.equalTo('isDel', false);
    query.find().then(function (results) {
        res.jsonp({ count: results.length, illness: results });
    });
});

router.get('/recommend/article/ill', function (req, res) {
    let illness_id = req.query.illness_id;
    let illness = AV.Object.createWithoutData('Illness', illness_id);
    let query = new AV.Query('Article');
    query.equalTo('isDel', false);
    query.limit(1000);
    query.descending('createdAt');
    query.include('problem');
    query.include('section');
    query.equalTo('illness', illness);
    query.find().then(function (articles) {
        async.map(articles, function (article, callback) {
            let one = {
                title: article.get('title'), section: article.get('section').get('name'), url: article.get('url'),
                writer: article.get('writer') ? article.get('writer') : "",
                updatedAt: article.get('problem') ? article.get('problem').get('createdAt') : article.get('createdAt')
            };
            callback(null, one);
        }, function (err, results) {
            res.jsonp({ count: results.length, articles: results });
        });
    });
});

//药
router.get('/recommend/medicine', function (req, res) {
    let query = new AV.Query('Medicine');
    query.equalTo('isDel', false);
    query.limit(1000);
    query.find().then(function (results) {
        res.jsonp({ count: results.length, medicine: results });
    });
});

//版本号
router.get('/version', function (req, res) {
    let query = new AV.Query('Version');
    query.first().then(function (version) {
        res.jsonp({ name: version.get('name'), code: version.get('code') });
    });
});

//生意经
// router.get('/thread', function (req, res) {
//     let index = req.query.index * 1 - 1;
//     let query = new AV.Query('Thread');
//     query.include('user');
//     query.descending('createdAt');
//     query.limit(20);
//     query.skip(20 * index);
//     query.equalTo('isDel', false);
//     query.find().then(function (threads) {
//         async.map(threads, function (thread, callback) {
//             let one = {
//                 content: thread.get('content'), images: thread.get('images'), name: thread.get('user').get('nickname'),
//                 headimg: thread.get('user').get('headimgurl'), comments: thread.get('comments') ? thread.get('comments') : [], objectid: thread.id,
//                 createdAt: thread.get('createdAt')
//             };
//             callback(null, one);
//         }, function (err, threads) {
//             res.jsonp({ index: req.query.index, threads: threads, count: threads.length });
//         });
//     });
// });

router.post('/thread/add', function (req, res) {
    let user_id = req.body.user_id;
    let user = AV.Object.createWithoutData('WxUser', user_id);
    let images = req.body.images;
    let content = req.body.content;
    let label = req.body.label;
    let title = req.body.title;
    let type_id = req.body.type_id;
    let type = AV.Object.createWithoutData('ThreadType', type_id);
    let thread = new Thread();
    thread.set('isDel', false);
    thread.set('user', user);
    thread.set('content', content);
    thread.set('images', images);
    thread.set('title', title);
    thread.set('label', label);
    thread.set('type', type);
    thread.save().then(function () {
        res.jsonp({ error: 0, msg: "" });
    });
});

router.post('/thread/reply', function (req, res) {
    let user_id = req.body.user_id;
    let thread_id = req.body.thread_id;
    let user = AV.Object.createWithoutData('WxUser', user_id);
    let thread = AV.Object.createWithoutData('Thread', thread_id);
    thread.increment('count', 1);
    let content = req.body.content;
    thread.fetch().then(function () {
        let comments = thread.get('comments');
        user.fetch().then(function () {
            let comment = { content: content, user_id: user_id, name: user.get('nickname'), headimg: user.get('headimgurl'), time: new Date() };
            if (typeof (comments) == "undefined") {
                comments = [];
            }
            comments.push(comment);
            thread.set('comments', comments);
            thread.save().then(function () {
                res.jsonp({ error: 0, msg: "" });
            }, function (err) {
                console.log(err);
            });
        });
    });
});

router.get('/thread/:user_id/:type_id', function (req, res) {
    let user_id = req.params.user_id;
    let user = AV.Object.createWithoutData('WxUser', user_id);
    let index = req.query.index * 1 - 1;
    let type_id = req.params.type_id;
    let type = AV.Object.createWithoutData('ThreadType', type_id);
    function promise1(callback2) {
        let query = new AV.Query('Thread');
        query.include('user');
        query.include('type');
        query.equalTo('type', type);
        query.descending('createdAt');
        query.limit(20);
        query.skip(20 * index);
        query.equalTo('isDel', false);
        query.find().then(function (threads) {
            async.map(threads, function (thread, callback) {
                let one = {
                    content: thread.get('content'), images: thread.get('images'), name: thread.get('user').get('nickname'),
                    headimg: thread.get('user').get('headimgurl'), comments: thread.get('comments') ? thread.get('comments') : [],
                    objectid: thread.id, createdAt: thread.get('createdAt'), title: thread.get('title') ? thread.get('title') : '',
                    label: thread.get('label') ? thread.get('label') : '', type: thread.get('type').get('name')
                };
                callback(null, one);
            }, function (err, threads) {
                callback2(null, { index: req.query.index, threads: threads, count: threads.length });
            });
        });
    }
    function promise2(callback2) {
        let query = new AV.Query('Thread');
        query.equalTo('isDel', false);
        query.equalTo('user', user);
        query.greaterThan('count', 0);
        let count = 0;
        query.find().then(function (threads) {
            async.map(threads, function (thread, callback) {
                count += thread.get('count');
                callback(null, 1);
            }, function (err, threads) {
                callback2(null, count);
            });
        });
    }
    async.parallel([
        function (callback) {
            promise1(callback);
        },
        function (threads, callback) {
            promise2(threads, callback);
        }], function (err, results) {
            res.jsonp({ list: results[0], count: results[1] });
        });
});

router.get('/thread/:user_id', function (req, res) {
    let user_id = req.params.user_id;
    let user = AV.Object.createWithoutData('WxUser', user_id);
    let index = req.query.index * 1 - 1;
    // let type_id = req.query.type_id;
    // let type = AV.Object.createWithoutData('ThreadType', type_id);
    function promise1(callback2) {
        let query = new AV.Query('Thread');
        query.include('user');
        query.include('type');
        //query.equalTo('type', type);
        query.descending('createdAt');
        query.limit(20);
        query.skip(20 * index);
        query.equalTo('isDel', false);
        query.find().then(function (threads) {
            async.map(threads, function (thread, callback) {
                let one = {
                    content: thread.get('content'), images: thread.get('images'), name: thread.get('user').get('nickname'),
                    headimg: thread.get('user').get('headimgurl'), comments: thread.get('comments') ? thread.get('comments') : [],
                    objectid: thread.id, createdAt: thread.get('createdAt'), title: thread.get('title') ? thread.get('title') : '',
                    label: thread.get('label') ? thread.get('label') : '', type: thread.get('type') ? thread.get('type').get('name') : ''
                };
                callback(null, one);
            }, function (err, threads) {
                callback2(null, { index: req.query.index, threads: threads, count: threads.length });
            });
        });
    }
    function promise2(callback2) {
        let query = new AV.Query('Thread');
        query.equalTo('isDel', false);
        query.equalTo('user', user);
        query.greaterThan('count', 0);
        let count = 0;
        query.find().then(function (threads) {
            async.map(threads, function (thread, callback) {
                count += thread.get('count');
                callback(null, 1);
            }, function (err, threads) {
                callback2(null, count);
            });
        });
    }
    async.parallel([
        function (callback) {
            promise1(callback);
        },
        function (threads, callback) {
            promise2(threads, callback);
        }], function (err, results) {
            res.jsonp({ list: results[0], count: results[1] });
        });
});

router.get('/threadunread/:user_id', function (req, res) {
    let user_id = req.params.user_id;
    let user = AV.Object.createWithoutData('WxUser', user_id);
    let query = new AV.Query('Thread');
    query.include('user');
    query.descending('createdAt');
    query.limit(1000);
    query.equalTo('isDel', false);
    query.equalTo('user', user);
    query.greaterThan('count', 0);
    query.find().then(function (threads) {
        async.map(threads, function (thread, callback) {
            let one = {
                content: thread.get('content'), images: thread.get('images'), name: thread.get('user').get('nickname'),
                headimg: thread.get('user').get('headimgurl'), comments: thread.get('comments') ? thread.get('comments') : [],
                objectid: thread.id, createdAt: thread.get('createdAt')
            };
            callback(null, one);
        }, function (err, threads) {
            res.jsonp({ threads: threads, count: threads.length });
        });
    });
});

router.get('/threadcomments/:thread_id', function (req, res) {
    let thread_id = req.params.thread_id;
    let thread = AV.Object.createWithoutData('Thread', thread_id);
    thread.set('count', 0);
    thread.fetch({
        include: ['user']
    }).then(function () {
        res.jsonp({
            content: thread.get('content'), images: thread.get('images'), name: thread.get('user').get('nickname'),
            headimg: thread.get('user').get('headimgurl'), objectid: thread.id, createdAt: thread.get('createdAt'),
            comments: thread.get('comments')
        });
    });
});

router.get('/threadtype', function (req, res) {
    let query = new AV.Query('ThreadType');
    query.equalTo('isDel', false);
    query.limit(1000);
    query.find().then(function (types) {
        res.jsonp(types);
    });
});


router.get('/threaddelete/:thread_id', function (req, res) {
    let thread_id = req.params.thread_id;
    let thread = AV.Object.createWithoutData('Thread', thread_id);
    thread.set('isDel', true);
    thread.save().then(function () {
        res.jsonp({ error: 0, msg: "" });
    });
});

router.get('/threadown/:user_id', function (req, res) {
    let user_id = req.params.user_id;
    let user = AV.Object.createWithoutData('WxUser', user_id);
    let query=new AV.Query('Thread');
    query.equalTo('isDel',false);
    query.equalTo('user',user);
    query.limit(1000);
    query.find().then(function(threads){
        async.map(threads, function (thread, callback) {
            let one = {
                content: thread.get('content'), images: thread.get('images'), name: thread.get('user').get('nickname'),
                headimg: thread.get('user').get('headimgurl'), comments: thread.get('comments') ? thread.get('comments') : [],
                objectid: thread.id, createdAt: thread.get('createdAt')
            };
            callback(null, one);
        }, function (err, threads) {
            res.jsonp({ threads: threads, count: threads.length });
        });
    });
});

router.get('/thread/views/:thread_id/:user_id', function (req, res) {
    let thread_id = req.params.thread_id;
    let thread = AV.Object.createWithoutData('Thread', thread_id);
    let user_id = req.params.user_id;
    let user = AV.Object.createWithoutData('WxUser', user_id);
    thread.increment('views', 1);
    let threadViewsMap = new ThreadViewsMap();
    threadViewsMap.set('user', user);
    threadViewsMap.set('thread', thread);
    threadViewsMap.set('isDel', false);
    threadViewsMap.save().then(function () {
        res.jsonp({ error: 0, msg: "" });
    });
});

router.get('/notice', function (req, res) {
    let query = new AV.Query('Notice');
    query.equalTo('isDel', false);
    query.equalTo('target', 'APP');
    query.first().then(function (notice) {
        res.jsonp({ notice: notice.get('content') });
    });
});

module.exports = router;