var express = require('express');
var Bottle = require('../model/Bottle');
var MyBottle = require('../model/MyBottle');

var router = express.Router();

/**
 * 扔瓶子
 */
router.post('/throw', function (req, res, next) {
	var bottle = {};
	if (req.body.content) {
		bottle.content = req.body.content;
	} else {
		return res.json({code: 0, msg: '内容不能为空!!!'});
	}

	// 如果所有人有值，表示扔回大海
	if (req.body.owner) {
		bottle.username = req.body.owner;
	} else {
		// 如果是自己扔瓶子，则从session中取出用户名
		bottle.username = req.session.user.username;
	}
	// 如果时间有值表示是扔回大海的
	if (req.body.time) {
		bottle.time = req.body.time;
	} else {
		// 如果没有值，表示自己扔的，需要记录下时间
		bottle.time = Date.now();
	}
	console.log('开始扔瓶子');
	// 开始扔瓶子
	Bottle.throw(bottle, function (result) {
		return res.json(result);
	});
});

/**
 * 捡瓶子
 */
router.post('/pick', function (req, res, next) {
	//如果有瓶子ID表示查看瓶子内容
	if(req.body.bottleId){
		MyBottle.show(req.body.bottleId, function(err,bottle){
			if(err){
				return res.json({code:0,msg:"查看瓶子出错!"});
			}else{
				return res.json({code:1,msg:bottle});
			}
		});
	}else{  //如果没有ID表示是从大海里捡瓶子
		Bottle.pick(req.session.user.username,function(result){
			console.error(result);
			return res.json(result);
		});
	}
});

/**
 * 将回应的瓶子存放到了mongodb数据库中
 */
router.post('/response', function (req, res, next) {
	console.log('进来了');
	var bottle = {user: [], message: []};
	// 把用户自己加进去
	bottle.user.push(req.session.user.username);
	// 把所有者加进去
	bottle.user.push(req.body.owner);

	// 添加
	if (req.body.content) {
		bottle.message.push({
			user: req.body.owner,
			content: req.body.content,
			time: req.body.time
		});
	} else {
		return res.json({code:0,msg:"内容不能为空!"});
	}

	if (req.body.response) { // 添加自己说的话
		bottle.message.push({
			user:req.session.user.username,
			content:req.body.response,
			time:Date.now()
		});
	} else {
		return res.json({code:0,msg:"内容不能为空!"});
	}
	console.log('呵呵哒');
	MyBottle.response(bottle,function(err,result){
		if(err){
			return res.json({code:0,msg:"回应出错!"});
		}else{
			return res.json({code:1,msg:bottle});
		}
	});
});

/**
 *  我的瓶子
 */
router.get('/myBottle', function (req, res, next) {
	MyBottle.myBottle(req.session.user.username,function(err,bottles){
		return res.json({code:1,msg:bottles});
	});
});
module.exports = router;