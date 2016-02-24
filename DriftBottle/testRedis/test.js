var redis = require('redis');
var bluebird = require('bluebird');

var client = redis.createClient(6379, '192.168.1.118');

//client = bluebird.promisifyAll(client);

client.SELECT(5, function(err) {
	console.log(err);
	client.HMSET('bottleid', {
		'name': 'java',
		'content': 'content'
	}, function (err, results) {
		client.HGETALL('bottleid', function (err, results) {
			// 直接返回一个对象
			console.log(results);
		});
	});
});

//client.HMSET(key2, {
//	"0123456789": "abcdefghij", // NOTE: key and value will be coerced to strings
//	"some manner of key": "a type of value"
//});

client.on("error", function (err) {
	console.log("Error " + err);
});