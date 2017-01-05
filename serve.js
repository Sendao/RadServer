var http = require('http');
var https = require('https');
var fs = require('fs');
var os = require('os');
var journey = require('journey');
var router = new(journey.Router);
var hostname = "spiritshare";
var App = require('./lib/app.js');
app = new App();
var app_static = require('./lib/static.js');
var hconfig = require('./lib/config.js');
var default_port = 80, default_ssl_port = 443;
var using_port, using_ssl_port;
var hostname;
if( 'port' in hconfig )
    default_port = hconfig['port'];
if( 'sslport' in hconfig )
    default_ssl_port = hconfig['sslport'];
if( 'hostname' in hconfig ) {
    hostname = hconfig['hostname'];
} else {
    hostname = os.hostname();
    if( hostname.indexOf(".") == -1 && 'default_hostname' in hconfig ) {
    	hostname = hconfig['default_hostname'];
    }
}
app.config = hconfig;
app.configure( [ 'clients', 'projects', 'stocks', 'cms', 'chat', 'watch', 'rcs', 'ggrid', 'ed' ] );
app.routes( router );
app_static.routes( router );

app.myloads = {};
app.loadtimes = {};
app.opensockets = {};

function openLoadHandler( ipaddr ) { // tests for connections that stay open
    if( !(ipaddr in app.opensockets) ) {
        app.opensockets[ipaddr] = 1;
    } else {
        app.opensockets[ipaddr]++;
    }
    if( app.opensockets[ipaddr] > 5 ) {
        console.log("Too many open requests from " + ipaddr + ", blocking it.");
        system("iptables -I INPUT -s " + ipaddr + " -j DROP");
        app.opensockets[ipaddr] = 0;
    }
}
function closeLoadHandler( ipaddr, doLoadTest ) { // tests for open connections and many non-200 statuses
    if( ipaddr in app.opensockets ) {
        app.opensockets[ipaddr]--;
    }
    if( !doLoadTest ) return;
    var tmn = new Date().getTime()/1000;
    if( (ipaddr in app.myloads) ) {
        if( tmn - app.loadtimes[ipaddr] > 5 ) {
            app.myloads[ipaddr]=0;
        } else {
            app.myloads[ipaddr]++;
        }
    } else {
        app.myloads[ipaddr] = 1;
    }
    app.loadtimes[ipaddr] = tmn;
    if( app.myloads[ipaddr] > 8 ) {
        console.log("Too many malformed requests from " + ipaddr + ", blocking it.");
        system("iptables -I INPUT -s " + ipaddr + " -j DROP");
        app.myloads[ipaddr] = 0;
    }
}

function mainHandler( req, res ) {
    var body = "", whoisit = 'remoteAddress' in req.connection ? req.connection.remoteAddress : "unknown";
    whoisit = whoisit.split(":")[3];
    
    console.log("Request from", whoisit, "for", req.url, "at", new Date());
    openLoadHandler(whoisit);

    req.addListener('data', function (chunk) { body += chunk });
    req.addListener('end', function () {
      //console.log(req, body);
        router.handle(req, body, function (result) {
            if( result.status != 200 ) {
//                console.log("Increment load counter for " + whoisit);
                closeLoadHandler(whoisit, true);
            } else {
                closeLoadHandler(whoisit, false);
            }
            if( 'Content-Type' in result.headers && result.headers['Content-Type'].indexOf('text') == -1 ) {
                result.encoding = 'binary';
                result.headers['Content-Length'] = Buffer.byteLength( result.body, result.encoding );
            }
            res.writeHead(result.status, result.headers);
            console.log("Finished request");
            if( result.encoding )
                res.end(result.body, result.encoding);
            else
                res.end(result.body);
        });
    });
}

if( process.env.PORT ) {
	using_port = process.env.PORT;
	using_ssl_port = process.env.PORT+1;
} else {
	using_port = default_port;
	using_ssl_port = default_ssl_port;
}


var server = http.createServer( mainHandler );
var wsserver = new app.tools.Websock.server(server);
var https_server = false, wssserver = false;
if( fs.existsSync( hconfig['ssl'] ) ) {
	https_server = https.createServer( { pfx: fs.readFileSync(hconfig['ssl']) }, mainHandler );
}

if( https_server ) {
	wssserver = new app.tools.Websock.server(https_server);
	https_server.listen(using_ssl_port);
	console.log("Ports " + using_port + ", " + using_ssl_port)
} else {
	console.log("Port " + using_port);
}
server.listen(using_port);
console.log("Server listening.")

wsserver.initialize();

var wssclient = false;
if( https_server ) {
	wssserver.initialize();
	app.connect_socket_servers( wsserver, wssserver, app.tools.Websock );
	wssclient = new app.tools.Websock.client("wss://" + hostname + ":" + using_ssl_port + "/", "echo-protocol");
} else {
    app.connect_socket_servers( wsserver, false, app.tools.Websock );
}
var wsclient = new app.tools.Websock.client("ws://" + hostname + ":" + using_port + "/", "echo-protocol");
console.log("Initialization complete. Script stored.");

app.connect_socket_clients( wsclient, wssclient );


