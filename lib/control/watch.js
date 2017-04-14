var async = require('async');

module.exports = function MonitorControl() {
        
    this.routes = function( router ) {
        router.get('/watch/usage.json').bind(this.getProcessData.bind(this));
        router.get('/watch/logfile.json').bind(this.liveTail.bind(this));
        router.post('/watch/cmd').bind(this.sendMonitorCommand.bind(this));
    };
        
    this.getProcessData = function(req, res, params) {
        var sess;
        if( !(sess=this.app.requireAdmin(res,params)) ) return;
        
        //console.log("Got process request");

        var cliconn;
        cliconn = this.app.locateUser( sess.key );
        if( !cliconn ) {
            console.log("User is not wearing socks.");
        } else {
            this.base.procs.registerClient( cliconn, 'procs_append', true );
            this.base.procs.registerClient( cliconn, 'procs_remove', true );
            this.base.procs.registerClient( cliconn, 'procs_update', true );
        }
        async.waterfall(
            [this.data.loadProcesses, this.data.getUsages, function(procdata, usages, cb){
                res.send(200, {}, { 'status': 'ok', 'data': { 'procs': procdata, 'usages': usages } } );
                cb(null);
            }], function(err) {
                if( err ) {
                    console.log("Error:");
                    console.log(err);
                    res.send(500, {}, { 'status': 'error', 'message': err } );
                }
            })
        ;
    };
    
    this.sendMonitorCommand = function(req, res, params) {
        var sess;
        if( !(sess=this.app.requireAdmin(res,params)) ) return;
        var sendMessage = false, sendHost = false, sendGroup = false;
        
        console.log("Got monitor command", params);
        
        switch( params.message )
        {
        case 'start': case 'stop': case 'restart':
            sendHost = params.host;
            sendGroup = params.group;
            sendMessage = params.message;
            this.data.sendCommand( sendMessage + ':' + sendGroup + "\n" );
            res.send(200, {}, {'message':'ok'});
            return;
        }
        res.send(500, {}, {'error':'command not found'});
    };

    this.liveTail = function(req, res, params) {
        var sess;
        if( !(sess=this.app.requireAdmin(res,params)) ) return;
        var sendMessage = false, sendHost = false, sendGroup = false;
    
        //console.log("Got liveTail request", params);
        
        var cc = this;
        async.waterfall(
            [
            function(cb) {
                cc.data.getLiveTail( params.fn, params.sz, cb );
            },
            function(data, newsize, cb) {
                res.send(200, {}, {'ok':'1', 'newdata': data, 'size': newsize});
                cb(null);
            }
            ],
            function(err) {
                if( err ) {
                    res.send(500, {}, {'error':err});
                } else {
                    res.send(200, {}, {'error':'unknown'});
                }
            }
        );
    };

    this.liveTailSock = function(req, res, params) {
        var sess;
        if( !(sess=this.app.requireAdmin(res,params)) ) return;
        this.data.startTailTrack( params.fn, params.sz, sess.key );
        res.send(200, {}, {'ok':'1'});
    };

};
