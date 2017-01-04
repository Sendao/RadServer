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
