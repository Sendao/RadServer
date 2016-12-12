var fs = require('fs');
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

module.exports = function DatabaseApp()
{
    var cc = this;

    this.locateTable = function(dbname, tablemain, tablename)
    {
        var xb = this.bases[dbname];
        if( !xb ) return false;
        var i, j;
        for( i=0; i<xb.length; i++ ) {
            j = xb.table(tablemain, tablename);
            if( j !== false ) return j;
        }
        return false;
    };
    
    this.bases = {};
    this.base = function(dbname) {
        return this.bases[dbname];
    };
    this.control = function(dbname) {
        this.mydbname = this.name = dbname;
        this.tables = {};
        this.controls = {};
        console.log("db", dbname);
        cc.bases[ dbname ] = this;
        
        this.workcycle = function() {
            cc.workCycle(this.mydbname);
        };

        this.findTable = this.Table = function(tablemain, tablename, constr) {
            var cx = this.tables;
            if( tablemain in cx ) {
                var i, tm = cx[tablemain], len = tm.length;
                for( i=0; i<len; ++i ) {
                    if( tm[i].name == tablename ) {
                        return tm[i];
                    }
                }
                return new this[tablemain](constr); 
            }
        };
        
    };

    this.workCycle = function(dbname) {
        this.workcycle( cc.bases[dbname] );
    };

    this.convey = function(dbname) {
        
        /******************  INIT *********************/
        console.log("init table", dbname);
        
        this.db = cc;
        this.mydbname = dbname;
        cc.bases[dbname].tables[ this.name ] = this;
        
        this.workTimer = 0;
        this.records = []; // recordno: record
        this.queue = [];
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
            var handles;
            if( this.isDistinct() && this.primary in new_record ) {
                if( this.has( new_record[ this.primary ] ) ) {
                    handles = [ db.handleFor(new_record) ];
                    isnew = false;
                }
            }
            if( isnew ) {
                handles = this.db.addRecords( this, [ new_record ] );
            }
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
        
        this.search = function( qry )
        {
            var fids = this.find(qry);
            var results = this.retrieve(fids);
            return results;
        };
        
        this.search2 = function( qry, range )
        {
            var fids = this.find2(qry, range);
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
            var fids = this.find(by, value);
            var results = this.retrieve(fids);
            return results;
        };
        
        this.search = function( by, value, range )
        {
            var fids = this.find(by, value, range);
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
        
        this.has = function(ident) { // DON'
//T LOOK AT ME!!!!
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
        // ERROR DID NOT PROCESS
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
                rec = cc.app.util.cloneObject( this.defaults );
                isnew = true;
            }
            
            // update the values in the record
            cc.app.util.cloneValues( rec, obj );
            
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
                var handles = this.indice[this.primary];
                return handles[0];
            }
            for( i in this.indice ) {
                if( i in rec && rec[i] in this.indice[i] ) {
                    handles = this.indice[i][rec[i]];
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
            cc.app.util.cloneValues( rec, obj );
            
            // save the record
            if( this.use_messaging )
                this.db.sendMessage( this, this.name + "_update", rec );
            this.db.saveScriptForHandle( this, handle );
            return rec;
        };
        //WARNING
        
        this.store = this.write = function( item ) {
            var idx = this.getHandle( item );
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
                value = by[i];
                if( cc.app.util.typeOf(value) == 'array' ) {
                    for( i=0; i<value.length; ++i ) {
                        if( value[i] in this.indice[bye] ) {
                            idx = this.indice[bye][value[i]];
                            for( j=0; j<idx.length; ++j ) {
                                results.push(idx[j]);
                            }
                        }
                    }
                    return results;
                } else if( value in this.indice[i] ) {
                    idx = this.indice[i][value];
                    for( j=0; j<idx.length; ++j ) {
                        results.push(idx[j]);
                    }
                    return results;
                } else {
                    //console.log("Search ", this.indice[bye], "FAILED for '", value, "'");
                }
            }
            return false;
        };
        this.find = function( qry ) {
            if( typeof qry == 'string' ) {
                var vals = qry.split('=');
                var param = vals.pop();
                var value = vals.join('=');
                return this.find(param,value);
            } else {
                var vals = [];
                var tgts = [];
                for( var i in qry ) {
                    tgts.push(i);
                    vals.push(qry[i]);
                }
                return this.find(tgts,vals);
            }
        };
        this.find2 = function( qry, page ) {
            if( typeof qry == 'string' ) {
                var vals = qry.split('=');
                var param = vals.pop();
                var value = vals.join('=');
                return this.find2(param,value,page['start'],page['count']);
            } else {
                var vals = [];
                var tgts = [];
                for( var i in qry ) {
                    tgts.push(i);
                    vals.push(qry[i]);
                }
                return this.find2(tgts,vals,page['start'],page['count']);
            }
        };
        this.find2 = function( by, value, start, count ) {
            var i, results=[], j, idx, len;
            var bye;
            if( typeof by == 'string' ) {
                by = { by: value };
            }
            len = by.length;
            var n = 0;
            for( i=0; i<len; ++i ) {
                if( by[i] in this.indice ) {
                    bye = by[i];
                    if( cc.app.util.typeOf(value) == 'array' ) {
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
                    } else {
                        console.log("Search ", this.indice[bye], "failed for '", value, "'");
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
        // STOP
        
        this.create = function(values) {
            var a = cc.app.util.cloneObject( this.defaults );
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
                cc.app.util.cloneValues( a, values );
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
        
        this.remove = function(idents) {
            this.db.deleteRecordsByIds( this, idents );
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
        
        this.query= function( start, count )
        {
            if( isNaN(count) ) count = 30;
            if( isNaN(start) || start < 0 ) start = 0;
            return this.find( this.primary, this.db.app.util.rangeOf(start,count) );
        };
        
        this.query= function( index, offset, count )
        {
            if( isNaN(count) ) count = 30;
            if( isNaN(offset) || offset < 0 ) offset = 0;
            return this.find( index, this.db.app.util.rangeOf(offset,count) );
        };
    };
    
    
    
    
    /* Count: return the total number of valid entries in the database */
    this.count = function( base ) {
        var i, len=base.fileindex.length;
        var valid=0;
        for( i=0; i<len; ++i ) {
            if( base.fileindex[i][4] != 5 ) {
                valid++;
            }
        }
        return valid;
    };
    
    
    
    /* Build directories for paths */
    this.buildDirFor = function( path ) {
        var paths = path.split('/');
        var i;
        
        var buildpath = ".";
        for( i=0; i<paths.length-1; i++ ) {
            buildpath = buildpath + "/" + paths[i];
            
            if( !fs.existsSync(buildpath) ) {
                fs.mkdir(buildpath);
            }
        }
    };
    
    /* Register a socket client to receive updates on a database condition */ 
    this.registerClient  = function( base, client, code, cond ) {
        if( !('clients' in base) || typeof base.clients == 'undefined' )
            base.clients = [];
        var i = base.clients.indexOf( client );
        if( i == -1 ) {
            i = base.clients.length;
        }
        base.clients.splice(i,0,[ client, code, cond ]);
    };
    
    this.clearClient = function( base, client ) {
        var i = base.clients.indexOf(client), len = base.clients.length;
        if( i == -1 ) return;
        var j, l2;
        i++;
        while( i < base.clients[i].length && cc.app.util.typeOf(base.clients[i]) == 'array' ) {
            base.clients.splice(i,1);
        }
    };
    this.clearClients = function( base ) {
        base.clients = [];
    };
    
    /* sendMessage: notifies the database that an object has been modified and should be stored (message) */
    this.sendMessage = function( base, code, modified_obj ) {
        var i = base.clients.length; // clients = [ client, code, con, client2, code2,... ] 
        var j, cond, passedAll = true;
        //console.log("Broadcast: [" + code + "]", typeof modified_obj);
        while( i > 0 ) {
            i-=3;
            if( base.clients[i+1] == code ) {
                j = cond.length;
                while( j > 0 ) {
                    j -= 3;
                    if( !base.testCondition( modified_obj[cond[0]], cond[1], cond[2] ) ) {
                        passedAll = false;
                        break;
                    }
                }
                if( passedAll ) {
                    base.messages.push( [ base.clients[i], code, modified_obj ] );
                }
            }
        }
    }
    
    /* sendMessages: sends updates via websockets */
    this.sendMessages = function( base, msgSet ) {
        var i, len = msgSet.length;
        var msg;
        
        for( i = 0; i < len; ++i ) {
            msg = msgSet[i];
            
            msg[0].send( { 'code': msg[1], 'data': msg[2] } );
        }
    };
    
    /* workcycle: runs repeatedly */
    this.workcycle = function( base ) {
        var timeNow = new Date().getTime();
        
        // Send connected data update messages to subscribers
        if( ('messages' in base) && base.messages.length > 0 ) {
            var i = base.messages;
            delete base.messages;
            base.messages = [];
            this.sendMessages(base, i);
        }
        
        if( base.rebuildindex != 0 ) {
            this.clean(base);
            base.rebuildindex = 0;
            return true;
        }
        return false;
    };
    
    /* enqueue: signals that it is ok to run 'clean()' */
    this.backgroundWrite = function( base, f ) {
        base.rebuildindex = base.rebuildindex | f;
        console.log( base.fn, "enqueue" );
    };
    
    /* cleanIndex: clear and prepare the main indices */
    this.cleanIndex = function(base) {
        for( i in base.indice ) {
            base.indice[i] = {};
        }
    };
    
    /* Clean: store data in the file depending on what has changed */
    this.clean = function( base ) {
//      console.log("db " + base.name + " clean");
        if( base.rebuildindex == 0 ) return;
        if( base.rebuildindex == 1 ) { // only index was modified/scripts already written
            this.saveIndex(base);
            base.rebuildindex=0;
        } else if( base.rebuildindex == 2 ) { // rewrite changed records
            //this.indexFromRecords(base);
            this.saveIndex(base);
            this.saveScript(base); //! todo: only changed records
            base.rebuildindex=0;
        } else if( base.rebuildindex == 3 ) { // rewrite all records
            this.indexFromRecords(base);
            this.saveIndex(base);
            this.saveScript(base);
            base.rebuildindex=0;
        }
    };
    
    /* addRecords: add records to the data storage space. */
    this.addRecords = function( base, items ) {
        var i, j, updated=false, newIndex;
        var handles = [];
        
        for( i=0; i<items.length; i++ ) {
            updated=false;
            newIndex = this.indexFor( base, items[i] );
            if( base.primary in base.unique ) {
                if( (j=base.fetch( items[i][base.primary] )) != false ) {
                    //console.log("addRecord() on existing record. Use saveScriptForHandle instead.");
                    base.fileindex[j] = [ 0, 0, newIndex, items[i], 1 ];
                    updated=true;
                    handles.push(j);
                }
            }
            if( !updated ) {
                j = base.fileindex.length;
                base.fileindex.push( [ 0, 0, newIndex, items[i], 1 ] );
                handles.push(j);
            }
            if( this.use_messaging )
                this.db.sendMessage( this, this.name + "_append", items[i] );
            this.constructIndexFor(base, j);
        }
        if( typeof base.postLoad == 'function' ) {
            base.postLoad(items);
        }
        return handles;
    };
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    /* loadIndex: load the whole index from the disk. */
    this.loadIndex = function( base ) {
        if( base.state != 0 ) return;
        base.state = 1;
        var buf, ifn = base.ifn;
        
        this.cleanIndex(base);
        base.fileindex = [];
        
        this.buildDirFor(ifn);
        if( !fs.existsSync(ifn) ) {
            //console.log("Missing or old index", ifn);
            this.loadScript(base);
            //console.log("Index reconstructed.", ifn);
        } else {
            buf = fs.readFileSync( ifn, "utf8" );
            base.fileindex = JSON.parse(buf);
            this.constructIndex(base);
            //console.log("Index loaded.", ifn, buf, base.fileindex);
            var i, len = base.fileindex.length;
            for( i=0; i<len; ++i ) {
                base.fileindex[i][4] = 0; // 'not loaded'
            }
        }
        //console.log(ifn, " " + base.fileindex.length + " index records.");
    };
    
    
    
    /* loadScript: load all data from disk. */
    this.loadScript = function( base ) {
        if( base.state > 1 ) return;
        base.state = 2;
        var buf, fn = base.fn;

        this.cleanIndex(base);
        base.fileindex = [];
        this.buildDirFor(fn);
        if( !fs.existsSync(fn) ) {
            //console.log("Missing or new db file " + fn);
            buf = "[]";
            base.eofmarker = 0;
        } else {
            //console.log("Read: " + fn);
            buf = fs.readFileSync( fn, "utf8" );
            base.eofmarker = buf.length;
        }
        
        try {
            base.records = JSON.parse(buf);
        } catch(e) {
            console.log("Error", e);
            console.log(buf);
        }
        this.indexFromRecords(base);
        if( typeof base.postLoad == 'function' ) {
            base.postLoad(base.records);
        }
    };
   
    
    
    
    
    
    
    
    
    
    

    /* loadRecords: load handles to data. */
    this.loadRecords = function( base, fids ) {
        var buf, fn = base.fn;
        var fidclone = cc.app.util.cloneObject(fids);

        if( !fs.existsSync(fn) ) {
            console.log("Missing or new db file " + fn);
            return false;
        }
        
        var fd = fs.openSync(fn, 'r');
        
        var i, fidno, fidx, resultArray = [];
        //console.log("loadRecords(" + fids.length + ")");
        for( i=0; i<fidclone.length; i++ ) {
            fidno = fidclone[i];
            if( !(fidno in base.fileindex) ) {
                console.log("Cannot locate record '" + fidno + "'" + "(" + typeof fidno + ") in index!");
                console.log(base.fileindex);
                console.log(base.fileindex.length);
                continue;
            }
            var fidx = base.fileindex[fidno];
            if( fidx[4] == 0 ) {
                buf = new Buffer( fidx[1] );
                //console.log("Read ", fidx[1], " bytes from offset ", fidx[0]);
                fs.readSync( fd, buf, 0, fidx[1], fidx[0] );
                //console.log("Buffer ", buf, buf.toString());
                fidx[3] = JSON.parse(buf.toString());
                fidx[2] = this.indexFor( base, fidx[3] );
                //console.log("after index:", fids.length, fids);
                this.constructIndexFor( base, fidno );
                //console.log("after construct:", fids.length, fids);
            }
            resultArray.push( fidx[3] );
            //console.log("next of " + fids.length);
        }
        this.backgroundWrite(base,1);
        if( resultArray.length == 0 )
            return false;
        if( typeof base.postLoad == 'function' ) {
            base.postLoad(resultArray);
        }
        return resultArray;
    };
    
    /* indexFromRecords:
     * build the index based on records.
     */
    this.indexFromRecords = function(base) {
        var i, j, idx, item;
        
        this.cleanIndex(base);
        this.fileindex = [];
        var fileoffset = 1;
        for( j=0; j<base.records.length; j++ ) {
            item = base.records[j];
            if( item == null ) continue;
            var itembuf = JSON.stringify( item );
            var itemsize = itembuf.length;
            base.fileindex[j] = [ fileoffset, itemsize, this.indexFor(base, item), item, 1 ];
            fileoffset += itemsize + 1;
            this.constructIndexFor(base, j);
        }
        this.backgroundWrite(base,2);
    };

    /* constructIndex: build indices from fileindex */
    this.constructIndex = function(base)
    {
        var fidno, i, fidx, tealength=0;
        
        this.cleanIndex(base);
        for( fidno=0; fidno<base.fileindex.length; ++fidno ) {
            fidx = base.fileindex[fidno];
            if( tealength == 0 ) tealength = 2;
            tealength += fidx[1];
            for( i in fidx[2] ) {
                if( !(fidx[2][i] in base.indice[i]) ) {
                    base.indice[i][ fidx[2][i] ] = [];
                }
                if( base.indice[i][ fidx[2][i] ].indexOf(fidno) == -1 )
                    base.indice[i][ fidx[2][i] ].push(fidno);
            }
        }
        base.eofmarker = tealength;
        
        this.backgroundWrite(base,1);
    };
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    /* constructIndexFor: build a single indice set for a single record already in the fileindex */
    this.constructIndexFor = function(base, fidno)
    {
        var fi = base.fileindex[fidno][2];
        var i;
        
        for( i in base.indice ) {
            if( !(fi[i] in base.indice[i]) ) {
                base.indice[i][ fi[i] ] = [];
            }
            if( typeof base.indice[i][fi[i]] != 'object' ) {
                //console.log("Irregular: ", base.indice[i][fi[i]]);
            }
            if( base.indice[i][ fi[i] ].indexOf(fidno) == -1 )
                base.indice[i][ fi[i] ].push(fidno);
        }
    };
    
    
    
    
    

    /* deleteRecordsById: remove locally stored data records and set fileindex[4] = 5('deleted') */
    this.deleteRecordsById = function( base, ids ) {
        var i, idkey, remids = [], deleted = 0;
        var remids = [], q;
        
        q = base.indice[ base.primary ];
        for( i = 0; i < ids.length; ++i ) {
            idkey = ids[i]; 
            if( idkey in q ) {
                for( j=0; j<q[idkey].length; j++ ) {
                    remids.push( q[idkey][j] );
                }
                delete base.indice[ base.primary ][ idkey ];
            }
        }
        
        remids.sort();
        
        for( i=0; i<ids.length; ++i ) {
            if( typeof base.deleteRecord == 'function' ) {
                base.deleteRecord( base.records[ ids[i] ] );
            }
            base.fileindex[ remids[i] ][2] = {};
            base.fileindex[ remids[i] ][3] = {};
            base.fileindex[ remids[i] ][4] = 5;
            ++deleted;
        }
        if( this.use_messaging )
            this.db.sendMessage( this, this.name + "_remove", ids );

        this.db.backgroundWrite(base,2);
        if( deleted != ids.length ) {
            console.log("!!! Deleted " + deleted + " instead of " + ids.length + " records!!!");
        }
        return deleted;
    };
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    /* isLoaded: returns false if the data has not been loaded and/or does not exist on the disk */
    this.isLoaded = function( base, n ) {
        if( n in base.fileindex && base.fileindex[n][4] == 1 )
            return true;
        return false;
    };

    /* indexFor: rebuild the full defined index for a single item
     * the index is also in base.fileindex[ item_handle ][3]
     */ 
    this.indexFor = function( base, item ) {
        var i, idx = {};
        
        for( i in base.indice ) {
            //console.log(i, item[i]);
            idx[i] = item[i];
        }
        //console.log("Calculate index: ", idx, "For: ", item);
        return idx;
    };
    
    
    
    
    
    
    
    
    
    
    /* saveHandles: save an array of handles to file */
    this.saveHandles = function( base, handles ) {
        var i;
        
        for( i = 0; i < handles.length; i++ ) {
            this.saveScriptForHandle(base,handles[i]);
        }
    };
    
    /* saveScriptForHandle: saves a single handle's actual data to a file
     *  may not work if filelen < tgtlen, yes really
     */
    this.saveScriptForHandle = function( base, mainidx ) {
        var mobj = base.fileindex[ mainidx ];
        
        //console.log("write(", mobj, ")");
        
        var item = mobj[3];
        if( typeof base.preSave == 'function' ) {
            base.preSave(item);
        }
        
        var temps = {};
        var fn = base.fn;
        var k;
        for( k in base.nosave ) {
            if( base.nosave[k] in item ) {
                temps[ base.nosave[k] ] = item[ base.nosave[k] ];
                delete item[ base.nosave[k] ];
            }
        }
        var buf = JSON.stringify(item);
        for( k in base.nosave ) {
            if( base.nosave[k] in temps ) {
                item[ base.nosave[k] ] = temps[ base.nosave[k] ];
            }
        }
        
        if( mainidx != 0 ) {
            buf = "," + buf;
        }
        var newsize = buf.length;
        var atEOF = false;
        if( typeof base.eofmarker == 'undefined' )
            base.eofmarker = 0;
        if( mobj[0] == 0 && mobj[1] == 0 ) { // new record
        //  console.log("item @ eof: ", base.eofmarker);
            mobj[0] = base.eofmarker-1;
            if( mobj[0] < 0 ) mobj[0] = 0;
            base.eofmarker += newsize;
            atEOF = true;
        } else if( newsize > mobj[1] ) {
        //  console.log("item @ eof: ", base.eofmarker);
            mobj[0] = base.eofmarker-1;
            if( mobj[0] < 0 ) mobj[0] = 0;
            base.eofmarker += newsize;
            atEOF = true;
        } else if( newsize < mobj[1] ) {
            // pad with spaces
            while( newsize < mobj[1] ) {
                buf += " ";
                newsize++;
            }
        }
        mobj[1] = newsize;
        
        if( ( mobj[0] + mobj[1] >= base.eofmarker ) || atEOF ) {
            buf += "]";
            atEOF=true;
        }
        var adjustStart = 0;
        if( mobj[0] == 0 ) {
            mobj[0] = 1;
            buf = "[" + buf;
            base.eofmarker+=2;
        //console.log("0 ", buf.length, base.eofmarker);
            adjustStart = -1;
        }
        var fd;
        if( !fs.existsSync(fn) ) {
            fd = fs.openSync(fn, 'w');
        } else {
            fd = fs.openSync(fn, 'r+');
            //console.log("File opened r+");
            var tbuf = new Buffer(5);
            fs.readSync(fd,tbuf,0,5,0);
        }
        var buf2 = new Buffer(buf);
        //console.log("Script ", mobj[0], ",", adjustStart, " : ", mobj[1], ",", atEOF, ":", base.eofmarker, " bytes.");
        fs.writeSync( fd, buf, mobj[0]+adjustStart, mobj[1] + (atEOF ? 1 : 0), 0 );
        fs.closeSync(fd);
                
        mobj[2] = this.indexFor( base, item );
        mobj[3] = item;
        mobj[4] = 0;
        
        this.backgroundWrite(base,1);
        // this.saveIndexFor(base,item);
    };
    
    
    
    
    /* saveIndex: saves the current index to disk */
    this.saveIndex = function( base ) {
        var fn = base.ifn;
        
        console.log("Write index " + fn);
        this.buildDirFor(fn);
        // rebuild the fileindex as clear.
        //! separate records from the fileindex again, but properly this time.
        var i;
        var fi = [], fi0;
        for( i=0; i<base.fileindex.length; ++i ) {
            fi0 = cc.app.util.cloneObject(base.fileindex[i]);
            fi0[3] = 0;
            fi0[4] = 0;
            fi.push(fi0);
        }
        var buf = JSON.stringify(fi);
        //console.log("Index: ", fi0);
        fs.writeFileSync( fn, buf );
        
        base.rebuildindex = 0;
        if( base.state < 1 ) base.state=1;
    };
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    /* saveScript: saves all data to file. any data that has not been loaded will be destroyed. */
    this.saveScript = function( base ) {
        var fn = base.fn;
        
        console.log("Write "+ fn);
        this.buildDirFor(fn);
        var i, offset=1, buf = "", smallbuf, k;
        var temps = {};
        var record;
        
        for( i=0; i<base.fileindex.length; i++ ) {
            record = base.fileindex[i][3];
            
            if( typeof base.preSave == 'function' ) {
                base.preSave(base.records[i]);
            }
            
            for( k in base.nosave ) {
                if( base.nosave[k] in record ) {
                    temps[ base.nosave[k] ] = record[ base.nosave[k] ];
                    delete record[ base.nosave[k] ];
                }
            }
            smallbuf = JSON.stringify( record );
            for( k in base.nosave ) {
                if( base.nosave[k] in temps ) {
                    record[ base.nosave[k] ] = temps[ base.nosave[k] ];
                }
            }
            if( i != 0 ) {
                smallbuf = "," + smallbuf;
            } else {
                smallbuf = "[" + smallbuf;
            }
            base.fileindex[i] = [offset,smallbuf.length,this.indexFor(base,record),record,1];
            buf += smallbuf;
            offset += smallbuf.length;
        }
        if( i != 0 )
            buf += "]";
        else
            buf = "[]";
        console.log("Write: " + i + " records, " + buf.length + " bytes.");
        base.eofmarker = offset;
        fs.writeFileSync( fn, buf, 'utf8' );
        base.state = 2;
    };

    
};
