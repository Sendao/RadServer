var async = require('async');

module.exports = function ProjectsControl() {
    
    this.routes = function(router) {
        router.get('/markers.json').bind( this.getMarkers.bind(this) );
        router.post('/markers.json').bind( this.startMarker.bind(this) );
        router.post('/markygen.js').bind( this.postMarker.bind(this) );
        router.post('/marky.js').bind( this.pollMarker.bind(this) );
    };
    
    /*
    this.socket_routes = function(router) {
        router.code('read', this.readMarker.bind(this));
    };
    */
    this.sockets = [];
    this.workcycle = function() {
    	var i;
    	for( i=0; i<this.sockets.length; i++ ) {
    		this.updateMarker(this.sockets[i]);
    	}
    };
    this.updateMarker = function(sock)
    {
    	var buf = this.data.markyGen(sock.mark, 24);
    	
    };
    this.startMarker = function(req, res, params) {
        var sess;
        if( !(sess=this.app.requireAuth(res,params)) ) return;
        var xd = this.base.sessions;
        var o = xd.create( { 'key': params['cookie'], 'mark': params['mark'] } );
        o.save();
        this.sockets.push( o );
    };
    this.getMarkers = function(req, res, params) {
        var sess;
        if( !(sess=this.app.requireAuth(res,params)) ) return;
        var data = this.base.list.page(params['start'], params['count']);
        if( !data ) {
            res.send(200, {}, {'status': '404'});
            return;
        }
        res.send(200, {}, {'status':'ok', 'data': data });
    };
    this.getMarker = function(req, res, params) {
        var sess;
        if( !(sess=this.app.requireAuth(res,params)) ) return;
    };
    this.postMarker = function(req, res, params) {
        var sess;
        if( !(sess=this.app.requireAuth(res,params)) ) return;
        
        this.data.postMarky( params['subject'], params['text'] );
    };
    this.pollMarker = function(req, res, params) {
        var sess;
        if( !(sess=this.app.requireAuth(res,params)) ) return;
        var buf = this.data.markyGen(params['m'], 24);
        res.send(200, {}, {'status':'ok', 'data': buf});
    };
};

