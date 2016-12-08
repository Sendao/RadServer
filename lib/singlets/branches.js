module.exports = function BranchesSinglet(myapp) {
    this.app = myapp;
    var db = myapp.db;
    this.Data = function() {
        db.control.call(this, 'branches');
        
        this.Branches = function() {
            this.name = 'branches';
            this.indice = { "name": {} };
            this.defaults = { 'name': '', 'to': '', 'password': '' };
            db.convey.call(this, 'branches');
        };
        this.branches = new this.Branches();
    };

    this.routes = function(router) {
        router.get('/branches.json').bind( this.getBranches.bind(this) );
        router.post('/branch.js').bind( this.updBranch.bind(this) );
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
        if( ('src' in params) ) {
            rows = xd.search( { 'owner': sess.userid, 'name': params['src'] } );
        } else if( ('id' in params) ) {
            rows = xd.search( { 'owner': sess.userid, 'id': params['id'] } );
        }
        return rows;
    };
    
    this.getBranches = function(req, res, params) { //?src=id
        var sess = this.app.authSession(params);
        if( !sess || !sess.userid ) {
            res.send( 200, {}, "unauthorized" );
            return;
        }
        var rows = this.getUserBranches(sess, params);
        if( rows !== false ) {
            var i, len= rows.length;
            var cliconn;
            cliconn = this.app.locateUser( sess.key );
            if( !cliconn ) {
                console.log("User is not wearing socks.");
                return;
            }
            for( i=0; i<len; ++i ) {
                this.base.branches.registerClient( cliconn, 'branches_update', [ 'id', '=', rows[i].id ] );
                this.base.branches.registerClient( cliconn, 'branches_remove', [ 'id', '=', rows[i].id ] );
            }
        }
        this.base.branches.registerClient( cliconn, 'branches_append', true );
        res.send( 200, {}, rows );
    };
    
    this.updBranch = function(req, res, params) { //?src=id&text=content&children=list||null
        var sess = this.app.authSession(params);
        if( !sess || !sess.userid ) {
            res.send( 200, {}, "unauthorized" );
            return;
        }
        var xd = this.base.branches;
        var rows = this.getUserBranches(sess, params);
        var rev = xd.auto(rows[0], params);
        xd.save(rev);
        res.send( 200, {}, rev );
    };
    
};
