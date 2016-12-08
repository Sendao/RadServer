var async = require('async');

module.exports = function MonitorControl() {
        
    this.routes = function( router ) {
        router.get('/watch/proc.json').bind(this.getProcessData.bind(this));
        router.post('/watch/proc.json').bind(this.getProcessData.bind(this));
        router.get('/watch/cfg.json').bind(this.getMonitorConfig.bind(this));
        router.post('/watch/cfg.json').bind(this.getMonitorConfig.bind(this));
        router.post('/watch/logs.json').bind(this.liveTail.bind(this));
        router.post('/watch/cmd').bind(this.sendMonitorCommand.bind(this));
    };
        
    this.getProcessData = function(req, res) {
        
        //console.log("Got process request");
        
        async.waterfall(
            [this.data.loadProcesses, this.data.getUsages, function(procdata, cb){
                res.send(200, {}, procdata);
                cb(null);
            }], function(err) {
                if( err ) {
                    console.log("Error:");
                    console.log(err);
                }
            })
        ;
    };
    
    this.getMonitorConfig = function(req, res) {
        
        //console.log("Got config request");
        
        async.waterfall(
            [this.data.loadMonitorConfig, function(cfgdata, cb){
                res.send(200, {}, cfgdata);
                cb(null);
            }], function(err) {
                if( err ) {
                    console.log("Error:");
                    console.log(err);
                }
            })
        ;
    };
    
    this.sendMonitorCommand = function(req, res, params) {
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

};
