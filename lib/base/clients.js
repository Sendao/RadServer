module.exports = function ClientsDB(myapp) {
    var cc = this;
    this.app = myapp;
    var db = myapp.db;
    db.control.call(this, 'clients');
    
    this.Clients = function() {
        this.name = 'clients';
        this.primary = "id";
        this.indice = { 'id': {}, "name": {} };
        this.defaults = { 'name': '', 'id': '', 'email': '', 'origin_data': '', 'totalCharged': 0 };
        db.convey.call(this, 'clients');
    };
    
    this.clients = new this.Clients();
};
