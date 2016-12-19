module.exports = function Could9DB(myapp) {
    var cc = this;
    var app = myapp;
    var db = app.db;
    var dbase = app.dbase;
    this.app = app;

    db.control.call(this, 'forum');
    
    this.Topics = function() {
        this.name = 'topics';
        this.indice = { 'name': '' };
        this.defaults = { 'name': '', 'tags': {}, 'folds': [], 'rootfolder': 0 };
        dbase.call(this, app, 'forum');
    };
    this.topics = new this.Topics();

    this.Tags = function() {
        this.name = 'tags';
        this.indice = { 'name': '' };
        this.defaults = { 'name': '', 'topics': [], 'rootfolder': 0 };
        dbase.call(this, app, 'forum');
    };
    this.tags = new this.Tags();
    

};
