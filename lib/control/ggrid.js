
module.exports = function ClientsControl() {
    this.cheerio = require('cheerio');
    this.request = require('request');
    
    this.routes = function(router) {
        router.post('/ggrid.js').bind( this.googleGrid.bind(this) );
        router.get('/ggrid.json').bind( this.googleGridStart.bind(this) );
        router.post('/tool/netscan.js').bind( this.toolScan.bind(this) );
    };
    this.toolScan = function(req, res, params) {
        var sess = this.app.authSession(params);
        var cc = this;
        
        this.request(params['addr'], function(err, response, body) {
            var jsobj = cc.cheerio.load(params['addr']);
            var jstr = JSON.stringify(jsobj);
            this.app.sendTo( sess['key'], { 'status': 'ok', 'code': 'net.scan', 'data': jstr } );
        } );
        
        res.send(200, {}, {'status': 'pending', 'code': 'net.scan' });
    };
    
    this.googleGridStart = function(req, res, params) {
        var sess;
        if( !(sess=this.app.requireAuth(res,params)) ) return;
        var xd = this.base.searchers;
        //! load searchers
        
        var xd = this.base.pages;
        //! load pages
        
        //! create session registry for data paths
    };
    
    this.googleGrid = function(req, res, params) {
        var sess;
        if( !(sess=this.app.requireAuth(res,params)) ) return;
        // update a value
        
    };
    
};
