const fs = await import('fs');
const { Utils } = await import('./tool/util.js');
const { FileObject } = await import('./tool/file.js');
const os = await import('node:os');
const readline = await import('node:readline/promises');

var apps = [];
export function workCycle(i) {
  apps[i].workcycle();
}

export function App() {
  this.Utils = Utils;
  this.packages = [];
  this.util = new Utils(this);
  this.file = new FileObject(this);
  this.router = false;
  this.routerS = false;
  this.started = false;
  this.cleaners = {
    '404': 60,
    '200': 3600,
    '200c': 1200,
    'err': 8600,
    'req': 60
  };
  Utils.prototype.fs = fs;
  this.tools = {};
  this.sing = {};

  this.runtimeCode = this.util.randomString(8);

  this.srv = {
    'http_port': 80,
    'ssl_port': 443
  };

  this.startup = function(app_static) {
    app_static.app = this;
    this.app_static = app_static;
    if( 'mobile' in this.config )
      this.isMobile = true;
    if (!('port' in this.config))
      this.config['port'] = this.srv['http_port'];
    if (!('portssl' in this.config))
      this.config['portssl'] = this.srv['ssl_port'];
    if (!('hostname' in this.config)) {
      var hostname = os.hostname();
      if (hostname.indexOf(".") == -1 && 'default_hostname' in this.config) {
        hostname = this.config['default_hostname'];
      }
      this.config['hostname'] = hostname;
    }
  };

  this.init = async function(localhost) {
    console.log("app.init()");

    for (var i in this.sing) {
      if ('onLoad' in this.sing[i]) {
        await this.sing[i].onLoad(this);
      }
    }

    console.log("onLoad completed");

    let loaded = new Set();
    let skeys = this.startup_keys;

    let keyn = 0;
    let loaded_count = 0;
    let cycle_count = 0;
    let keys = [];
    let funcs = [];
    var key;
    for( key of skeys ) {
      try {
        if( typeof this.util[key]['init'] == 'function' ) {
          keys.push(key);
          funcs.push(this.util[key]['init'].bind(this.util[key]));
        }
      } catch( bleh ) {}
    }
    for( var iTool in this.tools ) {
      try {
        if( typeof this.tools[iTool]['init'] == 'function' ) {
          keys.push([iTool]);
          funcs.push(this.tools[iTool]['init'].bind(this.tools[iTool]));
        }
      } catch( bleh ) {}
    }
    console.log("Loading ", keys);

    var isTool=false;
    while( keys.length > loaded_count ) {
      cycle_count++;
      if( cycle_count > 1000 ) {
        console.log("Aborting init.");
        console.log(this.prereq);
        console.log("Keys: " + keys.length + ", loaded: " + loaded_count);
        console.log("Loaded: ", Array.from(loaded));
        break;
      }

      key = keys[keyn];
      if( Array.isArray(key) ) { // iTool
        key = key[0];
        isTool = true;
      } else {
        isTool = false;
      }

      if( key in this.prereq ) {
        if( typeof this.prereq[key] == 'undefined' ) {
          delete this.prereq[key];
        } else {
          //console.log(key + " requires " + this.prereq[key]);
          keyn = (keyn+1)%keys.length;
          continue;
        }
      }
      if( loaded.has(key) ) {
        keyn = (keyn+1)%keys.length;
        continue;
      }

      try {
        if( typeof funcs[keyn] == 'function' ) {
          console.log("Init " + key);
          await funcs[keyn](this);
        } else {
          throw("No-init for " + key);
        }
      } catch( err ) {
        console.log("Init " + key + ", error", err);
        throw "error in init";
      }
      loaded.add(key);
      loaded_count++;

      for( var k in this.prereq ) {
        if( typeof this.prereq[k] == 'undefined' ) {
          delete this.prereq[k];
          continue;
        }
        let p = this.prereq[k].indexOf(key);
        if( p == -1 ) continue;
        if( p == 0 && this.prereq[k].length == 1 ) {
          //console.log("satisfy " + key + " for " + k + " - " + k + " ready.");
          delete this.prereq[k];
        } else {
          this.prereq[k].splice(p,1);
          //console.log("satisfy " + key + " for " + k);
        }
      }

      keyn = (keyn+1)%keys.length;
    }
    console.log("Prereqs loaded.");

    /*
    for( var iTool in this.tools ) {
      const k = this.tools[iTool];
      if( typeof k == 'string' ) continue;
      if( 'init' in k ) {
        console.log("init: " + iTool);
        await k.init(this);
      }
    }
    */

    if( localhost ) {
    console.log("Localhost:>");
      const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
      this.rl = rl;

      while( true ) {
        let val = await rl.question('> ');
        switch( val ) {
          case 'quit': case 'q':
            return;
          default:
            try {
              const code = `(async () => {
  return ` + val + `;
})()`;
              const result = await eval(code);
              if( result && typeof result.toString != 'undefined' ) {
                console.log(result.toString());
              } else {
                console.log(result);
              }
            } catch ( e ) {
              console.error( e );
            }
            continue;
        }
      }
    }
    //ask();
  };

  this.configure = async function(packages) {
    for (var i = 0; i < packages.length; ++i) {
      if( this.packages.indexOf( packages[i] ) == -1 ) {
        this.packages.push(packages[i]);
      }
    }
    for (i = 0; i < this.packages.length; ++i) {
      await this.addModule(this.packages[i]);
    }
  };

  // logging
  this.loggers = {
    'default': {
      'enabled': true,
      'target': [ 'console', '~/tmp/radlog.txt' ]
    },
    'web': {
      'enabled': true,
      'target': 'console'
    },
    'error': {
      'enabled': true,
      'target': 'console'
    },
    'warning': {
      'enabled': false,
      'target': 'console'
    },
    '404': {
      'enabled': true,
      'target': ['console','~/tmp/rad404.log']
    },
    '200': {
      'enabled': true,
      'target': ['console','~/tmp/rad200.log']
    },
    'common': {
      'enabled': true,
      'target': ['console','~/tmp/radCommon.log']
    },
    'traffic': {
      'enabled': true,
      'target': ['console','~/tmp/radtracks.log']
    },
    'debug': {
      'enabled': false,
      'target': 'console'
    },
    'database': {
      'enabled': false,
      'target': 'console'
    },
    'szn': {
      'enabled': false,
      'target': 'console'
    }
  };

  this.log = async function() {
    var i;
    let past=false,h=arguments[0];
    let arg_start=1;
    let handle = 'default';

    if( arguments.length == 1 ) {
      h = 'default';
      arg_start=0;
    }

    if (typeof h == 'object' || typeof h == 'array') {
      // handle := 'default' { past:true =h[enabled], ... }
      for (var i in h) {
        if( !(h[i] in this.loggers) ) {
          // default configuration
          console.log("New logger registered: " + h[i] + " -> default");
          this.loggers[h[i]] = {
            'target': 'console',
            'enabled': true
          };
          handle = h[i];
        }
        if( !(this.loggers[h[i]].enabled) ) continue;
        if( !past ) handle = h[i];
        else handle += ", " + h[i];
        past=true;
      }
      if( !past )
        return false; // selected logger i(s/are) in quiet mode
    } else {
      if (!(h in this.loggers)) {
        h = 'default';
        arg_start = 0;
      }
      if( !this.loggers[h].enabled )
        return false;
      handle = h;
    }

    let msg = (handle=='default')?'_':(handle[0].toUpperCase() + handle.slice(1)) + "@" + this.fmtTime(new Date()) + ":";
    for (i = arg_start; i < arguments.length; ++i) {
      msg += " " + (typeof arguments[i] != 'string') ? ( JSON.stringify(arguments[i]) ) : ( arguments[i] );
    }
    await this.logrecv(( typeof this.loggers[h].target == 'string' ) ? [this.loggers[h].target] : this.loggers[h].target, msg);
    return true;
  };

  this.logrecv = async function(targets, msg)
  {
    for( var target of targets ) {
      let past=true;
      switch (target) {
        case 'console':
        case 'stdout':
        case 'default':
        case 'main':
          console.log(msg);
          break;
        default:
          msg = msg + "\n";
          console.log(msg);
//          console.log(this.file,this.file.open);
          try {
            const fX = await this.file.open(target);
            await this.file.append(fX, msg);
            await this.file.close(fX);
          } catch( e ) {
          }
          break;
      }
    }
  };

  // routing
  this.connect_secure_router = function(myrouter) {
    this.routerS = myrouter;
    for (var i in this.ctrl) {
      if (typeof this.ctrl[i].socket_routes == 'function') {
        this.ctrl[i].socket_routes(myrouter);
      }
    }
  };

  this.connect_router = function(myrouter) {
    this.router = myrouter;
    for (var i in this.ctrl) {
      if (typeof this.ctrl[i].socket_routes == 'function') {
        this.ctrl[i].socket_routes(myrouter);
      }
    }
  };

  this.routes = function(router) {
    var i;
    this.routerControl = router;


    for (i in this.sing) {
      if (typeof this.sing[i].routes == 'function') {
        this.sing[i].routes(router);
      }
    }
    for (i in this.ctrl) {
      if (typeof this.ctrl[i].routes == 'function') {
        this.ctrl[i].routes(router);
      }
    }
    for( i in this.util ) {
      if( typeof this.util[i].routes == 'function' ) {
        this.util[i].routes(router);
      }
    }
  };


  this.loadTools = async function() {
    var dn, d, i, k, j, o;

    dn = './lib/eccentric/';
    d = await fs.readdirSync(dn);
    i = d.length;
    if( typeof this.util == 'undefined' ) {
      console.log("huh?");
    }
    this.startup_keys = [];
    while (i > 0) {
      --i;
      var x = d[i].split('.');
      var dlname = x[0];
      if (x[x.length - 1] != 'js') continue;
      
      //console.log("Eccentric " + d[i]);
      eval('Utils.prototype.' + dlname + " = import('./eccentric/" + d[i] + "');" );
      if( Utils.prototype[dlname] instanceof Promise )
        Utils.prototype[dlname] = await Utils.prototype[dlname];
      this.startup_keys.push(dlname);
    }

    var iTool, qload;
    let model_startup = this.startup_keys.slice();
    model_startup.sort((a,b) => (a-b)); // so that www is first I assume
    
    //console.log("startup tools: " + model_startup.join(", "));

    this.prereq = {};
    for( j=0; j<model_startup.length; j++ ) {
      i = model_startup[j];
      
      if( typeof this.util[i] == 'object' && (typeof this.util[i]['startup'] != 'function') ) {
        for( o in this.util[i] ) {
          const k = this.util[i][o];
          if( typeof k == 'function' && ('constructor' in k) ) {
            iTool = o[0].toUpperCase() + o.slice(1);
            console.log("Startup: " + i + "." + o);
            this.tools[iTool] = new k(this);
            if( 'startup' in this.tools[iTool] ) {
              console.log("Startup: tools.", iTool, "=", k);
              this.prereq[iTool] = this.tools[iTool].startup(this);
              if( this.prereq[iTool] && this.prereq[iTool].length > 0 ) {
                //console.log(iTool + " requires " + this.prereq[iTool]);
              }
            }
          } else {
            console.log(i + "." + o);
            Utils.prototype[o] = k;
          }
        }
      }
    }
    for( j=0; j<model_startup.length; j++ ) {
      i = model_startup[j];

      if (typeof this.util[i] == 'function') {
        console.log("skip " + i);
        continue;
      }
      if( typeof this.util[i] != 'object' ) {
        buf = String( this.util[i] );
        if( buf.length > 80 ) buf = buf.substring(0,80);
        console.log("Register: app.util." + i + "=" + buf);
        continue;
      }
      if( typeof this.util[i].startup == 'function' ) {
        console.log("Startup(): app.util." + i + ".startup(app)");
        this.prereq[i] = this.util[i].startup(this);
        for( o in this.util[i] ) {
          if( !(o in this.util) ) {
            if( (o in this) ) {
              //console.log("app.util." + o + " = app.util." + i + "." + o);
              eval('Utils.prototype.' + o + " = this.util." + i + "." + o + ";" );
            } else {
              //console.log("app." + o + " = app.util." + o + " = app.util." + i + "." + o);
              eval('Utils.prototype.' + o + " = this." + o + " = this.util." + i + "." + o + ";" );
            }
          }
        }
      }
    }

    for( j=0; j<model_startup.length; j++ ) {
      i = model_startup[j];

      if (typeof this.util[i] == 'function') {
        iTool = i[0].toUpperCase() + i.slice(1);
        console.log("Startup: new app.tools." + iTool + "."  + i + "(app)");
        this.tools[iTool] = new this.util[i](this);
      }
    }
    for( iTool in this.tools ) {
      const k = this.tools[iTool];
      if( typeof k == 'string' ) continue;
      if( 'modlocaL' in k ) {
        console.log("Modlocal: " + iTool);
        const qobj = new k.modlocaL(this);
        for (const q in qobj) {
//          this[q] = qobj[q];
          eval("this." + q + " = qobj[q];")
        }
      }
      if( 'onLoad' in this.tools[iTool] ) {
        console.log("onLoad: " + iTool);
        this.tools[iTool].onLoad(this);
      }
    }
    
    this.started = true;
    console.log("Tools loaded");
    
    dn = './lib/singlets/';
    d = fs.readdirSync(dn);
    i = d.length;
    while (i > 0) {
      --i;
      if (typeof d[i] != 'string') continue;
      if (d[i].indexOf(".js") == -1) continue;
      if (d[i].indexOf("skeleton") != -1) continue;
      var x = d[i].split('.');
      var dlname = x[0];
      this.addSinglet(dlname);
    }
  };



  /* four letter words: hold the main pointers to cross functional boundaries. */
  this.ctrl = {};
  this.data = {};
  this.base = {};
  this.objs = {};

  this.fullworkcycle = [];
  this.fullworkn = 0;
  this.buildcycle = true;

  this.startup = function() {
	  console.log("app.startup");
    let i;
    for( i in this.util ) {
      let iT = i[0].toUpperCase() + i.substring(1);
      if( iT in this.tools ) continue;
      if( ( typeof this.util[i] == 'object' ) && ( 'startup' in this.util[i] ) ) {
        this.prereq[i] = this.util[i]['startup'](this);
      }
    }
    for( i in this.tools) {
      if( typeof this.tools[i].startup == 'function') {
        this.prereq[i] = this.tools[i].startup(this);
      }
    }

    for (i in this.sing) {
      if( typeof this.sing[i].startup == 'function') {
        this.sing[i].startup(this);
      }
    }

    for (i in this.objs) {
      if (typeof this.objs[i].startup == 'function') {
        this.objs[i].startup(this);
      }
    }

    for (i in this.data) {
      if (typeof this.data[i].startup == 'function') {
        this.data[i].startup(this);
      }
    }
  };

  this.singlet_store = [];

  this.addSinglet = async function(singname) {
    var A, fn, c;

    fn = "/singlets/" + singname + ".js";
    if (fs.existsSync("./lib" + fn)) {
      try {
        A = await import("." + fn);
        const AB = A[ A.keys()[0] ];
        c = new AB(this);
      } catch (e) {
        console.log("Singlet ", singname);
        throw e;
      }
      c.app = this;
      c.objs = false;
      c.data = false;
      if (typeof c.Objs == 'function') { // mongodb type setup
        try {
          c.objs = new c.Objs();
          this.objs[singname] = c.objs;
        } catch (e) {
          c.objs = false;
          console.log("Database initialization error");
          console.log(e);
        }
      }
      if (typeof c.Data == 'function') { // basedb type setup
        try {
          c.data = new c.Data();
          this.data[singname] = c.data;
        } catch (e) {
          c.data = false;
          console.log("Database initialization error");
          console.log(e);
        }
      }

      this.sing[singname] = c;
      this.buildcycle = true;
    }
  };

  this.addModule = async function(modname) {
    var A, fn;
    var b = 0,
      c = 0,
      d = 0,
      g = 0;

    if (this.started == false) {
      //this.packages.push(modname);
      return;
    }
    //console.log("Module " + modname);
    fn = "/control/" + modname + ".js";
    if (fs.existsSync("./lib" + fn)) {
      A = null;
      try {
        A = await import("." + fn);
      } catch( e ) {
        console.log("Error loading module " + fn + ": ", e);
      }
      if( A !== null ) {
        try {
          const AB = A[ A.keys()[0] ];
          c = new AB(this);
          c.app = this;
          this.ctrl[modname] = c;
        } catch( e ) {
          console.log("Error creating new object for module " + fn + ": ", e);
        }
      }
    } else {
      //console.log("No control for " + modname + ".");
    }
    fn = "/data/" + modname + ".js";
    if (fs.existsSync("./lib" + fn)) {
      A = null;
      try {
        A = await import("." + fn);
      } catch( e ) {
        console.log("Error loading module " + fn + ": ", e);
      }
      if( A !== null ) {
        try {
          const AB = A[ Object.keys(A)[0] ];
          d = new AB(this);
          d.app = this;
          this.data[modname] = d;
        } catch( e ) {
          console.log("Error creating new object for module " + fn + ": ", e);
        }
      }
    }
    fn = "/objs/" + modname + ".js";
    if (fs.existsSync("./lib" + fn)) {
      A = null;
      try {
        A = await import("." + fn);
      } catch( e ) {
        console.log("Error loading module " + fn + ": ", e);
      }
      if( A !== null ) {
        try {
          const AB = A[ A.keys()[0] ];
          g = new AB(this);
          this.objs[modname] = g;
        } catch( e ) {
          console.log("Error creating new object for module " + fn + ": ", e);
        }
      }
    }
    if (c != 0) {
      c.data = d;
      c.objs = g;
    }
    if (d != 0) {
      d.ctrl = c;
      d.objs = g;
    }
    this.buildcycle = true;
  };

  this.startAppWorker = function(ap) {
    apps.push(ap);
    ap.appn = apps.length - 1;
  };

  this.workOut = function(ap, cb, rate) {
    var iTime = setInterval(cb, rate, ap.appn);
    //console.log("workOut @ " + rate + " = " + iTime);
    return iTime;
  };
  this.workNow = function(ap, cb) {
    return setImmediate(cb, ap.appn);
  };

  this.workCycle = function(appn) {
    apps[appn].workcycle();
  };
  this.fastCycle = function(appn) {
    apps[appn].fastcycle();
  };

  console.log("Runtime Code is " + this.runtimeCode);

};


