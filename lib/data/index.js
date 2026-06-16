export function IndexData(app) {

  this.app = app;

  this.tzadjust = 0;
// Socket controls
  this.thefoot = {};
  this.ensockify = function(pagekey, userid) {
    if( pagekey in this.thefoot ) return;
    this.thefoot[pagekey] = userid;
  };
  this.closeClient = function(pagekey) {
    delete this.thefoot[pagekey];
  };
  this.broadcast = function(msg) {
    var i, ids=[];
    for( i in this.thefoot ) {
      ids.push(i);
    }
    for( i=0; i<ids.length; ++i ) {
      this.messageUser2( ids[i], msg );
    }
  };
  this.messageUser2 = function(userid, message) {
    if( !(userid in this.thefoot) ) return;
    let client = this.app.locateUser(userid, true);
    if( client !== false ) {
      client.send(message,null,false);
    } else {
      delete this.thefoot[userid];
    }
  };
  this.messageUser = function(userid, message) {
    var i, found=false;
    for( i in this.thefoot ) {
      if( i == userid || this.thefoot[i] == userid ) {
        this.messageUser2(i, message);
        found=true;
      }
    }
    if( !found ) {
      console.log("User not found " + userid + ", ", this.thefoot);
    }
  };

};
