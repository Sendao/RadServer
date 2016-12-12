
module.exports = function ProjectsControl() {
    this.routes = function(router) {
        router.get('/chat.json').bind( this.getChat.bind(this) );
        router.put('/chat.json').bind( this.addChat.bind(this) );
    };
    
    this.getChat = function(req, res) {
        if( !(var sess=this.app.requireAuth(res,params)) ) return;
        var data = this.data.getChat();
        res.send(200, {}, data);
    };
    
    this.addChat = function(req, res, params) {
        if( !(var sess=this.app.requireAuth(res,params)) ) return;
    	var a = this.app.util.FibreRing( function() {
            var obj = this.data.postChat(params.name, '1.1.1.1', params.typing);
            res.send(200, {}, obj);
    	}, this );
    	a();
    	
    };
};

var async = require('async');
