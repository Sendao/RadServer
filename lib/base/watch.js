module.exports = function WatchDB(myapp) {
    var cc = this;
    var app = myapp;
    var db = app.db;
    var dbase = app.dbase;
    this.app = app;

    db.control.call(this, 'watch');
    
    this.Hosts = function() {
        this.name = 'hosts';
        this.loadoll = true;
        this.indice = { "name": {} };
        this.defaults = { 'name': '', 'host': '', 'status': 'offline' };
        dbase.call(this, app, 'watch');
    };
    this.hosts = new this.Hosts();
    
    this.Groups = function() {
        this.name = 'groups';
        this.loadall = true;
        this.indice = { "name": {} };
        this.defaults = { 'name': '', 'hostid': '', 'status': 'offline' };
        dbase.call(this, app, 'watch');
    };
    this.groups = new this.Groups();
    
    this.Procs = function() {
        this.name = 'procs';
        this.loadall = true;
        this.defaults = { 'name': '', 'groupid': '', 'status': 'offline' };
        dbase.call(this, app, 'watch');
    };
    this.procs = new this.Procs();
};
