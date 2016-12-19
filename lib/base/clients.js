module.exports = function ClientsDB(myapp) {
    var cc = this;
    var app = myapp;
    var db = app.db;
    var dbase = app.dbase;
    this.app = app;

    db.control.call(this, 'clients');
    
    this.Clients = function() {
        this.name = 'clients';
        this.primary = "id";
        this.indice = { 'id': {}, "name": {} };
        this.defaults = { 'name': '', 'id': '', 'email': '', 'origin_data': '', 'totalCharged': 0 };
        dbase.call(this, app, 'clients');
    };
    
    this.clients = new this.Clients();
};
