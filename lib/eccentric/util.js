var fibers = require('fibers');
var wait = require('wait.for');
var Sock = require('./websock.js');

function Util(app) {
    this.app = app;
    this.sock = null;
    this.FibreRing = function( cb, obj ) {
        if( typeof obj != 'undefined' )
            cb = cb.bind(obj);
        return function() { wait.launchFiber( cb ) };
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
}

module.exports = Util;
