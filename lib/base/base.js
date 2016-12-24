/*
 * base^2
 * database and interface for node.js
 * 
 * Todo:
 * 
 ** Verify data integrity programmatically (test)
 *
 */

// hilites..
// base.fileindex[i] = [offset,onerecord.length,this.indexFor(base,base.records[i]),record,0|1|5];
// fileindex[i][4] == 5 // deleted
// fileindex[i][4] == 1 // loaded
// fileindex[i][4] == 0 // on disk

module.exports = function DatabaseApp(myapp, dbname)
{ // 'convey'
    var app = myapp;
    var db = myapp.db;
    var cc = this;
    
    /******************  INIT *********************/
    //console.log("init table", dbname, this.name);
    
    this.db = myapp.db;
    this.mydbname = dbname;
    myapp.db.bases[dbname].tables[this.name] = this;
    
    this.records = []; // recordno: record
    this.queue = [];
    this.empties = [];
    this.fileindex = []; // recordno: offset, size, { index_backref }
    this.state = 0;
    this.quietDelay = 1000; // one second delay after every operation
    this.quietMax = 180; // 3 minute maximum before saving anyway
    
    if( typeof this.use_messaging == 'undefined' )
        this.use_messaging = true;
    if( this.use_messaging == true ) {
        this.clients = [];
    }
    
    if( typeof this.loadoll != 'undefined' )
        this.loadall = this.loadoll;
    if( typeof this.loadall == 'undefined' ) {
        this.loadall = false;
    }
    if( typeof this.unique == 'undefined' ) {
        this.unique = [];
    } else if( typeof this.unique == 'string' ) {
        this.unique = [ this.unique ];
    }
    
    if( typeof this.indice == 'undefined' ) {
        this.indice = {};
        if( this.unique.length > 0 ) {
            for( var i=0; i<this.unique.length; ++i ) {
                this.indice[this.unique[i]] = {};
            }
        }
    } else if( typeof this.indice == 'string' ) {
        var oldex = this.indice;
        this.indice = {};
        this.indice[ oldex ] = {};
    }

    if( typeof this.nostore == 'undefined' ) {
        this.nostore = [];
    } else if( typeof this.nostore == 'string' ) {
        this.nostore = [ this.nostore ];
    }
    
    if( typeof this.name == 'undefined' ) {
        console.log("Undefined name for database table", this);
        throw new Exception();
    }
    this.fn = './db/' + this.mydbname + "/" + this.name + ".json";
    this.ifn = './db/' + this.mydbname + "/" + this.name + ".idx.json";
    this.slotfn = './db/' + this.mydbname + '/' + this.name + ".slot.json";
    
    if( typeof this.primary == 'undefined' ) {
        if( 'id' in this.indice ) {
            this.primary = 'id';
        }
    }
    if( this.unique.indexOf(this.primary) == -1 )
        this.unique.push(this.primary);
    

    if( this.loadall )
        this.db.loadScript(this);
    else
        this.db.loadIndex(this);
    
    
    this.registerClient = function( client, code, cond ) {
        this.db.registerClient( this, client, code, cond );
    };

    this.testCondition = function(testOf, opcode, value)
    {
        switch( opcode ) {
        case 'in':
            return ( value.indexOf(testOf) != -1 );
        case '!in':
            return ( value.indexOf(testOf) == -1 );
        case '=':
            return ( testOf == value );
        case '==':
            return ( testOf === value );
        case '!=':
            return ( testOf != value );
        case '<':
            return ( testOf < value );
        case '<=':
            return ( testOf <= value );
        case '>':
            return ( testOf > value );
        case '>=':
            return ( testOf >= value );
        }

        return false;
    };
    
    
    /******************  LVL1 *********************/

    // Level 1 interface - objects
    // create([params]) creates a new object and returns it.
    // save(obj) will update or create the database reference to the object
    // fetch(handle) returns the object for a single handle.
    // retrieve(handles) returns a list of objects.
    // get(identifier) returns an object by ID.
    // search(by, value) returns a list of objects that match by=value.
    // has(ident) says if the table contains a record
    
    this.addClient = function(cli, code=null, cond=null)
    {
        this.db.registerClient(this, cli, code, cond);
    };
    
    this.clearClient = function(cli, code=null, cond=null)
    {
        this.db.clearClient(this, cli, code, cond);
    };
    
    this.clearClients = function()
    {
        this.db.clearClients();
    };
    
    
    this.loadRecords = function() {
        this.db.loadScript(this);
    };
    
    this.importRecords = function( new_records ) {
        this.db.addRecords( this, new_records );
    };
    
    // todo: make this return keys based on stored cache
    this.indexKeyFor = function( field, value ) {
        return value;
    };
    
    // stop reading/writing here and make proper documentation during downtime
    this.save = function( new_record ) {
        var isnew = true;
        
        if( typeof this.preSave == 'function' ) {
            if( !this.preSave(new_record) )
                return;
        }
        var handles = [];
        if( this.isDistinct() && this.primary in new_record ) {
            if( this.has( new_record[ this.primary ] ) ) {
                handles.push( this.getHandle(new_record) );
                isnew = false;
            }
        }
        if( isnew ) {
            handles = this.db.addRecords( this, [ new_record ] );
        }
        console.log("SaveHandles(", handles, ")");
        this.db.saveHandles( this, handles );
        if( this.use_messaging )
            this.db.sendMessage( this, this.name + "_update", new_record );
    };
    
    this.get = function( ident ) {
        var recordids = this.find( this.primary, ident );
        if( recordids === false )
            return false;
        return this.fetch(recordids);
    };
    
    this.searchq = function( qry, range )
    {
        var fids = this.findq(qry, range);
        var results = this.retrieve(fids);
        return results;
    };
    this.search2 = function( qry, start, count )
    {
        var fids = this.find2(qry, { 'start': start, 'count': count } );
        var results = this.retrieve(fids);
        return results;
    };
    
    this.search = function( by, value )
    {
        //console.info("search(",by,value,")");
        var fids = this.find(by, value);
        if( fids === false ) {
            console.info("No results by '" + by + "':'" + value + "'")
            console.info(this.fileindex);
        //} else {
            //console.info("Search ", by, value, "=", fids);
        }
        var results = this.retrieve(fids);
        return results;
    };
    
    this.fetch = function( handles ) {
        if( typeof handles != 'object' )
            handles = [ handles ];
        var results = this.retrieve( handles );
        if( results.length <= 0 || results === false )
            return false;
        if( results.length != 1 ) {
            console.log("Expected only one result for primary key ", handles, results);
        }
        return results[0];
    };
    
    this.retrieve = function( handles ) {
        if( handles === false ) return false; // gigo
        if( typeof handles != 'object' )
            handles = [ handles ];
        //console.log("retrieve ", handles, " from ", this.fileindex);
        return this.db.loadRecords(this, handles); 
    };
    
    this.count = function() {
        return this.db.count(this);
    };
    
    this.has = function(ident) {
        var results = this.find( this.primary, ident );
        if( results === false ) return false;
        return true;
    }
    
    /******************  LVL2 *********************/

    // Level 2 interface - handles
    // find(by,value) returns an array of handles
    // edit(handle, object) updates the handle
    // write/store(handle) saves the handle as it exists
    // exists(handle) says if a handle has been loaded
    
    this.exists = function(handle) {
        return this.db.isLoaded(this, handle);
    };
    
    this.edit = function(handle, obj, autoClear=false) {
        var rec, isnew=false;
        
        if( this.db.isLoaded(this, handle) ) {
            rec = this.db.loadRecords(this, [handle]);
            if( rec ) rec = rec[0];
        } else if( !autoClear ) {
            rec = this.db.loadRecords(this, [handle]);
            if( rec ) rec = rec[0];
        } else {
            rec = false;
        }
        if( rec == false || rec == null ) {
            // new object (this.create());
            rec = app.util.cloneObject( this.defaults );
            isnew = true;
        }
        
        // update the values in the record
        app.util.cloneValues( rec, obj );
        
        // save the record
        if( isnew ) {
            var handles = this.db.addRecords( this, [rec] );
            handle = handles[0];
        }
        this.db.saveScriptForHandle( this, handle );
        if( this.use_messaging )
            this.db.sendMessage( this, this.name + "_update", rec );
        return rec;
    };
    this.getHandle = function(rec) {
        var i;
        if( this.primary in rec ) {
            var lists = this.indice[this.primary];
            if( !(rec[this.primary] in lists) ) return false;
            var handles = lists[rec[this.primary]];
            if( typeof handles != "object" ) return false;
            return handles[0];
        }
        for( i in this.indice ) {
            if( i in rec && rec[i] in this.indice[i] ) {
                handles = this.indice[i][rec[i]];
                if( typeof handles == 'undefined' || handles === false ) return false;
                return handles[0];
            }
        }
        return false;
    };
    this.auto = function(rec, obj) {
        var handle = this.getHandle( rec );
        if( !handle ) {
            return false;
        }
        
        // update the values in the record
        app.util.cloneValues( rec, obj );
        
        // save the record
        if( this.use_messaging )
            this.db.sendMessage( this, this.name + "_update", rec );
        this.db.saveScriptForHandle( this, handle );
        return rec;
    };
    
    this.store = this.write = function( item ) {
        var idx = this.getHandle( item );
        if( !idx ) {
            console.error("Tried to store an item with no handle");
            return false;
        }
        if( this.use_messaging )
            this.db.sendMessage( this, this.name + "_update", item );
        return this.db.saveScriptForHandle(idx);
    };
    
    // fetchAll: retrieve all records in index from disk
    // returns a list of the loaded records
    this.fetchAll = function() {
        var i, by, value;
        var idx = this.indice[this.primary];
        var len = idx.length;
        var recs = [];
        for( i=0; i<len; ++i ) {
            rec = this.db.loadRecords(this, idx[i]);
            recs.push(rec[0]);
        }
        return recs;
    };
    
    // All: do fetchAll() without loading records that already exist.
    this.all = function() {
        var recopy = [];
        var i, len = this.fileindex.length;
        for( i=0; i<len; ++i ) {
            if( this.fileindex[i][4] == 5 ) continue;
            
            if( this.fileindex[i][4] == 0 ) {
                rec = this.db.loadRecords(this, [ i ] );
            } else {
                rec = this.fileindex[i][3];
            }
            recopy.push(rec);
        }
        return recopy;
    };
    
    // find({'name': 'abc', 'id': 42, 'owner': 'self'});
    // returns fids[fid=..,fid=..,...] reference to fileindex
    this.find = function( by, val ) {
        var i, results=[], j, idx, len;
        var bye;
        //console.log("find("+by+","+val+")");
        if( typeof by == 'string' ) {
            var ind = by;
            by = {};
            by[ind] = val;
        }
        len = by.length;
        for( i in by ) {
            if( !(i in this.indice) ) {
                console.log("No index found for '" + i + "'");
                continue;
            }
            bye = i;
            value = by[i];
            if( app.util.typeOf(value) == 'array' ) {
                console.log("array(" + value + ") in indice[" + bye + "]");
                for( i=0; i<value.length; ++i ) {
                    if( value[i] in this.indice[bye] ) {
                        idx = this.indice[bye][value[i]];
                        for( j=0; j<idx.length; ++j ) {
                            results.push(idx[j]);
                        }
                    }
                }
                return results;
            } else if( value in this.indice[bye] ) {
                idx = this.indice[bye][value];
                console.log("found(" + value + ") in indice[" + i + "]: " + idx.length);
                for( j=0; j<idx.length; ++j ) {
                    results.push(idx[j]);
                }
                return results;
//            } else {
//                console.log("Search ", this.indice[bye], "FAILED for '", value, "'");
//                return false;
            }
        }
        return false;
    };
    this.findq = function( qry, page ) {
//        console.log("find2("+qry+","+page+")");
        if( typeof qry == 'string' ) {
            var vals = qry.split('=');
            var param = vals.pop();
            var value = vals.join('=');
            return this.find2q(param,value,page['start'],page['count']);
        } else {
            var vals = [];
            var tgts = [];
            for( var i in qry ) {
                tgts.push(i);
                vals.push(qry[i]);
            }
            return this.find2q(tgts,vals,page['start'],page['count']);
        }
    };
    this.find2 = function( by, value, start, count ) {
        var i, results=[], j, idx, len;
        var bye;
        if( typeof by == 'string' ) {
            by = { by: value };
        }
  //      console.log("find2(",by,value,start,count,")");
        len = by.length;
        var n = 0;
        for( i=0; i<len; ++i ) {
            if( by[i] in this.indice ) {
                bye = by[i];
                if( app.util.typeOf(value) == 'array' ) {
                    for( i=0; i<value.length; ++i ) {
                        if( value[i] in this.indice[bye] ) {
                            idx = this.indice[bye][value[i]];
                            for( j=0; j<idx.length; ++j ) {
                                if( n <= start+count ) {
                                    n++;
                                    if( n >= start )
                                        results.push(idx[j]);
                                } else break;
                            }
                            if( n > start+count )
                                break;
                        }
                    }
                    return results;
                } else if( value in this.indice[bye] ) {
                    idx = this.indice[bye][value];
                    for( j=0; j<idx.length; ++j ) {
                        if( n <= start+count ) {
                            n++;
                            if( n >= start )
                                results.push(idx[j]);
                        } else break;
                    }
                    return results;
//                } else {
//                    console.log("Search ", this.indice[bye], "failed for '", value, "'");
                }
            } else {
                console.log("No index found for '" + by[i] + "'");
            }
        }
        return false;
    };
    
    this.isDistinct = function() {
        if( this.primary && this.unique.indexOf(this.primary) != -1 )
            return true;
        console.log("No " + this.primary + " found in ", this.unique);
        return false;
    };
    
    // table.create: creates a clone of the default values and populates them.
    // this does not alter the database or storage in any way.
    this.create = function(values) {
        var a = app.util.cloneObject( this.defaults );
        if( this.isDistinct() ) {
            console.log("Assigning id for distinct value");
            if( typeof values == 'undefined' || !(this.primary in values) ) {
                a[this.primary] = this.newid();
                console.log("Using id " + a[this.primary]);
            }
        } else {
            console.log("Create() on table with no primary value");
        }
        if( typeof values != 'undefined' )
            app.util.cloneValues( a, values );
        return a;
    };

    // this is called automatically by table.create(obj)
    this.newid = this.newident = function() {
        var i=1;
        if( this.state == 0 ) {
            this.db.loadIndex(this);
        }
        while( i in this.indice[this.primary] ) {
            ++i;
        }
        return i;
    };
    
    // table.remove: removes a record from the database and leaves an empty
    // slot in the file table.
    this.remove = function(idents) {
        this.db.deleteRecordsById( this, idents );
        if( this.use_messaging ) 
            this.db.sendMessage( this, this.name + '_remove', idents );
    };
    
    
    /******************  LVL3 *********************/
    
    // Level 3 interface - paging
    // page(qry,start,count)
    // returns the objects, while
    // query(qry,start,count)
    // returns the handles
    this.page = function( start, count )
    {
        if( isNaN(count) ) count = 30;
        if( isNaN(start) || start < 0 ) start = 0;
        var handles;
        var i, len = this.fileindex.length;
        
        for( i=0; i<len; ++i ) {
            if( this.fileindex[i][4] != 5 ) {  // isLoaded(i)
                handles.push(i);
            }
        }
        //var handles = this.find( this.primary, this.db.app.util.rangeOf(start,count) );
        return this.retrieve(handles);
    };
    
    // table.query: page outputs.
    this.query= function( start, count )
    {
        if( isNaN(count) ) count = 30;
        if( isNaN(start) || start < 0 ) start = 0;
        return this.findq( this.primary, this.db.app.util.rangeOf(start,count) );
    };
    
    // table.query: page outputs by index.
    this.query= function( index, offset, count )
    {
        if( isNaN(count) ) count = 30;
        if( isNaN(offset) || offset < 0 ) offset = 0;
        return this.findq( index, this.db.app.util.rangeOf(offset,count) );
    };
};
