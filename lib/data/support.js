export function SupportData() {

    this.users = [];
    this.ticket_admins = [];
    this.ticket_watchers = {};

    this.addUser = function(userid, pagekey)
    {
        var client = this.app.locateUser(pagekey, true);

        if( client == false ) {
            console.log("Invalid client/no socket found");
            return;
        }
        var i;

        for( i=0; i<this.users.length; ++i ) {
            if( this.users[i].pagekey == pagekey ) return;
        }
        var user = { 'pagekey': pagekey, 'userid': userid };
        this.users.push(user);
    };

    this.registerAdmin = function(userid)
    {
        if( this.ticket_admins.indexOf(userid) == -1 )
            this.ticket_admins.push(userid);
    };

    this.registerUserTicket = function(userid, ticketid)
    {
        if( !(ticketid in this.ticket_watchers) )
            this.ticket_watchers[ticketid] = [];
        else if( this.ticket_watchers[ticketid].indexOf(userid) != -1 )
            return;
        this.ticket_watchers[ticketid].push(userid);
    };

    this.messageUser = function(userid, message) {
      var i;
      var client=false,pagekey;
      for( i=0;i<this.users.length;++i ) {
        if( this.users[i].userid == userid ) {
          client = this.app.locateUser(this.users[i].pagekey, true);
          if( client != false ) {
            client.send(message,null,false);
          } else {
            pagekey = this.users[i].pagekey;
            this.users.splice(i,1);
            --i;
            //this.unregisterUser(pagekey);
          }
        }
      }
    };

	this.workcycle = function(){
		//! debug, possibly
	};

};
