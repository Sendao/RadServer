module.exports = function GGridDB(myapp) {
    var cc = this;
    var app = myapp;
    var db = app.db;
    var dbase = app.dbase;
    this.app = app;

    db.control.call(this, 'ggrid');
    
    this.Searchers = function() {
        this.name = 'searchers';
        this.indice = { 'id': {}, "name": {}, 'lastDt': {} };
        this.defaults = { 'name': '', 'terms': '', 'lastDt': 0, 'scanDt': 0 };
        dbase.call(this, app, 'ggrid');
    };
    this.searchers = new this.Searchers();
    
    this.Pages = function() {
        this.name = 'pages';
        this.indice = { 'id': {}, "name": {}, "uri": {} };
        this.defaults = { 'name': '', 'uri': '', 'contents': '', 'textContent': '', 'loadDt': 0, 'refreshDt': 0, 'refresh': false };
        dbase.call(this, app, 'ggrid');
    };
    this.pages = new this.Pages();
};
