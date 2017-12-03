var websocket = require("websocket");

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
    },

    // use this for initialization
    onLoad: function () {
        /*var buf = new ArrayBuffer(10);
        var dataview = new DataView(buf);

        dataview.setUint8(0, 100);
        var value = dataview.getUint8(0);
        console.log(value);*/
    },

    start: function() {
        this.scheduleOnce(function() {
            var data = {
                uname: "黄栋",
                upwd: "123456",
            };

            websocket.send_cmd(1, 1, data);
        }.bind(this), 3);
    }
    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },
});
