var fs = await import('fs');
var async =  await import('async');
const URL =  await import('node:url');

export var staticApp = {
    validDirs: [ 'three', 'epsilon', 'aoc24', 'x', 'src', 'js', 'we', 'cells',
    'js/src', 'js/d3', 'js/cog', 'js/plex', 'js/stocks',
    'js/three', 'js/three/build', 'js/three/examples/jsm', 'js/three/examples/jsm/controls', 'js/three/examples/jsm/loaders', 'js/three/examples/jsm/geometries',
    '.well-known/acme-challenge', 'acme-challenge', '.well-known', 'bin', 'css', 'style', 'view', 'view/game', 'views', 'img', 'images', 'tpl', 'newkeys' ],
    formats: {
        'jpg': { 'ansi':'image/jpeg' },
        'gif': { 'ansi':'image/gif' },
        'png': { 'ansi':'image/png' },
        'js': 'text/javascript',
        'html': 'text/html',
        'tpl': 'text/html',
        'css': 'text/css',
        'bin': 'application/x-binary',
        'exe': { 'ansi':'application/exe' },
        'json': { 'ansi':'application/json' },
        'mp4': { 'ansi':'video/mp4' },
        'bmp': { 'ansi':'image/png' },
        'jpeg': { 'ansi':'image/jpeg' },
        'ico': { 'ansi':'image/gif' },
        'pdf': { 'ansi':'application/pdf' },
        'txt': 'text/plain',
        'dds': 'application/x-binary',
        'bz2': { 'ansi':'application/bzip2' },
        'tar': { 'ansi':'application/tar' },
        'zip': { 'ansi':'application/zip' },
        'mp3': { 'ansi':'music/mp3' },
        'wav': { 'ansi':'music/wav' },
        'swf': { 'ansi':'application/x-shockwave-flash' }
    },

    normalOutput: function( req, res, data )
    {
      var body;

      if( Array.isArray(data) ) {
        this.app.respond.header(res, "Content-Type", data[0]);
        body = data[1];
      } else {
        this.app.respond.header(res, "Content-Type", "text/html");
        body = data;
      }
      //body = "Proxy intercepted. Contact: sendao@gmail.com 971 337 8816 Milwaukie, OR 97222"
      res.send( 200, res['headers'], body );
    },

    staticHandler: async function( req, res, filename, cb ) {
	console.log("sh: " + filename);
	filename = decodeURIComponent(filename);
	console.log("de: " + filename);
	if( typeof cb != 'function' ) cb = this.normalOutput.bind(this);

	if( filename.indexOf('/') != -1 ) {
	    console.log("invalid url '" + filename + "'");
      if( this.app.config['portssl'] == 443 ) {
  	    res.send(301, { 'Location': 'https://spiritshare.org/' });
      } else {
        let sslp = this.app.config['portssl'];
        res.send(301, { 'Location': 'https://spiritshare.org:' + sslp + '/' });
      }
	    return;
	}

    var whoisit = 'remoteAddress' in req.connection ? req.connection.remoteAddress : "unknown";
    //this.app.logWeb("Read " + filename);
    let ctx = {req,res,self:this};
    if( !await fs.existsSync('./static/' + filename) ) {
	ctx.self.app.log('404', filename + "..." + whoisit);
	ctx.res.send(404, {}, {});
    	return;
    }
    let stats = await fs.statSync('./static/' + filename);
    var modtime = new Date( stats['mtime'] );
    const mt = modtime.getTime();
    const etag = stats.size + '' + mt;

    ctx.self.app.respond.header(ctx.res, "Cache-Control", 'no-cache, must-revalidate');
    ctx.self.app.respond.header(ctx.res, "Last-Modified", modtime.toUTCString());
    ctx.self.app.respond.header(ctx.res, "ETag", etag);
    ctx.self.app.respond.header(ctx.res, "Referer-Policy", "origin");
   
    if (ctx.req.headers['if-none-match'] === etag) 
    {
        ctx.self.app.log('304', filename + "... " + whoisit);
        ctx.res.send(304, {}, {});
        ctx.self.app.logWeb("- cached on clientside (etag " + ctx.req.headers['if-none-match'] + ")");
        return;
    }
    if( 'if-modified-since' in ctx.req.headers )
    {
        var modsince = new Date(ctx.req.headers['if-modified-since']).getTime();
        if( !isNaN(modsince) && modsince != modtime.getTime() ) {
          ctx.self.app.log('304', filename + "... " + whoisit);
          ctx.res.send(304, {}, {});
          ctx.self.app.logWeb("- cached on clientside (mtime)");
          return;
        }
    }

    function finish_output(ctx, err, data, newmtime)
    {
	  //console.log("cb2()", ctx, err, data, newmtime);
          if( err ) {
            if( err.code == 'ENOENT' ) {
              ctx.self.app.log('404', filename + "... " + whoisit);
              ctx.res.send(404, { 'Content-Type': 'text/html' }, '<html><body>File not found.</body></html>' );
            } else if( err.code == 'ECACHED' ) {
              var ipaddr = ctx.req.connection.remoteAddress.split(":")[3];
              //ctx.self.app.logWeb(ipaddr + " : " + req.headers['user-agent']);
              ctx.self.app.consoleReverseIP(ipaddr);
              if( filename.indexOf('.html') != -1 ) {
                var pagekey = ctx.self.app.util.randomStr(14);
                ctx.self.app.logWeb("Pagekey cookie: " + pagekey);
                ctx.self.app.respond.cookie( ctx.res, 'pagekey', pagekey );
              }
              ctx.res.send(304, ctx.res.headers, '' );
            } else {
              ctx.self.app.log('error', err);
              ctx.self.app.log('error', "Error while reading file " + filename);
              if( typeof err != 'string' ) err = 'unknown';
              ctx.res.send(404, { 'Content-Type': 'text/html' }, '<html><body>File not found.</body></html><!--' + err + '-->' );
            }
            return;
          }
          if( newmtime ) {
            ctx.self.app.respond.header(ctx.res, "Last-Modified", new Date(newmtime).toDateString());
          }
          if( filename.indexOf('.html') != -1 ) {
            if( !('pckey' in ctx.req.cookies) ) {
              let pckey = ctx.self.app.util.randomStr(14);
              ctx.self.app.respond.cookie( ctx.res, 'pckey', pckey );
              ctx.self.app.logWeb("Pckey cookie: " + pckey);
            } else {
              ctx.self.app.respond.cookie( ctx.res, 'pckey', ctx.req.cookies.pckey );
            }

            var pagekey = ctx.self.app.util.randomStr(14);
            ctx.self.app.logWeb("Pagekey cookie: " + pagekey);
            ctx.self.app.respond.cookie( ctx.res, 'pagekey', pagekey );
          } else {
            ctx.self.app.logWeb(filename);
          }

          var i, ext;
          i = filename.lastIndexOf(".");
          ext = filename.substr(i+1);
          if( ext in ctx.self.formats ) {
            if( ctx.self.formats[ext] === 0 ) {
              cb(ctx.req,ctx.res,data);
            } else if( typeof ctx.self.formats[ext] == 'string' ) {
              cb(ctx.req,ctx.res, [ctx.self.formats[ext], data] );
            } else {
            	cb(ctx.req,ctx.res, [ctx.self.formats[ext].ansi, data] );
            }
          } else {
            if( i != -1 ) {
              ctx.self.app.logWeb("Unknown extension " + ext + " in " + filename);
            }
            cb(ctx.req, ctx.res, ['text/plain', data]);
          }
      } // /finish_output

      var [err,data] = await this.staticReadFile2( './static/' + filename, ctx);
      finish_output(ctx,err,data);
    },

    directoryHandler: async function( req, res, dirname_in, filename_in, cb ) {

	    console.log("dh", dirname_in, filename_in);
	
      const myURL = URL.parse('https://example.org/?dir=' + dirname_in + '&file=' + filename_in, true);
      let dirname = myURL.query['dir'], filename = myURL.query['file'];

      let notok = false;
      if( filename.indexOf("..") != -1 ) notok=true;
      if( '/.well-known/acme-challenge/'.indexOf(dirname) == -1 ) {
        if( !notok && dirname.indexOf(".")!=-1 ) notok=true;
      }

      if( !cb || typeof cb != 'function' ) cb = this.normalOutput.bind(this);
      
      if( notok || ( this.validDirs.indexOf(dirname) == -1 ) || filename.indexOf('/') != -1 ) {
      	this.app.logWeb("Forbidden request. dir=" + dirname + ", file=" + filename + ", notok=" + notok);
        res.send(404, { 'Content-Type': 'text/html' }, '<html><body><pre>\nForbidden directory: ' + dirname + ' ... valid dirs = {\n' + this.validDirs.join("\n ") + '\n}\n</pre></body></html>' );
        return;
      }

      const whoisit = 'remoteAddress' in req.connection ? req.connection.remoteAddress : "unknown";

      const ctx = {req,res};
	    var fstat, modtime, mt, etag, err, data;

	    if( !await fs.existsSync('./static/' + dirname + '/' + filename) ) {
		    err = {code:'404'};
		    fstat = {};
		    mt = -1;
		    etag = '';
		    modtime = null;
	    } else {
		err = null;
		fstat = await fs.statSync( './static/' + dirname + '/' + filename );
		modtime = new Date( fstat['mtime'] );
		etag = fstat.size + modtime.getTime();

	        this.app.respond.header(res, "Cache-Control", 'no-cache, must-revalidate');
        	this.app.respond.header(res, "Last-Modified", modtime.toUTCString());
        	this.app.respond.header(res, "ETag", etag);
        	this.app.respond.header(res, "Referer-Policy", "origin");
	    }
          

      if (req.headers['if-none-match'] === etag) {
        //this.app.logWeb("- cached on clientside (etag)");
        err = {code:'ECACHED'};
      }
      if( 'if-modified-since' in req.headers ) {
        const ms = new Date(req.headers['if-modified-since']);
	var modsince = "no";
	      if( ms instanceof Date ) {
		      modsince = ms.getTime();
	      }
        if( modtime instanceof Date && !isNaN(modsince) && modsince >= modtime.getTime() ) {
          //this.app.logWeb("- cached on clientside (mtime)");
	  err = {code:'ECACHED'};
        }
      }

      if( err === null ) {
        [err,data] = await this.staticReadFile2( './static/' + dirname + '/' + filename, ctx );
      }

      if( err ) {
        if( err.code == 'ENOENT' ) {
          //this.app.log('404', dirname + '/' + filename + "... " + whoisit);
          if( this.app.config['portssl'] == 443 ) {
            ctx.res.send(404, { 'Location': 'https://spiritshare.org/' }, whoisit );
          } else {
            ctx.res.send(404, { 'Location': 'https://spiritshare.org:' + this.app.config['portssl'] + '/' }, whoisit );
          }
        } else if( err.code == 'ECACHED' ) {
          //this.app.log("File " + dirname + '/' + filename + " was cached.");
          ctx.res.send(304, { 'Content-Type': 'text/html' }, whoisit );
        } else {
          this.app.log('error', err);
          this.app.log('error', "reading file " + dirname + '/' + filename);
          if( typeof err != 'string' ) err = 'unknown';
  	  console.log("Redirect to https");
          if( this.app.config['portssl'] == 443 ) {
            ctx.res.send(301, { 'Location': 'https://spiritshare.org/' + dirname + '/' + filename }, whoisit);
          } else {
            ctx.res.send(301, { 'Location': 'https://spiritshare.org:' + this.app.config['portssl'] + '/' + dirname + '/' + filename }, whoisit);
          }
        }
        return;
      }

      var i;
      for( i in this.formats ) {
          if( filename.indexOf(i) != -1 ) {
              if( this.formats[i] === 0 ) {
                  cb(ctx.req,ctx.res, data);
                } else if( typeof this.formats[i] == 'string' ) {
                  cb(ctx.req,ctx.res, [this.formats[i], data] );
                } else {
                  cb(ctx.req,ctx.res, [this.formats[i].ansi, data] );
                }
                return;
          }
      }

      this.app.logWeb("Unknown extension in " + dirname + "/" + filename);
      cb(ctx.req, ctx.res, ['text/plain', data]);
    },

    staticReadBinary2: async function( filename, ctx, st ) {
      var data;
      try {
        data = await fs.readFileSync( filename, 'binary' );
      } catch( err ) {
        this.app.logWeb("Error while reading binary file " + filename, err);
	return [err, null];
      }
      if( typeof data == 'object' )
        data = data.toString("binary");
      return [null, data];
    },

    createAppRoute: function( fname, args, fnlines ) {
      if( !('autoroutes' in this.app) ) this.app.autoroutes = {};
      this.app.autoroutes[fname] = { 'args': args, 'fn': fnlines.join("\n") };
    },

    scanScript: function( str, pos ) {
      var i, j;
      var depth=0;
      var buf="";

      for( i=pos; i<str.length; i++ ) {
        if( str[i] == '{' ) {
          break;
        }
        buf += str[i];
      }
      if( i>=str.length ) return null;

      for( ; i<str.length; i++ ) {
        buf += str[i];
        if( str[i] == '"' || str[i] == "'" ) {
          for( j=i+1; j<str.length; j++ ) {
            buf += str[j];
            if( str[j] == "\n" ) break;
            if( str[j] == "\\" ) j++;
            else if( str[j] == str[i] ) break;
          }
          i=j;
        } else if( str[i] == '{' ) {
          depth++;
        } else if( str[i] == '}' ) {
          depth--;
        }
        if( depth==0 ) break;
      }
      this.app.logWeb("Scanned: " + buf);
      return [ buf, i ];
    },

    reformScript: function( str ) {
      var i;

      var lines = str.split("\n");

      var paren = lines[0].indexOf('(');
      var fn = "";

      for( i=paren; i>=0; i-- ) {
        if( paren-i<2 && lines[0][i] == ' ' ) {
          paren = i;
        } else if( lines[0][i] == ' ' ) {
          break;
        } else if( i != paren ) {
          fn = lines[0][i] + fn;
        }
      }
      
      let args = [];

      for( i=paren; i<lines[0].length; i++ ) {
        if( i-paren<2 && lines[0][i] == '(' || lines[0][i] == ' ' ) {
          paren=i;
        } else if( lines[0][i] == ',' || lines[0][i] == ')' ) {
          args.push(lines[0].substring(paren+1,i).trim());
          paren=i;
          if( lines[0][paren] == ')' ) break;
        }
      }

      let fnlines = [ ];
      for( i=0; i<lines.length; i++ ) {
        if( lines[i].indexOf("'server';") == 0 ) {
          fnlines.push(lines[i].substring(9));
        } else {
          fnlines.push(lines[i]);
        }
      }
      if( fnlines[0].indexOf("async") != -1 ) {
        fnlines[0] = fnlines[0].replace("async", "");
      }
      this.createAppRoute( fn, args, fnlines );

      return [fn,args];
    },

    staticReadFile2: async function( filename, ctx ) {
      var fne = filename.split('.');
      var ext = fne[fne.length-1];
      if( !await fs.existsSync(filename) ) {
	      return [ '404', null ];
      }
      var st = await fs.statSync(filename);
      if( ext in this.formats && typeof this.formats[ext] != 'string' ) {
        this.app.logWeb("Read binary file " + filename);
        return await this.staticReadBinary2(filename,ctx,st);
      }
      //this.app.logWeb("Text read " + filename, ext, this.formats[ext]);
      var data;

      try {
	data = await fs.readFileSync( filename, 'utf-8' );
      } catch( err ) {
        this.app.logWeb("Error while reading static file " + filename, err);
	return [ '404 (' + filename + ').', '404 not found!' ];
      }
      var includefilename;
      var subfile, latest_time;
      var found = false;
      var use_extend_include="#includejs"; // #includejs [file]
      var use_extend_data="#data"; // #data [length] [db] [table] [queryval] [querytype] [queryparam] [queryval..]
      var use_extend_server="'server';"; // #server async function x ( args ) { ... }
      var useData, use_data;
      var data_length, data_db, data_table, data_query;
      var dataQueries;
      var err = null;

      latest_time = st.mtime;

      if( filename.indexOf(".html") != -1 ) {
        use_extend_include="#include";
      }

    var n;
      while( (n=data.indexOf(use_extend_include)) != -1 ) {
        const m = n + use_extend_include.length + 1;
        let o = data.indexOf("\n", m);
        if( o < 0 ) o = data.length-1;

        includefilename = data.substring( m, o ).trim();
	      console.log(m,o,includefilename);
        if( await fs.existsSync('./static/' + includefilename) == false ) {
          data = data.substring(0, n) + '404' + data.substring(o);
          return [ '404 ' + includefilename, null ];
        }
        st = await fs.statSync('./static/' + includefilename);
        if( st.mtime > latest_time ) {
          latest_time = st.mtime;
        }

	      var data2;
        [err,data2] = await this.staticReadFile2( './static/' + includefilename, ctx);
        if( err ) {
          if( typeof err != 'string' ) err = 'unknown';
	  return [ err, null ];
        }
        data = data.substring(0, n) + data2 + data.substring(o);
      };

      return [ err, data ];
    },

    indexHandler: function( req, res ) {
      this.staticHandler(req,res,"index.html", function(req,res,data) {
        this.normalOutput( req, res, data );
      }.bind(this));
    },

    routes: function( router ) {
      this.app.log('default', "Loading root routes");

      router.root.bind( this.indexHandler.bind(this) );
      for( var i in this.validDirs ) {
      	//this.app.logWeb("Route for " + this.validDirs[i]);
      	router.get( new RegExp('(' + this.validDirs[i] + ')/([^/]+)$') ).bind( this.directoryHandler.bind(this) );
      }
      router.get(/([^/]+)$/).bind( this.staticHandler.bind(this) );
    }
};
