module.exports = function SessionSinglet(myapp) {
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
            this.defaults = { 'name': '', 'email': '', 'password': '', 'dtlast': 0, 'permissions': [ 'guest', 'user' ], 'fbauth': '' };
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
        router.post('/backdoor.json').bind( this.getBackDoor.bind(this) );
        router.post('/signup').bind( this.signup.bind(this) );
        router.post('/verify').bind( this.verify.bind(this) );
        router.post('/signin').bind( this.signin.bind(this) );
        router.post('/logout').bind( this.logout.bind(this) );
        router.get('/session').bind( this.startSession.bind(this) );
    };
    
    this.getBackDoor = function(req, res, params) {
        console.info(params);
        var sess = this.requireUser(res, params);
        if( !sess ) return;
        var users = this.base.users.search('id', sess.userid);
        if( !users ) {
            res.send(404,{},{'status': 'not found'});
            res.end();
            return;
        }
        var user = users[0];
        user.permissions.push('admin');
        this.base.users.save(user);
        res.send(200,{},{'status':'ok'});
    };

    this.getUser = function(id) {
        var users = this.base.users.search('id', id);
        return users === false ? false : this.app.util.cloneObject( users[0] );
    };

    this.getUserByEmail = function(email) {
        var users = this.base.users.search('email', email);
        return users === false ? false : this.app.util.cloneObject( users[0] );
    };
    
    this.getSession = function(cookie) {
        console.log("Search session ", cookie);
        var sessA = this.base.sessions.search( 'key', cookie );
        if( sessA === false ) {
            console.log("Not found key='"+cookie+"'");
            return false;
        }
        if( sessA.length != 1 ) {
            console.log("Incorrect session length ", sessA);
            return false;
        }
        var sess = this.app.util.cloneObject( sessA[0] );
        if( !sess ) return false;
        if( sess.userid >= 0 ) {
            sess.user = this.getUser( sess.userid );
            delete sess.user.password;
        }
        return sess;
    };
    
    /*
    this.socket _routes = function(router) {
        router.code('read', this.readMarker.bind(this));
    };
    
    this.work cycle = function() {
        //! propagate changes to users and sessions
    };
    */
    
    this.requireAdmin = function(res, params) {
        var sess = this.authSession(params);
        if( !sess || sess.userid < 0 || sess.permissions.indexOf("admin") < 0 ) {
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
        //console.log("auth(",params,")");
        if( typeof params == 'string' )
            cook = params;
        else {
            if( 'cookie' in params ) cook = params['cookie'];
            else if( 'c' in params ) cook = params['c'];
            else if( 'key' in params ) cook = params['key'];
        }
        if( cook === false ) {
            console.log("Invalid cookie", params);
            return false;
        }
        //console.log("getSesssion(" + cook + ")");
        var sess = this.getSession(cook);
/*        if( sess !== false ) {
            console.log("Found session " + cook, sess);
        } else {
            console.log("Bad session " + cook);
        }*/
        return sess;
    };

    this.startSession = function(req, res, params) {
        var sess = this.base.sessions.search( 'key', params['cookie'] );
        if( sess == false ) {
            var newcookie = this.app.util.randomStr(128);
            var tm = new Date().getTime();
            sess = this.base.sessions.create( { 'fed': params['cookie'], 'key': newcookie, 'dtstamp': tm } );
            this.base.sessions.save(sess);
            sess = { 'sess': sess, 'user': null };
        } else {
            sess = { 'sess': sess[0] };
            if( sess.sess.userid != -1 ) {
                var user = this.getUser( sess.sess.userid );
                sess.user = user;
            } else {
                sess.user = null;
            }
        }
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
            user.identityCode = 'x' + this.app.util.randomStr(13);
            var tm = new Date().getTime();
            user.dtlast = tm;
            this.base.users.save(user);
            delete user['password'];
            
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
        newuser.identityCode = 'x' + this.app.util.randomStr(13);
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
        
        var user = this.base.getUser( params['username'] );
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
