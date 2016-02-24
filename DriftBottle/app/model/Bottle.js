var redis = require('redis');
var uuid = require('uuid');
var async = require('async');
var util = require('util');
var promise = require('bluebird');

var config = require('../config/config');

/**
 * 为了连接效率更高一些，这里使用一个连接池的概念：
 * generic-pool：通用的连接池，它不但可以管理redis连接，也可以管理mysql、mongo
 * 咱们的链接是非常消耗性能的，它是基于tcp的，所以它需要你更服务器进行关联，要进行三次握手，需要建立通信通道
 * 然后再去发数据，所以建立一个连接是非常消耗性能的，
 * 连接池就是把原来创建连接、销毁连接，转变成借连接，还连接的过程
 */

var pool = require('generic-pool').Pool({
	name: 'redisPool',
	create: function (callback) {
		callback(null, redis.createClient(config.redis.port, config.redis.host));
	},
	destroy: function (client) {
		client.quit();
	},
	max: 100, // 最大连接数
	min: 5, // 最小连接数
	idleTimeoutMillis: 30 * 1000,
	log: false
});

/**
 * 得到扔瓶子和捡瓶子的次数
 * 注意：这里必须这样写，必须创建两个客户端
 * redis数据库的选择：0号：存储瓶子，1号：存储扔的次数，2号：存储捡的次数
 * @param username
 * @param callback
 */
module.exports.getTimes = function (username, callback) {
	async.parallel({
		throwTimes: function (cb) {
			pool.acquire(function (err, client) {
				client.SELECT(1, function () {
					client.GET(username, function (err, throwTimes) {
						cb(null, throwTimes);
					});
				});
			});
		},
		pickTimes: function (cb) {
			pool.acquire(function (err, client) {
				client.SELECT(2, function () {
					client.GET(username, function (err, pickTimes) {
						cb(null, pickTimes);
					});
				});
			});
		}
	}, function (err, result) {
		// result的值就是一个数组，顺序是throwTimes和pickTimes的值
		callback(null, result);
	});
};
/**
 * auto方法里面是一个对象和一个回调
 * 这里使用auto方法不可行的原因是，select1和select2两个任务共用了一个client对象
 * 所以只能用两个client了
 * 注意：
 * 以下函数的执行关系：select1和select2之间是没有关系的，可以并发
 * 但是throwTimes一定是在select1执行结束后完成的
 * pickTimes一定是在select2执行结束后完成的。
 */

/*
module.exports.getTimes = function (username, callback) {
	pool.acquire(function (err, client) {
		async.auto({
			select1: function (cb, results) {
				client.SELECT(1, function () {
					cb(null, 'success');
				});
			},
			select2:function (cb, results) {
				client.SELECT(2, function () {
					cb(null, 'success');
				});
			},
			throwTimes: ['select1', function (cb, results) {
				client.GET(username, function (err, throwTimes) {
					cb(null, throwTimes);
				});
			}],
			pickTimes: ['select2', function (cb, results) {
				client.GET(username, function (err, pickTimes) {
					cb(null, pickTimes);
				});
			}]
		}, function (err, results) {
			if (err) {
				callback(err);
			} else {
				callback(null, {throwTimes: results.throwTimes || 0, pickTimes: results.pickTimes || 0});
			}
		});
	});
};
*/

/**
 * 扔瓶子
 */
module.exports.throw = function (bottle, callback) {
	var bottleId = uuid.v4();
	// 一个月的时间减去已过去的时间就是剩余的时间
	var expTime = (3600 * 24 * 30 * 1000 - (Date.now() - bottle.time)) / 1000; // 一个月的秒数

	async.waterfall([
		function (cb) {
			pool.acquire(function (err, client) { // 获取连接
				console.error('获取连接');
				cb(null, client);
			});
		}, function (client, cb) {
			console.error('选择1号库');
			client.SELECT(1, function () {
				cb(null, client);
			});
		}, function (client, cb) {
			console.error('获取此用户扔瓶子的次数');
			// 获取此用户扔瓶子的次数
			client.GET(bottle.username, function (err, result) {
				console.log('结果是：' + result);
				if (result && result >= 6) {
					return cb({code: 0, msg: "今天扔瓶子的机会已经用完啦"});
				} else {
					cb(null, client);
				}
			});
		}, function (client, cb) {
			console.error('扔瓶子的计数器加1');
			// 扔瓶子的计数器加1
			client.INCR(bottle.username, function (err) {
				console.log(err);
				cb(null, client);
			});
		}, function (client, cb) {
			console.error('选择3号库');
			client.SELECT(3, function () {
				cb(null, client);
			});
		}, function (client, cb) {
			// 批量的设置HASH的值，H：Hash，M：multi
			// key是生成的uuid
			// value就是bottle对象
			console.error('添加新瓶子');
			// 添加新瓶子
			client.HMSET(bottleId, bottle, function (err, result) {
				if (err) {
					cb({code: 0, msg: '请一会再试'});
				} else {
					cb(null, client);
				}
			});
		}, function (client, cb) {
			console.error('设置过期时间');
			client.expire(bottleId, expTime, function () {
				pool.release(client);
				cb(null, {code: 1, msg: '瓶子已经飘向远方了'});
			});
		}
	], function (err, results) {
		console.error(err);
		if (err) {
			callback(err);
		} else {
			callback(results);
		}
	});
};

module.exports.pick = function (username, callback) {
	pool.acquire(function (err, client) {
		// 旧的瓶子ID
		var oldBid = null;
		client = promise.promisifyAll(client);
		client.SELECTAsync(2).then(function () {
			console.log(1);
			return client.GETAsync(username);
		}).then(function (result) {
			console.log(2);
			if (result && result >= 3) {
				throw new Error('今天捡瓶子的机会用完啦');
			} else {
				return client.INCRAsync(username);
			}
		}).then(function () {
			console.log(3);
			return client.SELECTAsync(3);
		}).then(function () {
			console.log(4);
			// 获取随机的key：randomkey
			return client.RANDOMKEYAsync();
		}).then(function (bottleId) {
			console.log(5);
			if (!bottleId) {
				throw new Error("大海空空如也");
			} else {
				oldBid = bottleId;
				return client.HGETALLAsync(bottleId);
			}
		}).then(function (bottle) {
			console.log(6);
			callback({code: 1, msg: bottle});
			return bottle;
		}).then(function (bottle) {
			console.log(7);
			if (oldBid) {
				return client.DELAsync(oldBid);
			} else {
				// 这里只是为了返回一个promise对象，没有别的用处
				return client.RANDOMKEYAsync();
			}
		}).then(function () {
			console.log(8);
			// 这里只是为了返回一个promise对象，没有别的用处
			pool.release(client);
			return client.RANDOMKEYAsync();
		}).catch(SyntaxError, function(e){
			return callback({code: 0, msg: e.message});
		}).catch(function(e){
			return callback({code: 0, msg: e.message});
		});
	});
};





