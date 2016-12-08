var sockets = require('websocket');

function WebSocket()
{
    this.client = function(host, proto) {
        this.client = new sockets.client();
        this.host = host;
        this.proto = proto;
        this.conn = null;
        this.queue = [];

        var cc = this; // warning: nonsense. how can this possibly. fine. never mind.
        this.client.on( 'connectFailed', function(err) {
            console.log('connectFailed', err);
        });
       
        this.client.on( 'connect', function(conn) {
            console.log("WSC Connected");
            
            conn.on( 'error', function(err) {
                console.log("WSC error: ", err);
                this.close();
            });
            
            conn.on( 'close', function() {
                console.log("WSC closed. Reopening...");
                cc.client.connect( cc.host, cc.proto );
            });
            
            conn.on( 'message', function(msg) {
                if( msg.type == 'utf8' ) {
                    console.log("WSC Message: ", msg.utf8Data);
                }
            });
            
            cc.conn = conn;
            while( cc.queue.length > 0 ) {
                console.log("sent wsc message");
            }
        });
        
        this.send = function( msg ) {
            if( typeof msg != 'string' ) {
                msg = JSON.stringify(msg);
            }
            
            if( this.conn == null ) {
                this.queue.push(msg);
                return;
            }
            
            this.conn.sendUTF( msg );
        };
        
        this.client.connect( host, proto );

        console.log("WSC built.");
    };
    
    this.router = function( myapp ) {
        this.app = myapp;
        this.routes = {};
        this.code = function(codename, obj) {
            if( !(codename in this.routes) ) {
                this.routes[codename] = [];
            }
            this.routes[codename].push(obj);
        };
        this.routemsg = function(conn,code,msg){
            var i=0,len=this.routes[code].length;
            
            for( i=0; i<len; ++i ) {
                this.routes[code][i]( conn, code, msg );
            }
        }
    };
    
    this.server = function( server_unit, main_handler ) {
        this.sock = new sockets.server( { 'httpServer': server_unit, 'autoAcceptConnections': false } );
        this.protoc = 'echo-protocol';
        this.mainHandler = main_handler;
        this.myconns = [];
        this.myrouter = false;
        
        this.originAllowed = function( orig ) {
            return true;
        };
        this.registerRouter = function( routerobj ) {
            return this.myrouter = routerobj;
        }
        
        this.locateUser = function( targetCookie )
        {
        	var i;
        	
        	for( i = 0; i < this.myconns.length; i++ ) {
        		if( this.myconns[i].myid == targetCookie ) {
        			return this.myconns[i];
        		}
        	}
        	return false;
        };
        
        this.initialize = function() {
            this.myconns = [];
            
            var cc = this;
            
            this.sock.on( 'request', function(request) {
                if( !cc.originAllowed( request.origin ) ) {
                    request.reject();

                    console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
                    return;
                }

                var conn = request.accept( cc.protoc, request.origin );
                cc.myconns.push(conn);
                console.log("WSS: new connection.");
                
                conn.send = function(str) {
                    if( typeof str == 'string' )
                        this.sendUTF( str );
                    else
                        this.sendUTF( JSON.stringify( str ) );
                };

                conn.on( 'message', function(msg) {
                    //console.log("Message type: " + msg.type);
                    if( msg.type == 'utf8' ) {
                        //console.log("WSS Received: ", msg.utf8Data );
                        var data = JSON.parse(msg.utf8Data);
                        if( data.code == 'reg99' ) {
                            // register this client
                        	console.log("Registered client with id " + data.cookie);
                            conn.myid = data.cookie;
                            conn.sendUTF( JSON.stringify( { 'code': 'registered', 'cookie': data.cookie } ) );
                        } else if( data.code == 'grant99' ) {
                            var i, found=false;
                            var tgtUser = cc.locateUser(data.cookie);

                            if( tgtUser ) {
                            	tgtUser.sendUTF( JSON.stringify( { 'code': 'granted' } ) );
                                console.log("Grant forwarded to active connection.");
                                found=true;
                            }
                            if( !found ) {
                                console.log("Client not configured: missing cookie: ", data.cookie);
                            }
                        } else if( typeof cc.myrouter == 'function' ) {
                            cc.myrouter( conn, data.code, data, msg );
                        } else if( typeof cc.mainHandler == 'function' ) {
                            cc.mainHandler( conn, msg, data );
                        }
                    } else if( msg.type == 'binary' ) {
                    }
                });
                
                conn.on( 'close', function() {
                    var i = cc.myconns.indexOf(conn);
                    console.log("WS Connection from " + conn.remoteAddress + " closed.");
                    if( i != -1 ) {
                        cc.myconns.splice(i,1);
                    } else {
                        console.warn("WS connection unsafely pulled.");
                        conn.valid = false;
                    }
                });
            });
        };        
    };
};

module.exports = WebSocket;
