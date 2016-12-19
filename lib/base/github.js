module.exports = function GithubDB(myapp) {
    var cc = this;
    var app = myapp;
    var db = app.db;
    var dbase = app.dbase;
    this.app = app;

    db.control.call(this, 'github');
    
    this.Projects = function() {
        this.name = 'projects';
        this.loadoll = true;
        this.indice = { "name": {} };
        this.defaults = { 'name': '', 'host': '', 'status': 'offline' };
        dbase.call(this, app, 'github');
    };
    this.projects = new this.Projects();
    
    this.Branches = function() {
        this.name = 'branches';
        this.loadall = true;
        this.indice = { "name": {} };
        this.defaults = { 'name': '', 'hostid': '', 'status': 'offline' };
        dbase.call(this, app, 'github');
    };
    this.branches = new this.Branches();
    
    this.Targets = function() {
        this.name = 'targets';
        this.loadall = true;
        this.defaults = { 'name': '', 'groupid': '', 'status': 'offline' };
        dbase.call(this, app, 'github');
    };
    this.targets = new this.Targets();
};
