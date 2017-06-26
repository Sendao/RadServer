//https://www.npmjs.com/package/fb
// AppID: 1948355525410418
// AppSecret: app.config.fbsecret


module.exports = function FBSinglet(myapp) {
    var cc = this;
    var app = myapp;
    var db = app.db;
    var dbase = app.dbase;
    this.app = app;
    
    this.Data = function() {
        db.control.call(this, 'fb');
    
        this.Sources = function() {
            this.name = 'sources';
            this.indice = { 'id': {}, 'key': {}, "name": {} };
            this.defaults = { 'key': '', 'name': '', 'dtscan': 0 };
            dbase.call(this, app, 'fb');
        };
        this.sources = new this.Sources();

        this.Updates = function() {
            this.name = 'updates';
            this.indice = {  'id': {}, "key": {} };
            this.defaults = { 'key': '', 'title': '', 'caption': '', 'url': '', 'picurl': '', 'description': '', 'sourceid': '-1', 'dtstamp': 0, 'dtscan': 0, 'permissions': [ 'owner' ] };
            dbase.call(this, app, 'fb' );
        };
        this.updates = new this.Updates();

        this.Albums = function() {
            this.name = 'albums';
            this.indice = {  'id': {}, "key": {} };
            this.defaults = { 'key': '', 'title': '', 'caption': '', 'url': '', 'picurl': '', 'description': '', 'sourceid': '-1', 'dtstamp': 0, 'dtscan': 0, 'permissions': [ 'owner' ] };
            dbase.call(this, app, 'fb' );
        };
        this.albums = new this.Albums();

        this.Users = function() {
            this.name = 'users';
            this.indice = {  'id': {}, "key": {} };
            this.defaults = { 'key': '', 'sourceid': '-1', 'dtscan': 0 };
            dbase.call(this, app, 'fb' );
        };
        this.users = new this.Users();
        
        this.Sessions = function() {
            this.name = 'sessions';
            this.indice = {  'id': {}, "key": {} };
            this.defaults = { 'key': '', 'userid': '-1', 'dtstamp': 0, 'permissions': [ 'guest' ] };
            dbase.call(this, app, 'fb' );
        };
        this.sessions = new this.Sessions();
    };
    
    this.routes = function(router) {
        router.get('/fbreturn').bind( this.fbreturn.bind(this) );
        router.get('fblogin').bind( this.fblogin.bind(this) );
        router.get('/fblogout').bind( this.fblogout.bind(this) );
        router.get('/fbupdates').bind( this.fbupdates.bind(this) );
    };

    this.fbreturn = function(req, res, params)
    {
        // get user identity from secret
        var sessKey = params['c'];
        var sess = this.app.requireUser(res, {'c': sessKey});
        var user = this.app.getUser( sess['userid'] );
        var db = this.app.sing['sess'].base;
        var userdb = db.users;
        
    	// save parameters from oauth
        user.fbauth = params['code'];
        userdb.save(user);
        
        //! route a message to the main site
        // close window
        
        res.send( 200, {}, "Logged into FB." );
    };

    this.fblogin = function(req, res, params)
    {
        // get user authentication information
        var sess = this.app.requireUser(res, params);
        if( !sess ) return;
        
    	// redirect to fb login module
        var fburl = this.app.fb.getLoginUrl({
            'redirect_uri': 'http://spiritshare.ns01.info/fbreturn?c=' + sess.key,
            'scope': 'email,user_friends,public_profile',
            //'display': 'popup',
        });
        
        
        res.send( 302, { 'Location': fburl }, '' );
    };

    this.fblogout = function(req, res, params)
    {
        var sess = this.app.requireUser(res, params);
        if( !sess ) return;
        
        // drop user code
        var user = this.app.getUser( sess['userid'] );
        var db = this.app.sing['sess'].base;
        var userdb = db.users;
        
        user.fbauth = '';
        userdb.save(user);
        
        res.send( 200, {}, {'status':'ok','message':'Logged out.'} );
    };
    
    this.fbupdates = function(req, res, params)
    {
        var sess = this.app.requireUser(res, params);
        if( !sess ) return;
        
        // query the graph api for the user's wall
        // convert wall to objects
        // send objects back
        res.send( 200, {}, { 'status': 'ok' } );
    };
    
    this.updMeta = function(req, res, params)
    {
        var sess;
        if( !this.allow_access ) {
            sess = this.app.requireAdmin(res, params);
        } else {
            sess = this.app.authSession(params);
        }
        
    };
};
