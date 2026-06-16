
export function SupportDB(myapp) {
    var app = myapp;
    var mongoose = app.mongoose;
  
    this.tickets = [
      'dt', 'userid', 'author', 'contact', 'subject',
      'message', 'status'
    ];

    this.messages = [ 'ticketid', 'author',
      'message', 'dt' ];
};
