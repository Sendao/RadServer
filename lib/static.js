var fs = require('fs');
var async = require('async');

var staticApp = {
    		
    validDirs: [ 'js', 'js/src', 'src', 'bin', 'css', 'style', 'view', 'views', 'img', 'images', 'tpl' ],
    formats: {
        'js': 'text/javascript',
        'html': 'text/html',
        'tpl': 'text/html',
        'txt': 'text/txt',
        'json': 'text/javascript',
        'css': 'text/css',
        'png': { 'ansi':'image/png' },
        'jpg': { 'ansi':'image/jpeg' },
        'gif': { 'ansi':'image/gif' },
        'ico': { 'ansi':'image/gif' },
        'txt': 'text/plain',
        'bz2': { 'ansi':'application/bzip2' },
        'tar': { 'ansi':'application/tar' },
        'zip': { 'ansi':'application/zip' },
        'swf': { 'ansi':'application/x-shockwave-flash' }
    },
    
    normalOutput: function( req, res, data )
    {
        if( Array.isArray(data) ) {
            if( data[0].indexOf("text") != -1 ) {
                    res.send( 200, { 'Content-Type': data[0] }, data[1] );
            } else {
                    res.send( 200, { 'Content-Type': data[0] }, data[1] );
            }
        } else {
            res.send( 200, { 'Content-Type': 'text/html' }, data );
        }
    },
    
    staticHandler: function( req, res, filename, cb ) {
        if( !cb || typeof cb != 'function' ) cb = this.normalOutput;
        if( filename.indexOf('/') != -1 ) {
            res.send(404, { 'Content-Type': 'text/html' }, '<html><body>/ Forbidden.</body></html>' );
            return;
        }
        //fs.readFile( './static/' + filename, function(err, data) {
    	var this2 = this;
        this.staticReadFile( filename, function(err, data) {
            if( err ) {
            	console.log(err);
                console.log("Error while reading file " + filename);
                if( typeof err != 'string' ) err = 'unknown';
                res.send(404, { 'Content-Type': 'text/html' }, '<html><body>File not found.</body></html><!--' + err + '-->' );
                return;
            }
            var i;
            for( i in this2.formats ) {
                if( filename.indexOf(i) != -1 ) {
                    if( this2.formats[i] == 0 ) {
                        cb(req,res,data);
                    } else if( typeof this2.formats[i] == 'string' ) {
                        cb(req,res, [this2.formats[i], data] );
                    } else {
                    	cb(req,res, [this2.formats[i].ansi, data] );
                    }
                    return;
                }
            }
            console.log("Unknown extension in " + filename);
            cb(req, res, ['', data]);
        });
    },
    
    directoryHandler: function( req, res, dirname, filename, cb ) {
    
        if( !cb || typeof cb != 'function' ) cb = this.normalOutput;
        if( ( this.validDirs.indexOf(dirname) == -1 ) || filename.indexOf('/') != -1 ) {
            res.send(404, { 'Content-Type': 'text/html' }, '<html><body>Forbidden directory.' + this.validDirs.join(" ") + '</body></html>' );
            return;
        }
        /*
        var this2 = this;
        fs.readFile( './static/' + dirname + '/' + filename, 'utf-8', function(err, data) {
            if( err ) {
            	console.log(err);
                console.log("Error while reading directory file " + dirname + "/" + filename);
                res.send(404, { 'Content-Type': 'text/html' }, '<html><body>File not found.</body></html>' );
                return;
            }
            var i;
            for( i in this2.formats ) {
                if( filename.indexOf(i) != -1 ) {
                    if( this2.formats[i] == 0 ) {
                        cb(req,res,data);
                    } else if( typeof this2.formats[i] == 'string' ) {
                        cb(req,res, [this2.formats[i], data] );
                    } else {
                    	cb(req,res, [this2.formats[i].ansi, data] );
                    }
                    return;
                }
            }
            console.log("Unknown extension for " + filename);
            cb(req, res, ['', data]);
            return;  
        });
        */
        
    	var this2 = this;
        this.staticReadFile2( './static/' + dirname + '/' + filename, function(err, data) {
            if( err ) {
                console.log("Error while reading file " + filename);
                if( typeof err != 'string' ) err = 'unknown';
                res.send(404, { 'Content-Type': 'text/html' }, '<html><body>File not found.</body></html><!--' + err + '-->' );
                return;
            }
            var i;
            for( i in this2.formats ) {
                if( filename.indexOf(i) != -1 ) {
                    if( this2.formats[i] == 0 ) {
                        cb(req,res,data);
                    } else if( typeof this2.formats[i] == 'string' ) {
                        cb(req,res, [this2.formats[i], data] );
                    } else {
                    	cb(req,res, [this2.formats[i].ansi, data] );
                    }
                    return;
                }
            }
            console.log("Unknown extension in " + filename);
            cb(req, res, ['', data]);
        });
    },
    
    staticReadBinary: function( filename, cb ) {
    	return this.staticReadBinary2('./static' + filename, cb);
    },
    
    staticReadBinary2: function( filename, cb ) {
        var whoami = this;
        console.log("Binary read " + filename);
        fs.readFile( filename, 'binary', function(err, data) {
            if( err ) {
                console.log("Error while reading binary file " + filename);
                cb('404.');
                return;
            }
            if( typeof data == 'object' ) {
                data = data.toString("binary");
            }
    
            cb(null, data);
        });
    },
    
    staticReadFile: function( filename, cb ) {
    	return this.staticReadFile2( './static/' + filename, cb );
    },
    
    staticReadFile2: function( filename, cb ) {
        var whoami = this;
        var fne = filename.split('.');
        var ext = fne[fne.length-1];
        if( ext in this.formats && typeof this.formats[ext] != 'string' ) {
            return this.staticReadBinary2(filename,cb);
        }
        //console.log("Text read " + filename, ext, this.formats[ext]);
        fs.readFile( filename, 'utf-8', function(err, data) {
            if( err ) {
                console.log("Error while reading static file " + filename, err);
                cb('404 (' + filename + ').');
                return;
            }
            var n, m, o;
            var includefilename;
            var subfile;
            var found = false;
    
            async.whilst(
                function() { return data.indexOf('#include') != -1; },
                function (cb2) {
                    n=data.indexOf('#include');
                    m = n + 9;
                    o = data.indexOf("\n", m);
                    if( o < 0 ) o = 0;
                    includefilename = data.substring( m, o ).trim();
                    whoami.staticReadFile( includefilename, function( err, data2 ) {
                        if( err ) {
                            if( typeof err != 'string' ) err = 'unknown';
                            data2 = err;
                        }
                        data = data.slice(0, n) + data2 + data.slice(o);
                        cb2(null,true);
                    } );
                },
                function (err, results) {
                    cb(err, data);
                    return;
                }
            );
        });
    },
    
    indexHandler: function( req, res ) {
        this.staticHandler(req,res,"index.html", function(req,res,data) {
            var body;
            if( Array.isArray(data) ) {
                body = data[1];
            } else {
                body = data;
            }
            
            //body += "\n<script language=javascript>\n";
            //! add any needed authentication tokens here
            //body += "//script complete;\n";
            //body += "</script>\n";
            
            res.send(200, { 'Content-Type': 'text/html' }, body );
        });
    },
    
    routes: function( router ) {
        router.root.bind( this.indexHandler.bind(this) );
        for( var i in this.validDirs ) {
        	//console.log("Route for " + this.validDirs[i]);
        	router.get( new RegExp('(' + this.validDirs[i] + ')/([^/]+)$') ).bind( this.directoryHandler.bind(this) );
        }
        router.get(/cgi.+$/).bind( this.indexHandler.bind(this) );
        router.get(/([^/]+)$/).bind( this.staticHandler.bind(this) );
    },
    
    run: function(exports) {
        for( i in this ) {
            if( typeof this[i] == 'function' ) exports[i] = this[i].bind(this);
            else exports[i] = this[i];
        }
    }
    
};

staticApp.run(module.exports);
