var Database = require('./base.js');
var fs = require('fs');

module.exports = function AsanaDB() {
    
    this.Settings = function() {
        this.fn = "./db/asanasets.json";
        this.primary = "id";
        this.indice = { };
        this.defaults = { 'id': '0', 'apiKey': '', 'clientKey': '', 'clientSecret': '' };
        this.db = new Database();
        
        this.db.convey.call(this);
        
        /*
        this.preSave = function(new_record) {
            delete new_record.hours;
            console.log("Removed hours.");
        };*/
    };
    
    this.Auth = function() {
        this.fn = "./db/asanaauth.json";
        this.primary = 'id';
        this.indice = { 'id': {}, 'cookie': {} };
        this.defaults = { 'id': 0, 'cookie': 'none', 'userKey': '', 'userToken': '', 'userSecret': '' };
        this.db = new Database();
        
        this.db.convey.call(this);
    };
    
    this.settings = new this.Settings();
    this.auth = new this.Auth();
};
