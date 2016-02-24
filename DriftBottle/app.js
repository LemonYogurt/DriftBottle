var express = require('express');
var path = require('path');
// favicon图标的中间件
var favicon = require('serve-favicon');
// 打印日志信息的中间件
var logger = require('morgan');
// 解析body数据的
var bodyParser = require('body-parser');
// 解析cookie和session
var cookieParser = require('cookie-parser');
var expressSession = require('express-session');
// 使用redis存储session
var RedisStore = require('connect-redis')(expressSession);

// 导入配置
var config = require('./app/config/config');

// 导入路由
var index = require('./app/routes');
var users = require('./app/routes/users');
var bottle = require('./app/routes/bottle');

var Bottle = require('./app/model/Bottle');
var app = express();
var PORT = process.env.PORT || 3000;
// 监听服务
app.listen(PORT, function () {
	console.log('在', PORT, '端口监听成功');
});

// 设置模板页面的地址
app.set('views', path.join(__dirname, 'app/views'));
// 设置模板引擎
app.set('view engine', 'jade');

// 开始设置中间件
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(express.static(path.join(__dirname, 'public')));
app.use(logger('dev'));
// 解析body数据，在req中增加一个body属性
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
// 使用cookieParser，在req中增加一个cookies属性
app.use(cookieParser());

// 使用session中间件实现在redis中的存储
app.use(expressSession({
	secret: 'DriftBottle',
	resave: true,
	saveUninitialized: false,
	store: new RedisStore({
		host: config.redis.host,
		port: config.redis.port
	})
}));

app.use(function(req,res,next){
	var user = req.session.user || {throwTimes: 0, pickTimes: 0};
	res.locals.user = user;
	if(user.username){
		Bottle.getTimes(user.username,function(err, data){
			user.throwTimes = data.throwTimes? data.throwTimes:0;
			user.pickTimes = data.pickTimes? data.pickTimes:0;
			next();
		});
	}else{
		next();
	}
});

// 设置路由
app.use('/', index);
app.use('/users', users);
app.use('/bottle', bottle);

// 错误处理
// 捕获404错误
app.use(function(req, res, next) {
	var err = new Error('Not Found');
	err.status = 404;
	next(err);
});

// 错误处理

if (app.get('env') === 'development') {
	app.use(function(err, req, res, next) {
		res.status(err.status || 500);
		res.render('error', {
			message: err.message,
			error: err
		});
	});
}

app.use(function(err, req, res, next) {
	res.status(err.status || 500);
	res.render('error', {
		message: err.message,
		error: {}
	});
});





