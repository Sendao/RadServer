const fs = import('fs');

export function VFSControl() {

    this.routes = function(router) {
		router.get('/vfs/start.js').bind( this.getUser.bind(this) );
		router.get('/vfs/list.js').bind( this.getListing.bind(this) );
		router.post('/vfs/mkdir.js').bind( this.mkdir.bind(this) );
		router.post('/vfs/rm.js').bind( this.rm.bind(this) );
		router.post('/vfs/rename.js').bind( this.rename.bind(this) );
		router.post('/vfs/upload.js').bind( this.upload.bind(this) );
		router.get('/vfs/get.js').bind( this.download.bind(this) );
		router.get('/vfs/lists.js').bind( this.getLists.bind(this) );
		router.post('/vfs/bookmark.js').bind( this.bookmark.bind(this) );
		router.post('/vfs/delbookmark.js').bind( this.delBookmark.bind(this) );
		router.post('/vfs/pathmark.js').bind( this.pathmark.bind(this) );
		router.post('/vfs/delpathmark.js').bind( this.delPathmark.bind(this) );
    };

	this.readDir = async function(path) {
		let paths = await fs.readdirSync(path);
		var i;

		for( i=0; i<paths.length; i++ ) {
			var stat = await fs.statSync(path + paths[i]);
			paths[i] = { s: paths[i], d: stat.isDirectory(), m: stat.mtime.getTime() };
		}

		return paths;
	}

	this.checkPathSecurity = function(path)
	{
  	if( path[0] != "~" ) return false;
		if( path.indexOf("..") >= 0 ) return false;
		if( path.length < 255 ) return true;
		return false;
	}
	this.replacePath = function(path, user)
	{
		if( typeof path != 'string' ) return "";
		return path.replace("~", "/var/users/" + user);
	}

	this.getListing = function(req, res, params) {
		this.app.requireAuth( req, res, params, async function(auth) {
      const user = auth.user;
			var path = params['path'] || '/';

			if( user.securitylevel < 10 && !this.checkPathSecurity(path) ) {
				this.app.respond.jsonError(res, 300, 'Permission denied.');
				return;
			}
			path = this.replacePath(path, user.name);

			if( path[path.length-1] != '/' ) path = path + "/";
				
			var paths = await this.readDir(path);

			this.app.respond.jsonOk(res, { status: 'ok', path: path, files: paths });

		}.bind(this));
	};

	this.mkdir = function(req, res, params) {
		this.app.requireAuth( req, res, params, async function(auth) {
      const user = auth.user;
				var path = params['path'] || '/';

				if( user.securitylevel < 10 && !this.checkPathSecurity(path) ) {
					this.app.respond.jsonError(res, 300, 'Permission denied.');
					return;
				}
				path = this.replacePath(path, user.name);

				if( path[path.length-1] != '/' ) path = path + "/";
				
				var paths = path.split("/");
				var i;
				var curpath = "/";
				for( i=1; i<paths.length; i++ ) {
					if( paths[i] == '' ) continue;
					curpath += paths[i];
					if( !await fs.existsSync(curpath) ) {
						await fs.mkdirSync(curpath);
					}
				}

				this.app.respond.jsonOk(res, { status: 'ok' });

		}.bind(this));
	};

	this.rm = function(req, res, params) {
		this.app.requireAuth( req, res, params, async function(auth) {
      const user = auth.user;
				var path = params['path'] || '/';

				if( user.securitylevel < 10 && !this.checkPathSecurity(path) ) {
					this.app.respond.jsonError(res, 300, 'Permission denied.');
					return;
				}
				path = this.replacePath(path, user.name);

				if( path[path.length-1] != '/' ) path = path + "/";
				var stat = await fs.statSync(path);

				if( stat.isDirectory() ) {
					await fs.rmdirSync(path);
				} else {
					await fs.rmSync(path);
				}

				this.app.respond.jsonOk(res, { status: 'ok' });

		}.bind(this));
	};

	this.rename = function(req, res, params) {
		this.app.requireAuth( req, res, params, async function(auth) {
      const user = auth.user;
				var path = params['path'];

				if( user.securitylevel < 10 && !this.checkPathSecurity(path) ) {
					this.app.respond.jsonError(res, 300, 'Permission denied.');
					return;
				}
				path = this.replacePath(path, user.name);

				var newname = params['to'];

				if( newname.indexOf("..") != -1 ) {
					this.app.respond.jsonError(res, 300, 'Permission denied.');
					return;
				}

				if( !path || !newname ) {
					this.app.respond.jsonError(res, 300, 'Invalid parameters.');
					return;
				}

				await fs.renameSync(path, newname);
				this.app.respond.jsonOk(res, { status: 'ok' });

		}.bind(this));
	};

	this.isTextFile = function(buf) {
		var i;
		var Z = 'Z'.charCodeAt(0);

		for( i=0; i<buf.length; i++ ) {
			if( buf.readInt8(i) > 126 ) return false;
		}

		return true;
	}

	this.upload = function(req, res, params) {
		this.app.requireAuth( req, res, params, async function(auth) {
      const user = auth.user;

				if( !await fs.existsSync("/var/users/" + user.user.name + "/") ) {
					await fs.mkdirSync("/var/users/" + user.user.name + "/");
				}

				console.log("Upload " + req.files.uploads.length + " files.");

				for( var i=0; i<req.files.uploads.length; i+=3 ) {
					var path = req.files.uploads[i+2];
					var buffer = req.files.uploads[i+1];
					if( path.indexOf("..") >= 0 ) continue;

					console.log("file " + (i/3) + ": check isTextFile...");
					if( this.isTextFile(buffer) ) {
						//var str = buffer.toString();
						console.log("Writing file.");
						await fs.writeFileSync("/var/users/" + user.user.name + "/" + path, buffer);
						console.log("Writing to /var/users/" + user.user.name + "/" + path);
					} else {
						console.log("Writing file.");
						await fs.writeFileSync("/var/users/" + user.user.name + "/" + path, buffer);//, 0, buffer.length, null, function(err, written, buffer) {});
						console.log("Uploading /var/users/" + user.user.name + "/" + path);
					}					
				}

				this.app.respond.jsonOk(res, { status: 'ok' });

		}.bind(this));
	};

	this.download = function(req, res, params) {
		this.app.requireAuth( req, res, params, async function(auth) {
      const user = auth.user;
				var path = params['path'];

				if( user.securitylevel < 10 && !this.checkPathSecurity(path) ) {
					this.app.respond.jsonError(res, 300, 'Permission denied.');
					return;
				}
				path = this.replacePath(path, user.name);

				var exts = path.split(".");
				var ext = exts[exts.length-1];
				
				this.app.respond.header(res, "Content-Type", "text/html");
		
				//this.app.logWeb("normal output 200 ", res['headers']);
				let formats = {
					'bin': 'application/x-binary',
					'exe': { 'ansi':'application/exe' },
					'mp4': { 'ansi':'video/mp4' },
					'png': { 'ansi':'image/png' },
					'jpg': { 'ansi':'image/jpeg' },
					'jpeg': { 'ansi':'image/jpeg' },
					'gif': { 'ansi':'image/gif' },
					'ico': { 'ansi':'image/gif' },
					'pdf': { 'ansi':'application/pdf' },
					'dds': 'application/x-binary',
					'bz2': { 'ansi':'application/bzip2' },
					'tar': { 'ansi':'application/tar' },
					'zip': { 'ansi':'application/zip' },
					'swf': { 'ansi':'application/x-shockwave-flash' }
					};

				if( !await fs.existsSync(path) ) {
					this.app.respond.jsonError(res, 300, 'File not found.');
					return;
				}
					
				var stat = await fs.statSync(path);
				var text;
				if( stat.size > 100000000 ) {
					this.app.respond.jsonError(res, 300, 'File too large.');
					return;
				}
				this.app.respond.header(res, "Last-Modified", stat.mtime.toUTCString());
				this.app.respond.header(res, "Cache-Control", "max-age=31536000");
				
				if( 'if-modified-since' in req.headers ) {
					var ifModifiedSince = new Date(req.headers['if-modified-since']);
					if( ifModifiedSince.getTime() >= stat.mtime.getTime() ) {		
						res.send(304, res.headers, '' );
						return;
					}
				}

				if( ext in formats ) {
					text = fs.readFileSync(path, "binary");
					if( typeof formats[ext] != 'string' ) {
						this.app.respond.header(res, "Content-Type", formats[ext]['ansi']);
					} else {
						this.app.respond.header(res, "Content-Type", formats[ext]);
					}
					res.send( 200, res['headers'], text );
				} else {
					text = await fs.readFileSync(path, "utf-8");
					this.app.respond.jsonOk(res, { status: 'ok', path: path, contents: text });
				}

		}.bind(this));
	};

	this.bookmark = function(req, res, params) {
		this.app.requireAuth( req, res, params, function(auth) {
			var path = params['path'];
			var name = params['name'] || 'New Bookmark';

			if( user.securitylevel < 10 && !this.checkPathSecurity(path) ) {
				this.app.respond.jsonError(res, 300, 'Permission denied.');
				return;
			}
				path = this.replacePath(path, user.name);
				let obj = { name: name, path: path, createdt: new Date(), userid: user.userid };

				this.objs.Bookmarks.create( obj, function(e) {
					if( e ) {
						console.log(e);
					}
					this.app.respond.jsonOk(res, { status: 'ok' });
				}.bind(this));
			}.bind(this));
		}.bind(this));
	};

	this.getLists = function(req, res, params) {
		this.app.requireAuth( req, res, params, function(auth) {
      const user = auth.user;
      
				this.objs.Bookmarks.find({ userid: user.userid }, function(e, bookmarks) {
					if( e ) {
						console.log(e);
					}
					var i;
					for( i=0; i<bookmarks.length; i++ ) {
						bookmarks[i] = bookmarks[i].toObject();
					}

					this.objs.Pathmarks.find({ userid: user.userid }, function(e, pathmarks) {
						if( e ) {
							console.log(e);
						}
		
						for( i=0; i<pathmarks.length; i++ ) {
							pathmarks[i] = pathmarks[i].toObject();
							if( pathmarks[i].path[pathmarks[i].path.length-1] != '/' ) pathmarks[i].path += "/";
							pathmarks[i].files = this.readDir( pathmarks[i].path );
						}
						this.app.respond.jsonOk(res, { status: 'ok', bookmarks: bookmarks, pathmarks: pathmarks });
					}.bind(this));
				}.bind(this));
			}.bind(this));
		}.bind(this));
	};

	this.pathmark = function(req, res, params) {
		this.app.requireAuth( req, res, params, function(auth) {
			this.app.getUser( auth, function(e, user) {
				var path = params['path'] || '/';
				var name = params['name'] || 'New mark';

				if( user.user.securitylevel < 10 && !this.checkPathSecurity(path) ) {
					this.app.respond.jsonError(res, 300, 'Permission denied.');
					return;
				}
				path = this.replacePath(path, user.user.name);
				if( path[path.length-1] != '/' ) path = path + "/";

				if( !fs.existsSync(path) ) {
					this.app.respond.jsonError(res, 300, 'Path does not exist.');
					return;
				}

				this.objs.Pathmarks.create( { name: name, path: path, createdt: new Date(), userid: user.userid }, function(e) {
					if( e ) {
						console.log(e);
					}
					this.app.respond.jsonOk(res, { status: 'ok' });
				}.bind(this));
			}.bind(this));
		}.bind(this));
	};

	this.delPathmark = function(req, res, params) {
		this.app.requireAuth( req, res, params, function(auth) {
			this.app.getUser( auth, function(e, user) {
				var id = params['id'];

				if( !id ) {
					this.app.respond.jsonError(res, 300, 'Invalid parameters.');
					return;
				}

				this.objs.Pathmarks.find( { _id: id, userid: user.userid }, function(e, docs) {
					if( docs.length == 1 ) {
						this.objs.Pathmarks.deleteOne({ _id: id }, function(e) {
							if( e ) {
								console.log(e);
							}
							this.app.respond.jsonOk(res, { status: 'ok' });
						}.bind(this));
					} else {
						this.app.respond.jsonError(res, 300, 'Permission denied.');
					}
				}.bind(this));
			}.bind(this));
		}.bind(this));
	};

	this.delBookmark = function(req, res, params) {
		this.app.requireAuth( req, res, params, function(auth) {
			this.app.getUser( auth, function(e, user) {
				var id = params['id'];

				if( !id ) {
					this.app.respond.jsonError(res, 300, 'Invalid parameters.');
					return;
				}

				this.objs.Bookmarks.find( { _id: id, userid: user.userid }, function(e, docs) {
					if( docs.length == 1 ) {
						this.objs.Bookmarks.deleteOne({ _id: id }, function(e) {
							if( e ) {
								console.log(e);
							}
							this.app.respond.jsonOk(res, { status: 'ok' });
						}.bind(this));
					} else {
						this.app.respond.jsonError(res, 300, 'Permission denied.');
					}
				}.bind(this));
			}.bind(this));
		}.bind(this));
	};

};
