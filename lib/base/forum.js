module.exports = function Could9DB(myapp) {
    var cc = this;
    this.app = myapp;
    var db = myapp.db;
    db.control.call(this, 'forum');
    
    this.Topics = function() {
        this.name = 'topics';
        this.indice = { 'name': '' };
        this.defaults = { 'name': '', 'tags': {}, 'folds': [], 'rootfolder': 0 };
        db.convey.call(this, 'forum');
    };
    this.topics = new this.Topics();

    this.Tags = function() {
        this.name = 'tags';
        this.indice = { 'name': '' };
        this.defaults = { 'name': '', 'topics': [], 'rootfolder': 0 };
        db.convey.call(this, 'forum');
    };
    this.tags = new this.Tags();
    

};
