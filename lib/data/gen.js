const MongoClient = require('mongodb').MongoClient;

module.exports = function GenData() {
  this.getDatabases = function(db, cb)
  {
    if( db.url == "mongodb://localhost/" && db.name == "node" ) {

      var mdb = this.app.mongoose.connection.db;

      mdb.listCollections().toArray( function(e,colls) {
        if( e ) {
          cb(e);
          return;
        }

//        console.log("Collections2:",colls);
        // Empty dbtabs
        this.objs.Dbtabs.deleteMany({'dbid':db._id}, function(err, doc) {
          //! Put collections into dbtabs
          var i;
          var tabs = [];
          var tab;
          var coll;
          var count = colls.length;
          var myoutput = [];

          for( i=0; i<colls.length; ++i ) {
            tab = { 'name': colls[i].name };
//            console.log("Study table " + colls[i].name);
            coll = mdb.collection(colls[i].name);
            coll.mapReduce(
              function() {
                var i, cs, pos;
                for( i in this ) {
                  if( i == '__v' ) continue;
                  cs = this[i].constructor.toString();
                  pos = cs.indexOf("(");
                  cs = cs.substr(9, pos-9);
                  emit( i + ":" + cs, 1);
                }
              },
              function(k, v) {
                  return Array.sum(v);
              },
              {
                  out: { inline: 1 }
              },
              function(collname, e, docs) {
                var i, e, etype, ename;
                var fields = '';
                var tab, table;

                if( e ) {
                  console.log("Error reading " + collname + ": " + e);
                  count--;
                  if( count == 0 ) {
//                    console.log("(done)");
                    cb(null,myoutput);
                  }
                  return;
                }

                for( i=0; i< docs.length; ++i ) {
                  e = docs[i]['_id'];
                  if( fields != '' ) fields += ',';
                  fields += e;
                }
//                console.log("Create table " + collname);
                tab = {
                  'name': collname,
                  'fields': fields
                };
                myoutput.push(tab);
                table = new this.objs.Dbtabs(tab);
                table.dbid = db._id;
                table.save( function(e, doc) {
                  count--;
                  if( count == 0 ) {
//                    console.log("(done)");
                    cb(null,myoutput);
                  }
                }.bind(this));
              }.bind(this, colls[i].name));
          }
        }.bind(this));
      }.bind(this));

      return;
    }
    MongoClient.connect(db.url, {}, function(err, mdb) {
      if( err ) {
        cb(err);
        return;
      }

      var onedb = mdb.db(db.name);

      onedb.listCollections().toArray(function(err, colls) {
        if( err ) {
          cb(err);
          return;
        }

//        console.log("Collections:",colls);
        // Empty dbtabs
        this.objs.Dbtabs.deleteMany({'dbid':db._id}, function(err, doc) {
          //! Put collections into dbtabs
          var i;
          var tabs = [];
          var tab;
          var coll;
          var count = colls.length;
          var myoutput = [];

          for( i=0; i<colls.length; ++i ) {
            tab = { 'name': colls[i].name };
//            console.log("Study table " + colls[i].name);
            coll = onedb.collection(colls[i].name);
            coll.mapReduce(
              function() {
                var i, cs, pos;
                for( i in this ) {
                  if( i == '__v' ) continue;
                  cs = this[i].constructor.toString();
                  pos = cs.indexOf("(");
                  cs = cs.substr(9, pos-9);
                  emit( i + ":" + cs, 1);
                }
              },
              function(k, v) {
                  return Array.sum(v);
              },
              {
                  out: { inline: 1 }
              },
              function(collname, e, docs) {
                var i, e, etype, ename;
                var fields = '';
                var tab, table;

                for( i=0; i< docs.length; ++i ) {
                  e = docs[i]['_id'];
                  if( fields != '' ) fields += ',';
                  fields += e;
                }
//                console.log("Create table " + collname);
                tab = {
                  'name': collname,
                  'fields': fields
                };
                myoutput.push(tab);
                table = new this.objs.Dbtabs(tab);
                table.save( function(e, doc) {
                  count--;
                  if( count == 0 ) {
//                    console.log("(done)");
                    cb(null,myoutput);
                  }
                }.bind(this));
              }.bind(this, colls[i].name));
          }
        }.bind(this));
      }.bind(this));
    }.bind(this));
  };


  this.processTPL = function(src)
  {
    var objs = [];
    var i, mode=0, depth=0;
    var buf = '';

    for( i=0; i<src.length; ++i ) {
      //console.log("Process mode="+mode+" src["+i+"]=" + src[i] + " depth="+depth);
      if( mode > 0 ) {
        if( src[i] == '{' ) {
          depth++;
        } else if( src[i] == '}' ) {
          depth--;
          if( depth<0 ) {
            objs.push( { mode: mode, code: buf } );
            mode=0;
            buf='';
            depth=0;
            continue;
          }
        }
      }
      if( mode == 0 ) {
        if( src[i] == '$' ) {
          if( src[i+1] == '{' ) {
            if( buf != '' ) {
              objs.push( { mode: mode, code: buf } );
            }
            mode = 1;
            buf = '';
            i++;
          } else {
            buf += '$';
          }
          continue;
        }
        if( src[i] == '*' ) {
          if( src[i+1] == '{' ) {
            if( buf != '' ) {
              objs.push( { mode: mode, code: buf } );
            }
            mode = 2;
            buf = '';
            i++;
          } else {
            buf += '*';
          }
          continue;
        }
      }
      buf += src[i];
    }

    if( buf != '' ) {
      objs.push( { mode: mode, code: buf } );
    }

    return objs;
  };

  this.processTPLVars = function(objs)
  {
    var inputs = [];
    var vars = [], v;
    var i;

    console.log("ProcessVars");
    for( i=0; i<objs.length; ++i ) {
      if( objs[i].mode == 2 )
        vars.push( objs[i].code );
    }

    console.log(vars);
    for( i=0; i<vars.length; ++i ) {
      v = vars[i].split(",");
      inputs.push( { name: v[0], stype: v[1], default: v.length>2?v[2]:'' } );
    }

    console.log(inputs);

    return inputs;
  };
};
