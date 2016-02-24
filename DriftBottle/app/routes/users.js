var express = require('express');
var uuid = require('uuid');
var path = require('path');
var formidable = require('formidable');
var fs = require('fs');
var crypto = require('crypto');
var User = require('../model/User');
var Bottle = require('../model/Bottle');
var router = express.Router();

/**
 * 注册用户
 */
router.post('/reg', function (req, res, next) {
	/**
	 * 使用formidable解析req，得到files数据
	 */
	new formidable.IncomingForm().parse(req, function (err, fields, files) {
		var username = fields.username;
		var password = fields.password;
		var avatar = files.avatar;

		// 如果用户名不存在，则返回信息，在后台规定，code:0表示错误，code:1表示成功
		if (!username) {
			return res.json({code: 0, msg: '用户名不能为空'});
		}

		if (!password) {
			// 对密码进行加密处理
			return res.json({code: 0, msg: '密码不能为空'});
		} else {
			password = crypto.createHash('md5').update(password).digest('hex');
		}
		console.log('开始注册');
		User.login({
			username: username
		}, function (result) {
			if (result && result.username) {
				return res.json({code: 0, msg: '该用户名已经存在'});
			} else {
				// 使用uuid生成一个随机不重复的字符串
				var avatarName = uuid.v4() + path.extname(avatar.name);
				// 将头像文件上传到upload文件夹中
				// 注意，这里的路径是以引用该文件的路径为基础
				fs.createReadStream(avatar.path).pipe(fs.createWriteStream('./public/upload/' + avatarName));

				User.reg({
					username: username,
					password: password,
					avatar: '/upload/' + avatarName
				}, function (result) {
					if (result && result.username) {
						// 然后将user信息传入到session中
						req.session.user = {
							username: result.username,
							avatar: result.avatar,
							throwTimes: 0,
							pickTimes: 0
						};
						return res.json({code: 1, msg: req.session.user});
					} else {
						return res.json({code: 0, msg: '注册失败'});
					}
				});
			}
		});
	});
});

/**
 * 登录用户
 */
router.post('/login', function (req, res) {
	/**
	 * 使用formidable解析req，得到files数据
	 */
	new formidable.IncomingForm().parse(req, function (err, fields) {
		var username = fields.username;
		var password = fields.password;

		// 如果用户名不存在，则返回信息，在后台规定，code:0表示错误，code:1表示成功
		if (!username) {
			return res.json({code: 0, msg: '用户名不能为空'});
		}

		if (!password) {
			// 对密码进行加密处理
			return res.json({code: 0, msg: '密码不能为空'});
		} else {
			password = crypto.createHash('md5').update(password).digest('hex');
		}

		User.login({
			username: username,
			password: password
		}, function (result) {
			if (result && result.username) {
				Bottle.getTimes(result.username, function (err, results) {
					console.log(results);
					// 然后将user信息传入到session中
					req.session.user = {
						username: result.username,
						avatar: result.avatar,
						throwTimes: results.throwTimes == null? 0 : results.throwTimes,
						pickTimes: results.pickTimes == null? 0 : results.pickTimes
					};
					return res.json({code: 1, msg: req.session.user});
				});
			} else {
				return res.json({code: 0, msg: '用户不存在'});
			}
		});
	});
});
/**
 * 注销用户
 */
router.get('/logout', function (req, res, next) {
	req.session.user = {};
	return res.json({code: 1, msg: '退出成功'});
});


module.exports = router;