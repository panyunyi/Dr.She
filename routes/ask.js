'use strict';
var router = require('express').Router();
var AV = require('leanengine');
var request = require('request-json');
var appid = process.env.wx_appid;
var secret = process.env.wx_secret;
var partner_key = process.env.partner_key;
var WxUser = AV.Object.extend('WxUser');
var Problem = AV.Object.extend('Problem');
var chunyu = require('../routes/chunyu');
var multiparty = require('multiparty');
var fs = require('fs');

router.get('/', function (req, res) {
    let sess = req.session;
    console.log(sess.objid);
    res.render('ask');
});

router.post('/add', function (req, res) {
    let sess = req.session;
    let query = new AV.Query('WxUser');
    query.get(sess.objid).then(function (user) {
        let time = Math.round(new Date().getTime() / 1000).toString();
        let imglist=req.body.imglist.split(',');
        let data = { "content": req.body.content, "image": imglist, "age": req.body.age+"岁", "sex": user.sex };
        chunyu.createFree(sess.objid, time, data).then(function(data){
            res.jsonp({ id: data });
        });
    }, function (error) {
        // 异常处理
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
                    theFile.fetch().then(function(){
                         res.send({img:theFile.get('url')});
                    });
                }).catch(console.error);
            });
        } else {
            res.send('请选择一个文件。');
        }
    });
});

module.exports = router;