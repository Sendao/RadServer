module.exports = function CMSDB(myapp) {
    var cc = this;
    this.app = myapp;
    var db = myapp.db;

	db.control.call(this, 'cms');
	
    this.Modules = function() {
        this.name = 'modules';
        this.defaults = { 'dt': 0, 'name': '', 'config': {} };
        db.convey.call(this, 'cms');
    };
    this.modules = new this.Modules();
    this.Layouts = function() {
        this.name = 'layouts';
        this.defaults = { 'dt': 0, 'name': '' };
        db.convey.call(this, 'cms');
    };
    this.layouts = new this.Layouts();
    this.Posts = function() {
        this.name = 'posts';
        this.defaults = { 'dt': 0, 'name': '' };
        db.convey.call(this, 'cms');
    };
    this.posts = new this.Posts();
    this.Scripts = function() {
        this.name = 'scripts';
        this.defaults = { 'dt': 0, 'name': '', 'content': '' };
        db.convey.call(this, 'cms');
    };
    this.scripts = new this.Scripts();
    this.files = new this.File();
    this.Files = function() {
        this.name = 'scripts';
        db.convey.call(this, 'cms');
    };
    
};
