module.exports = function BranchesSinglet(myapp) {
    var cc = this;
    var app = myapp;
    this.app = app;
    
    this.allow_access = true;

    this.routes = function(router) {
        router.post('/ed.json').bind( this.updData.bind(this) );
        router.get('/base.json').bind( this.getTables.bind(this) );
        router.get('/ed.json').bind( this.getData.bind(this) );
        router.get('/cmd.json').bind( this.runCommand.bind(this) );
    };
    
    this.runCommand = function(req, res, params) {
        var sess;
        if( !this.allow_access ) {
            sess = this.app.requireAdmin(res, params);
        } else {
            sess = this.app.authSession(params);
        }
        
        res.send( 200, {}, eval( params['code'] ) );
    };
    
    this.getTables = function(req, res, params)
    {
        var sess;
        if( !this.allow_access ) {
            sess = this.app.requireAdmin(res, params);
        } else {
            sess = this.app.authSession(params);
        }
        
        var xd, base, table;
        var bases = {};
        var tables;
        var indexlist, i;
        for( base in this.app.db.bases ) {
            tables = this.app.db.bases[base].tables;
            bases[base] = { 'name': base, 'tables': {} };
            for( table in tables ) {
                xd = tables[table];
                indexlist = [];
                for( i in xd.indice ) {
                    indexlist.push(i);
                }
                bases[base]['tables'][table] = { 'name': table, 'defaults': xd.defaults, 'indexes': indexlist };
            }
        }
        res.send(200, {}, {'status': 'ok', 'data': JSON.stringify(bases) });
    };
    
    this.getData = function(req, res, params)
    {
        var sess;
        if( !this.allow_access ) {
            sess = this.app.requireAdmin(res, params);
        } else {
            sess = this.app.authSession(params);
        }
        
        var base = params['base'];
        var table = params['table'];
        var vals = params['vals'];
        
        var xd = this.app.db.bases[base].tables[table];
        var result = xd.page(params['start'], params['count']);
        res.send(200, {}, {'status': 'ok', 'data': JSON.stringify(result)});        
    };
    
    this.updData = function(req, res, params)
    {
        var sess;
        if( !this.allow_access ) {
            sess = this.app.requireAdmin(res, params);
        } else {
            sess = this.app.authSession(params);
        }
        
        var base = params['base'];
        var table = params['table'];
        var vals = params['vals'];
        
        var xd = this.app.db.bases[base].tables[table];
        var els, el;
        if( 'id' in params ) {
            els = xd.search( 'id', params['id'] );
            if( !els ) {
                res.send(200, {}, {'status': '404', 'message': 'Record not found.'});
                return;
            }
            el = els[0];
            xd.auto(el, params);
        } else {
            el = xd.create( params );
            xd.save(el);
        }
        
        res.send(200, {}, {'status': 'ok', 'data': JSON.stringify(el)} );
    };
};
