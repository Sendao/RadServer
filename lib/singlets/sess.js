module.exports = function BranchesSinglet(myapp) {
    var cc = this;
    var app = myapp;
    var db = app.db;
    var dbase = app.dbase;
    this.app = app;
    
    this.Data = function() {
        db.control.call(this, 'auth');
    
        this.Users = function() {
            this.name = 'users';
            this.indice = { 'id': {}, "name": {}, "email": {} };
            this.defaults = { 'name': '', 'email': '', 'password': '', 'dtlast': 0, 'permissions': [ 'guest', 'user' ] };
            dbase.call(this, app, 'auth');
        };
        this.users = new this.Users();
        
        this.Sessions = function() {
            this.name = 'sessions';
            this.indice = {  'id': {}, "key": {} };
            this.defaults = { 'key': '', 'fed': '', 'userid': '-1', 'dtstamp': 0, 'permissions': [ 'guest' ] };
            dbase.call(this, app, 'auth' );
        };
        this.sessions = new this.Sessions();
    };
    
    this.routes = function(router) {
        router.post('/signup').bind( this.signup.bind(this) );
        router.post('/verify').bind( this.verify.bind(this) );
        router.post('/signin').bind( this.signin.bind(this) );
        router.post('/logout').bind( this.logout.bind(this) );
        router.get('/session').bind( this.startSession.bind(this) );
    };

    this.getUser = function(id) {
        var users = this.data.users.search('id', id);
        return users[0];
    };

    this.getUserByEmail = function(email) {
        var users = this.data.users.search('email', email);
        return users[0];
    };
    
    this.getSession = function(cookie) {
        console.log("Search session ", cookie);
        var sessA = this.base.sessions.search( 'key', cookie );
        if( sessA === false ) {
            console.log("Not found key='"+cookie+"'");
            return false;
        }
        if( sessA.length != 1 ) console.log("Incorrect session length ", sessA);
        var sess = sessA[0];
        return sess;
    };
    
    /*
    this.socket_routes = function(router) {
        router.code('read', this.readMarker.bind(this));
    };
    
    this.workcycle = function() {
        //! propagate changes to users and sessions
    };
    */
    
    this.requireAdmin = function(res, params) {
        var sess = this.authSession(params);
        if( !sess || ( sess.userid < 0 || sess.username != 'sendao' ) ) {
            res.send(200,{},{'status':'Unauthorized'});
            res.end();
            return false;
        }
        return sess;
    };
    
    this.requireUser = function(res, params) {
        var sess = this.authSession(params);
        if( !sess || ( sess.userid < 0 ) ) {
            res.send(200,{},{'status':'Unauthorized'});
            res.end();
            return false;
        }
        return sess;
    };
    
    this.requireAuth = function(res, params) {
        var sess = this.authSession(params);
        if( !sess ) {
            res.send(200,{},{'status':'Unauthorized'});
            res.end();
            return false;
        }
        return sess;
    };
    
    this.requireAuth2 = function(res, params, flags) {
        var sess = this.authSession(params);
        var i, found = false;
        if( typeof flags != 'object' ) flags = [flags];
        if( sess ) {
            for( i=0; i<flags.length; ++i ) {
                if( sess.permissions.indexOf(flags[i]) == -1 ) {
                    found=true;
                    break;
                }
            }
        }
        if( !sess || ( found == true ) ) {
            res.send(200,{},{'status':'Unauthorized'});
            res.end();
            return false;
        }
        return sess;
    };
    
    this.authSession = function(params) {
        var cook=false;
        if( typeof params == 'string' )
            cook = params;
        else {
            if( 'cookie' in params ) cook = params['cookie'];
            else if( 'c' in params ) cook = params['c'];
            else cook = params['key'];
        }
        if( cook === false ) {
            console.log("Invalid cookie", params);
            return false;
        }
        console.log("getSesssion(" + cook + ")");
        var sess = this.getSession(cook);
        if( sess !== false ) {
            console.log("Found session " + cook, sess);
        } else {
            console.log("Bad session " + cook);
        }
        return this.app.util.cloneObject(sess);
    };

    this.startSession = function(req, res, params) {
        var newcookie = this.app.randomStr(128);
        var tm = new Date().getTime();
        var sess = this.base.sessions.create( { 'fed': params['cookie'], 'key': newcookie, 'dtstamp': tm } );
        this.base.sessions.save(sess);
        console.log("New session ", sess);
        res.send(200, {}, {'status': 'ok', 'data': sess});
    };
    
    this.logout = function(req, res, params) {
        var auth = this.requireAuth2(res, params, ['user']);
        if( auth === false ) return;
        auth.userid = false;
        auth.idcode = false;
        this.base.sessions.save(auth);
        res.send(200, {}, {'status': 'ok'});
    };
    this.signin = function(req, res, params) {
        var auth = this.requireAuth(res, params);
        if( auth === false ) return;
        var username = params['username'];
        var password = params['password'];
        
        var users = this.base.users.search('name', username);
        var len = users.length, found=false, user;
        for( var i = 0; i < len; ++i ) {
            user = users[i];
            if( user.password == password ) {
                found=true;
                break;
            }
        }
        if( !found ) {
            res.send(200, {}, {'status': 'incorrect'});
        } else {
            user.identityCode = 'x' + this.app.randomStr(13);
            var tm = new Date().getTime();
            user.dtlast = tm;
            this.base.users.save(user);
            
            user = this.app.util.cloneObject(user);
            delete user.password;
            
            auth.userid = user.id;
            auth.idcode = user.identityCode;
            auth.permissions = user.permissions;
            this.base.sessions.save(auth);
            res.send(200, {}, {'status': 'ok', 'sess': auth, 'user': user});
        }
    };
    this.signup = function(req, res, params) {
        var auth = this.requireAuth(res, params);
        if( auth === false ) return;
        var username = params['username'];
        var password = params['password'];
        
        if( params['username'] == '' || params['password'] == '' ) {
            res.send(200, {}, {'status': 'incorrect'});
            return;
        }
        if( auth === false ) {
            res.send(200, {}, {'status': 'no session connection'});
            return;
        }
        if( this.base.users.search( 'name', username ) !== false ) {
            res.send(200, {}, {'status': 'existing user'});
            return false;
        }
        var newuser = this.base.users.create( { 'name': username, 'password': password } );
        if( newuser === false ) {
            res.send(200, {}, {'status': 'existing user'});
            return;
        }
        newuser.email = params['email'];
        var tm = new Date().getTime();
        newuser.dtlast = tm;
        newuser.permissions = [ 'user', 'guest', 'newbie' ];
        this.base.users.save(newuser);
        newuser.identityCode = 'x' + this.app.randomStr(13);
        delete newuser.password;
        auth.idcode = newuser.identityCode;
        auth.userid = newuser.id;
        auth.permissions = newuser.permissions;
        this.base.sessions.save(auth);
        
        //! Todo: send email to users
        
        res.send(200, {}, {'status': 'ok', 'user': newuser, 'sess': auth});
    };
    
    this.verify = function(req, res, params) {
        var auth = this.requireAuth2(res, params, 'user');
        if( !auth ) return;
        
        var user = this.data.getUser( params['username'] );
        if( user.identityCode.substr(0,1) == 'x' && user.identityCode == params['code'] ) {
            user.identityCode = 'user';
            var tm = new Date().getTime();
            user.dtlast = tm;
            user.permissions.push( 'verified' );
            this.base.users.save(user);
            auth.userid = user.id;
            auth.permissions = user.permissions;
            this.base.sessions.save(auth);
            res.send(200, {}, {'status': 'ok', 'user': user, 'sess': auth});
        } else {
            res.send(200, {}, {'status': 'incorrect'});
        }
    };
    
};
