const crypto = await import('node:crypto');

// 1. To Create a Hash
function passwordToSaltHash(password)
{
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(password, salt, 64).toString('hex');
    return [salt, hash];
}

// 2. To Verify a Password
function verifyPassword(password, salt, hash)
{
    const hash2 = crypto.scryptSync(password, salt, 64).toString('hex');
    return hash2 === hash;
}

// Usage
//const storedHash = hashPassword('my-secure-password');
//const isCorrect = verifyPassword('my-secure-password', storedHash);


export function Auth(app)
{
  this.app = app;
  app.sess = this;
  
  this.startup = function(app)
  {
    console.log("starting session manager");
    return ['dbx'];
  }
  this.init = async function(app)
  {
    console.log("starting session database tables");
    this.chats = await this.app.dbx.table('chats', ['userid','message','time','fromid','toid'], ['fromid','toid','time']);
    this.users = await this.app.dbx.table('users', ['name','email','password','passsalt','pckey','isagent','auth'], ['name','email']);
    this.sessions = await this.app.dbx.table('sess', ['pckey','userid','time'], ['pckey','userid','time']);
  }

  this.getUser = async function(userid)
  {
    const user = await this.users.get(userid);
    return user;
  };
  this.getUserByName = async function(name)
  {
    const users = await this.users.scan({name});
    if( users.length == 1 )
      return users[0];
  };
  this.getUserSafe = async function(userid)
  {
    const userSafe = await this.users.get(userid);
    delete userSafe.password;
    delete userSafe.passsalt;
    return userSafe;
  };
  this.userLogout = async function(sess)
  {
    const user = sess.user;
    const userCopy = await this.getUser(user.id);
    userCopy.pckey = '';
    await this.users.save(userCopy);
    delete sess.user;
    sess.userid = -1;
    await this.sessions.save(sess);
  };
  this.userLogin = async function(name, password, pckey)
  {
    const user = await this.getUserByName(name);
    if( user == null ) return false;

    if( verifyPassword(password, user.passsalt, user.password) ) {
      user.pckey = pckey;
      await this.users.save(user);

      delete user.passsalt;
      delete user.password;
      return user;
    }

    return true;
  };
  this.userRegister = async function(name, text_pass, pckey)
  {
    const user_check = await this.getUserByName(name);
    if( user_check !== null ) return false;

    const [passsalt, password] = passwordToSaltHash(text_pass);
    const user = await this.users.create({name,password,passsalt,pckey});

    return user;
  };

  this.findUserSession = async function(users, pckey)
  {
    var user;
    for( user of users ) {
      if( user.pckey != pckey ) continue;
        
      delete user.password;
      delete user.passsalt;

      const sessions = await this.sessions.scan({'userid':user.userid});
      var sess;
      for( sess of sessions ) {
        if( sess.pckey != user.pckey ) continue;
        sess.user = user;
        return sess;
      }
      const time = parseInt( Date.now().getTime()/1000 );
      sess = await this.sessions.create({'userid':user.userid,'pckey':params['pckey'], time});
      sess.user = user;
      return sess;
    }

    return null;
  }

  this.findSession = async function(sessions, params)
  {
    var sess;
    for( sess of sessions ) {
      if( !isNaN(sess.userid) && sess.userid != -1 ) {
        const user = await this.getUserSafe(sess.userid);
        sess.user = user;
        return sess;
      }
    }

    for( sess of sessions ) {
      if( sess['pckey'] == params['pckey'] ) {
        sess.user = null;
        return sess;
      }
    }
    return null;
  }
  this.findOrMakeSession = async function(sessions, params)
  {
    var sess = this.findSession(sessions, params);
    if( sess != null ) return sess;

    const time = Date.now().getTime()/1000;
    sess = await this.sessions.create({'pckey':sess['pckey'],'userid':-1,time});
    sess.pckey = params['pckey'];
    await this.sessions.save( sess );
    sess.user = null;
    return sess;
  }

  this.getSession = async function(r, p, force=false)
  {
    let pckey = p['pckey'];
    if( typeof pckey == 'undefined' ) {
	    pckey = r.cookies['pckey'];
	    if( typeof pckey == 'undefined' )
		    throw "A fit";
    }
    let e = await this.users.scan({pckey});
    var sess;

    if( e.length > 0 ) {
      sess = await this.findUserSession(e, p);
      if( sess != null ) return sess;
    }

    e = await this.sessions.scan({pckey});
    if( force )
      sess = await this.findOrMakeSession(e, p);
    else
      sess = await this.findSession(e, p);
    return sess;
  }

  const parent = this;
  this.modlocaL = function() {
    this.get_session = this.getSession = async function(r, s, p)
    {
      const sess = await parent.getSession(r,p,true);
      return sess;
    };
    this.loginRoute = async function(r, s, p)
    {
      const sess = await parent.getSession(r,p,true);
      if( sess.user !== null ) {
        this.respond.jsonOk(s, {status:'already logged in'});
        return false;
      }
      const user = await parent.userLogin(p['name'], p['pass'], pckey);
      if( user === false ) {
        this.respond.jsonOk(s, {status:'user exists'});
        return false;
      }
      sess.userid = user.id;
      const time = parseInt( Date.now().getTime()/1000 );
      sess.time = time;
      await parent.sessions.save(sess);

      delete user.password;
      delete user.passsalt;
      this.respond.jsonOk(s, {user,sess,status:'ok',pckey});
      return true;
    };
    this.logoutRoute = async function(r, s, p)
    {
      const sess = await parent.getSession(r,p,true);
      if( !('user' in sess) || sess.user === null ) {
        this.respond.jsonOk(s, {status:'not logged in'});
        return false;
      }

      const userid = sess.user.id;
      delete sess.user;
      sess.userid = -1;
      await parent.sessions.save(sess);

      const userCopy = await parent.getUser(userid);
      userCopy.pckey = '';
      await parent.users.save(userCopy);

      this.respond.jsonOk(s, {status:'logged out'});
      return true;
    }
      
    this.registerRoute = async function(r, s, p)
    {
      const sess = await parent.getSession(r,p,true);
      if( sess.user !== null ) {
        this.respond.jsonOk(s, {status:'already logged in'});
        return false;
      }

      const user = await parent.userRegister(p['name'], p['pass'], p['pckey']);
      if( user === false ) {
        this.respond.jsonOk(s, {status:'user exists'});
        return false;
      }

      user.pckey = sess.pckey;
      await parent.users.save(user);

      sess.userid = user.id;
      delete sess.user;
      await parent.sessions.save(sess);

      this.respond.jsonOk(s,{user,sess,status:'ok',pckey});
      return true;
    };

    this.requireSession = async function(r, s, p)
    {
      const sess = await parent.getSession(r,p,true);
      return sess;
    };
    this.requireUser = async function(r, s, p)
    {
      const sess = await this.requireSession(r,s,p);
      if( !('user' in sess) || sess.user === null ) {
        return false;
      }
      return sess;
    };
    this.requireAdmin = async function(r, s, p)
    {
      const sess = await this.requireUser(r,s,p);
      const user = sess.user;
      if( isNaN(user.auth) || user.auth <= 0 )
        return null;
      return user;
    };
  };
};

