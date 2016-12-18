var async = require('async');

module.exports = function ProjectsControl() {
    
    this.routes = function(router) {
        router.get('/projects.json').bind( this.getProjects.bind(this) );
        router.post('/project.js').bind( this.postProject.bind(this) );
        router.post('/hours.js').bind( this.postHours.bind(this) );
    };

    /*
    this.sockets = [];
    this.socket_routes = function(router) {
        // router.value('projects', 'dbtable', this.base.projects);
        router.code('projects', this.feedProjects.bind(this));
    };
    */
    
    this.getProjects = function(req, res, params) {
        var sess;
        if( !(sess=this.app.requireAuth(res,params)) ) return;
        var i;
        
        var data = this.base.projects.page(params['start'], params['count']);
        if( !data ) {
            res.send(200, {}, {'status': '404'});
            return;
        }
        for( i=0; i<data.length; ++i ) {
            data[i].Hours = this.base.findTable( 'Hours', data[i].name + "/hours", data[i] );
            data[i].Feats = this.base.findTable( 'Features', data[i].name + "/features", data[i] );
            data[i].hours = data[i].Hours.page(0,100);
            data[i].feats = data[i].Feats.page(0,100);
            delete data[i].Hours;
            delete data[i].Feats;
            this.sockets.push( { 'key': params['key'], 'pagestart': params['start'], 'pagecount': params['count'], 'project': data[i].id } );
        }
        res.send(200, {}, data);
    };
    
    this.postProject = function(req, res, params) {
        var sess;
        if( !(sess=this.app.requireAuth(res,params)) ) return;
        var obj = this.data.postProject(params);
        res.send(200, {}, obj);
    };
    
    this.postHours = function(req, res, params) {
        var sess;
        if( !(sess=this.app.requireAuth(res,params)) ) return;
        var obj = this.data.postHours(params);
        res.send(200, {}, {'status': 'ok', 'data': obj} );
    };
    
    this.delHours = function(req, res, params) {
        var sess;
        if( !(sess=this.app.requireAuth(res,params)) ) return;
        var id = params['id'];
        var objs = this.base.projects.search('id', id);
        if( objs.length != 1 ) {
            res.send(200, {}, {"status":"error", "msg":"failure"} );
            return;
        }
        var prj = objs[0];
        var hxd = this.base.Table( "Hours", prj.name + "/hours" );
        this.base.hours.remove([id]);
        res.send(200, {}, {"status": "ok", 'data': prj.id} );
    };
    
    this.postFeats = function(req, res, params) {
        var sess;
        if( !(sess=this.app.requireAuth(res,params)) ) return;
        var obj = this.data.postFeats(params);
        res.send(200, {}, {"status":"ok", 'data': obj} );
    };
    
    this.delFeats = function(req, res, params) {
        var sess;
        if( !(sess=this.app.requireAuth(res,params)) ) return;
        var id = params['id'];
        var objs = this.base.search('id', id);
        if( objs.length != 1 ) {
            res.send(200, {}, {"status":"error", "msg":"failure"});
            return;
        }
        this.base.remove([id]);
        res.send(200, {}, {"status": "ok", 'data': id});
    };
    
};
