var fs = require('fs');

module.exports = function ModularApp()
{
    this.flowNumber = function(n)
    {
        if( n > 1024001024 ) {
            return parseInt(n/1024001024) + "G"; //..
        } else if( n > 1024000 ) {
            return parseInt(n/1024000) + "M";
        } else if( n > 1024 ) {
            return parseInt(n/1024) + "K";        
        }
        return n + "B";
    };
    
    
    this.randomInt = function(a,b)
    {
        return Math.floor( Math.random()*(b-a) + a );
    };
    
    this.ctrl = {};
    this.data = {};
    this.base = {};
    
    this.workcycle = function() {
    	var i;

    	for( i in this.data ) {
    		if( typeof this.data[i].workcycle == 'function' ) {
    			this.data[i].workcycle();
    		}
    	}
    	for( i in this.base ) {
    		if( typeof this.base[i].workcycle == 'function' ) {
    			this.base[i].workcycle();
    		}
    	}
    };

    this.routes = function( router ) {
        var i;
        
        console.log("Setting app routes.");
        for( i in this.ctrl ) {
            console.log("Module: " + i);
            this.ctrl[i].routes(router);
        }
    };
    
    this.addModule = function( modname ) {
        var A, fn;
        var b=0, c=0, d=0;

        console.log("Load module " + modname);
        
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
            b = new A();
            b.app = this;
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
        console.log("Loaded module " + modname);
        console.log("Controls: " + Object.keys(this.ctrl) );
    };
    
    this.addModule( 'clients' );
    this.addModule( 'projects' );
    this.addModule( 'could9' );
    this.addModule( 'stocks' );
};

