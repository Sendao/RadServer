var async = require('async');
var objtool = require('../tool/object.js');

module.exports = function ProjectsControl() {
    
    this.routes = function(router) {
        router.get('/asana.json').bind( this.getAsana.bind(this) );
        router.put('/asana.js').bind( this.configure.bind(this) );
        router.get('/asana_oauth.js').bind( this.oauthConfirm.bind(this) );
    };
    
    this.oauthConfirm = function( req, res ) {
    	var a = this.tool.util.FibreRing( function() {
    		//! send oauth confirmation message
    		this.data.oauth.oauthConfirm( { } );
    	});
    };
    
    this.getAsana = function(req, res) {
        var data = this.data.getAuthDetail();
        res.send(200, {}, data);
    };
    
    this.configure = function(req, res, params) {
    	var a = this.tool.util.FibreRing( function() {
            var obj = this.data.postProject(params);
            res.send(200, {}, obj);
    	}, this );
    	a();
    	
    };
    
    this.postHours = function(req, res, params) {
        var data = this.data.getProjects();
        
        var obj = this.data.postHours(params);
        res.send(200, {}, obj);
    };
    
};
