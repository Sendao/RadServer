module.exports = function Could9DB(Database) {
    var db = Database;
    Database.control.call(this, 'chat');
    
    this.Users = function() {
        this.name = 'users';
        this.primary = "id";
        this.unique = [ 'id' ];
        this.indice = { 'id': {}, 'name': {}, "when": {}, "fromip": {} };
        this.defaults = { 'id': 0, 'name': '', 'when': '0', 'fromip': '0.0.0.0' };
        db.convey.call(this, 'chat');
    };
    
    this.Posts = function() {
        this.name = 'posts';
        this.primary = "id";
        this.indice = { 'id': {}, 'name': {}, "when": {}, "fromip": {} };
        this.unique = [ 'id' ];
        this.defaults = { 'id': '', 'name': '', 'when': '0', 'fromip': '0.0.0.0', 'message': 'who?' };
        db.convey.call(this, 'chat');
    };
    
    this.users = new this.Users();
    this.posts = new this.Posts();
};
