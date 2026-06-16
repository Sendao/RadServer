const ObjectID = -1;

export function WWWDatabase(myapp) {
  var cc = this;
  var app = myapp;
  var mongoose = app.mongoose;

  this.cats = new mongoose.Schema({
    name: String
  });
  this.Cats = app.tools.Mongoose.schemaModel('genCats', this.cats, true);

  this.templates = new mongoose.Schema({
    catid: { type: ObjectID, index: true },
    name: String,
    code: String,
    tpl: [{mode: Number, code: String}],
    vars: [{name: String, stype: String, default: String}]
  });
  this.Templates = app.tools.Mongoose.schemaModel('genTemplates', this.templates, true);

  this.datas = new mongoose.Schema({
    name: String,
    code: String
  });
  this.Datas = app.tools.Mongoose.schemaModel('genDatas', this.datas, true);

  this.dbconns = new mongoose.Schema({
    name: String,
    url: String,
  });
  this.Dbconns = app.tools.Mongoose.schemaModel('genDBConns', this.dbconns, true);

  this.dbtabs = new mongoose.Schema({
    dbid: { type: ObjectID, index: false },
    name: String,
    fields: String
  });
  this.Dbtabs = app.tools.Mongoose.schemaModel('genDBTables', this.dbtabs, true);

  this.tabledefs = new mongoose.Schema({
    name: String,
    fields: String
  });
  this.Tabledefs = app.tools.Mongoose.schemaModel('genTabledefs', this.tabledefs, true);

  this.tablerows = new mongoose.Schema({
    tabid: { type: ObjectID, index: true },
    values: String
  });
  this.Tablerows = app.tools.Mongoose.schemaModel('genTablerows', this.tablerows, true);

};
