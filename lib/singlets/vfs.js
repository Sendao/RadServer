var async = require('async');

module.exports = function VFSSinglet(myapp) {
    var cc = this;
    var app = myapp;
    var db = app.db;
    var dbase = app.dbase;
    this.app = app;

    
    this.routes = function(router) {
        router.post('/vfs/files.js').bind( this.updFile.bind(this) );
        router.post('/vfs/folds.js').bind( this.updFolder.bind(this) );
        router.get('/vfs/files.js').bind( this.getFile.bind(this) );
        router.get('/vfs/folds.js').bind( this.getFolder.bind(this) );
        router.get('/vfs.json').bind(  this.getRoot.bind(this) );
    };

    this.Data = function() {
        db.control.call(this, 'vfs');
        
        this.Files = function() {
            this.name = 'files';
            this.defaults = { 'name': '', 'enc': 'binary', 'folds': [], 'tags': [], 'content': '' };
            dbase.call(this, app, 'vfs');
        };
        this.files = new this.Files();
        
        this.Folds = function() {
            this.name = 'folds';
            this.defaults = { 'name': '', 'folds': [], 'files': [] };
            dbase.call(this, app, 'vfs');

        };
        this.folds = new this.Folds();    
    };
    
    this.getRoot = function(req, res, params) {
        params['folder'] = '/';
        this.getFolder(req, res, params);
    };

    this.getFile = function(req, res, params) {
        var sess;
        if( !(sess=this.app.requireUser(res,params)) ) return;
        var files = this._getFile(params);
        res.send(200, {}, {'status': 'ok', 'data': files});
    };
    this.getFolder = function(req, res, params) {
        var sess;
        if( !(sess=this.app.requireUser(res,params)) ) return;
        var sites = this._getFolder(params);
        res.send(200, {}, {'status': 'ok', 'data': sites});
    };
    this.updFile = function(req, res, params) {
        var sess;
        if( !(sess=this.app.requireUser(res,params)) ) return;
        var det = this._updFile( params );
        if( det === false ) {
            res.send(200, {}, {'status': 'failed'});
            return;
        }
        res.send(200, {}, { 'status': 'ok', 'data': det });
    };    
    this.updFolder = function(req, res, params) {
        var sess;
        if( !(sess=this.app.requireUser(res,params)) ) return;
        var det = this._updFolder(params);
        if( det === false ) {
            res.send(200, {}, {'status': 'failed'});
        }
        res.send(200, {}, {'status':  'ok', 'data': det} );
    };
    
    this._updFile = function(params)
    {
        var xd = this.base.files;
        var file;
        file = this._getFile(params);
        if( file === false ) {
            file = xd.create(params);
        } else {
            file = xd.edit(file, params);
        }
        if( !file ) return false;
        file.save();
        return file;
    };
    this._updFolder = function(params)
    {
        var xd = this.base.folds;
        var file;
        file = this._getFolder(params);
        if( file === false ) {
            file = xd.create(params);
        } else {
            file = xd.edit(file, params);
        }
        if( !file ) return false;
        file.save();
        return file;
    };
    
    this._getFolder = function(params) {
        var xd = this.base.folds;
        var fold=false;
        if( 'fold' in params ) {
            fold=xd.search('id', params['fold']);
        } else if( 'folder' in params ) {
            fold=xd.search('name', params['folder']);
        }
        if( fold !== false ) fold = fold[0];
        return fold;
    };
    this._getFile = function(params)
    {
        var xd = this.base.files;
        var file=false;
        if( 'file' in params ) {
            file=xd.search('id', params['file']);
        } else if( 'filename' in params ) {
            file=xd.search('name', params['filename']);
        }
        if( file !== false ) file = file[0];
        return file;
    };

};
