'use strict';
var router = require('express').Router();
var AV = require('leanengine');
var request = require('request-json');
var Todo = AV.Object.extend('Todo');
var async = require('async');
var moment = require('moment');
var appid = process.env.wx_appid;
var secret = process.env.wx_secret;

function getTokenAndSendMsg(data, msg, callback) {
    let result = {
        "error": 0, // 0 代表成功,其它 代表异常
        "error_msg": "" //错误信息
    };
    let client = request.createClient('https://api.weixin.qq.com/cgi-bin/');
    client.get('token?grant_type=client_credential&appid=' + appid + '&secret=' + secret, function (err, res, body) {
        let token = body.access_token;
        client = request.createClient('https://api.weixin.qq.com/cgi-bin/message/template/');
        client.post('send?access_token=' + token, data, function (err, res, body) {
            //response.jsonp(result);
            console.log(msg);
            callback(null, msg);
        });
    });
}

router.get('/json/advice', function (req, res, next) {
    let query = new AV.Query('Advice');
    let arr = [];
    query.count().then(function (count) {
        let num = Math.ceil(count / 1000);
        async.times(num, function (n, callback) {
            query.limit(1000);
            query.skip(1000 * n);
            query.include('user');
            query.find().then(function (users) {
                async.map(users, function (user, callback1) {
                    if (typeof (user) != "undefined") {
                        let time = new moment(user.get('createdAt'));
                        let one = {
                            nickname: user.get('user').get('nickname') ? user.get('user').get('nickname') : "", phone: user.get('phone') ? user.get('phone') : "",
                            content: user.get('content') ? user.get('content') : "", source: user.get('source') ? user.get('source') : "",
                            image: user.get('image') ? user.get('image') : "",
                            createdAt: time.format('YYYY-MM-DD HH:mm:ss')
                        };
                        arr.push(one);
                    }
                    callback1(null, user);
                }, function (err, results) {
                    callback(null, n);
                });
            });
        }, function (err, users) {
            res.jsonp({ "data": arr });
        });
    });
});

router.get('/json/users', function (req, res, next) {
    let query = new AV.Query('WxUser');
    let arr = [];
    query.count().then(function (count) {
        let num = Math.ceil(count / 1000);
        async.times(num, function (n, callback) {
            query.limit(1000);
            query.skip(1000 * n);
            query.find().then(function (users) {
                async.map(users, function (user, callback1) {
                    if (typeof (user) != "undefined") {
                        let time = new moment(user.get('createdAt'));
                        let one = {
                            nickname: user.get('nickname') ? user.get('nickname') : "", sex: user.get('sex') ? user.get('sex') : "",
                            phone: user.get('phone') ? user.get('phone') : "", points: user.get('points'), city: user.get('city') ? user.get('city') : "",
                            headimgurl: user.get('headimgurl') ? user.get('headimgurl') : "",
                            createdAt: time.format('YYYY-MM-DD HH:mm:ss')
                        };
                        arr.push(one);
                    }
                    callback1(null, user);
                }, function (err, results) {
                    callback(null, n);
                });
            });
        }, function (err, users) {
            res.jsonp({ "data": arr });
        });
    });
});

router.get('/json/doctors', function (req, res, next) {
    let query = new AV.Query('Doctor');
    let arr = [];
    query.count().then(function (count) {
        let num = Math.ceil(count / 1000);
        async.times(num, function (n, callback) {
            query.limit(1000);
            query.skip(1000 * n);
            query.find().then(function (doctors) {
                async.map(doctors, function (doctor, callback1) {
                    if (typeof (doctor) != "undefined") {
                        let time = new moment(doctor.get('createdAt'));
                        let one = {
                            name: doctor.get('name') ? doctor.get('name') : "", hospital: doctor.get('hospital') ? doctor.get('hospital') : "",
                            hospital_grade: doctor.get('hospital_grade') ? doctor.get('hospital_grade') : "", level_title: doctor.get('level_title'),
                            title: doctor.get('title') ? doctor.get('title') : "", clinic: doctor.get('clinic') ? doctor.get('clinic') : "",
                            good_at: doctor.get('good_at') ? doctor.get('good_at') : "", education_background: doctor.get('education_background') ? doctor.get('education_background') : "",
                            headimgurl: doctor.get('image'),
                            createdAt: time.format('YYYY-MM-DD HH:mm:ss')
                        };
                        arr.push(one);
                    }
                    callback1(null, doctor);
                }, function (err, results) {
                    callback(null, n);
                });
            });
        }, function (err, doctors) {
            res.jsonp({ "data": arr });
        });
    });
});

router.get('/json/problems', function (req, res, next) {
    let query = new AV.Query('Problem');
    let resdata = {};
    let arr = [];
    function promise1(callback2) {
        query.count().then(function (count) {
            let num = Math.ceil(count / 1000);
            async.times(num, function (n, callback) {
                query.limit(1000);
                query.include('user');
                query.include('illness');
                query.skip(1000 * n);
                query.find().then(function (problems) {
                    async.map(problems, function (problem, callback1) {
                        if (typeof (problem) != "undefined") {
                            let time = new moment(problem.get('createdAt'));
                            let one = {
                                problem_id: problem.get('problem_id'), user: problem.get('user') ? problem.get('user').get('nickname') : "", source: problem.get('source') ? problem.get('source') : "",
                                createdAt: time.format('YYYY-MM-DD HH:mm:ss'), DT_RowId: problem.id, select: problem.get('select'), title: problem.get('title'), emp: problem.get('user') ? problem.get('user').get('emp') : "",
                                illness_name: problem.get('illness') ? problem.get('illness').get('name') : "", illness: problem.get('illness') ? problem.get('illness').id : "",
                                keywords: problem.get('keywords') ? problem.get('keywords') : ""
                            };
                            arr.push(one);
                        }
                        callback1(null, problem);
                    }, function (err, results) {
                        callback(null, n);
                    });
                });
            }, function (err, problems) {
                resdata["data"] = arr;
                callback2(null, arr);
            });
        });
    }
    function promise2(callback1) {
        let query = new AV.Query('Illness');
        query.equalTo('isDel', false);
        query.ascending('serial');
        query.find().then(function (results) {
            async.map(results, function (result, callback) {
                result.set('label', result.get('name'));
                result.set('value', result.id);
                callback(null, result);
            }, function (err, data) {
                data = { "illness": data };
                resdata["options"] = data;
                callback1(null, data);
            });
        });
    }
    async.parallel([
        function (callback) {
            promise1(callback);
        },
        function (callback) {
            promise2(callback);
        }], function (err, results) {
            res.jsonp(resdata);
        });
});

router.put('/json/problems/edit/:id', function (req, res) {
    let arr = req.body;
    let id = req.params.id;
    let problem = AV.Object.createWithoutData('Problem', id);
    let select = arr['data'][id]['choice'] * 1;
    let illness_id = arr['data'][id]['illness'];
    let illness = AV.Object.createWithoutData('Illness', illness_id);
    problem.set('illness', illness);
    problem.set('title', arr['data'][id]['title']);
    problem.set('select', select);
    if (select == 1) {
        problem.set('select', 1);
        problem.save().then(function () {
            let articleQuery = new AV.Query('Article');
            articleQuery.equalTo('isDel', false);
            articleQuery.equalTo('problem', problem);
            articleQuery.first().then(function (artobj) {
                if (typeof (artobj) == "undefined") {
                    let article = new Article();
                    article.set('isDel', false);
                    let section = AV.Object.createWithoutData('Section', '598c1cf4a22b9d0061023845');
                    article.set('section', section);
                    article.set('title', arr['data'][id]['title']);
                    article.set('writer', ' ');
                    article.set('illness', illness);
                    problem.fetch({ include: 'illness,user' }).then(function () {
                        article.set('url', 'http://drshe.leanapp.cn/inquiry/query?id=' + problem.get('problem_id'));
                        article.set('problem', problem);
                        article.save().then(function () {
                            let data = [];
                            let time = new moment(problem.get('createdAt'));
                            let one = {
                                problem_id: problem.get('problem_id'), user: problem.get('user').get('nickname'), createdAt: time.format('YYYY-MM-DD HH:mm:ss'),
                                source: problem.get('source'), title: problem.get('title'), DT_RowId: problem.id, select: problem.get('select'), illness_name: problem.get('illness').get('name'),
                                illness: problem.get('illness').id
                            };
                            data.push(one);
                            res.jsonp({ "data": data });
                        });
                    });
                } else {
                    let data = [];
                    problem.fetch({ include: 'illness,user' }).then(function () {
                        let time = new moment(problem.get('createdAt'));
                        let one = {
                            problem_id: problem.get('problem_id'), user: problem.get('user').get('nickname'), createdAt: time.format('YYYY-MM-DD HH:mm:ss'),
                            source: problem.get('source'), title: problem.get('title'), DT_RowId: problem.id, select: problem.get('select'), illness_name: problem.get('illness').get('name'),
                            illness: problem.get('illness').id
                        };
                        data.push(one);
                        artobj.set('illness', illness);
                        artobj.save().then(function () {
                            res.jsonp({ "data": data });
                        });
                    });
                }
            });
        });
    } else if (select == 0) {
        let data = [];
        problem.set('select', 0);
        problem.save().then(function () {
            let query = new AV.Query('Article');
            query.equalTo('problem', problem);
            query.first().then(function (article) {
                article.set('isDel', true);
                article.save().then(function () {
                    problem.fetch({ include: 'illness,user' }).then(function () {
                        let time = new moment(problem.get('createdAt'));
                        let one = {
                            problem_id: problem.get('problem_id'), user: problem.get('user').get('nickname'), createdAt: time.format('YYYY-MM-DD HH:mm:ss'),
                            source: problem.get('source'), title: problem.get('title'), DT_RowId: problem.id, select: problem.get('select'), illness_name: problem.get('illness').get('name'),
                            illness: problem.get('illness').id
                        };
                        data.push(one);
                        res.jsonp({ "data": data });
                    });
                });
            });

        });
    }
});

router.get('/json/images', function (req, res, next) {
    let query = new AV.Query('_File');
    let arr = [];
    query.count().then(function (count) {
        let num = Math.ceil(count / 1000);
        async.times(num, function (n, callback) {
            query.limit(1000);
            query.skip(1000 * n);
            query.find().then(function (images) {
                async.map(images, function (image, callback1) {
                    if (typeof (image) != "undefined") {
                        let time = new moment(image.get('createdAt'));
                        let one = {
                            name: image.get('name'), url: image.get('url'),
                            createdAt: time.format('YYYY-MM-DD HH:mm:ss')
                        };
                        arr.push(one);
                    }
                    callback1(null, image);
                }, function (err, results) {
                    callback(null, n);
                });
            });
        }, function (err, images) {
            res.jsonp({ "data": arr });
        });
    });
});

router.get('/json/business', function (req, res, next) {
    let query = new AV.Query('Business');
    let arr = [];
    query.count().then(function (count) {
        let num = Math.ceil(count / 1000);
        async.times(num, function (n, callback) {
            query.limit(1000);
            query.skip(1000 * n);
            query.include('user');
            query.find().then(function (business) {
                async.map(business, function (busines, callback1) {
                    if (typeof (busines) != "undefined") {
                        let time = new moment(busines.get('createdAt'));
                        let one = {
                            name: busines.get('name'), phone: busines.get('phone'), connecter: busines.get('connecter'), area: busines.get('area') ? busines.get('area') : "",
                            address: busines.get('address') ? busines.get('address') : "", user: busines.get('user') ? busines.get('user').get('nickname') : "",
                            createdAt: time.format('YYYY-MM-DD HH:mm:ss')
                        };
                        arr.push(one);
                    }
                    callback1(null, busines);
                }, function (err, results) {
                    callback(null, n);
                });
            });
        }, function (err, business) {
            res.jsonp({ "data": arr });
        });
    });
});

router.get('/json/businessclient', function (req, res, next) {
    let query = new AV.Query('BusinessClient');
    let arr = [];
    query.count().then(function (count) {
        let num = Math.ceil(count / 1000);
        async.times(num, function (n, callback) {
            query.limit(1000);
            query.skip(1000 * n);
            query.include('business');
            query.equalTo('isDel', false);
            query.find().then(function (business) {
                async.map(business, function (busines, callback1) {
                    if (typeof (busines) != "undefined") {
                        let time = new moment(busines.get('createdAt'));
                        let one = {
                            name: busines.get('name'), phone: busines.get('phone'), business: busines.get('business') ? busines.get('business').get('name') : "", area: busines.get('area') ? busines.get('area') : "",
                            address: busines.get('address') ? busines.get('address') : "", age: busines.get('age'),
                            createdAt: time.format('YYYY-MM-DD HH:mm:ss')
                        };
                        arr.push(one);
                    }
                    callback1(null, busines);
                }, function (err, results) {
                    callback(null, n);
                });
            });
        }, function (err, business) {
            res.jsonp({ "data": arr });
        });
    });
});

router.get('/json/donate', function (req, res, next) {
    let query = new AV.Query('Donate');
    let arr = [];
    query.count().then(function (count) {
        let num = Math.ceil(count / 1000);
        async.times(num, function (n, callback) {
            query.limit(1000);
            query.skip(1000 * n);
            query.include('user');
            query.find().then(function (donates) {
                async.map(donates, function (donate, callback1) {
                    if (typeof (donate) != "undefined") {
                        let time = new moment(donate.get('createdAt'));
                        let one = {
                            title: donate.get('title'), points: donate.get('points'), source: donate.get('source'), user: donate.get('user').get('nickname'),
                            createdAt: time.format('YYYY-MM-DD HH:mm:ss')
                        };
                        arr.push(one);
                    }
                    callback1(null, donate);
                }, function (err, results) {
                    callback(null, n);
                });
            });
        }, function (err, donates) {
            res.jsonp({ "data": arr });
        });
    });
});

router.get('/json/recharge', function (req, res, next) {
    let query = new AV.Query('Recharge');
    let arr = [];
    query.count().then(function (count) {
        let num = Math.ceil(count / 1000);
        async.times(num, function (n, callback) {
            query.limit(1000);
            query.skip(1000 * n);
            query.include('user');
            query.equalTo('result', true);
            query.find().then(function (recharges) {
                async.map(recharges, function (recharge, callback1) {
                    if (typeof (recharge) != "undefined") {
                        let time = new moment(recharge.get('createdAt'));
                        let one = {
                            title: recharge.get('title'), price: recharge.get('price'), source: recharge.get('source'), user: recharge.get('user') ? recharge.get('user').get('nickname') : "",
                            createdAt: time.format('YYYY-MM-DD HH:mm:ss'), orderid: recharge.get('orderid')
                        };
                        arr.push(one);
                    }
                    callback1(null, recharge);
                }, function (err, results) {
                    callback(null, n);
                });
            });
        }, function (err, recharges) {
            res.jsonp({ "data": arr });
        });
    });
});

router.get('/json/keywords', function (req, res, next) {
    let query = new AV.Query('KeyWords');
    query.equalTo('isDel', false);
    query.limit(1000);
    query.find().then(function (results) {
        results.forEach(function (result) {
            result.set('DT_RowId', result.id);
        });
        res.jsonp({ data: results });
    });
});

var KeyWords = AV.Object.extend('KeyWords');
router.post('/json/keywords/add', function (req, res) {
    let arr = req.body;
    let keywords = new KeyWords();
    keywords.set('title', arr['data'][0]['title']);
    keywords.set('words', arr['data'][0]['words']);
    keywords.set('tip', arr['data'][0]['tip']);
    keywords.set('des', arr['data'][0]['des']);
    keywords.set('isDel', false);
    let data = [];
    keywords.save().then(function (keywords) {
        keywords.set('DT_RowId', keywords.id);
        data.push(keywords);
        res.jsonp({ data: data });
    });
});

router.put('/json/keywords/edit/:id', function (req, res) {
    let arr = req.body;
    let id = req.params.id;
    let keywords = AV.Object.createWithoutData('KeyWords', id);
    keywords.set('title', arr['data'][id]['title']);
    keywords.set('words', arr['data'][id]['words']);
    keywords.set('tip', arr['data'][id]['tip']);
    keywords.set('des', arr['data'][id]['des']);
    keywords.save().then(function (keywords) {
        let data = [];
        keywords.set('DT_RowId', keywords.id);
        data.push(keywords);
        res.jsonp({ "list": data });
    });
});

router.delete('/json/keywords/remove/:id', function (req, res) {
    let id = req.params.id;
    let keywords = AV.Object.createWithoutData('KeyWords', id);
    keywords.set('isDel', true);
    keywords.save().then(function () {
        res.jsonp({ "data": [] });
    });
});

router.get('/json/article', function (req, res, next) {
    let resdata = {};
    function promise1(callback3) {
        let query = new AV.Query('Article');
        let arr = [];
        query.count().then(function (count) {
            let num = Math.ceil(count / 1000);
            async.times(num, function (n, callback) {
                query.limit(1000);
                query.equalTo('isDel', false);
                query.skip(1000 * n);
                query.include('section');
                query.find().then(function (articles) {
                    async.map(articles, function (article, callback1) {
                        if (typeof (article) != "undefined") {
                            article.set('section', article.get('section').get('name'));
                            let time = new moment(article.get('createdAt')).format('YYYY-MM-DD HH:mm:ss');
                            article.set('time', time);
                            article.set('DT_RowId', article.id);
                            arr.push(article);
                        }
                        callback1(null, article);
                    }, function (err, articles) {
                        callback(null, n);
                    });
                });
            }, function (err, articles) {
                resdata["data"] = arr;
                callback3(null, arr);
            });
        });
    }

    function promise2(callback1) {
        let query = new AV.Query('Section');
        query.equalTo('isDel', false);
        query.descending('createdAt');
        query.find().then(function (results) {
            async.map(results, function (result, callback) {
                result.set('label', result.get('name'));
                result.set('value', result.id);
                callback(null, result);
            }, function (err, data) {
                callback1(null, data);
            });
        });
    }
    async.parallel([
        function (callback) {
            promise1(callback);
        },
        function (callback) {
            promise2(callback);
        }], function (err, results) {
            resdata["options"] = Object.assign({ "section": results[1] });
            res.jsonp(resdata);
        });
});

var Article = AV.Object.extend('Article');
router.post('/json/article/add', function (req, res) {
    let arr = req.body;
    let article = new Article();
    article.set('title', arr['data'][0]['title']);
    article.set('url', arr['data'][0]['url']);
    article.set('writer', arr['data'][0]['writer']);
    let section = AV.Object.createWithoutData('Section', arr['data'][0]['section']);
    article.set('section', section);
    article.set('isDel', false);
    let data = [];
    article.save().then(function (article) {
        article.set('DT_RowId', article.id);
        let time = new moment(article.get('createdAt')).format('YYYY-MM-DD HH:mm:ss');
        article.set('time', time);
        section.fetch().then(function (section) {
            article.set('section', section.get('name'));
            data.push(article);
            res.jsonp({ data: data });
        });
    });
});

router.put('/json/article/edit/:id', function (req, res) {
    let arr = req.body;
    let id = req.params.id;
    let article = AV.Object.createWithoutData('Article', id);
    article.set('title', arr['data'][id]['title']);
    article.set('url', arr['data'][id]['url']);
    article.set('writer', arr['data'][id]['writer']);
    let section = AV.Object.createWithoutData('Section', arr['data'][id]['section']);
    article.set('section', section);
    article.save().then(function (article) {
        let data = [];
        article.set('DT_RowId', article.id);
        let time = new moment(article.get('createdAt')).format('YYYY-MM-DD HH:mm:ss');
        article.set('time', time);
        section.fetch().then(function (section) {
            article.set('section', section.get('name'));
            data.push(article);
            res.jsonp({ data: data });
        });
    });
});

router.delete('/json/article/remove/:id', function (req, res) {
    let id = req.params.id;
    let article = AV.Object.createWithoutData('Article', id);
    article.set('isDel', true);
    article.save().then(function () {
        res.jsonp({ "data": [] });
    });
});

router.get('/json/o2o', function (req, res, next) {
    let query = new AV.Query('O2O');
    query.equalTo('isDel', false);
    query.limit(1000);
    query.find().then(function (results) {
        results.forEach(function (result) {
            result.set('DT_RowId', result.id);
            let time = new moment(result.get('createdAt')).format('YYYY-MM-DD HH:mm:ss');
            result.set('time', time);
        });
        res.jsonp({ data: results });
    });
});

router.get('/json/service', function (req, res, next) {
    let query = new AV.Query('Service');
    query.equalTo('isDel', false);
    query.limit(1000);
    query.find().then(function (results) {
        results.forEach(function (result) {
            result.set('DT_RowId', result.id);
            let time = new moment(result.get('createdAt')).format('YYYY-MM-DD HH:mm:ss');
            result.set('time', time);
        });
        res.jsonp({ data: results });
    });
});

var Service = AV.Object.extend('Service');
router.post('/json/service/add', function (req, res) {
    let arr = req.body;
    let service = new Service();
    service.set('name', arr['data'][0]['name']);
    service.set('price', arr['data'][0]['price'] * 1);
    service.set('isDel', false);
    let data = [];
    service.save().then(function (service) {
        service.set('DT_RowId', service.id);
        let time = new moment(service.get('createdAt')).format('YYYY-MM-DD HH:mm:ss');
        service.set('time', time);
        data.push(service);
        res.jsonp({ data: data });
    });
});

router.put('/json/service/edit/:id', function (req, res) {
    let arr = req.body;
    let id = req.params.id;
    let service = AV.Object.createWithoutData('Service', id);
    service.set('name', arr['data'][id]['name']);
    service.set('price', arr['data'][id]['price'] * 1);
    service.save().then(function (service) {
        let data = [];
        service.set('DT_RowId', service.id);
        let time = new moment(service.get('createdAt')).format('YYYY-MM-DD HH:mm:ss');
        service.set('time', time);
        data.push(service);
        res.jsonp({ "data": data });
    });
});

router.delete('/json/service/remove/:id', function (req, res) {
    let id = req.params.id;
    let service = AV.Object.createWithoutData('Service', id);
    service.set('isDel', true);
    service.save().then(function () {
        res.jsonp({ "data": [] });
    });
});

router.get('/json/serviceitem', function (req, res, next) {
    let query = new AV.Query('ServiceItem');
    query.equalTo('isDel', false);
    query.limit(1000);
    query.find().then(function (results) {
        results.forEach(function (result) {
            result.set('DT_RowId', result.id);
            let time = new moment(result.get('createdAt')).format('YYYY-MM-DD HH:mm:ss');
            result.set('time', time);
        });
        res.jsonp({ data: results });
    });
});

var ServiceItem = AV.Object.extend('ServiceItem');
router.post('/json/serviceitem/add', function (req, res) {
    let arr = req.body;
    let serviceitem = new ServiceItem();
    serviceitem.set('name', arr['data'][0]['name']);
    serviceitem.set('price', arr['data'][0]['price'] * 1);
    serviceitem.set('isDel', false);
    let data = [];
    serviceitem.save().then(function (serviceitem) {
        serviceitem.set('DT_RowId', serviceitem.id);
        let time = new moment(serviceitem.get('createdAt')).format('YYYY-MM-DD HH:mm:ss');
        serviceitem.set('time', time);
        data.push(serviceitem);
        res.jsonp({ data: data });
    });
});

router.put('/json/serviceitem/edit/:id', function (req, res) {
    let arr = req.body;
    let id = req.params.id;
    let serviceitem = AV.Object.createWithoutData('ServiceItem', id);
    serviceitem.set('name', arr['data'][id]['name']);
    serviceitem.set('price', arr['data'][id]['price'] * 1);
    serviceitem.save().then(function (serviceitem) {
        let data = [];
        serviceitem.set('DT_RowId', serviceitem.id);
        let time = new moment(serviceitem.get('createdAt')).format('YYYY-MM-DD HH:mm:ss');
        serviceitem.set('time', time);
        data.push(serviceitem);
        res.jsonp({ "data": data });
    });
});

router.delete('/json/serviceitem/remove/:id', function (req, res) {
    let id = req.params.id;
    let serviceitem = AV.Object.createWithoutData('ServiceItem', id);
    serviceitem.set('isDel', true);
    serviceitem.save().then(function () {
        res.jsonp({ "data": [] });
    });
});

router.get('/json/repair', function (req, res) {
    let resdata = {};
    function promise1(callback1) {
        let query = new AV.Query('Service');
        query.equalTo('isDel', false);
        query.equalTo('status', 1);
        query.limit(1000);
        query.find().then(function (results) {
            async.map(results, function (result, callback) {
                result.set('DT_RowId', result.id);
                let time = new moment(result.get('createdAt')).format('YYYY-MM-DD HH:mm:ss');
                result.set('time', time);
                callback(null, result);
            }, function (err, data) {
                resdata["data"] = data;
                callback1(null, data);
            });
        });
    }
    function promise2(callback1) {
        let query = new AV.Query('ServiceItem');
        query.equalTo('isDel', false);
        query.find().then(function (results) {
            async.map(results, function (result, callback) {
                result.set('label', result.get('name'));
                result.set('value', result.id);
                callback(null, result);
            }, function (err, data) {
                data = { "item": data };
                resdata["options"] = data;
                callback1(null, data);
            });
        });
    }
    async.parallel([
        function (callback) {
            promise1(callback);
        },
        function (callback) {
            promise2(callback);
        }], function (err, results) {
            res.jsonp(resdata);
        });
});

var ServiceItemMap = AV.Object.extend('ServiceItemMap');
router.put('/json/repair/edit/:id', function (req, res) {
    let arr = req.body;
    let id = req.params.id;
    let service = AV.Object.createWithoutData('Service', id);
    let status = arr['data'][id]['status'] * 1;
    let items = arr['data'][id]['item'];
    let price = arr['data'][id]['price'] * 1;
    if (price > 0) {
        service.set('price', price);
    } else {
        service.set('price', 0);
    }
    if (status) {
        service.set('status', 2);
    } else {
        service.set('status', 1);
    }
    service.save().then(function (result) {
        let repair = "";
        async.map(items, function (item, callback) {
            let serviceitem = AV.Object.createWithoutData('ServiceItem', item);
            let si = new ServiceItemMap();
            si.set('isDel', false);
            si.set('service', service);
            si.set('item', serviceitem);
            callback(null, si);
        }, function (err, items) {
            AV.Object.saveAll(items).then(function () {
                res.jsonp({ "data": [] });
            });
        });
    });
});

router.get('/json/send', function (req, res) {
    let resdata = {};
    function promise1(callback1) {
        let query = new AV.Query('Service');
        query.equalTo('isDel', false);
        query.equalTo('status', 2);
        query.limit(1000);
        query.find().then(function (results) {
            async.map(results, function (result, callback) {
                result.set('DT_RowId', result.id);
                let time = new moment(result.get('createdAt')).format('YYYY-MM-DD HH:mm:ss');
                result.set('time', time);
                callback(null, result);
            }, function (err, data) {
                resdata["data"] = data;
                callback1(null, data);
            });
        });
    }
    function promise2(callback1) {
        let query = new AV.Query('ServiceItem');
        query.equalTo('isDel', false);
        query.find().then(function (results) {
            async.map(results, function (result, callback) {
                result.set('label', result.get('name'));
                result.set('value', result.id);
                callback(null, result);
            }, function (err, data) {
                data = { "item": data };
                resdata["options"] = data;
                callback1(null, data);
            });
        });
    }
    async.parallel([
        function (callback) {
            promise1(callback);
        },
        function (callback) {
            promise2(callback);
        }], function (err, results) {
            res.jsonp(resdata);
        });
});

router.put('/json/send/edit/:id', function (req, res) {
    let arr = req.body;
    let id = req.params.id;
    let service = AV.Object.createWithoutData('Service', id);
    let delivery = arr['data'][id]['delivery'];
    let items = arr['data'][id]['item'];
    service.set('delivery',delivery);
    service.set('status',3);
    service.save().then(function(){
        res.jsonp({ "data": [] });
    });
});

router.get('/json/section', function (req, res, next) {
    let query = new AV.Query('Section');
    query.equalTo('isDel', false);
    query.limit(1000);
    query.find().then(function (results) {
        results.forEach(function (result) {
            result.set('DT_RowId', result.id);
            let time = new moment(result.get('createdAt')).format('YYYY-MM-DD HH:mm:ss');
            result.set('time', time);
        });
        res.jsonp({ data: results });
    });
});

var Section = AV.Object.extend('Section');
router.post('/json/section/add', function (req, res) {
    let arr = req.body;
    let section = new Section();
    section.set('name', arr['data'][0]['name']);
    section.set('isDel', false);
    let data = [];
    section.save().then(function (section) {
        section.set('DT_RowId', section.id);
        let time = new moment(section.get('createdAt')).format('YYYY-MM-DD HH:mm:ss');
        section.set('time', time);
        data.push(section);
        res.jsonp({ data: data });
    });
});

router.put('/json/section/edit/:id', function (req, res) {
    let arr = req.body;
    let id = req.params.id;
    let section = AV.Object.createWithoutData('Section', id);
    section.set('name', arr['data'][id]['name']);
    section.save().then(function (section) {
        let data = [];
        section.set('DT_RowId', section.id);
        let time = new moment(section.get('createdAt')).format('YYYY-MM-DD HH:mm:ss');
        section.set('time', time);
        data.push(section);
        res.jsonp({ "data": data });
    });
});

router.delete('/json/section/remove/:id', function (req, res) {
    let id = req.params.id;
    let section = AV.Object.createWithoutData('Section', id);
    section.set('isDel', true);
    section.save().then(function () {
        res.jsonp({ "data": [] });
    });
});

router.get('/json/illness', function (req, res, next) {
    let query = new AV.Query('Illness');
    query.equalTo('isDel', false);
    query.limit(1000);
    query.find().then(function (results) {
        results.forEach(function (result) {
            result.set('DT_RowId', result.id);
            let time = new moment(result.get('createdAt')).format('YYYY-MM-DD HH:mm:ss');
            result.set('time', time);
        });
        res.jsonp({ data: results });
    });
});

var Illness = AV.Object.extend('Illness');
router.post('/json/illness/add', function (req, res) {
    let arr = req.body;
    let illness = new Illness();
    illness.set('name', arr['data'][0]['name']);
    illness.set('isDel', false);
    let data = [];
    illness.save().then(function (illness) {
        illness.set('DT_RowId', illness.id);
        let time = new moment(illness.get('createdAt')).format('YYYY-MM-DD HH:mm:ss');
        illness.set('time', time);
        data.push(illness);
        res.jsonp({ data: data });
    });
});

router.put('/json/illness/edit/:id', function (req, res) {
    let arr = req.body;
    let id = req.params.id;
    let illness = AV.Object.createWithoutData('Illness', id);
    illness.set('name', arr['data'][id]['name']);
    illness.save().then(function (illness) {
        let data = [];
        illness.set('DT_RowId', illness.id);
        let time = new moment(illness.get('createdAt')).format('YYYY-MM-DD HH:mm:ss');
        illness.set('time', time);
        data.push(illness);
        res.jsonp({ "data": data });
    });
});

router.delete('/json/illness/remove/:id', function (req, res) {
    let id = req.params.id;
    let illness = AV.Object.createWithoutData('Illness', id);
    illness.set('isDel', true);
    illness.save().then(function () {
        res.jsonp({ "data": [] });
    });
});

router.post('/json/message/send', function (req, res) {
    let title = req.body.title;
    let type = req.body.type;
    let time = new moment();
    let creditChange = req.body.creditChange;
    let creditName = req.body.creditName;
    let remark = req.body.remark;
    let number = req.body.number;
    let userQuery = new AV.Query('WxUser');
    userQuery.exists('openid');
    userQuery.limit(1000);
    userQuery.find().then(function (users) {
        let count = 0;
        async.map(users, function (user, callback) {
            let account = user.get('nickname') ? user.get('nickname') : "亲爱的用户";
            let amount = user.get('points') * 1;
            let openid = user.get('openid');
            let data = {
                touser: openid, template_id: "TXq10kof3hw7w_6wJ-FeaEUVKVhlOu7m1nuhAuPv1qk", url: 'https://open.weixin.qq.com/connect/oauth2/authorize?appid=wx0d482cfc691f30e5&redirect_uri=http://drshe.leanapp.cn&response_type=code&scope=snsapi_userinfo&state=1', "data": {
                    "first": {
                        "value": title,
                        "color": "#173177"
                    },
                    "account": {
                        "value": account,
                        "color": "#173177"
                    },
                    "time": {
                        "value": time.format('LLL'),
                        "color": "#173177"
                    },
                    "type": {
                        "value": type,
                        "color": "#173177"
                    },
                    "creditChange": {
                        "value": creditChange,
                        "color": "#173177"
                    },
                    "creditName": {
                        "value": creditName,
                        "color": "#173177"
                    },
                    "number": {
                        "value": number,
                        "color": "#173177"
                    },
                    "amount": {
                        "value": amount,
                        "color": "#173177"
                    },
                    "remark": {
                        "value": remark,
                        "color": "#173177"
                    }
                }
            };
            count++;
            let msg = count.toString() + ":" + account + " " + openid;
            getTokenAndSendMsg(data, msg, callback);
        }, function (err, results) {
            res.jsonp(results);
        });
    });

});

router.post('/json/message/notify', function (req, res) {
    let title = req.body.title;
    let time = new moment();
    //let openid="oY9WLjnY5tQYPIlQPquKXR9iAVKk";
    let userQuery = new AV.Query('WxUser');
    userQuery.exists('openid');
    userQuery.limit(1000);
    userQuery.find().then(function (users) {
        let count = 0;
        async.map(users, function (user, callback) {
            let account = user.get('nickname') ? user.get('nickname') : "亲爱的用户";
            let openid = user.get('openid');
            let data = {
                touser: openid, template_id: "g2ZZ3PhB5lP1ZtinX6e3X_46IsIniOfV2KsUomM5d1Y", url: 'https://open.weixin.qq.com/connect/oauth2/authorize?appid=wx0d482cfc691f30e5&redirect_uri=http://drshe.leanapp.cn/toc&response_type=code&scope=snsapi_userinfo&state=1', "data": {
                    "first": {
                        "value": title,
                        "color": "#173177"
                    },
                    "keyword1": {
                        "value": account,
                        "color": "#173177"
                    },
                    "keyword2": {
                        "value": "问医积分等你领",
                        "color": "#173177"
                    },
                    "keyword3": {
                        "value": "8月31日-9月7日",
                        "color": "#173177"
                    },
                    "keyword4": {
                        "value": "星天使公众号",
                        "color": "#173177"
                    },
                    "remark": {
                        "value": "点击链接，即可领取5个问医积分！",
                        "color": "#d20b31"
                    }
                }
            };
            count++;
            let msg = count.toString() + ":" + account + " " + openid;
            getTokenAndSendMsg(data, msg, callback);
        }, function (err, results) {
            res.jsonp(results);
        });
    });

});
module.exports = router;
