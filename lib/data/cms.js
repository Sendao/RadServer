var fs = require('fs');

module.exports = function CMSData() {    

	this.getModules = function() {
		
		var auth = this.app.data.could9.getAuth();
	};
	this.getModule = function(id, name) {
        var xd = this.base.modules;
        return xd.records;
    };
	this.getLayouts = function() {
        var xd = this.base.modules;
        return xd.records;
    };
	this.getModules = function() {
        var xd = this.base.modules;
        return xd.records;
    };
	this.getModules = function() {
        var xd = this.base.modules;
        return xd.records;
    };
    
    this.postProject = function(params) {
        var xd = this.base.projects;
        xd.loadRecords();
        
        var pname = params.name;
        var prj;
        
        if( pname in xd.indice.name ) {
            prj = xd.records [ xd.indice.name[pname] ];
            xd.update( prj, params );
        } else {
            prj = xd.create( params );
            prj.id = xd.newident();
        }
        
        console.log("New project", prj);
        
        xd.save( prj );
        
        xd.saveRecords();
        
        return prj;
    };
    
    this.getHours = function( project ) {
        var xd = new this.base.Hours( project );
        xd.loadRecords();
        
        var i;
        
        for( i=0; i<xd.records.length; i++ ) {
            xd.records[i].descr = xd.records[i].dt + ": " + xd.records[i].summary;
        }
        
        return xd.records;
    };
    
    this.postHours = function(params) {
        this.base.projects.loadRecords();
        var prj = this.base.projects.find( 'name', params.project );
        if( prj === false ) {
            console.log("Project " + params.project + " not found.");
            return false;
        }
        var xd = new this.base.Hours( prj );
        xd.loadRecords();
        
        var ident = params.id;
        var hour;
        
        if( ident in xd.indice.id ) {
            hour = xd.records [ xd.indice.id[ident] ];
            xd.update( prj, params );
        } else {
            hour = xd.create( params );
            hour.id = xd.newident();
        }
        
        xd.save( hour );
        console.log("Posted hours: ", hour);
        
        xd.saveRecords();
        
        return hour;
    };
    
};
