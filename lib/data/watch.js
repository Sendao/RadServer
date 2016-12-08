var fs = require('fs');
var async = require('async');
var usage = require('usage');

module.exports = function WatchData() {
    
    this.loadMonitorConfig = function(cb)
    {
        fs.readFile('/tmp/monitor.status', 'utf8', function(err, data) {
            if( err ) {
                console.log("Error while reading pids file");
                return cb(err);
            }
            var parser = data.split('\n'), parser2, parsedName, parsedPid, parsedCPU;
            var i;
            var cfgdata = { groups: [] };
            var c_group = null, c_lf = null, c_rp = null;
            var c_mode=0;
            
            for( i=0; i< parser.length; i++ ) {
                parser2 = parser[i].split(' ');
                if( parser2.length <= 0 ) continue;
                var cmd = parser2.splice(0,1);
                switch( cmd[0] ) {
                    case 'group':
                        c_group = { 'name': parser2.join(' '), 'processes': [], 'logfiles': [], 'requires': [] };
                        //console.log("Load group ", c_group);
                        cfgdata.groups.push(c_group);
                        c_mode = 1;
                        break;
                    case 'state':
                        if( c_mode == 1 ) {
                            c_group.state = parser2.splice(0,1)[0];
                        } else if( c_mode == 2 ) {
                            c_rp.runstate = parser2.splice(0,1)[0];
                            c_rp.cmdstate = parser2.splice(0,1)[0];
                        }
                        break;
                    case 'logto':
                        if( c_mode == 1 ) {
                            c_group.logto = parser2.join(' ');
                            c_lf = { 'path': parser2.join(' '), 'isdir': 0 };
                            c_group.logfiles.push( c_lf );
                        }
                        break;
                    case 'logcount':
                        if( c_mode == 1 ) {
                            c_group.logcount = parser2.join(' ');
                        }
                        break;
                    case 'logsize':
                        if( c_mode == 1 ) {
                            c_group.logsize = parser2.join(' ');
                        }
                        break;
                    case 'require':
                        if( c_mode == 1 ) {
                            c_group.requires.push( parser2.join(' ') );
                        }
                        break;
                    case 'process':
                        c_rp = { 'name': parser2.join(' '), 'mainpid': -1, 'cwd': '', 'env': '', 'psgrep': '', 'pids': [] };
                        c_group.processes.push( c_rp );
                        c_mode = 2;
                        break;
                    case 'lastdown':
                        if( c_mode == 2 ) {
                            c_rp.lastdown = parser2.join(' ');
                        }
                        break;
                    case 'start':
                        if( c_mode == 2 ) {
                            c_rp.startat = parser2.join(' ');
                        }
                        break;
                    case 'mainpid':
                        if( c_mode == 2 ) {
                            c_rp.mainpid = parser2.splice(0,1)[0];
                        }
                        break;
                    case 'cwd':
                        if( c_mode == 2 ) {
                            c_rp.cwd = parser2.join(' ');
                        }
                        break;
                    case 'env':
                        if( c_mode == 2 ) {
                            c_rp.env = parser2.join(' ');
                        }
                        break;
                    case 'psgrep':
                        if( c_mode == 2 ) {
                            c_rp.psgrep = parser2.join(' ');
                        }
                        break;
                    case 'pid':
                        if( c_mode == 2 ) {
                            var pid = {};
                            pid.pid = parser2.splice(0,1)[0];
                            pid.cpu = parser2.splice(0,1)[0];
                            pid.cpu2 = parser2.splice(0,1)[0];
                            pid.cpu3 = parser2.splice(0,1)[0];
                            pid.cmdline = parser2.join(' ');
                            c_rp.pids.push(pid);
                        }
                        break;
                    case 'logdir':
                        c_lf = { 'path': parser2.join(' '), 'isdir': 1 };
                        c_group.logfiles.push( c_lf );
                        c_mode = 1;
                        break;
                    case 'logfile':
                        c_lf = { 'path': parser2.join(' '), 'isdir': 0 };
                        c_group.logfiles.push( c_lf );
                        c_mode = 1;
                        break;
                }
            }
            cb(null, cfgdata);
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
};
