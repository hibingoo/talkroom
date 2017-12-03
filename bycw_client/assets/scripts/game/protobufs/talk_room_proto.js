var proto_man = require("proto_man");

// 二进制
/*
 var data = {
	uname: "Blake",
	upwd: "123456",
};
*/
function encode_cmd_1_1(body) {
	var stype = 1;
	var ctype = 1;

	var total_len = 2 + 2 + body.uname.utf8_byte_len() + body.upwd.utf8_byte_len() + 2 + 2;
	var buf = new ArrayBuffer(total_len);
	var dataview = new DataView(buf);

	dataview.setUint16(0, stype, true); // 0, 1
	dataview.setUint16(2, ctype, true); // 2, 3

	// uname的字符串
	dataview.setUint16(4, body.uname.utf8_byte_len(), true); // 4, 5
	dataview.write_utf8(6, body.uname); // 6写入uname的字符串	
	// end

	var offset = 6 + body.uname.utf8_byte_len(); 
	dataview.setUint16(offset, body.upwd.utf8_byte_len(), true); // offset + 0, offset + 1
	dataview.write_utf8(offset + 2, body.upwd); // offset + 2写入upwd的字符串	

	return buf;
} 

function decode_cmd_1_1(cmd_buf) {
	return null;
}

proto_man.reg_encoder(1, 1, encode_cmd_1_1);
proto_man.reg_decoder(1, 1, decode_cmd_1_1);