module.exports = function GithubDB(myapp) {
    var cc = this;
    this.app = myapp;
    var db = myapp.db;
    db.control.call(this, 'github');
    
    this.Projects = function() {
        this.name = 'projects';
        this.loadoll = true;
        this.indice = { "name": {} };
        this.defaults = { 'name': '', 'host': '', 'status': 'offline' };
        db.convey.call(this, 'github');
    };
    this.projects = new this.Projects();
    
    this.Branches = function() {
        this.name = 'branches';
        this.loadall = true;
        this.indice = { "name": {} };
        this.defaults = { 'name': '', 'hostid': '', 'status': 'offline' };
        db.convey.call(this, 'github');
    };
    this.branches = new this.Branches();
    
    this.Targets = function() {
        this.name = 'targets';
        this.loadall = true;
        this.defaults = { 'name': '', 'groupid': '', 'status': 'offline' };
        db.convey.call(this, 'github');
    };
    this.targets = new this.Targets();
};
