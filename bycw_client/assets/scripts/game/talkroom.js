var websocket = require("websocket");

var STYPE_TALKROOM = 1;
var TalkCmd = {
	Enter: 1, // 用户进来
	Exit: 2, // 用户离开ia
	UserArrived: 3, // 别人进来;
	UserExit: 4, // 别人离开

	SendMsg: 5, // 自己发送消息,
	UserMsg: 6, // 收到别人的消息
};

var Respones = {
	OK: 1,
	IS_IN_TALKROOM: -100, // 玩家已经在聊天室
	NOT_IN_TALKROOM: -101, // 玩家不在聊天室
	INVALD_OPT: -102, // 玩家非法操作
	INVALID_PARAMS: -103, // 命令格式不对
};

cc.Class({
    extends: cc.Component,

    properties: {
        // foo: {
        //    default: null,      // The default value will be used only when the component attaching
        //                           to a node for the first time
        //    url: cc.Texture2D,  // optional, default is typeof default
        //    serializable: true, // optional, default is true
        //    visible: true,      // optional, default is true
        //    displayName: 'Foo', // optional
        //    readonly: false,    // optional, default is false
        // },
        // ...
        input: {
            default: null,
            type: cc.EditBox,
        },
        //定义一个输入框属性，这样就可以把做好的输入框拖到属性检查器的这个入口上
    },

    // use this for initialization
    onLoad: function () {
        websocket.register_serivces_handler({
            1: this.on_talk_room_service_return.bind(this),
        });
    },

    on_talk_room_service_return: function(stype, cmd, body) {
        switch(cmd) {
            case TalkCmd.Enter:
                console.log("Enter", body);
            break;
            case TalkCmd.Exit:
                console.log("Exit", body);
            break;
            case TalkCmd.UserArrived:
                console.log("UserArrived", body);
            break;
            case TalkCmd.UserExit:
                console.log("UserExit", body);
            break;
            case TalkCmd.SendMsg:
                console.log("SendMsg", body);
            break;
            case TalkCmd.UserMsg:
                console.log("UserMsg", body);
            break;
        }
    },

    start: function() {

    },
    
    //链接聊天室按钮的入口函数
    connect_to_talkroom: function(){
       console.log("connect_to_talkroom");
    },
    //退出聊天室按钮的入口函数
    disconnect_to_talkroom: function(){
       console.log("disconnect_to_talkroom");
    },
    //发送信息按钮的入口函数
    send_msg_to_talkroom: function(){
        //获得链接到该脚本上文字输入框中的文字
        var str = this.input.string;
        //如果没有文字或者小于0，则返回
        if (!str || str.length <=0){
            return;
        }
        //有的话就打印该字符
        console.log(str);
        //打印后置空
        this.input.string="";



    },
    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },
});
