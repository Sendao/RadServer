var async = require('async');

module.exports = function VFSControl() {

    this.routes = function(router) {
        router.post('/vfs/files.js').bind( this.updFile.bind(this) );
        router.post('/vfs/folds.js').bind( this.updFolder.bind(this) );
        router.get('/vfs/files.js').bind( this.getFile.bind(this) );
        router.get('/vfs/folds.js').bind( this.getFolder.bind(this) );
        router.get('/vfs.json').bind(  this.getRoot.bind(this) );
    };
    
    this.getRoot = function(req, res, params) {
        var sess;
        if( !(sess=this.app.requireAuth(res,params)) ) return;
    	this.getFolder(req, res, {'folder': '/'});
    };

    this.getFile = function(req, res, params) {
        var sess;
        if( !(sess=this.app.requireAuth(res,params)) ) return;
        var files = this.data.getFile(params);
        res.send(200, {}, {'status': 'ok', 'data': files});
    };
    this.getFolder = function(req, res, params) {
        var sess;
        if( !(sess=this.app.requireAuth(res,params)) ) return;
        var sites = this.base.getFolder(params);
        res.send(200, {}, {'status': 'ok', 'data': sites});
    };

    this.updFile = function(req, res, params) {
        var sess;
        if( !(sess=this.app.requireAuth(res,params)) ) return;
        var det = this.data.updFile( params );
        if( det === false ) {
            res.send(200, {}, {'status': 'failed'});
            return;
        }
        res.send(200, {}, { 'status': 'ok', 'data': det });
    };
    
    this.updFolder = function(req, res, params) {
        var sess;
        if( !(sess=this.app.requireAuth(res,params)) ) return;
        var det = this.data.updFolder(params);
        if( det === false ) {
        	res.send(200, {}, {'status': 'failed'});
        }
        res.send(200, {}, {'status':  'ok', 'data': det} );
    };
};
