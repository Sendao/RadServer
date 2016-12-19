module.exports = function CMSDB(myapp) {
    var cc = this;
    var app = myapp;
    var db = app.db;
    var dbase = app.dbase;
    this.app = app;

	db.control.call(this, 'cms');
	
    this.Modules = function() {
        this.name = 'modules';
        this.defaults = { 'dt': 0, 'name': '', 'config': {}, 'mainscript': -1 };
        dbase.call(this, app, 'cms');
    };
    this.modules = new this.Modules();
    this.Layouts = function() {
        this.name = 'layouts';
        this.defaults = { 'dt': 0, 'name': '', 'scriptid': -1 };
        dbase.call(this, app, 'cms');
    };
    this.layouts = new this.Layouts();
    this.Posts = function() {
        this.name = 'posts';
        this.defaults = { 'dt': 0, 'name': '', 'scriptid': -1 };
        dbase.call(this, app, 'cms');
    };
    this.posts = new this.Posts();
    this.Scripts = function() {
        this.name = 'scripts';
        this.defaults = { 'dt': 0, 'name': '', 'content': '' };
        dbase.call(this, app, 'cms');
    };
    this.scripts = new this.Scripts();
    
};
