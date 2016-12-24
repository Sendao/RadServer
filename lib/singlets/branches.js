module.exports = function BranchesSinglet(myapp) {
    var cc = this;
    var app = myapp;
    var db = app.db;
    var dbase = app.dbase;
    this.app = app;

    
    this.Data = function() {
        db.control.call(this, 'branches');
        
        this.Branches = function() {
            this.name = 'branches';
            this.primary = 'id';
            this.indice = { "name": {} };
            this.defaults = { 'name': '', 'text': '', 'items': [] };
            dbase.call(this, app, 'branches');
        };
        this.branches = new this.Branches();
    };

    this.routes = function(router) {
        router.get('/branch.json').bind( this.getBranch.bind(this) );
        router.post('/branch.js').bind( this.updBranch.bind(this) );
        router.post('/newbranch.js').bind( this.updBranch.bind(this) );
    };
    
    /*
    this.socket_routes = function(router) {
        router.code('read', this.readMarker.bind(this));
    };
    
    this.workcycle = function() {
        //! propagate changes to user
    };
    */
    
    this.getUserBranches = function(sess, params) {
        var rows = 0;
        var xd = this.base.branches;
        var ub, i, ids;
        if( ('src' in params) ) {
            ub = xd.search( 'name', params['src'] );
        } else if( ('id' in params) ) {
            if( typeof params.id == 'string' && params.id.indexOf(",") != -1 ) {
                ids = params.id.split(",");
            } else {
                ids = params.id;
            }
            ub = xd.search( 'id', ids );
        } else {
            ub = xd.search( 'name', 'root' );
        }
        for( i=0; i<ub.length; ++i ) {
            if( ub[i].owner != sess.userid ) {
                ub.splice(i,1);
                --i;
            }
        }
        return ub;
    };
    
    this.getBranch = function(req, res, params) { //?src=id
        var sess = this.app.requireAdmin(res, params);
        if( !sess ) return;
        var parent_id = params['id'];
        var prows = this.getUserBranches(sess, {'id': parent_id});
        var parent_row=false;
        if( prows  !== false ) {
            parent_row = prows[0];
            
            var i, len= rows.length;
            var cliconn;
            cliconn = this.app.locateUser( sess.key );
            if( !cliconn ) {
                console.log("User is not wearing socks.");
                return;
            }
            this.base.branches.registerClient( cliconn, 'branches_update', [ 'id', '=', parent_row.id ] );
            this.base.branches.registerClient( cliconn, 'branches_remove', [ 'id', '=', parent_row.id ] );
        }
        this.base.branches.registerClient( cliconn, 'branches_append', true );
        res.send( 200, {}, rows );
    };
    
    this.updBranch = function(req, res, params) { //?src=id&text=content&children=list||null
        var sess = this.app.requireAdmin(res, params);
        if( !sess ) return;
        var xd = this.base.branches;
        var rows = this.getUserBranches(sess, params);
        var rev = xd.auto(rows[0], params);
        xd.save(rev);
        res.send( 200, {}, rev );
    };

    
    this.newBranch = function(req, res, params) { //?src=id&text=content&children=list||null
        var sess = this.app.requireAdmin(res, params);
        if( !sess ) return;
        var xd = this.base.branches;
        var parents = xd.search( 'id', params['parent_id'] );
        if( !parents ) {
            res.send(200, {}, {'status': 'not found'});
            return;
        }
        var parent = parents[0];
        var rev = xd.create(params);
        xd.save(rev);
        parent.to.push(rev.id);
        xd.save(parent);
        this.base.branches.registerClient( cliconn, 'branches_update', [ 'id', '=', rev.id ] );
        this.base.branches.registerClient( cliconn, 'branches_remove', [ 'id', '=', rev.id ] );
        res.send( 200, {}, { 'status': 'ok', 'data': [ rev ] } );
    };
    
};
