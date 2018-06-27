var fs = require('fs');
var async = require('async');
var usage = require('usage');

module.exports = function WatchData() {
    
    this.tracking_tails = [];
    this.configData = { 'groups': {}, 'logto': '', 'loaded': false };

    this.startup = function()
    {
        if( this.configData.loaded == false )
            this.loadMonitorConfig();
    };
    
    this.workcycle = function()
    {
        var i, len=this.tracking_tails.length;
        var a, b;
        var found=false;
        
        if( this.configData.loaded == false )
            this.loadMonitorConfig();

        this.loadMonitorStatus();
        
        for( i=0; i<len; ++i ) {
            a = this.tracking_tails[i];
            if( !a[2] ) {
                this.tracking_tails.splice(i,1);
                --i;
                len=this.tracking_tails.length;
                continue;
            }
            this.trackLiveTail(i);
            found=true;
        }
        return found;
    };
    
    this.fetchConfig = function()
    {
        //! check if the config file has changed and read it if so
        if( false ) {
            this.loadMonitorConfig();
        }
        return this.configData;
    };
    
    this.fetchGroups = function()
    {
        return this.configData.groups;
    };
    
    this.fetchStatus = function()
    {
    	if( false ) {
    		this.loadMonitorConfig();
    	}
    	this.loadMonitorStatus();
    	return this.configData;
    };
    
    this.fetchUsage = function()
    {
        var cfg = this.fetchStatus();
        var usages = [];
        var i;
        for( i in cfg.pids ) {
            usages[i] = cfg.pids[i];
            //groups[i].usage
        }
        return usages;
    };
    
    this.loadMonitorConfig = function()
    {
    	var t2 = this;
        fs.readFile('/var/rad/monitor.cfg', 'utf8', function(err, data) {
            if( err ) {
                console.log("Error while reading config file", err);
                return;
            }
            var parser = data.split('\n'), parser2, parsedName, parsedPid, parsedCPU;
            var i;
            var cfgdata = { mainlog: '', groups: [] };
            var c_group = null, c_lf = null, c_rp = null;
            var c_mode=0;
            var lastmode;
            
            for( i=0; i< parser.length; i++ ) {
                parser2 = parser[i].split(':');
                if( parser2.length <= 0 ) continue;
                var cmd = parser2.splice(0,1);
                var val = parser2.join(':').trim();
                //console.info("loadMonitorConfig", cmd[0], val);
                switch( cmd[0] ) {
                    case 'group':
                        c_group = { 'name': val, 'state': 0,
                            'processes': [],
                            'watches': [],
                            'requires': [],
                            'logfiles': [] };
                        //console.log("Load group ", c_group);
                        cfgdata.groups.push(c_group);
                        c_mode = 1;
                        break;
                    case 'process':
                        c_rp = { 'name': val,
                            'mainpid': -1, 'startcmd': '', 'stopcmd': '',
                            'cwd': '', 'env': '', 'psgrep': '',
                            'autostart': false, 'newsid': false,
                            'noshell': false, 'crashlines': 8,
                            'pids': [], 'logfiles': [] };
                        c_group.processes.push( c_rp );
                        c_mode = 2;
                        break;
                    case 'logdir':
                    case 'logfile': 
                        c_lf = { 'path': val, 'isdir': 0 };
                        if( c_mode == 3 || c_mode == 4 )
                            c_mode = lastmode; // go back to 2
                        lastmode = c_mode; // go back to 2
                        c_mode = 3; // logfile mode 3
                        if( lastmode == 1 ) {
                            c_group.logfiles.push( c_lf );
                        } else if( lastmode == 2 ) {
                            c_rp.logfiles.push( c_lf );
                        }
                        break;
                    case 'watch':
                        c_watch = { 'path': val, 'subdirs': false };
                        if( c_mode == 3 || c_mode == 4 )
                            c_mode = lastmode;
                        lastmode = c_mode;
                        c_mode = 4;
                        if( lastmode == 1 ) {
                            c_group.watches.push( c_watch );
                        }
                        break;
                    case 'subdirs':
                        if( c_mode == 4 ) {
                            c_watch.subdirs = ( val == 'yes' || val == 'true' );
                        }
                        break;
                    case 'logto':
                        if( c_mode == 0 ) {
                            // global logfile
                            cfgdata.mainlog = val;
                        } else if( c_mode == 1 ) {
                            // groupwide logfile
                            c_lf = { 'path': val, 'isdir': 0 };
                            c_group.logfiles.push( c_lf );
                        } else if( c_mode == 2 ) {
                            //process logfile
                            c_lf = { 'path': val, 'isdir': 0 };
                            c_rp.logfiles.push( c_lf );
                        }
                        break;
                    case 'require':
                        if( c_mode == 1 ) {
                            c_group.requires.push( val );
                        }
                        break;
                    case 'cwd':
                        if( c_mode == 2 ) {
                            c_rp.cwd = val;
                        }
                        break;
                    case 'env':
                        if( c_mode == 2 ) {
                            c_rp.env = val;
                        }
                        break;
                    case 'autostart':
                        if( c_mode == 2 ) {
                            c_rp.autostart = ( val == 'true' || val == 'yes' || val == 'on' );
                        }
                        break;
                    case 'newsid':
                        if( c_mode == 2 ) {
                            c_rp.newsid = ( val == 'true' || val == 'yes' || val == 'on' );
                        }
                        break;
                    case 'noshell':
                        if( c_mode == 2 ) {
                            c_rp.noshell = ( val == 'true' || val == 'yes' || val == 'on' );
                        }
                        break;
                    case 'crashlines':
                        if( c_mode == 2 ) {
                            c_rp.crashlines = val;
                        }
                        break;
                    case 'psgrep':
                        if( c_mode == 2 ) {
                            c_rp.psgrep = val;
                        }
                        break;
                    case 'start':
                        if( c_mode == 2 ) {
                            c_rp.startcmd = val;
                        }
                        break;
                    case 'stop':
                        if( c_mode == 2 ) {
                            c_rp.stopcmd = val;
                        }
                        break;
                }
            }
            cfgdata.loaded = true;
            t2.configData = cfgdata;
            console.info("Stored config", t2.configData);
        });
    };

    this.loadMonitorStatus = function()
    {
    	var t2 = this;
        fs.readFile('/tmp/monitor.status', 'utf8', function(err, data) {
            if( err ) {
                if( err.errno == -2 ) { // file not found
                    //! reset configuration values
                    return;
                }
                console.log("Error while reading pids file", err);
                return;
            }
            //! unlink status file
            
            var parser = data.split('\n'), parser2, parsedName, parsedPid, parsedCPU;
            var i;
            var c_group = null, c_lf = null, c_rp = null;
            var c_mode=0;
            var val, cmd, rev, hnd;
            
            
            var parseTable = {
            		'group': {
            			'-1': () => {
	                        c_group = t2.findGroup(val);
	                        if( c_group === false ) {
	                        	console.info("Couldn't find group '" + val + "'");
	                        	return -1;
	                        }
	                        return 1;
            			}
            		},
            		'process': {
            			'-1': () => {
	                        c_rp = t2.findProcess(c_group, val);
	                        c_rp.pids = [];
	                        return 2;
            			}
            		},
            		'logfile': { 'end': [ 3, 4 ],
            			1: [ () => c_lf = t2.findLogfile(c_group, val), 3 ],
            			2: [ () => c_lf = c_lf = t2.findLogfile(c_rp, val), 3 ]
            		},
            		'watch': { 'end': [ 3, 4 ],
            			1: [ () => c_watch = t2.findWatch(c_group, val), 4 ]
            		},
            		'state': {
            			1: () => {
            				c_group.state = parser2.splice(0,1)[0];
            			},
            			2: () => {
            				c_rp.runstate = parser2.splice(0,1)[0];
            				c_rp.cmdstate = parser2.splice(0,1)[0];
            			}
            		},
            		'logto': {
            			0: () => -1, // global logfile, just ignore it
            			1: () => {
                            c_group.logto = parser2.join(' ');
                            if( !t2.findLogfile(c_group, parser2.join(' ')) ) {
                                c_lf = { 'path': parser2.join(' '), 'isdir': 0 };
                                c_group.logfiles.push( c_lf );
                            }        				
            			}
            		},
            		'logcount': {
            			1: () => { c_group.logcount = val; }
            		},
            		'logsize': {
            			1: () => { c_group.logsize = val; }
            		},
            		'lastdown': {
            			2: () => { c_rp.lastdown = val; }
            		},
            		'start': {
            			2: () => { c_rp.startat = val; }
            		},
            		'mainpid': {
            			2: () => { c_rp.mainpid = val; }
            		},
            		'pid': {
            			2: () => {
                            var pid = {};

                            parser2 = val.split(' ');
                            pid.pid = parser2[0];
                            pid.cpu = parser2[1];
                            pid.cpu2 = parser2[2];
                            pid.cpu3 = parser2[3];
                            pid.cmdline = parser2.slice(4).join(' ');
                            c_rp.pids.push(pid);            				
            			}
            		}
                };
            
            for( i=0; i< parser.length; i++ ) {
                parser2 = parser[i].split(' ');
                if( parser2.length <= 0 ) continue;
                cmd = parser2.splice(0,1);
                val = parser2.join(' ').trim();
                
                if( cmd == '' ) {
                	if( parser[i] != '' ) {
                		console.info("Invalid watch config line '" + parser[i] + "'");
                	}
                	continue;
                }
                
                if( !(cmd in parseTable) ) {
                	console.info("Command not found '" + cmd + "'");
                	continue;
                }
                hnd = parseTable[cmd];
                
                if( 'end' in hnd ) {
                	for( j=0; j<hnd['end'].length; j++ ) {
                		if( c_mode == hnd['end'][j] ) {
                			c_mode = lastmode;
                		}
                	}
                }
                
                if( '-1' in hnd ) {
                	rev = hnd['-1']();
                	if( rev != -1 && typeof rev != 'undefined' ) {
                		lastmode = c_mode = rev;
                	}
                } else if( c_mode in hnd ) {
                	if( typeof hnd[c_mode] == 'function' ) {
                		rev = hnd[c_mode]();
        				if( rev != -1 && typeof rev != 'undefined' ) {
        					lastmode = c_mode = rev;
        				}
                	} else {
        				rev = hnd[c_mode][0]();
        				if( rev != -1 && typeof rev != 'undefined' ) {
        					rev = hnd[c_mode][1];
        				}
        			}        			
                }
            }
        });
    };
    
    this.loadMonitorPids = function()
    {
        fs.readFile('/tmp/monitor.pids', 'utf8', function(err, data) {
            if( err ) {
                console.log("Error while reading config file", err);
                return;
            }
            var parser = data.split('\n'), parser2;
            var i, j, k;
            var pidid, usage, procname, pids = [];
            var c_group = null, c_rp = null, c_pid = null;

            for( i=0; i< parser.length; i++ ) {
                parser2 = parser[i].split(':');
                if( parser2.length <= 2 ) continue;
                
                pidid = parser2.shift();
                usage = parser2.shift();
                procname = parser2.join(':');
                
                pids[pidid] = usage;
            }
            for( i in this.configData.groups ) {
                c_group = this.configData[i];
                for( j in c_group.processes ) {
                    c_rp = c_group.processes[j];
                    for( k in c_rp.pids ) {
                        c_pid = c_rp.pids[k];
                        if( c_pid.pid in pids )
                            c_pid.usage = pids[c_pid.pid];
                    }
                }
            }
            this.configData.pids = pids;
        });
    };
    
    this.findGroup = function(groupname)
    {
    	var i, c_group;
    	
    	for( i in this.configData.groups ) {
    		c_group = this.configData.groups[i];
    		if( c_group.name == groupname )
    			return c_group;
    	}
    	return false;
    };
    
    this.findProcess = function(group, procname)
    {
    	var i, c_rp;
    	
    	for( i in group.processes ) {
    		c_rp = group.processes[i];
    		if( c_rp.name == procname )
    			return c_rp;
    	}
    	return false;
    };
    
    this.findLogfile = function(group, logname)
    {
    	var i, c_lf;
    	
    	for( i in group.logfiles ) {
    		c_lf = group.logfiles[i];
    		if( c_lf.path == logname )
    			return c_lf;
    	}
    	return false;
    };
    
    this.findWatch = function(group, watchname)
    {
    	var i, c_watch;
    	
    	for( i in group.watches ) {
    		c_watch = group.watches[i];
    		if( c_watch.path == watchname )
    			return c_watch;
    	}
    	return false;
    };
    this.saveConfigFile = function()
    {
    	var buf = '';
    	var line, c_group, c_rp, c_lf;
    	var i, j, k;
    	
    	if( this.configData.mainlog != "" )
    		buf += "logto: " + this.configData.mainlog + "\n";
    	
    	for( i in this.configData.groups ) {
    		c_group = this.configData.groups[i];
    		buf += "group: " + c_group.name + "\n";
            for( j in c_group.requires ) {
                buf += "require: " + c_group.requires[j] + "\n";
            }
    		for( k in c_group.logfiles ) {
    			c_lf = c_group.logfiles[k];
    			buf += "logto: " + c_lf.path + "\n";
    		}
    		for( j in c_group.processes ) {
    			c_rp = c_group.processes[j];
    			buf += "process: " + c_rp.name + "\n";
    			if( c_rp.autostart != false )
    				buf += "autostart: true\n";
    			if( c_rp.newsid != false )
    				buf += "newsid: true\n";
    			if( c_rp.noshell != false )
    				buf += "noshell: true\n";
    			if( c_rp.env != "" )
    				buf += "env: " + c_rp.env + "\n";
    			if( c_rp.pwd != "" )
    				buf += "pwd: " + c_rp.pwd + "\n";
    			if( c_rp.startcmd != "" )
    				buf += "start: " + c_rp.startcmd + "\n";
    			if( c_rp.stopcmd != "" )
    				buf += "stop: " + c_rp.stopcmd + "\n";
    			if( c_rp.crashlines != 8 )
    				buf += "crashlines: " + c_rp.crashlines + "\n";
    			for( k in c_rp.logfiles ) {
    				c_lf = c_rp.logfiles[k];
    				buf += "logto: " + c_lf.path + "\n";
    			}
    		}
    		for( j in c_group.watches ) {
    			c_watch = c_group.watches[j];
    			buf += "watch: " + c_watch.path + "\n";
    			if( c_watch.subdirs != false )
    				buf += "subdirs: true\n";
    		}
    	}
    	
    	console.log("Save config data:");
    	console.log(buf);
    	//! write buf to /var/rad/monitor.cfg
    };
    
    this.loadProcesses = function(cb)
    {
        fs.closeSync( fs.openSync('/tmp/monitor.web', 'a') ); // let the monitor know we're watching and speed up the checks
        fs.readFile('/tmp/monitor.pids', 'utf8', function(err, data) {
            if( err ) {
                console.log("Error while reading pids file");
                return cb(err);
            }
            var parser = data.split('\n'), parser2, parsedName, parsedPid, parsedCPU;
            var i;
            var procdata = {};
            for( i=0; i< parser.length; i++ ) {
                parser2 = parser[i].split(':');
                if( parser2.length <= 0 ) continue;
                parsedPid = parser2.splice(0, 1);
                parsedCPU = parser2.splice(0, 1);
                parsedName = parser2.join(":");
                procdata[ parsedPid ] = { 'pid': parsedPid, 'id': i, 'cpu': parsedCPU, 'name': parsedName };
            }
            //console.log("Read " + i + " process elements from file");
            cb(null, procdata);
        });
    };
    
    this.sendCommand = function(cmd)
    {
        var fscmdname = this.app.randomInt(10000,100000);
        var fsid = fs.openSync('/tmp/monitor.cmd/cmd.' + fscmdname, 'a');
        fs.writeSync(fsid, cmd, 0, cmd.length, 'append');
        fs.closeSync(fsid);
        console.log("Sent command "+ cmd + ":" + fscmdname);
    };
    
    this.getUsages = function(procdata, cb)
    {
        var usages = {};

        var procName, procPid;

        async.forEachOf( procdata, function( value, key, cb2 ) {
          usage.lookup( value['pid'], {}, (err,data) => {
              if( err ) return cb2(err);
              usages[key] = data;
              cb2();
          });
        }, function( err ) {
            if( err ) {
                cb(err);
            } else {
                cb(null, procdata, usages);
            }
        });
    };
    
/*
    this.getUsages = function(procdata, cb)
    {
        var usages = {}, sval;
    
        var procName, procPid;
                
        async.forEachOf( procdata, function( value, key, forEnd ) {
            usage.lookup( key, {}, function(err,data) {
                if( err ) {
                    if( err.code != 'ENOENT' ) {
                        console.log("Saw error e=", err);
                    }
                    procdata[key] = [];
                    return forEnd();
                }
                
                var datx = {};
                datx.memory = this.app.flowNumber(data.memory);
                datx.rss = this.app.flowNumber(data.memoryInfo.rss);
                datx.vsz = this.app.flowNumber(data.memoryInfo.vsize);
                datx.pcpu = data.cpuInfo.pcpu;
                datx.pcpuU = data.cpuInfo.pcpuUser;
                datx.pcpuS = data.cpuInfo.pcpuSystem;
                for( i in datx ) {
                    procdata[key][i] = datx[i];
                }
                forEnd();
            });
        }, function( err ) {
            if( err ) {
                console.log("Saw error err=", err);
                cb(err);
            } else {
                cb(null, procdata);
            }
        });
    };
    */
    this.getLiveTail = function(filename, lastsize, cb2)
    {
        lastsize = parseInt(lastsize);
        if( isNaN(lastsize) ) lastsize=0;
        async.waterfall(
            [
                function(cb) {
                    fs.stat( filename, function( err, stats ) {
                        if( err ) {
                            
                            if( err.code == 'ENOENT' ) {
                                cb(null, 0);
                                return;
                            }
                            console.log(err);
                            cb(err);
                        } else {
                            cb(null, stats['size']);
                        }
                    });
                },
                
                function(filesize, cb) {
                    if( filesize < lastsize )
                        lastsize = 0;

                    if( filesize <= lastsize ) {
                        cb(null, '', filesize);
                        return;
                    }
                    
                    var newsize = filesize - lastsize;
                    var maxsize = 8192;
                    if( newsize > maxsize ) {
                        newsize = maxsize;
                        lastsize = filesize - newsize;
                    }
                    var buffer = new Buffer(newsize);
 
                    var fd, bytesRead;
 
                    fd = fs.openSync(filename, 'r');
                    //console.log("Read " + newsize + " bytes at " + lastsize + " offset");
                    bytesRead = fs.readSync(fd, buffer, 0, newsize, lastsize);
                    fs.closeSync(fd);
                    //if( bytesRead != 0 ) {
                        //console.log("Read " + newsize + " bytes at " + lastsize + " offset: " + buffer.toString());
                    //}
                    cb( null, buffer.toString(), filesize );
                },
                
                function(newdata, newsize, cb) {
                    cb2(null, newdata, newsize);
                }
            ], cb2
        );
    };
    this.startTailTrack = function(filename, lastsize, sessionkey)
    {
        this.tracking_tails.push([filename,lastsize,sessionkey]);
    };
    
    this.trackLiveTail = function(i)
    {
        var a = this.tracking_tails[i];
        var filename, lastsize, sessionkey;
        filename = a[0];
        lastsize = a[1];
        sessionkey = a[2];
        var cliconn = this.app.locateUser(sessionkey);
        if( !cliconn ) {
            console.warn("Couldn't locate client by ", sessionkey);
            this.tracking_tails[i][2] = false;
            return;
        }
        var cc = this;
    
        lastsize = parseInt(lastsize);
        if( isNaN(lastsize) ) lastsize=0;
        
        fs.stat( filename, function( err, stats ) {
            if( err ) {
                if( err.code == 'ENOENT' ) {
                    cliconn.send({'code':'track','file':filename,'at':lastsize,'data':'','size':0});
                    this.tracking_tails[i][2] = false;
                    return;
                }
                console.log(err);
                return;
            }
            var filesize = stats['size'];
            
            if( isNaN(filesize) || filesize < 0 ) {
                cliconn.send({'code':'track','file':filename,'at':lastsize,'data':'','size':0});
                this.tracking_tails[i][2] = false;
                return;
            }
            
            if( filesize < lastsize )
                lastsize = 0;
                
            var newsize = filesize - lastsize;
            var maxsize = 8192;
            if( newsize > maxsize ) {
                newsize = maxsize;
                lastsize = filesize - newsize;
            }
            var fd = fs.openSync(filename, 'r');
            var buffer = new Buffer(newsize);
            var bytesRead = fs.readSync(fd, buffer, 0, newsize, lastsize);
            fs.closeSync(fd);
            
            cliconn.send({'code':'track','file':filename,'at':lastsize,'data':buffer.toString(),'size':filesize});
            this.tracking_tails[i][2] = filesize;
        });
    };
};
