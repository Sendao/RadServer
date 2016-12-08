module.exports = function GGridDB(myapp) {
    var cc = this;
    this.app = myapp;
    var db = myapp.db;
    db.control.call(this, 'ggrid');
    
    this.Searchers = function() {
        this.name = 'searchers';
        this.indice = { 'id': {}, "name": {} };
        this.defaults = { 'name': '', 'terms': '', 'lastDt': 0, 'scanDt': 0 };
        db.convey.call(this, 'ggrid');
    };
    this.searchers = new this.Searchers();
    
    this.Pages = function() {
        this.name = 'pages';
        this.indice = { 'id': {}, "name": {}, "uri": {} };
        this.defaults = { 'name': '', 'uri': '', 'contents': '', 'textContent': '', 'loadDt': 0, 'refreshDt': 0, 'refresh': false };
        db.convey.call(this, 'ggrid');
    };
    this.pages = new this.Pages();
};
