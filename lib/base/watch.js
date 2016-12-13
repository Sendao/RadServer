module.exports = function WatchDB(myapp) {
    var cc = this;
    this.app = myapp;
    var db = myapp.db;
    db.control.call(this, 'watch');
    
    this.Hosts = function() {
        this.name = 'hosts';
        this.loadoll = true;
        this.indice = { "name": {} };
        this.defaults = { 'name': '', 'host': '', 'status': 'offline' };
        db.convey.call(this, 'watch');
    };
    this.hosts = new this.Hosts();
    
    this.Groups = function() {
        this.name = 'groups';
        this.loadall = true;
        this.indice = { "name": {} };
        this.defaults = { 'name': '', 'hostid': '', 'status': 'offline' };
        db.convey.call(this, 'watch');
    };
    this.groups = new this.Groups();
    
    this.Procs = function() {
        this.name = 'procs';
        this.loadall = true;
        this.defaults = { 'name': '', 'groupid': '', 'status': 'offline' };
        db.convey.call(this, 'watch');
    };
    this.procs = new this.Procs();
};
