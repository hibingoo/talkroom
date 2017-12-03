var proto_man = require("../netbus/proto_man.js");
/*
enter:
客户端: 进入聊天室
1, 1, body = {
	uname: "名字",
	usex: 0 or 1, // 性别
};
返回:
1, 1, status = OK;

exit
客户端: 离开聊天室
1, 2, body = null;
返回:
1, 2, status = OK;

UserEnter: 主动发送
1, 3, body = uinfo{
	uname: "名字",
	usex: 0 or 1, // 性别
}
UserExit: 主动发送
1, 4, body = uinfo {
	uname: "名字",
	usex: 0, 1 // 性别
}

客户端请求发送消息
1, 5, body = "消息内容"
返回
1, 5, body = {
	0: status, OK, 失败的状态码
	1: uname,
	2: usex,
	3: msg, // 消息内容
}

UserMsg: 服务器主动发送
1, 6, body = {
	0: uname,
	1: usex
	2: msg,
};
*/
// 二进制
function encode_cmd_1_1(body) {
	var stype = 1;
	var ctype = 1;

	var total_len = 2 + 2 + body.uname.length + body.upwd.length + 2 + 2;
	var buf = Buffer.allocUnsafe(total_len);
	buf.writeUInt16LE(stype, 0); // 0, 1
	buf.writeUInt16LE(ctype, 2); // 2, 3

	// uname的字符串
	buf.writeUInt16LE(body.uname.length, 4); // 4, 5
	buf.write(body.uname, 6); // 6写入uname的字符串	
	// end

	var offset = 6 + body.uname.length; 
	buf.writeUInt16LE(body.upwd.length, offset); // offset + 0, offset + 1
	buf.write(body.upwd, offset + 2); // offset + 2写入upwd的字符串	

	return buf;
} 

function decode_cmd_1_1(cmd_buf) {
	var stype = 1;
	var ctype = 1;

	// uname
	var uname_len = cmd_buf.readUInt16LE(4);

	if((uname_len + 2 + 2 + 2) > cmd_buf.length) {
		return null;
	}
	
	var uname = cmd_buf.toString("utf8", 6, 6 + uname_len);
	if (!uname) {
		return null;
	}
	// end 

	var offset = 6 + uname_len;
	var upwd_len = cmd_buf.readUInt16LE(offset);
	if ((offset + upwd_len + 2) > cmd_buf.length) {
		return null;
	}

	var upwd = cmd_buf.toString("utf8", offset + 2, offset + 2 + upwd_len);
	
	var cmd = {
		0: 1,
		1: 1,
		2: {
			"uname": uname,
			"upwd":  upwd,
		}
	};
	return cmd;	
}

proto_man.reg_encoder(1, 1, encode_cmd_1_1);
proto_man.reg_decoder(1, 1, decode_cmd_1_1);