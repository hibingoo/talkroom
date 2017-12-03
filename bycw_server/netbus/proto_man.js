/* 规定:
(1)服务号 命令号 不能为0
(2)服务号与命令号大小不能超过2个字节的整数;
(3) buf协议里面2个字节来存放服务号(0开始的2个字节)，命令号(1开始的2个字节);
(4) 加密,解密, 
(5) 服务号命令号二进制中都用小尾存储
(6) 所有的文本，都使用utf8
*/
var log = require("../utils/log.js");
var proto_man = {
	PROTO_JSON: 1,  
	PROTO_BUF: 2,
	encode_cmd: encode_cmd,
	decode_cmd: decode_cmd,
	reg_decoder: reg_buf_decoder,
	reg_encoder: reg_buf_encoder,
};

// 加密
function encrypt_cmd(str_of_buf) {
	return str_of_buf;
}

// 解密
function decrypt_cmd(str_of_buf) {
	return str_of_buf;
}

function _json_encode(stype, ctype, body) {
	var cmd = {};
	cmd[0] = stype;
	cmd[1] = ctype;
	cmd[2] = body;

	var str = JSON.stringify(cmd);
	return str;
}

function json_decode(cmd_json) {
	var cmd = null;
	try {
		cmd = JSON.parse(cmd_json);
	}
	catch(e) {
		
	}
	
	if (!cmd || 
		typeof(cmd[0])=="undefined" ||
		typeof(cmd[1])=="undefined" ||
		typeof(cmd[2])=="undefined") {
		return null;
	}

	return cmd;
} 

// key, value, stype + ctype -->key: value
function get_key(stype, ctype) {
	return (stype * 65536 + ctype);
}

// 参数1: 协议类型 json, buf协议;
// 参数2: 服务类型 
// 参数3: 命令号;
// 参数4: 发送的数据本地，js对象/js文本，...
// 返回是一段编码后的数据;
function encode_cmd(proto_type, stype, ctype, body) {
	var buf = null;
	
	if (proto_type == proto_man.PROTO_JSON) {
		buf = _json_encode(stype, ctype, body);
	}
	else { // buf协议
		var key = get_key(stype, ctype);
		if (!encoders[key]) {
			return null;
		}
		// end 
		buf = encoders[key](body);
	}

	if (buf) {
		buf = encrypt_cmd(buf); // 加密	
	}
	
	return buf;
}

// 参数1: 协议类型
// 参数2: 接手到的数据命令
// 返回: {0: stype, 1, ctype, 2: body}
function decode_cmd(proto_type, str_or_buf) {
	str_or_buf = decrypt_cmd(str_or_buf); // 解密

	if (proto_type == proto_man.PROTO_JSON) {
		return json_decode(str_or_buf);
	}

	if (str_or_buf.length < 4) {
		return null;
	}

	var cmd = null; 
	var stype = str_or_buf.readUInt16LE(0);
	var ctype = str_or_buf.readUInt16LE(2);
	var key = get_key(stype, ctype);

	if (!decoders[key]) {
		return null;
	}

	cmd = decoders[key](str_or_buf);
	return cmd;
}

// buf协议的编码/解码管理  stype, ctype --> encoder/decoder
var decoders = {}; // 保存当前我们buf协议所有的解码函数, stype,ctype --> decoder;
var encoders = {}; // 保存当前我们buf协议所有的编码函数, stype, ctype --> encoder


// encode_func(body) return 二进制bufffer对象
function reg_buf_encoder(stype, ctype, encode_func) {
	var key = get_key(stype, ctype);
	if (encoders[key]) { // 已经注册过了，是否搞错了
		log.warn("stype: " + stype + " ctype: " + ctype + "is reged!!!");
	}

	encoders[key] = encode_func;
}

// decode_func(cmd_buf) return cmd { 0: 服务号, 1: 命令号, 2: body};
function reg_buf_decoder(stype, ctype, decode_func) {
	var key = get_key(stype, ctype);
	if (decoders[key]) { // 已经注册过了，是否搞错了
		log.warn("stype: " + stype + " ctype: " + ctype + "is reged!!!");
	}

	decoders[key] = decode_func;
}

module.exports = proto_man;