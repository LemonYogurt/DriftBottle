var mongoose = require('mongoose');
var util = require('util');
var config = require('../config/config');
mongoose.connect('mongodb://' + config.mongo.host + ':' + config.mongo.port + '/' + config.mongo.db);

var BottleSchema = new mongoose.Schema({
	user: Array,
	message: Array
});

var bottleModel = mongoose.model('Bottle', BottleSchema);

/**
 * 回应
 * @param bottle
 * @param callback
 */
module.exports.response = function (bottle, callback) {
	var newBottle = new bottleModel(bottle);
	newBottle.save(function (err, bottle) {
		if (err) {
			return callback(err);
		} else {
			callback(null, bottle);
		}
	});
};

/**
 * 查询出与我相关的瓶子
 * @param owner
 * @param callback
 */
module.exports.myBottle = function(owner,callback){
	bottleModel.find({user:owner},function(err,bottles){
		if(err)
			callback(err);
		else
			callback(null,bottles);
	});
};

/**
 * 根据查询出的列表的瓶子id，再查出具体的内容
 * @param bottleId
 * @param callback
 */
module.exports.show = function(bottleId,callback){
	bottleModel.findOne({_id:bottleId},function(err,bottle){
		if(err)
			callback(err);
		else
			callback(null,bottle);
	});
};