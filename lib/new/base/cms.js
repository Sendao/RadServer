module.exports = function CMSDB(Database) {
	var db = Database;
	Database.control.call(this, 'cms');
	
    this.Modules = function() {
        this.name = 'modules';
        this.primary = "id";
        this.indice = { 'id': {} };
        this.defaults = { 'dt': 0, 'name': '', 'config': {} };
        db.convey.call(this, 'cms');
    };
    this.modules = new this.Modules();
    this.Layouts = function() {
        this.name = 'layouts';
        this.primary = "id";
        this.indice = { 'id': {} };
        this.defaults = { 'dt': 0, 'name': '' };
        db.convey.call(this, 'cms');
    };
    this.layouts = new this.Layouts();
    this.Posts = function() {
        this.name = 'posts';
        this.primary = "id";
        this.indice = { 'id': {} };
        this.defaults = { 'dt': 0, 'name': '' };
        db.convey.call(this, 'cms');
    };
    this.posts = new this.Posts();
    this.Scripts = function() {
        this.name = 'scripts';
        this.primary = "id";
        this.indice = { 'id': {} };
        this.defaults = { 'dt': 0, 'name': '', 'content': '' };
        this.db = new Database();        
        db.convey.call(this, 'cms');
    };
    this.scripts = new this.Scripts();
};
