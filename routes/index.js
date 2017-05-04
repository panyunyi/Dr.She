'use strict';
var router = require('express').Router();
var AV = require('leanengine');
var request=require('request-json');
var appid= process.env.wx_appid;
var secret= process.env.wx_secret;
var WxUser = AV.Object.extend('WxUser');

router.get('/', function(req, res) {
    let code=req.query.code;
    let state=req.query.state;
    let client=request.createClient('https://api.weixin.qq.com/sns/oauth2/');
    client.get('access_token?appid='+appid+'&secret='+secret+'&code='+code+'&grant_type=authorization_code',function(err,res1,body){
        if(body!="undefined"&&typeof(body.openid)!="undefined"){
            client=request.createClient('https://api.weixin.qq.com/sns/');
            client.get('userinfo?access_token='+body.access_token+'&openid='+body.openid+'&lang=zh_CN',function(err2,res2,body2){
                if(body2!="undefined"&&typeof(body2.openid)!="undefined"){
                    let openid=body2.openid;
                    let query=new AV.Query('WxUser');
                    query.equalTo('openid',openid);
                    query.count().then(function(count){
                        if(count==0){
                            let wxuser=new WxUser();
                            wxuser.set('openid',openid);
                            wxuser.set('nickname',body2.nickname);
                            wxuser.set('sex',body2.sex==1?"男":"女");
                            wxuser.set('city',body2.city);
                            wxuser.set('province',body2.province);
                            wxuser.set('country',body2.country);
                            wxuser.set('headimgurl',body2.headimgurl);
                            wxuser.save().then(function(data){
                                res.render('index',{id:data.id});
                            },function(err){
                                console.log(err);
                            });
                        }else if(count==1){
                            query.find().then(function(data){
                                res.render('index',{id:data.id});
                            });
                        }else{
                            res.jsonp("用户信息有重复，为保证用户利益请及时联系客服。");
                        }
                    });
                }else{
                    res.jsonp("获取信息异常，请退出菜单重进。");
                }
            });
        }else{
            res.jsonp("获取信息异常，请退出菜单重进。");
        }
    });
    
});

module.exports = router;
