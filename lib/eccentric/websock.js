const AsyncFunction = Object.getPrototypeOf(async function() {}).constructor;

const os = await import('os');
const pty = await import('node-pty');
const _sockets = await import('websocket');
const sockets = _sockets.default;
const {StringDecoder} = await import('string_decoder');
var decoder = new StringDecoder('utf8');

/**
 * @constructor
 * @returns
 */
export function WebSocket() {
  this.modlocaL = function() {
    this.wscli = false;
    this.wsscli = false;
    this.wssrv = false;
    this.wsssrv = false;
    this.socket = function() {
      if (this.wsssrv !== false) {
        return this.wsssrv;
      } else {
        return this.wssrv;
      }
    };

    /**
     * @memberOf WebSocket
     */
    this.work_sockets = function() {
      this.wssrv.workcycle();
      this.wsssrv.workcycle();
    };

    this.connect_socket_clients = function(wsclient, wssclient) {
      if (wssclient) {
        this.wsscli = wssclient;
      } else {
        this.wsscli = false;
      }
      this.wscli = wsclient;
    };

    this.connect_socket_servers = function(wsserver, wssserver, sockmain) {
      if (wssserver) {
        wssserver.app = this;
        this.wsssrv = wssserver;
        this.connect_secure_router(this.wsssrv.registerRouter(new sockmain.router(this)));
      } else {
        this.wsssrv = false;
      }
      wsserver.app = this;
      this.wssrv = wsserver;
      this.connect_router(this.wssrv.registerRouter(new sockmain.router(this)));
    };

    this.socket_routes = function(router) {
      var i;

      for (i in this.sing) {
        if (typeof this.sing[i].socket_routes == 'function') {
          this.ctrl[i].routes(router);
        }
      }
      for (i in this.ctrl) {
        if (typeof this.ctrl[i].socket_routes == 'function') {
          this.ctrl[i].socket_routes(router);
        }
      }
    };

  };

  this.client = function(host, proto) {
    this.client = new sockets.client();
    this.host = host;
    this.proto = proto;
    this.conn = null;
    this.queue = [];

    var cc = this;
    this.client.on('connectFailed', function(err) {
      console.log('Could not connect client->websocket ' + host + ":" + proto, err);
      //  cc.client.connect(cc.host, cc.proto);
    });

    this.client.on('connect', function(conn) {
      console.log("Client->websocket connected: " + host + ":" + proto);

      conn.on('error', function(err) {
        console.log("WSC error: ", err);
        this.close();
      });

      conn.on('close', function() {
        console.log("Client->websocket closed. Reopening...");
        cc.client.connect(cc.host, cc.proto);
      });

      conn.on('message', function(msg) {
        if (msg.type == 'utf8') {
          console.log("Client->websocket message: ", msg.utf8Data);
        }
      });

      cc.conn = conn;
      while (cc.queue.length > 0) {
        var msg = cc.queue.shift();
        cc.conn.sendUTF(msg);
      }
    });

    this.send = function(msg) {
      console.log("Client " + this.host + ": Send message: " + typeof msg);

      if (typeof msg != 'string') {
        msg['confirm'] = confirmcode;
        msg = JSON.stringify(msg);
      }

      if (this.conn == null) {
        this.queue.push(msg);
        return;
      }

      this.conn.sendUTF(msg);
    };

    console.log("Starting server side socket connection " + host + ":" + proto + ".");
    this.client.connect(host, proto);
  };

  this.router = function(myapp) {
    this.app = myapp;
    this.routes = {};
    this.code = function(codename, obj) {
      if (!(codename in this.routes)) {
        this.routes[codename] = [];
      }
      this.routes[codename].push(obj);
    };
    this.routemsg = function(conn, code, msg) {
      var i = 0,
        len = this.routes[code].length;

      for (i = 0; i < len; ++i) {
        this.routes[code][i](conn, code, msg);
      }
    }
  };

  this.server = function(server_unit, main_handler) {
    console.log("new sockets server");
    this.sock = new sockets.server({
      'httpServer': server_unit,
      'autoAcceptConnections': false,
      'keepalive': true,
      'keepaliveInterval': 60000,
      'keepaliveGracePeriod': 10000,
      'useNativeKeepalive': true,

    });
    this.protoc = 'echo-protocol';
    this.mainHandler = main_handler;
    this.myconns = [];
    this.myrouter = false;
    this.changes = {};
    this.confirmCodes = {};

    this.originAllowed = function(orig) {
      return true;
    };
    this.registerRouter = function(routerobj) {
      return this.myrouter = routerobj;
    };

    this.locateUser = function(pagekey, allow_failure=false) {
      var i;

      if( !pagekey || pagekey == 'undefined' ) {
        if( !allow_failure )
          this.app.util.throwStack("locateUser: no pagekey (" + pagekey + ")");
        return false;
      }
      //console.log("Find user " + targetCookie);
      for (i = 0; i < this.myconns.length; i++) {
        if (this.myconns[i].pagekey == pagekey) {
          //console.log("Found");
          //console.log("Found user '" + pagekey + "'");
          return this.myconns[i];
        }
      }
      if( !allow_failure ) {
        this.app.util.throwStack("locateUser: no user with pagekey '" + pagekey + "'");
        return false;
      }
      return false;
    };

    this.changeProp = function(propid, data) {
      this.changes[propid] = data;
      this.quickcycle(this.workcycle.bind(this));
    };

    this.workcycle = function() {
      var i, len = this.myconns.length,
        j;
      var chx = this.changes; // obj clone?
      this.changes = {};

      console.log("websocketserver.workcycle()");

      var rt = app.util.getSeconds();

      for (j in this.confirmCodes) {
        // resend messages

        if (this.confirmCodes[j][1] < rt - (6 * this.confirmCodes[j][0])) {
          // 6 seconds old. resend
          this.confirmCodes[j][0]++;
          this.confirmCodes[j][2].send(this.confirmCodes[j][3], j);
        }
      }

      for (j in chx) {
        //console.log(chx[j]);
        for (i = 0; i < len; ++i) {
          this.myconns[i].send({
            'code': j,
            'data': chx[j]
          });
        }
      }
    };

    this.msgConfirm = function(ccc) {
      if (ccc in this.confirmCodes) {
        delete this.confirmCodes[ccc];
      }
    };

    this.consoles = {};

    this.openConsole = function(code, conn) {
      if( code in this.consoles ) delete this.consoles[code]; // here lies the soul of AI
      var con = this.consoles[code] = {};
      con.connkey = conn.pagekey;
      if( conn.user.securitylevel > 10 ) {
        console.log("Spawning console");
        con.write = function(c, code, msg) {
          console.log("Console data", msg);
          c.send({
            'code': 'co',
            'z': code,
            's': msg.toString()
          });
        }.bind(con,conn,code);
      } else {
        console.log("Tried to start console but had no privileges", conn.user);
        con.write = function(){};
      }
    };


    this.awaitFromString = async function(handler) {
      return new Promise((resolve, reject) => {
          new AsyncFunction(
              "resolve",
              "reject",
              `try { await ${handler}; resolve(); } catch (e) { reject(e); }`
          )(resolve, reject);
      });
    };

    this.sendToConsole = async function(code, msg, conn) {
      if( !(code in this.consoles) ) {
        console.log("sendtoShell: no shell " + code);
        return;
      }
      if( this.consoles[code].connkey != conn.pagekey ) {
        console.log("sendtoShell: wrong connection");
        return;
      }
      var result;
      try {
        result = await this.awaitFromString(msg);
      } catch( e ) {
        result = "error: " + e;
      }
      this.consoles[code].write(msg + "\n= " + result);
    };


    this.shells = {};
    this.openShell = function(code, conn) {
      if( code in this.shells ) delete this.shells[code];
      var shell = this.shells[code] = {};
      shell.connkey = conn.pagekey;
      if( conn.user.securitylevel > 10 ) {
        console.log("Spawning shell");

        shell.bin = pty.spawn('bash', [], {shell: true, rows: 30, cols: 80, cwd: process.env.HOME, env: process.env});
        shell.bin.on('data', function(code, conn, data) {
          console.log("Shell data", data);
          conn.send({
            'code': 'sh',
            'z': code,
            's': data.toString()
          });
        }.bind(this, code, conn));
        shell.bin.on('error', function(err) {
          console.error('Failed to start subprocess,', err);
        }.bind(this));
        shell.bin.on('close', function(code) {
          console.log(`child process exited with code ${code}`);
        }.bind(this));
      } else {
        console.log("Tried to start shell but had no privileges", conn.user);
        shell.bin = null;
      }
    };

    this.sendtoShell = function(code, msg, conn) {
      if( !(code in this.shells) ) {
        console.log("sendtoShell: no shell " + code);
        return;
      }
      if( this.shells[code].connkey != conn.pagekey ) {
        console.log("sendtoShell: wrong connection");
        return;
      }
      this.shells[code].bin.write(msg);
    };

    this.initialize = function() {

      console.log("Initializing websock.js");
      this.myconns = [];

      var cc = this;

      this.sock.on('request', function(request) {
        console.log((new Date()) + ' socket origin ' + request.origin + '</endorigin>');
        if (!cc.originAllowed(request.origin)) {
          console.log("origin " + request.origin + " rejected", e);
          try {
            request.reject();
          } catch( e ) {
          console.log("origin " + request.origin + " rejected", e);
          }
          return;
        }

        var conn;
        try {
          conn = request.accept(cc.protoc, request.origin);
        } catch( e ) {
          console.log("origin " + request.origin + " rejected", e);
          return;
        }
        conn.pagekey = conn.pckey = '';
        conn.closed = false;
        conn.user = false;
        cc.myconns.push(conn);
        /*
        let banned = ['::ffff:138.68.239.14'];
        if( conn.remoteAddress != "::ffff:" + cc.app.config.localip ) { // home
          console.log("Socket: new connection from " + conn.remoteAddress);
        }
        if( banned.indexOf( conn.remoteAddress ) != -1 ) {
          conn.close();
          return;
        }
        */
        console.log("Socket: new connection from " + conn.remoteAddress);

        conn.send = function(str, confirmcode = null, useconfirm = true) {
          if (confirmcode == null && useconfirm ) {
            do {
              confirmcode = cc.app.util.randomString(8);
            } while (confirmcode in cc.confirmCodes);
          }
          var omsg = (typeof str == 'string') ? JSON.parse(str) : str;

          if( useconfirm ) {
            if (!('confirm' in omsg))
              omsg['confirm'] = confirmcode;
          }

          str = JSON.stringify(omsg);

          if( useconfirm ) {
            if (!(confirmcode in cc.confirmCodes))
              cc.confirmCodes[confirmcode] = [1, app.util.getSeconds(), this, str];
          }

          //console.log("Send: ", str);
          this.sendUTF(str);
        };

        conn.on('message', function(msg) {
          var sess;
          //console.log(msg);
          if (msg.type == 'utf8') {
            var data = JSON.parse(msg.utf8Data);
            if( data.c == 'sh' ) {
              /*
              let cz = data.z;
              if( cz in this.shells ) {
                this.sendToShell(cz, data.s, conn);
              } else {
                this.openShell(cz, conn);
              }
              */
            } else if( data.c == 'co' ) {
              /*
              let cz = data.z;
              if( cz in this.consoles ) {
                this.sendToConsole(cz, data.s, conn);
              } else {
                this.openConsole(cz, conn);
              }
              */
            } else if (data.code == 'reg99') {
              // register this client
              conn.pckey = data.pckey;
              conn.pagekey = data.pagekey;
              console.log("registered radiantdb socket to pckey " + data.pckey + ". New Pagekey: " + conn.pagekey);
              /*
              // try to find their session
              sess = cc.app.sing.sess.getSession( conn.pagekey, conn.pckey );
              if( sess ) {
                if( sess.userid != -1 ) {
                  conn.user = sess.user = cc.app.sing.sess.getUser( sess.userid );
                  console.log("(user session connected)");
                } else {
                  conn.user = false;
                  console.log("(guest session connected)");
                }
              }
              try {
                if( sess.user )
                  delete sess.user.password;

                conn.send({
                  'code': 'registered',
                  'pagekey': conn.pagekey,
                  'pckey': conn.pckey,
                  'sess': sess
                });
              } catch( e ) {
                console.log("socket registered response error: ", e);
              }
              */
            } else if( data.code == 'reg98' ) {
              // register this client
              conn.pckey = data.pckey;
              conn.pagekey = data.pagekey;
              console.log("registered mongodb socket to pckey " + data.pckey + ". New Pagekey: " + conn.pagekey);
              /*
              // try to find their session
              cc.app.sing.mongosess.getSession( conn.pagekey, conn.pckey, function( e, sess ) {
                if( e ) {
                  console.log(e);
                  return;
                }
                if( sess ) {
                  if( sess.userid != -1 ) {
                    cc.app.sing.mongosess.getUser( sess, function(e, user) {
                      delete user.password;

                      sess.user = user.user;
                      conn.user = user.user;
                      
                      conn.send({
                        'code': 'registered',
                        'pagekey': conn.pagekey,
                        'pckey': conn.pckey,
                        'sess': sess
                      });
                      console.log("(mongo user session connected)");
                    }.bind(this));
                  } else {
                    conn.user = false;
                    conn.send({
                      'code': 'registered',
                      'pagekey': conn.pagekey,
                      'pckey': conn.pckey,
                      'sess': sess
                    });
                    console.log("(mongo guest session connected)");
                  }
                }
              } );
                */

            } else if (typeof cc.myrouter == 'function') {
              cc.myrouter(conn, data.code, data, msg);
            } else if (typeof cc.mainHandler == 'function') {
              cc.mainHandler(conn, msg, data);
            }
          } else if (msg.type == 'binary') {}
        }.bind(this));

        conn.on('close', function() {
          console.log("Socket Connection from " + conn.remoteAddress + " closed.");
          conn.closed = true;
          var i = cc.myconns.indexOf(conn);
          if (i != -1) {
            cc.myconns.splice(i, 1);
          } else {
            console.warn("WS connection unsafely pulled.");
            conn.valid = false;
          }
        }.bind(this));
      }.bind(this));
    };
  };
};
