module.exports = function Could9DB(myapp) {
    var cc = this;
    this.app = myapp;
    var db = myapp.db;
    Database.control.call(this, 'marky');
    
    this.List = function() {
        this.name = 'list';
        this.loadoll = true;
        this.primary = "id";
        this.indice = { 'id': {}, "name": {} };
        this.defaults = { 'name': '' };
        db.convey.call(this, 'marky');
    };
    this.list = new this.List();
    
    this.Words = function() {
        this.name = 'words';
        this.loadall = true;
        this.primary = "id";
        this.indice = { 'id': {}, "name": {} };
        this.defaults = { 'listid': 0, 'name': '', 'nexts': '' };
        db.convey.call(this, 'marky');
    };
    this.words = new this.Words();
    
    this.Sessions = function() {
        this.name = 'sessions';
        this.loadall = true;
        this.defaults = { 'key': '', 'mark': '', 'rate': 0 };
        db.convey.call(this, 'marky');
    };
    this.sessions = new this.Sessions();
};
