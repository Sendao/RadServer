
module.exports = function ClientsControl() {
    this.routes = function(router) {
        router.post('/ed.js').bind( this.updData.bind(this) );
        router.get('/ed.json').bind( this.getData.bind(this) );
    };
    
    this.getData = function(req, res, params)
    {
        var sess = this.app.requireAdmin(res, params);
        console.info("got there, though.");
        res.send(200, {}, {'msg':"Test"});
        if( !sess ) return;
        var base = params['base'];
        var table = params['table'];
        var vals = params['vals'];
        
        var xd = this.app.db.bases[base].tables[table];
        var result = xd.page(params['start'], params['count']);
        res.send(200, {}, {'status': 'ok', 'data': JSON.stringify(result)});        
    };
    
    this.updData = function(req, res, params)
    {
        var sess = this.app.requireAdmin(res, params);
        var base = params['base'];
        var table = params['table'];
        var vals = params['vals'];
        
        var xd = this.app.db.bases[base].tables[table];
        
    };
};
