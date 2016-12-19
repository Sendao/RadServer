//https://github.com/mikedeboer/node-github

module.exports = function RevisionDB(myapp) {
    var cc = this;
    var app = myapp;
    var db = app.db;
    var dbase = app.dbase;
    this.app = app;

    db.control.call(this, 'revision');
    
    this.Sites = function() {
        this.name = 'sites';
        this.primary = "name";
        this.unique = 'id';
        this.indice = { "name": {}, 'id': {} };
        this.defaults = {
        		'name': '',
        		'id': 0,
        		'uri': '',
        		'type': 'github',
        		'auth': 'none',
        		'authuser': 'none',
        		'authpass': 'none',
        		'authtok': 'none',
        		'authkey': 'none'
        	};
        dbase.call(this, app, 'revision');
    };
    
    this.Base = function(site) {
        this.name = site.name + "/base";
        this.primary = 'id';
        this.indice = { 'id': {}, 'name': {}, 'site': {} };
        this.defaults = { 'id': 0,
        		'site': site.name,
        		'name': 'default',
        		'uri': '',
        		'updtime': 0
        	};
        dbase.call(this, app, 'revision');
    };
    
    this.sites = new this.Sites();
};
