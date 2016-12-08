var async = require('async');
//var Stripe = require('../tool/stripe.js');

module.exports = function StocksControl() {
  
    this.routes = function(router) {
        router.post('/tracker.js').bind( this.tracker.bind(this) );
        router.post('/advise.js').bind( this.advise.bind(this) );
        router.get('/records.json').bind( this.getRecords.bind(this) );
    };
    
    this.tracker = function(req, res, params) {
        res.send(200);
    };
    
    this.advise = function(req, res, params) {
        res.send(200);
    };
    
    this.getRecords = function(req, res, params) {
        res.send(200);
    };

};
