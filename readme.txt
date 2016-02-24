初始化后端项目：
npm init

初始化前端项目：
bower init

node控制台出现这种错误：
Error: Can't set headers after they are sent.
或者利用err对象打印出的错误信息：
(error) MISCONF Redis is configured to save RDB snapshots, but is currently not able to persist on disk. Commands that may modify the data set are disabled. Please check Redis logs for details about the error.

都有可能是redis服务器出现了问题

977 x 480(600)

出现这个错误的原因是：
WRONGTYPE Operation against a key holding the wrong kind of value

类型不符合，比如说：hmset设置的key必须用hgetall这种形式来获取，而不能用其它获取key的方式

而在该程序中，session持久化在redis的0号库中，瓶子也存放在0号库中，使用RANDOMEKEY随机获取一个key，可能获取的是session的key

如果session的key使用hgetall获得结果，将会报错，所以，进行调整，将瓶子存放在3号数据库中
