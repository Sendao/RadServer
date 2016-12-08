module.exports = function CMSDB(myapp) {
    var cc = this;
    this.app = myapp;
    var db = myapp.db;
    db.control.call(this, 'vfs');
    
    this.Files = function() {
        this.name = 'files';
        this.defaults = { 'name': '', 'enc': 'binary', 'folds': [], 'tags': [], 'content': '' };
        db.convey.call(this, 'vfs');
    };
    this.files = new this.Files();
    
    
    this.Folds = function() {
        this.name = 'folds';
        this.defaults = { 'name': '', 'folds': [], 'files': [] };
        db.convey.call(this, 'vfs');

    };
    this.folds = new this.Folds();    
    
};
