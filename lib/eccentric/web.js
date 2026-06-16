let dns = await import('node:dns');
let fs = await import("fs");
let http = await import("http");
let https = await import("https");
var _Busboy = await import("busboy");
let Busboy = _Busboy.default;


var web;

    export function startup( app ) {
      web = new WebObject(app);
      console.log("Created web");
      return [ 'dbx' ];
    }

    export async function init(app) {
        app.log('web', 
            "http starting...");
        web.server = await http.createServer(web.mainHandler_Insecure.bind(web));
        if ('ssl' in web.app.config ) {//&& await fs.existsSync(this.app.config['ssl'])) {
            web.app.log('web', "https starting...");
            if( fs.existsSync(web.app.config['ssl']) ) {
                web.https_server = await https.createServer({ pfx: fs.readFileSync(web.app.config['ssl']) }, web.mainHandler.bind(web));
            } else {
                console.log("Missing file web.app.config.ssl " + web.app.config['ssl']);
            }
        } else {
      		console.log("Missing ssl in config");
	      	console.log(web.app.config);
	      }
        web.using_port = web.default_port;
        web.using_ssl_port = web.default_ssl_port;

        if( 'port_http' in web.app.config ) {
          console.log("Switch to port " + web.app.config.port_http);
          web.using_port = web.app.config.port_http;
        }
        if( 'port_https' in web.app.config ) {
          console.log("SSL to port " + web.app.config.port_https);
          web.using_ssl_port = web.app.config.port_https;
        }

        web.app_static = web.app.app_static;
        web.hostname = web.app.config['hostname'];

        dns.setServers([
              '8.8.8.8',
              '[2001:4860:4860::8888]',
              '8.8.8.8:1053',
              '[2001:4860:4860::8888]:1053',
            ]); 

        if( await fs.existsSync('bannedips.txt') ) {
            try {
                web.bannedIps = JSON.parse( fs.readFileSync('bannedips.txt') );
            } catch( e ) {
                console.log(e);
                web.bannedIps = {};
            }
        } else {
            web.bannedIps = {};
        }
        if( await fs.existsSync('validips.txt') ) {
            try {
                web.validRequesters = JSON.parse( fs.readFileSync('validips.txt') );
            } catch( e ) {
                console.log(e);
                web.validRequesters = {};
            }
        } else {
            web.bannedIps = {};
        }
      await web.finishStartup();
    };

export function WebObject(app) {
      this.app = app;
        this.myloads = {};
        this.loadtimes = {};
        this.opensockets = {};
        this.default_port = 80;
        this.default_ssl_port = 443;
        this.server = false;
        this.wsserver = false;
        this.https_server = false;
        this.wssserver = false;
        this.hostname = '';
        this.hostsList = {};
        this.validRequesters = {};
        
        this.mainHandler = function (req, res) {
            var body = "", whoisit = 'remoteAddress' in req.connection ? req.connection.remoteAddress : "unknown";
            if (typeof whoisit == 'undefined') {
                this.app.logWeb("Irreverent request");
                res.writeHead(504, { 'Specifier': 'None' });
                res.end();
                return;
            }
            whoisit = whoisit.split(":")[3];
            let clientname = whoisit;

            if( !(clientname in this.hostsList) ) {
                this.hostsList[clientname] = false;
                clientname = whoisit;
                dns.reverse(whoisit, function(whoisit, err, result){
                    if( typeof result == 'undefined') {
                        //this.app.log("error", "Whoisit of " + whoisit + ": " + err);
                        //this.app.log("error", "Trace of request.headers: " + JSON.stringify(req.headers) );
                        //this.app.log("error", err);
                        return;
                    }
                    this.hostsList[whoisit] = result;
                    clientname = result[0] + "(" + whoisit + ")";
                }.bind(this, whoisit));
            } else if( this.hostsList[clientname] === false ) {
                clientname = whoisit;
            } else {
                try {
                    clientname = this.hostsList[clientname][0] + "(" + whoisit + ")";
                } catch( e ) {
                    clientname = whoisit;
                }
            }

            //let banned_agents = [ 'google', 'x.com', 'bing', 'grok', 'chatgpt' ];

            //dns.lookup()
            if( !('bannedIps' in this) ) this.bannedIps={};
            else if( whoisit in this.bannedIps || clientname in this.bannedIps ) {
                if( !(whoisit in this.bannedIps) ) this.bannedIps[whoisit]=0;
                this.bannedIps[whoisit]++;

                if( this.bannedIps[whoisit]%50 == 3 ) {
                    this.app.logWeb("Banned IP " + whoisit + " is persistent.");
                }

                if( this.bannedIps[whoisit] > 1000000 ) { // um... how persistent? :)
                    this.bannedIps[whoisit] = 0;
                }
                res.writeHead(504, { 'Specifier': 'None' });
                res.end();
                return;
            }

/* still a bit buuggy:
            if( !(whoisit in this.validRequesters) ) { // await import validation first:
                if( !req.url.endsWith("/") && req.url.indexOf(".html") == -1 && req.url.indexOf(".txt") == -1 && req.url.indexOf("fav") == -1 && req.url.indexOf(".xml") == -1 ) {
                    console.log("invalid url " + req.url);
                    res.writeHead(504, { 'Specifier': 'None' });
                    res.end();
                    return;                    
                } else {
                    this.validRequesters[whoisit] = true;
                }
            }*/

            var hosts = "https:" + req.method + "//" + req.headers.host + req.url;
            //req.url = decodURI( req.url );
            let justurl = req.url.split("?")[0];

            if( req.url.indexOf(".html") != -1 ) {

            }

            if( !this.checkUrl(justurl, whoisit) ) {
                res.end();
                return;
            }

            req.res = res; // duh
            var cc = this;
            req.loaderId = this.openLoadHandler(whoisit);
            
            if( req.loaderId === false ) {
                this.app.log('traffic', 'load rejected: ' + req.url + ":" + req.method + ":" + justurl + " from " + clientname + " (" + whoisit + ")");
                res.end();
                return;
            }
            if( req.headers.host != 'spiritshare.org' ) {
                res.end();
                return;
            }
            this.app.log('traffic', 'Request #' + this.loadsum[whoisit] + "(" + whoisit + ") " + justurl + "(" + req.method + ")");
            
            if( !('params' in req) ) req.params={};

            var list = {}, rc = req.headers.cookie;
            rc && rc.split(';').forEach(function (cookie) {
              var parts = cookie.split('=');
              var p1 = parts.shift().trim();
              var px = parts.join("=");
              list[p1] = px;
              req.params[p1] = px;
            });
            res.cookies = req.cookies = list;

            if (req.method == 'POST') {
                var bb;
                if (!('Content-Type' in req.headers)) {
                    if ("content-type" in req.headers) {
                        req.headers['Content-Type'] = req.headers['content-type'];
                    }
                }
                let copyof = this.app.util.cloneObject( req.headers );
		    console.log(copyof);
                try {
                    if( Busboy === false ) {
                      bb = false;
                    } else {
                      bb = Busboy({ headers: req.headers });
                    }
                }
                catch (err) {
                    this.app.log('error', "Busboy error request headers: " + JSON.stringify(req.headers));
   		    console.log(err);
                    this.app.log('error', "Malformed request " + req.url + " from " + whoisit);
                    this.closeLoadHandler(whoisit, req.loaderId);
                    return;
                    //bb = false;
                }
                
                if (bb !== false) {
                    var myfiles = {};
                    var myfields = {};
                    var this_enctype = false;
                    this.app.log('bb', "Busboy request headers: ", req.headers );
                    bb.on('file', function (name, f, fn, enc, mimetype) {
                        this_enctype = enc;
                        this.app.log('web', whoisit + " :: Recv File [" + name + "]: " + enc + ", " + mimetype + ": " + fn);
                        var mybody = [];
                        if (name in myfiles) {
                            myfiles[name].push(false, 0, fn);
                        }
                        else {
                            myfiles[name] = [false, 0, fn];
                        }
                        f.on('data', function (d) {
                            mybody.push(d);
                        }.bind(this));
                        f.on('end', function () {
                            var c = Buffer.concat(mybody);
                            var v = c;
                            var i;
                            for (i = 0; i < myfiles[name].length; i += 3) {
                                if (myfiles[name][i + 2] == fn) {
                                    myfiles[name][i + 1] = v;
                                    myfiles[name][i + 0] = true;
                                }
                            }
                            this.app.log('web', whoisit + " :: File upload finished (" + name + ", " + fn + "): " + v.length + " bytes");
                        }.bind(this));
                    }.bind(this));
                    bb.on('field', function (name, val, fnTrunc, valTrunc, encoding, mimetype) {
                        //this.app.logWeb("BB Field: "+ name + "="+val);
                        myfields[name] = val;
                    });
                    bb.on('finish', function () {
                        req.files = myfiles;
                        req.params = myfields;
                        body = cc.buildArgString(myfields);
                        function jsdf() {
                            this.whoisit = whoisit;
                            this.hosts = hosts;
                            this.res = res;
                            this.req = req;
                            this.body = body;
                            this.cc = cc;
                        }
                        ;
                        var j = new jsdf();
                    
                        try {
                            cc.app.routerControl.handle(req, body, cc.finalHandler.bind(j));
                        }
                        catch (er) {
                            if (er != "end") {
                                this.app.log('warning', req.url + "," + whoisit + " :: We had an error", er);
                            }
                        }
                    });
                    req.pipe(bb);
                    return;
                }
            }
            req.addListener('data', function (chunk) { body += chunk; });
            req.addListener('end', function () {
                if ('content-type' in req.headers && req.headers['content-type'].indexOf("multipart") != -1) {
                    this.app.log('upload', "files.js report", req.headers, req.headers['content-type']);
                }
                //var parts = req.url.split('/');

                function jsdf() {
                    this.whoisit = whoisit;
                    this.hosts = hosts;
                    this.res = res;
                    this.req = req;
                    this.body = body;
                    this.cc = cc;
                }
                ;
                var j = new jsdf();

                let alphaCheck = this.app.util.isMostlyAlpha(body);
                if( !alphaCheck ) {
                    this.app.log('error', 'translation error' + body);
                    body = 'input rejected';
                }

                try {
                    cc.app.routerControl.handle(req, body, cc.finalHandler.bind(j));
                }
                catch (er) {
                    if (er != "end") {
                        this.app.log('error', "error", er);
                    }
                }
            }.bind(this));
        };

    this.finishStartup = async function () {
      if( this.app.config.mobile ) {
        console.log("Cannot start servers in mobile mode");
        return;
      }

        this.wsserver = new this.app.tools.WebSocket.server(this.server);
      console.log("Listening on port " + this.using_port);
        this.server.listen(this.using_port);
        this.wsserver.initialize();
        if ('ssl' in this.app.config && fs.existsSync(this.app.config['ssl'])) {
          console.log("SSL on port " + this.using_ssl_port);
            this.https_server.listen(this.using_ssl_port);
            this.wssserver = new this.app.tools.WebSocket.server(this.https_server);
            this.wssserver.initialize();
            this.app.log('debug', "Ports " + this.using_port + ", " + this.using_ssl_port);
            this.app.log('debug', "Hostname " + this.hostname);
        }
        else {
            this.wssserver = false;
            this.app.logWeb("Port " + this.using_port);
        }
        this.app.log('web', "Servers listening.");
        //this.wsclient = new this.app.tools.Websock.client("ws://" + this.hostname + ":" + this.using_port + "/", "echo-protocol");
        this.wssclient = this.wsclient = false;
        this.app.connect_socket_servers(this.wsserver, this.wssserver, this.app.tools.WebSocket);
        if( this.wssserver ) {
            this.wssclient = new this.app.tools.WebSocket.client("wss://" + this.app.config['hostname'] + ":" + this.using_ssl_port + "/", "echo-protocol");
        }
        this.app.connect_socket_clients(this.wsclient, this.wssclient);
        this.app.log('web', "web startup completed");
      return ['websock'];
    };
    ;

    
    /**
     * mainHandler_Insecure handles http:// requests.
     * @memberOf WebObject
     */
    this.mainHandler_Insecure = function (req, res) {
        let eourl = req.url.indexOf("?");
        if( eourl == -1 ) eourl = req.url.length;

        let valid_insecure_filters = [ '.txt', '.well-known', '.xml', '.css' ];
        var found=false;
        for( var a of valid_insecure_filters ) {
            let b = req.url.indexOf(a);
            if( b < eourl && b != -1 ) {
                return this.mainHandler(req,res);
            }
        }

        var whoisit = 'unknown';

        if ('remoteAddress' in req.connection) {
            if (typeof req.connection.remoteAddress == 'undefined') {
                res.writeHead(504, { 'Specifier': 'None' });
                res.end();
                return;
            }
            whoisit = req.connection.remoteAddress;
        }

        let whos = whoisit.split(":");
        if( whos.length < 4 ) {
            res.writeHead(504, { 'Specifier': 'None' });
            res.end();
            return;
        }
        whoisit = whos[3];

        let clientname = whoisit;
        if( !(whoisit in this.hostsList) ) {
            this.hostsList[whoisit] = false;
            dns.reverse(whoisit, function(whoisit, err, result){
                if( typeof result == 'undefined' ) {
                    //this.app.log("error", "Whoisit of " + whoisit + ": " + err.code);
                    //this.app.log("error", err);           
                    return;
                }
                this.hostsList[whoisit] = result;
            }.bind(this, whoisit));
        } else {
            try {
                clientname = this.hostsList[clientname][0] + "(" + whoisit + ")";
            } catch( e ) {
            }
        }
        
        if( whoisit in this.bannedIps ) {
            res.end();
            return;
        }

        if( !this.checkUrl(req.url, whoisit) ) {
            res.end();
            return;
        }


        if (!('ssl' in this.app.config) || this.app.config.ssl == false) {
            return this.mainHandler(req, res);
        }

        this.app.log('traffic', "[0] " + clientname + " http " + req.url + " [->https]");


        // redirect to https:
        res.writeHead(301, { 'Location': 'https://' + this.app.config.hostname + req.url });
        res.end();

        //! consider blocking incoming traffic requests here since ... well this is good enough for now though
        /*
        let loaderId = this.openLoadHandler(whoisit);
        if( loaderId === false ) {
            res.end();
            return;
        }
        req.addListener('data', function (chunk) {  });
        req.addListener('end', function (loaderId) {
            this.closeLoadHandler(whoisit, loaderId);
            res.writeHead(301, { 'Location': 'https://' + cc.app.config.hostname + req.url });
            res.end();
            return;
        }.bind(this,loaderId)); */
    };

    this.checkUrl = function( url, ipaddr ) {
        let passed = true;
        if( passed && url.indexOf(".env") != -1 ) passed=false;
        if( passed && url.indexOf("..") != -1 ) passed=false;
        if( passed && url.indexOf("wp-inc") != -1 ) passed=false;
        if( passed && url.indexOf("wp-admin") != -1 ) passed=false;
        if( passed && url.indexOf("wp-content") != -1 ) passed=false;
        if( passed && url.indexOf(".php") != -1 ) passed=false;
        if( passed && url.indexOf(".%2e") != -1 ) passed=false;
        if( passed && url.indexOf("%2e.") != -1 ) passed=false;
        if( passed && url.indexOf("%2e%2e") != -1 ) passed=false;
        
        if( !passed ) {
            this.bannedIps[ipaddr] = 1;
            this.app.logWeb("BAN: Ip " + ipaddr + " for requesting " + url);
            this.saveBans();
        }
        return passed;
    };    

    this.saveBans = function() {
        try {
            //fs.writeFileSync( 'bannedips.txt', JSON.stringify(this.bannedIps) ); -- they don't decay so someone might get invalidly banned.
            fs.writeFileSync( 'validips.txt', JSON.stringify(this.validRequesters.keys()) );
        } catch( e ) {
            this.app.log("error", "bannedips:");
            this.app.log("error", e);
        }
    };

    this.openLoadHandler = function (ipaddr) {
        let tmn = new Date().getTime()/1000;

        if( !('loadTrackId' in this) ) this.loadTrackId={};
        if( !('loadTracker' in this) ) this.loadTracker={};
        if( !('loadsum' in this) ) this.loadsum={};
        
        if( !(ipaddr in this.loadTracker) ) {
            this.loadTracker[ipaddr] = [];
            this.loadTrackId[ipaddr] = 0;
            this.loadsum[ipaddr] = 0;
        } else if( this.loadTracker[ipaddr].length > 1 ) { // if you are currently asking for multiple things, including multiple sockets possibly:
            if( ipaddr in this.loadsum && this.loadsum[ipaddr] > 60 ) { // if you are making me take too long:
                this.app.logWeb("Taking too long from " + ipaddr);
                return false; // no you cannot have it
            }
        } else { // if you just calm down it resets
            this.loadsum[ipaddr] = 0; // the clock
        }

        if( !(ipaddr in this.loadTrackId) ) this.loadTrackId[ipaddr]=0;
        else this.loadTrackId[ipaddr]++;

        if( this.loadTracker[ipaddr].length > 33 ) {
            this.app.logWeb("BAN: Too many open requests from " + ipaddr);
            this.bannedIps[ipaddr] = 1;
            this.saveBans();
            return false; // implies res.end()
        }
        this.loadTracker[ipaddr].push([tmn,this.loadTrackId[ipaddr]+0]);

        if( isNaN(this.maxSocketsFound) || ( this.loadTracker[ipaddr].length > this.maxSocketsFound ) ) {
            this.maxSocketsFound = this.loadTracker[ipaddr].length;
            this.app.logWeb("Excession bandwidth (max parallel requests) hits " + this.maxSocketsFound);
        }

        //?let trailing_length = tmn - this.socketopentime[ipaddr][0];
        return this.loadTrackId[ipaddr]+0;
    };
    ;
    /*

lett's find these
// how many requests are you making over time
// and how much time am I taking to give you those
// -> took 18 to load in 6000<$$$>

we want the sum between two curves:
one curve is requests start : n+0, n+2, n+5
second curve is requests end : n+1, n+8, n+15
#
# x=totalsum+(end-start+(n-n))//?
#
# 1-0=1, 1+(8-2)=7, 7+(15-5)=17
#

S: 0,    1, 2, 3, 12, 13

E: 6000, 2, 3, 4, 13, 14
0 + 2-0=2,   -->2 ... 2 // (2-2=0)
 2 + 3-1=4,  -->1 ... 3 // (4-1=3) // hey hey what's with the three second pause h
  4 + 4-2=6,  -->0 ... 3 // (6-3=3)
   6 + 13-3=16,  -->7 ... 10 // (16-10=6)
   16 + 14-12=18,  -->2 // are these numbers anything? no not quite just keep looking at the pattern here...
                    // ... 12 // (18-12=6)
                // -6?
   18 (holds at 18 unless server reboots)
    */

    this.closeLoadHandler = function (ipaddr, loaderId) {
        var tmn = new Date().getTime()/1000;

        // first determine how long this request took
        var time_taken=0, trackerN=-1;
        for( var i=0; i<this.loadTracker[ipaddr].length; i++ ) {
            if( this.loadTracker[ipaddr][i][1] == loaderId ) {
                time_taken = tmn - this.loadTracker[ipaddr][i][0];
                trackerN = i;
                break;
            }
        }
        if( trackerN == -1 ) {
            this.app.log('default', "Error: closeHandler tracker not found");
            return;
        }

        this.loadsum[ipaddr] += time_taken;        
        this.loadTracker[ipaddr].splice(trackerN,1);

        //this.requestsclosed[ipaddr]++;

/*
        let tail_tracer = this.socketopentime[ipaddr].unshift();
        if( !(ipaddr in this.tailTracer) ) this.tailTracer[ipaddr]=0;
        this.roundtriptime[ipaddr] -= this.socketopentime[ipaddr][ this.tailTracer[ipaddr] ];
        this.tailTracer[ipaddr]++;
*/
    };
    ;

    this.buildArgString = function (obj, nx) {
        var i, args = "", subargs;
        if (typeof nx == 'undefined')
            nx = "";
        for (i in obj) {
            if (typeof obj[i] != 'object') {
                if (args != "")
                    args += "&";
                if (nx != "")
                    args += encodeURIComponent(nx + "[" + i + "]");
                else
                    args += encodeURIComponent(i);
                args += "=" + encodeURIComponent(obj[i]);
            }
            else {
                if (nx != "")
                    subargs = this.buildArgString(obj[i], nx + "[" + i + "]");
                else
                    subargs = this.buildArgString(obj[i], i);
                if (args != "" && subargs != "")
                    args += "&" + subargs;
            }
        }
        return args;
    };
    
	this.autorouter = async function( req, res, params ) {
		this.app.log('debug', "autorouter.");
		var fn = params['_f'];
		this.app.log('debug', "autorouter: ", fn, params);
		this.app.log('debug', "Run script: " + fn);
		if( !('autoroutes' in this) || !(fn in this.autoroutes) ) {
		  this.app.log('debug', "Autorouter: Unknown function " + fn);

          res.writeHead(301, { 'Location': 'https://spiritshare.org/' });
		  //res.send(404, { 'Content-Type': 'text/html' }, '<html><body>File not found.</body></html>' );
		  return;
		}
        this.app.log('debug', "Found AR");
		var args = this.autoroutes[fn]['args'];
		var script = this.autoroutes[fn]['fn'];
		var parms = {};
		var i;
		
		for( i=0; i<args.length; i++ ) {
		  if( !(args[i] in params) ) {
			this.app.log('debug', "Autorouter: Missing argument " + args[i]);
            res.writeHead(301, { 'Location': 'https://spiritshare.org/' });
			res.send(404, { 'Content-Type': 'text/html' }, '<html><body>Missing parameter.</body></html>' );
			return;
		  }
		  parms[args[i]] = params[args[i]];
		}
  
		var result;
		/* eslint no-with: "off" */
		this.app.log('debug', "Run script: " + script);
		//with( parms ) {
		  result = eval( script + "\n" + fn + "(" + args.join(",") + ")" );
		//}
        this.app.log('debug', result);
		res.send(200, { 'Content-Type': 'text/html' }, JSON.stringify(result) );
	  };

      /*
    WebObject.prototype.closeResult = function(result) { // closeResult.bind({options})
        
        var common_urls = ['.*js', '.*png', '.*jpg', '.*gif', '.*ico', '.*css/.*css', '.*index.html'];
        var common_users = {};
        var ignore_urls = ['.*ico', '.*css', '.*js/.*js'];
        var whoisit = this.whoisit;
        var hosts = this.hosts;
        var req = this.req;
        var res = this.res;
        var body = this.body;
        var cc = this.cc;
        var user_errors = [406, 405];
        // 405 = method not allowed
        cc.closeLoadHandler(whoisit, req.loaderId);
        if (result.status == 404) {
            cc.app_static.report404(hosts, whoisit);
        }
        else if (user_errors.indexOf(result.status) != -1) {
            // who effin cares if you fucked up?
        }
        else if (result.status != 200) {
            cc.app_static.reportError(result.status + ":" + result.body, hosts, whoisit);
        }
        else {
            var found = false;
            / * track common users more coherently
            if( whoisit in common_users ) {
                common_users[whoisit].push(hosts);
                found=true;
            }
            * /
            for (var i = 0; i < ignore_urls.length; i++) {
                if (hosts.match(ignore_urls[i])) {
                    found = true;
                    break;
                }
            }
            if (!found) {
                for (var i = 0; i < common_urls.length; i++) {
                    if (common_urls[i] == '') {
                        if (req.url == '' || req.url == '/' || req.url == 'index.html') {
                            found = true;
                            break;
                        }
                        continue;
                    }
                    if (hosts.match(common_urls[i])) {
                        found = true;
                        break;
                    }
                }
                if (found) {
                    cc.app_static.reportCommon200(hosts, whoisit);
                }
                else {
                    cc.app_static.report200(hosts, whoisit);
                }
            }
        }
        if ('Content-Type' in result.headers && result.headers['Content-Type'].indexOf('text') == -1) {
            result.encoding = 'binary';
            result.headers['Content-Length'] = Buffer.byteLength(result.body, result.encoding);
        }
        res.writeHead(result.status, result.headers);
        //console.log("Finished request");
        if (result.encoding)
            res.end(result.body, result.encoding);
        else
            res.end(result.body);

    }

    */


    this.finalHandler = function (result) {
        //if (this.req.url != '/sconfirm.js') {
        //    this.cc.app.logWeb("finalHandler(" + result.status + "): " + this.req.url + "=" + result.encoding);
        //}
        //console.log(result);
        var common_urls = ['.*js', '.*png', '.*bmp', '.*jpg', '.*gif', '.*ico', 'css/.*css', '.*css/.*css', '.*index.html'];
        var common_users = {};
        var ignore_urls = ['.*ico', '.*css', '.*js/.*js'];
        var whoisit = this.whoisit;
        var hosts = this.hosts;
        var req = this.req;
        var res = this.res;
        var body = this.body;
        var cc = this.cc;
        var user_errors = [406, 405];
        // 405 = method not allowed
        cc.closeLoadHandler(whoisit, req.loaderId);

        if (user_errors.indexOf(result.status) != -1)
            result.status = 200; // 406/405 are user side errors so just send it anyway

        if (result.status == 404)
            cc.app.log('404', hosts, whoisit);
        else if (result.status != 200)
            cc.app.log('error', result.status + ":" + result.body, hosts, whoisit);
        else { // how should we log the request:
            let logged = false;
            for (var i = 0; i < ignore_urls.length; i++) {
                if (hosts.match(ignore_urls[i])) {
                    logged = true;
                    break;
                }
            }
            if (!logged) {
                for (var i = 0; i < common_urls.length; i++) {
                    if (common_urls[i] == '') {
                        if (req.url == '' || req.url == '/' || req.url == 'index.html') {
                            logged = true;
                            break;
                        }
                        continue;
                    }
                    if (hosts.match(common_urls[i])) {
                        logged = true;
                        break;
                    }
                }
                if (logged) {
                    cc.app.log('common', hosts, whoisit);
                }
                else {
                    cc.app.log('200', hosts, whoisit);
                }
            }
        }
        if ('Content-Type' in result.headers && result.headers['Content-Type'].indexOf('text') == -1) {
            result.encoding = 'binary';
            result.headers['Content-Length'] = Buffer.byteLength(result.body, result.encoding);
        }
        res.writeHead(result.status, result.headers);
        //console.log("Finished request");
        if (result.encoding)
            res.end(result.body, result.encoding);
        else
            res.end(result.body);
    };

    }

