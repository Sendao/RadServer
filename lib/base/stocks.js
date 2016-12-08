module.exports = function Could9DB(myapp) {
    var cc = this;
    this.app = myapp;
    var db = myapp.db;
	db.control.call(this, 'stocks');
	
    this.Tracks = function() {
        this.name = 'tracks';
        this.primary = "id";
        this.indice = { 'id': {}, "ticker": {} };
        this.defaults = { 'name': '', 'id': '', 'ticker': '', 'lastscan': '', 'owned': 0 };
        db.convey.call(this, 'stocks');
    };
    
    this.tracks = new this.Tracks();
};
