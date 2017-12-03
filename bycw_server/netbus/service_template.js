var service = {
	stype: 1, // 服务号
	name: "service tempalte", // 服务名称

	// 每个服务初始化的时候调用
	init: function () {
			
	},

	// 每个服务收到数据的时候调用
	on_recv_player_cmd: function(session, ctype, body) {
	},

	// 每个服务连接丢失后调用,被动丢失连接
	on_player_disconnect: function(session) {
	},
};

module.exports = service;
