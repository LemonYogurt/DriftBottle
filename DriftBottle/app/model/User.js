// 这个使用npm安装在window下面会报点错，没有关系，忽略就行了
var mongoose = require('mongoose');
// 将这个模型导出，模型的名字叫User
// Schema里面用于定义，有哪些字段，字段的类型是什么
// Schema就是定义的意思，它里面并不包含和数据相关的任何操作
// 一个model相当于collections
var User = mongoose.model('User', new mongoose.Schema({
	username: String, //用户
	password: String, // 密码
	avatar: String // 头像
}));

module.exports.reg = function (user, callback) {
	new User(user).save(function (err, user) {
		if (err) {
			callback(err);
		} else {
			callback(user);
		}
	});
};

module.exports.login = function (user, callback) {
	User.findOne({username: user.username, password: user.password}, function (err, user) {
		if (err) {
			callback(err);
		} else {
			callback(user);
		}
	});
};
