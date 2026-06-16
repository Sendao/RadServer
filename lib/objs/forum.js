export function Could9DB(myapp) {
  var cc = this;
  var app = myapp;
  var mongoose = app.mongoose;

  this.whiteboard = new mongoose.Schema({
    id: String,
    dt: { type: Date, default: Date.now },
    author: String,
    postby: String,
    message: String
  });
  //console.log( Object.keys( app.tools ) );
  this.Whiteboard = app.tools.Mongoose.schemaModel('Whiteboard', this.whiteboard, true);

  this.autoface = {
    whiteboard: {
      noget: false,
      nopost: false,
      db: this.Whiteboard
    }
  }
};
