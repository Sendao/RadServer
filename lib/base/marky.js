module.exports = function MarkyDB(myapp) {
    var cc = this;
    var app = myapp;
    var db = app.db;
    var dbase = app.dbase;
    this.app = app;

    db.control.call(this, 'marky');
    
    this.List = function() {
        this.name = 'list';
        //this.loadoll = true;
        this.primary = "id";
        this.indice = { 'id': {}, "name": {} };
        this.defaults = { 'name': '' };
        dbase.call(this, app, 'marky');
    };
    this.list = new this.List();
    
    this.Words = function() {
        this.name = 'words';
        this.loadall = true;
        this.primary = "id";
        this.indice = { 'id': {}, "name": {}, 'word': {} };
        this.defaults = { 'listid': 0, 'name': '', 'word': '', 'nexts': '' };
        dbase.call(this, app, 'marky');
    };
    this.words = new this.Words();
    
    this.Sessions = function() {
        this.name = 'sessions';
        this.loadall = true;
        this.indice = { 'ready': {} };
        this.defaults = { 'key': '', 'ready': 0, 'mark': '', 'rate': 0 };
        dbase.call(this, app, 'marky');
    };
    this.sessions = new this.Sessions();
};
