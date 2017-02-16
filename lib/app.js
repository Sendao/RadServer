var fs = require('fs');
var Fiber = require('fibers');
var wait = require('wait.for');
var DbCore = require('./base/core.js');
var DbBase = require('./base/base.js');
var Util = require('./tool/util.js');
var File = require('./tool/file.js');
var dbcore = new DbCore();
var apps = [];

module.exports = function ModularApp()
{
    dbcore.app = this;
	this.db = dbcore;
	this.dbase = DbBase;
	
    this.packages = [ ];
    this.util = new Util(this);
    this.file = new File();
    this.router = false;
    this.routerS = false;
    
	this.configure = function(packages) {
		for( var i=0; i<packages.length; ++i ) {
			this.packages.push( packages[i] );
			this.addModule( packages[i] );
		}
	};
	
	this.connect_secure_router = function( myrouter )
	{
	    this.routerS = myrouter;
        for( var i in this.ctrl ) {
            if( typeof this.ctrl[i].socket_routes == 'function' ) {
                this.ctrl[i].socket_routes(myrouter);
            }
        }
	};
	
	this.connect_router = function( myrouter )
	{
	    this.router = myrouter;
	    for( var i in this.ctrl ) {
	        if( typeof this.ctrl[i].socket_routes == 'function' ) {
	            this.ctrl[i].socket_routes(myrouter);
	        }
	    }
	};

	this.workCycle = function(i)
	{
		apps[i].workcycle();
		console.log("outside cycle");
	};
    
	this.connect_socket_clients = function( wsclient, wssclient )
	{
		if( wssclient ) {
			this.wsscli = wssclient;
		} else {
		    this.wsscli = false;
		}
		this.wscli = wsclient;
	};
	
	this.connect_socket_servers = function( wsserver, wssserver, sockmain )
	{
		if( wssserver ) {
			this.wsssrv = wssserver;
			this.connect_secure_router( this.wsssrv.registerRouter( new sockmain.router(this) ) );
		} else {
		    this.wsssrv = false;
		}
		this.wssrv = wsserver;
        this.connect_router( this.wssrv.registerRouter( new sockmain.router(this) ) );
	};
	
	this.socket = function() {
	    if( this.wsssrv !== false ) {
	        return this.wsssrv;
	    } else {
	        return this.wssrv;
	    }
	};
	
	//! todo: turn these into waiting queues
	this.wscli = false;
	this.wsscli = false;
	this.wssrv = false;
	this.wsssrv = false;

    this.tool = { 'wait': wait, 'fs': fs, 'Fiber': Fiber };
    this.models = {};
    this.tools = {};
    this.sing = {};
    this.requireAdmin = function(r, p)
    {
        return this.sing.sess.requireAdmin(r,p);
    };
    this.requireUser = function(r, p)
    {
        return this.sing.sess.requireUser(r,p);
    };
    this.requireAuth2 = function(r, p, flags)
    {
        return this.sing.sess.requireAuth2(r,p,flags);
    };
    this.requireAuth = function(r, p)
    {
        return this.sing.sess.requireAuth(r,p);
    };
    this.authSession = function(p)
    {
        return this.sing.sess.authSession(p);
    };
    this.getSession = function(p)
    {
        return this.sing.sess.getSession(p);
    };
    this.getUser = function(id)
    {
        return this.sing.sess.getUser(id);
    };
    this.sendTo = function(key, msg)
    {
        var user = this.locateUser(key);
        user.send(msg);
    }
    this.locateUser = function(key)
    {
        var cliconn=false;
        if( this.wsssrv )
            cliconn = this.wsssrv.locateUser( key );
        if( !cliconn )
            cliconn = this.wssrv.locateUser( key );
        return cliconn;
    };
    
    this.loadTools = function()
    {
    	var dn = './lib/singlets/';
    	var d = fs.readdirSync(dn);
    	var i = d.length;
    	while( i > 0 ) { --i;
    	    if( typeof d[i] != 'string' ) continue;
    	    if( d[i].indexOf(".js") == -1 ) continue;
    	    if( d[i].indexOf("skeleton") != -1 ) continue;
    		var x = d[i].split('.');
    		var dlname = x[0];
    		this.addSinglet( dlname );
    	}
    	
        dn = './lib/eccentric/';
        d = fs.readdirSync(dn);
        i = d.length;
        while( i > 0 ) { --i;
            var x = d[i].split('.');
            var dlname = x[0];
            this.models[ dlname ] = require( './eccentric/' + d[i]);
        }
    	
    	var i, iTool;
    	for( i in this.models ) {
            //console.log("Load tool " + i + ": " + typeof this.models[i]);
    		if( typeof this.models[i] != 'function' ) {
    		    console.log("Static exposure", this.models[i]);
    		    continue;
    		}
    		for( var j in this.models[i] ) {
    			console.log(j, this.models[i][j]);
    		}
    		iTool = i[0].toUpperCase() + i.slice(1);
   			this.tools[ iTool ] = new this.models[i](this);
    	}    	
    	
    	
		for( i=0; i<this.packages.length; ++i ) {
			this.addModule( this.packages[i] );
		}
    };
    
    apps.push(this);
    
    this.appn = apps.length-1;
    this.intRate = 100;
    this.intTimer = setInterval(workCycle, this.intRate, this.appn);
    this.intR = 6;
    this.intMin = 6; // "just a second"
    this.intMax = 60; // "just a minute"
    
    this.quietRate = function(target=0) {
    	while( target == 0 || target > this.intR ) {
    		++this.intR;
    		if( target == 0 ) target = this.intR;
    	}
    	this.upClock();
    };
    
    this.attackRate = function(target=0) {
    	while( target == 0 || target < this.intR ) {
    		--this.intR;
    		if( target == 0 ) target = this.intR;
    	}
    	this.upClock();
    };
    
    /* upClock: restart the system clock (heartbeat) somewhere within a sane range. */
    this.upClock = function() {
    	if( this.intR > this.intMax ) { this.intR = this.intMax; }
    	if( this.intR < this.intMin ) { this.intR = this.intMin; }
		this.intRate = Math.pow( this.intR, 4 );
    	if( this.intTimer != -1 )
    		clearInterval( this.intTimer );
    	this.intTimer = setInterval(workCycle, this.intRate, this.appn);
    };
    
    /* randomInt: produce a number between a and b. */
    this.randomInt = function(a,b)
    {
        return Math.floor( Math.random()*(b-a) + a );
    };
    /* randomStr: produce a len length string of letters between a and Z and 0 and 9. */
    this.randomStr = function(len)
    {
    	var w = '';
    	while( len > 0 ) { len--;
    		c = this.randomInt(0,61);
    		if( c < 10 ) {
    			w += c;
    		} else if( c < 37 ) {
    			w += String.fromCharCode( c + 87 );
    		} else {
    			w += String.fromCharCode( c + 30 );
    		}
    	}
        return w;
    };
    
    /* four letter words: hold the main pointers to cross functional boundaries. */
    this.ctrl = {};
    this.data = {};
    this.base = {};
    
    this.fullworkcycle = [];
    this.fullworkn = 0;
    this.buildcycle = true;
    
    /* workcycle: convey the system clock to the functional boundaries. */
    this.workcycle = function() {
    	var i, len, f;
    	var found=false;
    	
    	if( this.fullworkn == 5 ) {
    	    this.fullworkcycle=[];
    	    this.buildcycle=true;
    	}
    	this.fullworkn = ((this.fullworkn + 1) % 500);
    	//console.log("mainwork", this.buildcycle, this.fullworkcycle.length);
    	
    	if( this.buildcycle ) {
    	    //console.log("rebuild");
    	    this.buildcycle=false;
            for( i in this.sing ) {
                if( 'workcycle' in this.sing[i] ) {
                    //console.log("build - sing ", i);
                    this.fullworkcycle.push(this.sing[i]);
                }
                if( 'base' in this.sing[i] && this.sing[i].base !== false && 'workcycle' in this.sing[i].base ) {
                    //console.log("build - sing base ", i);
                    this.fullworkcycle.push(this.sing[i].base);
                }
            }
            for( i in this.data ) {
                if( 'workcycle' in this.data[i] ) {
                    this.fullworkcycle.push(this.data[i]);
                }
            }
            for( i in this.ctrl ) {
                if( 'workcycle' in this.ctrl[i] ) {
                    this.fullworkcycle.push(this.ctrl[i]);
                }
            }
            for( i in this.base ) {
                if( 'workcycle' in this.base[i] ) {
                    this.fullworkcycle.push(this.base[i]);
                }
            }
            for( i in this.tools ) {
                if( 'workcycle' in this.tools[i] ) {
                    this.fullworkcycle.push(this.tools[i]);
                }
            }
    	}
    	len = this.fullworkcycle.length;
	    for( i=0; i<len; ++i ) {
	        found = this.fullworkcycle[i].workcycle();
	        if( found ) break;
	    }
	    //console.log("found at ", i, len);
	    for( ++i; i<len; ++i ) {
	        this.fullworkcycle[i].workcycle();
	    }

    	if( !found ) {
    		this.quietRate();
    	} else {
    		this.attackRate(); // process events more or less quickly
    	}
    };

    this.routes = function( router ) {
        var i;
        console.log("Setting app routes.");
        for( i in this.sing ) {
            if( typeof this.sing[i].routes == 'function' ) {
                this.sing[i].routes(router);
            }
        }
        for( i in this.ctrl ) {
            if( typeof this.ctrl[i].routes == 'function' ) {
                this.ctrl[i].routes(router);
            }
        }
    };
    this.socket_routes = function( router ) {
        var i;
        console.log("Setting socket routes.");
        for( i in this.sing ) {
            if( typeof this.sing[i].socket_routes == 'function' ) {
                this.ctrl[i].routes(router);
            }
        }
        for( i in this.ctrl ) {
            if( typeof this.ctrl[i].socket_routes == 'function' ) {
                this.ctrl[i].socket_routes(router);
            }
        }
    };
    
    this.addSinglet = function( singname ) {
        var A, fn, c;
        
        fn = "/singlets/" + singname + ".js";
        if( fs.existsSync( "./lib" + fn ) ) {
            //console.log("Load ", fn);
            A = require("." + fn);
            c = new A(this);
            c.app = this;
            c.base = false;
            if( typeof c.Data == 'function' ) {
                try {
                    c.base = new c.Data();
                } catch( e ) {
                    c.base = false;
                    console.log("Error");
                    console.log(e);
                }
            }
            
            this.sing[singname] = c;
            console.log("Singlet " + singname);
            this.buildcycle = true;
        }
    };
    
    this.addModule = function( modname ) {
        var A, fn;
        var b=0, c=0, d=0;

        //console.log("Loading module " + modname);
        
        fn = "/control/" + modname + ".js";
        if( fs.existsSync( "./lib" + fn ) ) {
            A = require("." + fn);
            c = new A();
            c.app = this;
            this.ctrl[ modname ] = c;
        } else {
            console.log("No control for " + modname + ".");
        }
        fn = "/data/" + modname + ".js";
        if( fs.existsSync( "./lib" + fn ) ) {
            A = require("." + fn);
            d = new A();
            d.app = this;
            this.data[ modname ] = d;
        }
        fn = "/base/" + modname + ".js";
        if( fs.existsSync( "./lib" + fn ) ) {
            A = require("." + fn);
            b = new A(this);
            this.base[ modname ] = b;
        }
        
        if( c != 0 ) {
            c.data = d;
            c.base = b;
        }
        if( d != 0 ) {
            d.ctrl = c;
            d.base = b;
        }
        if( b != 0 ) {
            b.ctrl = c;
            b.data = d;
        }
        //console.log("Loaded module " + modname);
        //console.log("Controls: " + Object.keys(this.ctrl) );
        this.buildcycle = true;
    };
    
    this.loadTools();
};


function workCycle(i)
{
    apps[i].workcycle();
}
