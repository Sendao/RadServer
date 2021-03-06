module.exports = function ChatDB(myapp) {
    var cc = this;
    var app = myapp;
    var db = app.db;
    var dbase = app.dbase;
    this.app = app;

    db.control.call(this, 'chat');
        
    this.Posts = function() {
        this.name = 'posts';
        this.primary = "id";
        this.indice = { 'id': {}, 'name': {}, "when": {}, "fromip": {} };
        this.unique = [ 'id' ];
        this.defaults = { 'id': '', 'name': '', 'when': '0', 'fromip': '0.0.0.0', 'message': 'who?' };
        dbase.call(this, app, 'chat');
    };
    
    this.posts = new this.Posts();
    
};
