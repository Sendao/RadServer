export function WWWDatabase(myapp) {
  var cc = this;
  var app = myapp;
  var mongoose = app.mongoose;

  this.config = new mongoose.Schema({
    id: String
  });
  //console.log( Object.keys( app.tools ) );
  this.Config = app.tools.Mongoose.schemaModel('wwwConfig', this.config, true);

  this.timers = new mongoose.Schema({
    id: String,
    target: String,
    name: String,
    requests: String,
    seconds: Number
  });
  //console.log( Object.keys( app.tools ) );
  this.Timers = app.tools.Mongoose.schemaModel('wwwTimers', this.timers, true);

  this.cache = new mongoose.Schema({
    id: String,
    dt: { type: Date, default: Date.now },
    url: String,
    content: String,
  });
  //console.log( Object.keys( app.tools ) );
  this.Cache = app.tools.Mongoose.schemaModel('wwwCache', this.cache, true);

  this.struct = new mongoose.Schema({
    id: String,
    title: String,
    images: [{ src: String }],
    links: [{ href: String, img: String, text: String, description: String }],
    texts: [ String ]
  });
  //console.log( Object.keys( app.tools ) );
  this.Struct = app.tools.Mongoose.schemaModel('wwwStruct', this.struct, true);

  this.searches = new mongoose.Schema({
    id: String,
    reqid: String,
    lastDt: { type: Date, default: Date.now },
    nextDt: { type: Date },
    readSpeed: Float,
    url: String
  });
  //console.log( Object.keys( app.tools ) );
  this.Searches = app.tools.Mongoose.schemaModel('wwwSearches', this.searches, true);

  this.searchresults = new mongoose.Schema({
    id: String,
    searchid: String,
    link: String,
    text: String,
    dt: { type: Date, default: Date.now }
  });
  //console.log( Object.keys( app.tools ) );
  this.Searchresults = app.tools.Mongoose.schemaModel('wwwSearchresults', this.searchresults, true);

  this.requests = new mongoose.Schema({
    id: String,
    dt: { type: Date, default: Date.now },
    lastDt: { type: Date },
    schedTm: { type: Date },
    type: String,
    url: String,
    cacheid: String,
    structid: String,
    state: String,
    runEvent: String
  });
  //console.log( Object.keys( app.tools ) );
  this.Requests = app.tools.Mongoose.schemaModel('wwwRequests', this.requests, true);
};
