module.exports = function Could9DB(Database) {
	var db = Database;
	Database.control.call(this, 'could9');
	console.log("could9 db created");
	
    this.Users = function() {
    	this.name = 'users';
        this.primary = "id";
        this.indice = { 'id': {}, "name": {} };
        this.defaults = { 'name': '', 'email': '', 'password': '' };
        db.convey.call(this, 'could9');
    };
    this.users = new this.Users();
    
    this.Sessions = function() {
    	this.name = 'sessions';
        this.primary = "id";
        this.indice = { 'id': {}, "cookie": {} };
        this.defaults = { 'cookie': '', 'userid': '' };
        db.convey.call(this, 'could9' );
    };
    this.sessions = new this.Sessions();
    
};
