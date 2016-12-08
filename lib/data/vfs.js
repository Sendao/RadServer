var fs = require('fs');
var async = require('async');

module.exports = function VFSData() {
    this.getFolder = function(params) {
        var xd = this.base.folds;
        var fold=false;
        if( 'fold' in params ) {
            fold=xd.search('id', params['fold']);
        } else if( 'folder' in params ) {
            fold=xd.search('name', params['folder']);
        }
        return fold;
    };
    this.getFile = function(params)
    {
        var xd = this.base.files;
        var file=false;
        if( 'file' in params ) {
            file=xd.search('id', params['file']);
        } else if( 'filename' in params ) {
            file=xd.search('name', params['filename']);
        }
        return file;
    };

    this.updFile = function(params)
    {
    	var xd = this.base.files;
    	var file;
    	file = this.getFile(params);
    	if( file === false ) {
    		file = xd.create(params);
    	} else {
    		file = xd.edit(file, params);
    	}
    	if( !file ) return false;
    	file.save();
    	return file;
    };
    this.updFolder = function(params)
    {
    	var xd = this.base.folds;
    	var file;
    	file = this.getFolder(params);
    	if( file === false ) {
    		file = xd.create(params);
    	} else {
    		file = xd.edit(file, params);
    	}
    	if( !file ) return false;
    	file.save();
    	return file;
    };
    
    this.postFolder = function(params) {
        var prj = p
        var prjL = this.base.projects.search( 'name', params.project );
        if( prjL === false ) {
            console.log("Project " + params.project + " not found.");
            console.log(this.base.projects.fileindex);
            return false;
        }
        if( prjL.length != 1 ) {
            console.log("Project list for " + params.project + " is too long:", prjL);
            return false;
        }
        var prj = prjL[0]; // this.base.projects.fetch( prjH[0] );
        if( !prj ) {
            console.log("Could not fetch project ", prjL);
            return false;
        }
        var xd = new this.base.Hours( prj );
        
        var hour = xd.create(params);
        xd.save( hour );

        console.log("Posted hours: ", hour);
        
        return hour;
    };
};
