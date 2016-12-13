var async = require('async');

module.exports = function RevisionControl() {

    this.routes = function(router) {
        router.post('/rcs/site.js').bind( this.updSite.bind(this) );
        router.post('/rcs/base.js').bind( this.updBase.bind(this) );
        router.post('/rcs/rcs.js').bind( this.controller.bind(this) );
        router.get('/rcs/list.js').bind( this.getListing.bind(this) );
        router.get('/rcs/sites.js').bind( this.getSites.bind(this) );
        router.get('/rcs/site.js').bind( this.getSite.bind(this) );
    };
    
    this.controller = function(req, res, params) {
        var sess;
        if( !(sess=this.app.requireAuth(res,params)) ) return;
    	// Run tool methods
    	//switch( params['action'] ) {
    	//}
		res.send(200, {}, {'status': 'none'});
    };
    
    this.getSites = function(req, res, params) {
        var sess;
        if( !(sess=this.app.requireAuth(res,params)) ) return;
        var sites = this.base.sites.page(params['start'], params['count']);
        res.send(200, {}, {'status': 'ok', 'data': sites} );
    };

    this.getSite = function(req, res, params) {
        var sess;
        if( !(sess=this.app.requireAuth(res,params)) ) return;
        var sites = this.base.Sites.search( 'name', params['name'] );
        if( !sites ) {
            res.send(200, {}, {'status': 'error'});
            return;
        }
    	res.send(200, {}, {'status': 'ok', 'data': sites[0]} );
    };
    
    this.getListing = function(req, res, params) {
        var sess;
        if( !(sess=this.app.requireAuth(res,params)) ) return;
        var predet = this.base.search( 'id', params['site'] );
        var site = predet[0];
        var xd = this.base.data( 'base/' + site['name'] );
    	var listing = xd.page( params['start'], params['count'] );
    	if( !listing )
    	    res.send(200, {}, {'status':'error'});
    	else
    	    res.send(200, {}, {'status':'ok','data':listing});
    };
    
    this.updSite = function(req, res, params) {
        var sess;
        if( !(sess=this.app.requireAuth(res,params)) ) return;
        var predet = this.base.find( 'id', params['id'] );
        var site = predet[0];
    	var det = this.base.edit( site, params );
    	if( det.status != 'ok' ) {
    		res.send(200, {}, {'status': det.status});
    		return;
    	}
    	res.send(200, {}, det);
    };
    
    this.updBase = function(req, res, params) {
        var sess;
        if( !(sess=this.app.requireAuth(res,params)) ) return;
        var predet = this.base.search( 'id', params['site'] );
        var site = predet[0];
        var xd = this.base.data( 'base/' + site['name'] );
        var record = xd.find( 'id', params['id'] );
    	var det = xd.edit( record, params );
    	if( det.status != 'ok' ) {
    		res.send(200, {}, {'status': det.status});
    		return;
    	}
    	res.send(200, {}, det);
    };
};
