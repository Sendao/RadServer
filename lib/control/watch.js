export function MonitorControl() {

    this.routes = function( router ) {
        //router.get('/watch/tail.json').bind(this.liveTail.bind(this));
        //router.get('/watch/cfg.json').bind(this.getConfigData.bind(this));
        //router.get('/watch/usage.json').bind(this.getProcessData.bind(this));
        //router.post('/watch/cmd').bind(this.sendMonitorCommand.bind(this));
    };


    this.getConfigData = function(req, res, params) {
        var sess;
        if( !(sess=this.app.requireAdmin(req,res,params)) ) return;
        var cliconn;
        cliconn = this.app.locateUser( sess.pagekey );
        if( !cliconn ) {
            console.log("User is not wearing socks.");
        } else {
            this.base.procs.registerClient( cliconn, 'config_append', true );
            this.base.procs.registerClient( cliconn, 'config_remove', true );
            this.base.procs.registerClient( cliconn, 'config_update', true );
        }
        var configData = this.data.fetchConfig();
        this.data.startLiveMonitor( sess.pagekey );

        if( configData ) {
            res.send(200, {}, { 'status': 'ok', 'data': configData } );
        } else {
            console.log("Error");
            console.log(configData);
            res.send(500, {}, { 'status': 'error', 'message': 'Config not loaded' } );
        }
    };

    this.getProcessData = function(req, res, params) {
        var sess;
        if( !(sess=this.app.requireAdmin(req,res,params)) ) return;

        //console.log("Got process request");

        var cliconn;
        cliconn = this.app.locateUser( sess.pagekey );
        if( !cliconn ) {
            console.log("User is not wearing socks.");
        } else {
            this.base.procs.registerClient( cliconn, 'procs_append', true );
            this.base.procs.registerClient( cliconn, 'procs_remove', true );
            this.base.procs.registerClient( cliconn, 'procs_update', true );
        }
        var configData = this.data.fetchUsage();
        if( configData ) {
            res.send(200, {}, { 'status': 'ok', 'data': configData } );
        } else {
            console.log("Error");
            console.log(configData);
            res.send(500, {}, { 'status': 'error', 'message': 'Usage not loaded' } );
        }
    };

    this.sendMonitorCommand = function(req, res, params) {
        var sess;
        if( !(sess=this.app.requireAdmin(req,res,params)) ) return;
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
        if( !(sess=this.app.requireAdmin(req,res,params)) ) return;

        this.data.getLiveTail( params.fn, params.sz, sess.pagekey, function(err, data, newsize) {
          if( err ) {
            res.send(500, {}, {'error':err});
          } else {
            res.send(200, {}, {'status':'ok', 'file': params.fn, 'data': data, 'size': newsize});
          }
        });
    };

};
