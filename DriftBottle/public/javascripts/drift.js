/* menu.jade头部Start */

function login() {
	$('#loginModal').modal('show');
}

function reg() {
	$('#regModal').modal('show');
}

$('#avatar').change(function () {
	var file = $('#avatar')[0].files[0];
	var fd = new FileReader();
	fd.readAsDataURL(file);

	fd.onload = function () {
		$('#avatarPreview').attr('src', this.result);
		$('#avatarPreview').css('display', 'block');
	};
});


function logout() {
	$.ajax({
		url: '/users/logout',
		type: 'GET',
		dataType: 'json'
	}).done(function (msg) {
		if(msg['code']==1){
			window.location.href = '/';
		}
	});
}
/* menu.jade头部End */

/* menu.jade底部Start */

/**
 * 扔瓶子
 */
function throwBottle() {
	if (parseInt($('#throwTimes').text()) <= 0) {
		$('#msg').text('您今天扔瓶子的机会用完啦...');
		$('#msgModal').modal('show');
	} else {
		$('#content').val();
		$('#throwModal').modal('show').css({
			'margin-top': '150px'
		});
	}
}

/**
 * 捞一个
 */
function pick() {
	if(parseInt($('#pickTimes').text())<=0) {
		$('#msg').text('你今天捞瓶子的机会用完啦。。。。');
		$('#msgModal').modal('show');
	} else {
		$.ajax({
			url:"/bottle/pick",
			// 这里设置成POST的原因是因为后面查看我的瓶子的时候，发送的也是该url，但是那时会有数据发送
			type:"POST",
			dataType:'json'
		}).done(function(msg){
			if(msg['code']==1){
				var bottle = msg['msg'];
				$('#pickTimes').text(parseInt($('#pickTimes').text())-1);
				$("#owner").val(bottle.username);
				$("#showOwner").html(bottle.username);
				$("#bottle_content").val(bottle.content);
				$("#showBottle_content").html(bottle.content);
				$("#time").val(bottle.time);
				$("#showTime").html(new Date(parseInt(bottle.time)).toLocaleString());
				$('#pickModal').modal('show');
			}else{
				$('#msg').text(msg['msg']);
				$('#msgModal').modal('show');
			}
		});
	}
}

/**
 * 我的瓶子
 */
function myBottle() {
	$.ajax({
		url:"/bottle/myBottle",
		type:"GET",
		dataType:'json'
	}).done(function(msg){
		if(msg['code']==1){
			var bottles = msg['msg'];
			$('#myBottleRows').empty();
			// 将与我相关的瓶子列表显示出来
			for(var i=0;i<bottles.length;i++){
				$('#myBottleRows').append(
					$('<div class="col-sm-12"><a href="#" onclick="viewBottle(\'' + bottles[i]._id + '\')"'+'>'
						+(bottles[i].message[0].user+":"+bottles[i].message[0].content)
						+'</a></div>')
				);
			}
			$('#myBottleModal').modal('show');
		}else{
			$('#msg').text(msg['msg']);
			$('#msgModal').modal('show');
		}
	});
}

/* menu.jade底部End */

/*注册的模态框reg.jade Start*/
$('#regModal').on('hide.bs.modal', function () {
	var username = $('#username').val();
	var password = $('#password').val();
	if (username) {
		var formData = new FormData();
		formData.append('username', username);
		formData.append('password', password);
		formData.append('avatar', $('#avatar')[0].files[0]);
		console.log('呵呵');
		$.ajax({
			url: '/users/reg',
			type: 'POST',
			data: formData,
			dataType: 'json',
			processData: false,
			contentType: false
		}).done(function (msg) {
			if(msg['code']==1){
				var userInfo = msg['msg'];
				$('#regInfo').css('display', 'none');
				$('#userInfo').css('display', 'block');
				$('#myUsername').text(userInfo.username);
				$('#myAvatar').attr('src',userInfo.avatar);
				$('#throwTimes').text(6 - parseInt(userInfo.throwTimes));
				$('#pickTimes').text(3 - parseInt(userInfo.pickTimes));
			} else {
				$('#msg').text(msg['msg']);
				$('#msgModal').modal('show');
			}
		});
	}
});
/*注册的模态框reg.jade End*/

/*登录的模态框login.jade Start*/
$('#loginModal').on('hide.bs.modal', function () {
	var username = $('#user').val();
	var password = $('#pwd').val();
	if (username) {
		var formData = new FormData();
		formData.append('username', username);
		formData.append('password', password);

		$.ajax({
			url: '/users/login',
			type: 'POST',
			data: formData,
			dataType: 'json',
			processData: false,
			contentType: false
		}).done(function (msg) {
			if(msg['code']==1){
				var userInfo = msg['msg'];
				$('#regInfo').css('display', 'none');
				$('#userInfo').css('display', 'block');
				$('#myUsername').text(userInfo.username);
				$('#myAvatar').attr('src', userInfo.avatar);
				$('#throwTimes').text(6 - parseInt(userInfo.throwTimes));
				$('#pickTimes').text(3 - parseInt(userInfo.pickTimes));
			} else {
				$('#msg').text(msg['msg']);
				$('#msgModal').modal('show');
			}
		});
	}
});
/*登录的模态框login.jade End*/

/* 扔瓶子的模态框throw.jade Start */
$('#throwModal').on('hide.bs.modal', function () {
	var content = $('#content').val();
	if (content) {
		$.ajax({
			url: '/bottle/throw',
			type: 'POST',
			data: {content: content},
			dataType: 'json'
		}).done(function (msg) {
			if (msg['code'] == 1) {
				// #throwTimes的位置在menu.jade中
				$('#throwTimes').text(parseInt($('#throwTimes').text()) - 1);
				// #msg和#msgModal的位置在message.jade中
				$('#msg').text(msg['msg']);
				$('#msgModal').modal('show');
			} else {
				$('#throwTimes').text(parseInt($('#throwTimes').text()) - 1);
				$('#msg').text(msg['msg']);
				$('#msgModal').modal('show');
			}
		});
	}
});

/* 扔瓶子的模态框throw.jade End */

/* 捡瓶子的模态框pick.jade Start */
/**
 * 捡瓶子：扔回去
 */
function throwback() {
	var owner = $('#owner').val();
	var time = $('#time').val();
	var bottle_content = $('#bottle_content').val();

	if (bottle_content) {
		$.ajax({
			url: '/bottle/throw',
			type: 'POST',
			data: {content: bottle_content, owner: owner, time: time},
			dataType: 'json'
		}).done(function (msg) {
			if(msg['code'] == 1){
				$('#pickModal').modal('hide');
				$('#throwTimes').text(parseInt($('#throwTimes').text()));
				$('#msg').text(msg['msg']);
				$('#msgModal').modal('show');
			}else{
				$('#pickModal').modal('hide');
				$('#msg').text(msg['msg']);
				$('#msgModal').modal('show');
			}
		});
	}
}

/**
 * 捡瓶子：回应
 */
function response(){
	var owner = $('#owner').val();
	var time = $('#time').val();
	var response = $('#response').val();
	var bottle_content = $('#bottle_content').val();
	if(bottle_content){
		$.ajax({
			url:"/bottle/response",
			type:"POST",
			data:{response:response,content:bottle_content,owner:owner,time:time},
			dataType:'json'
		}).done(function(msg){
			if(msg['code']==1){
				$('#pickModal').modal('hide');
				$('#msg').text('回应成功,瓶子已经收藏到了我的瓶子里了。');
				$('#msgModal').modal();
			}else{
				$('#pickModal').modal('hide');
				$('#msg').text(msg['msg']);
				$('#msgModal').modal();
			}
		});
	}
}

/* 捡瓶子的模态框pick.jade End */

/* 我的瓶子的模态框viewBottle.jade Start */
function viewBottle(bottleId){
	$.ajax({
		url:"/bottle/pick",
		type:"POST",
		data:{bottleId: bottleId},
		dataType:'json'
	}).done(function(msg){
		if(msg['code']==1){
			var bottle = msg['msg'];
			$('#viewBottleRows').empty();
			for(var i=0;i<bottle.message.length;i++){
				$('#viewBottleRows').append(
					$('<div class="col-sm-12">'
						+(bottle.message[i].user+":"+bottle.message[i].content)
						+'</div>')
				);
			}
			$('#myBottleModal').modal('hide');
			$('#viewBottleModal').modal('show');
		}else{
			$('#msg').text(msg['msg']);
			$('#msgModal').modal('show');
		}
	});
}
/* 我的瓶子的模态框viewBottle.jade End */