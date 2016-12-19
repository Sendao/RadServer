module.exports = function Could9DB(myapp) {
    var cc = this;
    var app = myapp;
    var db = app.db;
    var dbase = app.dbase;
    this.app = app;

    db.control.call(this, 'stocks');
	
    this.Tracks = function() {
        this.name = 'tracks';
        this.primary = "id";
        this.indice = { 'id': {}, "ticker": {} };
        this.defaults = { 'name': '', 'id': '', 'ticker': '', 'lastscan': '', 'owned': 0 };
        dbase.call(this, app, 'stocks');
    };
    
    this.tracks = new this.Tracks();
};
