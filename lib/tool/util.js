var fibers = require('fibers');
var wait = require('wait.for');
//var Sock = require('./websock.js');

function UtilsObject(app) {
    this.app = app;
    this.params = {};
    
    // create a new session
    this.typeOf = function( value ) {
        var s = typeof value;
        if (s === 'object') {
            if (value) {
                if (value instanceof Date) {
                    s = 'date';
                } else if (value instanceof Array) {
                    s = 'array';
                }

            } else {
                s = 'null';
            }
        }
        return s;
    };
    
    this.indexOf= function(array, idx) {
        var i, len = array.length;
        
        for( i=0; i<len; ++i ) {
            if( array[i] == idx )
                return i;
        }
        return false;
    };
    
    this.locationOf= function(array, idx, startptr) {
        var i, len = array.length;
        
        for( i=startptr; i<len; ++i ) {
            if( array[i] == idx )
                return i;
        }
        return false;
    };
    
    this.rangeOf= function(start, count) {
        var fin = start+count;
        var inc = fin > 0 ? 1 : -1;
        var srch=[];
        while( start != fin ) {
            srch.push(start);
            start += inc;
        }
        return srch;
    };

    this.cloneValues= function(obj, values) {
        for( var i in values ) {
            obj[i] = this.cloneObject( values[i] );
        }
    };
    
    this.isAlpha= function(value) {
    	var upperBoundUpper = "A".charCodeAt(0);
    	var lowerBoundUpper = "Z".charCodeAt(0);
    	var upperBoundLower = "a".charCodeAt(0);
    	var lowerBoundLower = "z".charCodeAt(0);

    	for (var i = 0; i < value.length; i++) {
    		var char = value.charCodeAt(i);
    		if( (char >= upperBoundUpper && char <= lowerBoundUpper) ||
    			(char >= upperBoundLower && char <= lowerBoundLower) )
    			continue;
    		return false;
		}
    	return true;
    };
    this.isDigit= function(value) {
    	var upperBound = "9".charCodeAt(0);
    	var lowerBound = "0".charCodeAt(0);

    	for (var i = 0; i < value.length; i++) {
    		var char = value.charCodeAt(i);
    		if( char <= upperBound && char >= lowerBound )
    			continue;
			return false;
		}
    	return true;
    };
    
    this.cloneObject= function(obj) {
        var clone;
        var typ = this.typeOf(obj);
        switch(typ){
            case 'date':
                clone = new Date();
                clone.setTime(obj.getTime());
                break;
            case 'object':
                clone={};
                for( var i in obj )
                {
                    clone[i] = this.cloneObject(obj[i]);
                }
                break;
            case 'array':
                clone = obj.slice(0);
                break;
            case 'function':
                clone = null;
                break;
            default:
                intermed = JSON.stringify(obj);
                clone = JSON.parse(intermed);
                break;
        }
        return clone;
    };
    this.FibreRing = function( cb, obj ) {
        if( typeof obj != 'undefined' )
            cb = cb.bind(obj);
        return function() { wait.launchFiber( cb ) };
    };
    
    /* randomInt: produce a number between a and b. */
    this.randomInt = function(a,b)
    {
        return Math.floor( Math.random()*(b-a) + a );
    };
    this.randomNumber = this.randomInt;
    
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
    this.randomAlpha = this.randomStr;
    this.randomString = this.randomStr;
    

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

    var server = null;
    
    this.connectMailer = function( ) {
        this.server = email.server.connect( {
            user: this.app.gmail_user,
            password: this.app.gmail_password,
            host: this.app.gmail_host,
            tls: {ciphers: "SSLv3"}
        } );
    };
    this.sendMessage = function( to, ccs, subj, msg, cb ) {
        if( this.server == null ) {
            connectMailer();
        }
        this.server.send( {
            text: msg,
            from: this.app.gmail_fullname + '<' + this.app.gmail_user + '>',
            to: to,
            cc: ccs,
            subject: subj }, function( err, message ) {
                console.log(err||message);
                cb(err,message);
            });
    };
    
    /*
    this.find = function() {
        this.cb.apply( null, arguments );
    };
    
    this.fin = function( runner, thisArg, args ) {
        
        var oldcb = args[ args.length-1 ];
        var carryobj = { 'cb': oldcb };
        args[ args.length-1 ] = this.find.bind( carryobj );
        
        runner.apply( thisArg, args );  
    };
    */
    
    /*
    this.ShoeSock = function( runner, thisArg, args ) {
        this.sock = new Sock( "ws://localhost:8080", "echo-protocol" );
        ock.send({'code':'c1'});
        
        var oldcb = args[ args.length-1 ];
        args[ args.length-1 ] = this.ShoeHorn;
        
        runner.apply( thisArg, args );
    };
    
    this.FibreSock = function( cb ) {
        
    }
    */
};


module.exports = UtilsObject;
