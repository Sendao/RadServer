var fs = require('fs');
var async = require('async');

module.exports = function ClientsData() {
    
    this.sendMail = function( to, ccs, subj, msg, cb )
    {
        this.app.util.connectMailer();
        this.app.util.sendMessage(to,ccs,subj,msg,cb);
    };
    
    this.createClient = function( details )
    {
        //details = {"message":"success","details":{"id":"cus_8vVgoJ06lIU7SY","object":"customer","account_balance":0,"created":1470051191,"currency":null,"default_source":"card_18dednG64fYgaTV0vksHKDCi","delinquent":false,"description":"anand@alphasheets.com","discount":null,"email":null,"livemode":false,"metadata":{},"shipping":null,"sources":{"object":"list","data":[{"id":"card_18dednG64fYgaTV0vksHKDCi","object":"card","address_city":null,"address_country":null,"address_line1":null,"address_line1_check":null,"address_line2":null,"address_state":null,"address_zip":null,"address_zip_check":null,"brand":"Visa","country":"US","customer":"cus_8vVgoJ06lIU7SY","cvc_check":"pass","dynamic_last4":null,"exp_month":1,"exp_year":2019,"fingerprint":"C3wtuEU66DXGSxyB","funding":"credit","last4":"4242","metadata":{},"name":"sendao@gmail.com","tokenization_method":null}],"has_more":false,"total_count":1,"url":"/v1/customers/cus_8vVgoJ06lIU7SY/sources"},"subscriptions":{"object":"list","data":[],"has_more":false,"total_count":0,"url":"/v1/customers/cus_8vVgoJ06lIU7SY/subscriptions"}}}
        
        //this.base.clients.loadRecords();
        var client = this.base.clients.create();
        client.id = details['id'];
        client.name = client.email = details['description'];
//        details.sources = '';
        delete details.subscriptions;
        client.details = details;
        this.base.clients.save(client);
        
        return client;
    }
    
};
