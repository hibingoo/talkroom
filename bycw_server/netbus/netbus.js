var net = require("net");
var ws = require("ws");

var log = require("../utils/log.js");
var tcppkg = require("./tcppkg.js");
var proto_man = require("./proto_man.js");
var service_manager = require("./service_manager.js");

var netbus = {
	start_tcp_server: start_tcp_server,
	start_ws_server: start_ws_server,
	// session_send: session_send,
	session_close: session_close,
};

var global_session_list = {};
var global_seesion_key = 1;

// 有客户端的session接入进来
function on_session_enter(session, proto_type, is_ws) {
	if (is_ws) {
		log.info("session enter", session._socket.remoteAddress, session._socket.remotePort);
	}
	else {
		log.info("session enter", session.remoteAddress, session.remotePort);	
	}
	
	session.last_pkg = null; // 表示我们存储的上一次没有处理完的TCP包;
	session.is_ws = is_ws;
	session.proto_type = proto_type;
	session.is_connected = true;


	// 扩展session的方法
	session.send_encoded_cmd = session_send_encoded_cmd;
	session.send_cmd = session_send_cmd;
	// end 

	// 加入到我们的serssion 列表里面
	global_session_list[global_seesion_key] = session;
	session.session_key = global_seesion_key;
	global_seesion_key ++;
	// end 
}

function on_session_exit(session) {
	session.is_connected = false;
	service_manager.on_client_lost_connect(session);

	session.last_pkg = null; 
	if (global_session_list[session.session_key]) {
		global_session_list[session.session_key] = null;
		delete global_session_list[session.session_key]; // 把这个key, value从 {}里面删除
		session.session_key = null;
	}
}

// 一定能够保证是一个整包;
// 如果是json协议 str_or_buf json字符串;
// 如果是buf协议 str_or_buf Buffer对象;
function on_session_recv_cmd(session, str_or_buf) {
	if(!service_manager.on_recv_client_cmd(session, str_or_buf)) {
		session_close(session);
	}
}

function session_send_cmd(stype, ctype, body) {
	if (!this.is_connected) {
		return;
	}
	
	var cmd = null;
	cmd = proto_man.encode_cmd(this.proto_type, stype, ctype, body);
	if (cmd) {
		this.send_encoded_cmd(cmd);
	}
}

// 发送命令
function session_send_encoded_cmd(cmd) {
	if (!this.is_connected) {
		return;
	}

	if (!this.is_ws) { // 
		var data = tcppkg.package_data(cmd);
		this.write(data);
		return;
	}
	else {
		this.send(cmd);
	}
}

// 关闭一个session
function session_close(session) {
	if (!session.is_ws) {
		session.end();
		return;
	}
	else {
		session.close();
	}
}


// -------------------------------
function add_client_session_event(session, proto_type) {
	session.on("close", function() {
		on_session_exit(session);
	});

	session.on("data", function(data) {
		// 
		if (!Buffer.isBuffer(data)) { // 不合法的数据
			session_close(session);
			return;
		}
		// end 

		var last_pkg = session.last_pkg;
		if (last_pkg != null) { // 上一次剩余没有处理完的半包;
			var buf = Buffer.concat([last_pkg, data], last_pkg.length + data.length);
			last_pkg = buf;
		}
		else {
			last_pkg = data;	
		}

		var offset = 0;
		var pkg_len = tcppkg.read_pkg_size(last_pkg, offset);
		if (pkg_len < 0) {
			return;
		}

		while(offset + pkg_len <= last_pkg.length) { // 判断是否有完整的包;
			// 根据长度信息来读取我们的数据,架设我们穿过来的是文本数据
			var cmd_buf; 


			// 收到了一个完整的数据包
			if (session.proto_type == proto_man.PROTO_JSON) {
				var json_str = last_pkg.toString("utf8", offset + 2, offset + pkg_len);
				if (!json_str) {
					session_close(session);
					return;
				}
				on_session_recv_cmd(session, json_str);	
			}
			else {
				cmd_buf = Buffer.allocUnsafe(pkg_len - 2); // 2个长度信息
				last_pkg.copy(cmd_buf, 0, offset + 2, offset + pkg_len);
				on_session_recv_cmd(session, cmd_buf);	
			}
			

			offset += pkg_len;
			if (offset >= last_pkg.length) { // 正好我们的包处理完了;
				break;
			}

			pkg_len = tcppkg.read_pkg_size(last_pkg, offset);
			if (pkg_len < 0) {
				break;
			}
		}

		// 能处理的数据包已经处理完成了,保存 0.几个包的数据
		if (offset >= last_pkg.length) {
			last_pkg = null;
		}
		else { // offset, length这段数据拷贝到新的Buffer里面
			var buf = Buffer.allocUnsafe(last_pkg.length - offset);
			last_pkg.copy(buf, 0, offset, last_pkg.length);
			last_pkg = buf;
		}

		session.last_pkg = last_pkg;
	});

	session.on("error", function(err) {
		
	});

	on_session_enter(session, proto_type, false);
}

function start_tcp_server(ip, port, proto_type) {
	var str_proto = {
		1: "PROTO_JSON",
		2: "PROTO_BUF"
	};
	log.info("start tcp server ..", ip, port, str_proto[proto_type]);
	var server = net.createServer(function(client_sock) { 
		add_client_session_event(client_sock, proto_type);
	});


	// 监听发生错误的时候调用
	server.on("error", function() {
		log.error("server listen error");
	});

	server.on("close", function() {
		log.error("server listen close");
	});

	server.listen({
		port: port,
		host: ip,
		exclusive: true,
	});
}

// -------------------------
function isString(obj){ //判断对象是否是字符串  
	return Object.prototype.toString.call(obj) === "[object String]";  
}  

function ws_add_client_session_event(session, proto_type) {
	// close事件
	session.on("close", function() {
		on_session_exit(session);
	});

	// error事件
	session.on("error", function(err) {
	});
	// end 

	session.on("message", function(data) {
		if (session.proto_type == proto_man.PROTO_JSON) {
			if (!isString(data)) {
				session_close(session);
				return;
			}
			on_session_recv_cmd(session, data);
		}
		else {
			if (!Buffer.isBuffer(data)) {
				session_close(session);
				return;
			}

			on_session_recv_cmd(session, data);	
		}
		
	});
	// end

	on_session_enter(session, proto_type, true); 
}

function start_ws_server(ip, port, proto_type) {
	var str_proto = {
		1: "PROTO_JSON",
		2: "PROTO_BUF"
	};
	log.info("start ws server ..", ip, port, str_proto[proto_type]);
	var server = new ws.Server({
		host: ip,
		port: port,
	});

	function on_server_client_comming (client_sock) {
		ws_add_client_session_event(client_sock, proto_type);
	}
	server.on("connection", on_server_client_comming);

	function on_server_listen_error(err) {
		log.error("ws server listen error!!");
	}
	server.on("error", on_server_listen_error);

	function on_server_listen_close(err) {
		log.error("ws server listen close!!");
	}
	server.on("close", on_server_listen_close);
}

module.exports = netbus;

