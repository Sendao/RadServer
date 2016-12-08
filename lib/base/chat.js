module.exports = function ChatDB(myapp) {
    var cc = this;
    this.app = myapp;
    var db = myapp.db;
    
    db.control.call(this, 'chat');
        
    this.Posts = function() {
        this.name = 'posts';
        this.primary = "id";
        this.indice = { 'id': {}, 'name': {}, "when": {}, "fromip": {} };
        this.unique = [ 'id' ];
        this.defaults = { 'id': '', 'name': '', 'when': '0', 'fromip': '0.0.0.0', 'message': 'who?' };
        db.convey.call(this, 'chat');
    };
    
    this.posts = new this.Posts();
    
};
