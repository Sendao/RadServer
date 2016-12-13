var async = require('async');
var Stripe = require('../tool/stripe.js');

module.exports = function ClientsControl() {
  
    this.routes = function(router) {
        router.post('/client.js').bind( this.newClient.bind(this) );
        router.post('/charge.js').bind( this.chargeClient.bind(this) );
        router.get('/clients.json').bind( this.getClients.bind(this) );
    };

    this.newClient = function(req, res, params) {
        console.log("newClient", params);
        var cc = this;
        Stripe.createCustomer(params['stripeToken'], params['stripeEmail'], function(err, result) {
            if( err ) {
                //res.send( 200, { 'Content-Type': 'text/html' }, data );
                res.send(200, {}, {'message':'error', 'details': err});
                return;
            }
            if( typeof result == 'string' ) result = JSON.parse(result);

            var client = cc.data.createClient( result );
            
            res.send(200, {}, {'message':'success', 'details': client});
        });
    };
    
    this.getClients = function(req, res, params) {
        var sess;
        if( !(sess=this.app.requireAuth(res,params)) ) return;
        this.base.clients.loadRecords();
        var i, lRec, recs;
        
        recs = [];
        lRec = this.base.clients.records;
        for( i=0; i<lRec.length; ++i ) {
            recs[i] = { 'name': lRec[i].name, 'email': lRec[i].email };
        }
        
        res.send(200, {}, recs);
    };
    
    this.chargeClient = function(req, res, params) {
        var sess;
        if( !(sess=this.app.requireAuth(res,params)) ) return;
            
        console.log(params);
        
        var projectdb = this.app.base.projects.projects;
        var projects = projectdb.search( 'name', params.projectName );
        if( projects === false ) {
            res.send(404, {}, {'error': 'Project not found.'});
            return;
        }
        var project = projects[0];
        
        console.log("Found project", project);
        
        var clientdb = this.base.clients;
        var clients = clientdb.search( 'name', params.clientName );
        if( clients === false ) {
            res.send(404, {}, {'error': 'Client not found.'});
            return;
        }
        var client = clients[0];
        
        console.log("Found client", client);
        
        var i, hoursTotal=0, amount=0, rate=50;
        var hourn, hour;
        var invoice = "Invoice for Scott Anthony Powell, " + params.start + " - " + params.end + "\nGenerated via SpiritTracks\n\n";
        var inv_hours = "", inv_notes="", inv_h_notes="";
        var inv_newline = "\n";
        var hour_list=[];
        var prjhours = new this.app.base.projects.Hours( project );
        prjhours.loadRecords();
        //prjhours = prjhours.records;
               
        for( i=0; 'hours[' + i + ']' in params; i++ ) {
            hourn = params['hours[' + i + ']'];
            hour = prjhours.find('id', hourn);
            hoursTotal += parseFloat(hour.dur);
            
            // sort by hour
            hour_list.push( hour );
            console.log(hour);
        }
        
        var months = [ 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec' ];
        hour_list.sort( function(a,b) { var ad = new Date(a.dt), bd = new Date(b.dt); return ad-bd; } );
        var lastdt = "", daytotal=0.0;
        
        for( i=0; i < hour_list.length; i++ ) {
            hour = hour_list[i];
            if( lastdt != hour.dt ) {
                if( lastdt != "" ) {
                    inv_hours += inv_newline + "Total for " + lastdt + ": ";
                    inv_hours += daytotal + " hour" + ( daytotal != 1 ? "s" : "" ) + inv_newline + inv_newline;
                    if( inv_h_notes != "" ) {
                        inv_notes += lastdt + ":" + inv_newline + inv_h_notes + inv_newline;
                        inv_h_notes = "";
                    }
                    daytotal = 0.0;
                }
                inv_hours += hour.dt + ":" + inv_newline;
                lastdt = hour.dt;
            } else if( inv_hours != "" ) {
                inv_hours += inv_newline;
            }
            inv_hours += hour.dur + " hour" + ( hour.dur == 1 ? ": " : "s: " ) + hour.summary;
            if( 'notes' in hour && hour.notes != "" ) {
                if( inv_h_notes != "" ) inv_h_notes += inv_newline;
                inv_h_notes += "notes for '" + hour.summary + "':\n" + hour.notes;
            }
            daytotal += parseFloat(hour.dur);
        }
        if( lastdt != "" ) {
            inv_hours += inv_newline + "Total for " + lastdt + ": ";
            inv_hours += daytotal + " hour" + ( daytotal != 1 ? "s" : "" ) + inv_newline;
            if( inv_h_notes != "" ) {
                inv_notes += lastdt + ":" + inv_newline + inv_h_notes + inv_newline;
            }
        }
        
        
        amount = rate * hoursTotal;
        amount = amount.toFixed(2);
        amounht = amount + 50;
//        amount = amount - 50; // $50.00

        invoice += "Summary:\n" + inv_hours + "\nTotal Hours: " + hoursTotal + "\nHourly Rate: $50.00\nInvoice Total: $" + amount + "\n\nNotes: \n" + inv_notes + "\n";
        var invoice_summary = "Invoice for " + params.start + " - " + params.end + " (" + hoursTotal + " hour" + (hoursTotal==1?"":"s") + " at USD " + rate + ")";
        
        console.log("Invoice subject: " + invoice_summary + ", text:\n" + invoice);
        
        if( params['authcode'] != this.app.config.authcode )
            return;
        
        var cc = this;
        
        this.data.sendMail( client.email, "sendao@gmail.com, teraten@hotmail.com", invoice_summary, invoice, function(err,reso) {
            if( err ) {
                console.log("Error sending invoice: "+ err);
                res.send(500, {}, { "status": "Error sending invoice", "details": err } );
                return;
            } else {
                console.log("Email sent successfully. Sending invoice...");
                
                console.log("Charging " + client.id + " amount: " + amount);
                Stripe.chargeCustomer( client.id, amount * 100, hoursTotal + " hour(s) at USD 50.00", function(err, result) {
                    var resultobj, msgobj;
                    if( err ) {
                        msgobj = [ 'Failed. Payment of ' + amount, 'Payment issue. Details:\n' + JSON.stringify(err) ];
                        resultobj = {'message':'error', 'details': err};
                    } else {
                        msgobj = [ 'Success! Payment of ' + amount, 'Payment success. Details:\n' + JSON.stringify(result) ];
                        resultobj = {'message':'success', 'details': result};
                    }
                    
                    client.totalCharged += params['amount'];
                    clientdb.save(client);
                    clientdb.saveRecords();
                    
                    cc.data.sendMail( 'sendao@gmail.com', 'teraten@hotmail.com', msgobj[0], msgobj[1], function(err2,msg) {
                        if( err ) {
                            console.log("Error sending email: ", err2);
                        }
                        res.send(200, {}, resultobj);
                    } );
                });
            }
        } );
        
    };

};
