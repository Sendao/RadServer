var fs = require('fs');
/*
 * base^2
 * database and interface for node.js
 * 
 * Todo:
 ** Remove empties from the records
 ** Fix findSpace()
 ** Merge empty spaces
 ** dynamically load and save individual index records
 *
 */

// hilites..
// base.fileindex[i] = [offset,onerecord.length,this.indexFor(base,base.records[i]),record,0|1|5];
// fileindex[i][4] == 5 // deleted
// fileindex[i][4] == 1 // loaded
// fileindex[i][4] == 0 // on disk

module.exports = function DbCore()
{ // 'base'
    var cc = this;

    this.locateTable = function(dbname, tablemain, tablename)
    {
        var xb = this.bases[dbname];
        if( !xb ) return false;
        var i, j;
        for( i=0; i<xb.length; i++ ) {
            j = xb.table(tablemain, tablename);
            if( j !== false ) {
                return j;
            }
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
    
    /* workcycle: runs repeatedly */
    this.workcycle = function( base ) {
        var timeNow = new Date().getTime();
        var i;
        
        for( i in base.tables ) {
            if( base.tables[i].rebuildindex != 0 || base.tables[i].haswrites != false ) {
                this.clean(base.tables[i]);
                base.tables[i].rebuildindex = 0;
            }
        }
        // Send connected data update messages to subscribers
        if( ('messages' in base) && base.messages.length > 0 ) {
            console.log("db." + base.name + " sending messages " + base.messages.length);
            var i = base.messages;
            delete base.messages;
            base.messages = [];
            this._sendMessages(base, i);
        }
        
        if( base.rebuildindex != 0 ) {
            //console.log("db." + base.name + " clean-up");
            this.clean(base);
            base.rebuildindex = 0;
            return true;
        }
        return false;
    };

    /* Register a socket client to receive updates on a database condition */ 
    this.subscribe = this.registerClient  = function( base, client, code, cond ) {
        if( !('clients' in base) || typeof base.clients == 'undefined' )
            base.clients = [];
        var i = base.clients.indexOf( client );
        if( i == -1 ) {
            i = base.clients.length;
        }
        base.clients.splice(i, i == base.clients.length ? 0 : 1, [ client, code, cond ] );
    };
    
    /* Clean client list. Client list is used for messaging. */ 
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
    
    /* sendMessage: notifies the database that an object has been modified and should be messaged to all clients */
    this.sendMessage = function( base, code, modified_obj ) {
        var i = base.clients.length; // clients = [ client, code, conds=[(index,opcode,value),cond2,cond3,...], client2, code2,... ] 
        var j, cond, passedAll;
        //console.log("Broadcast: [" + code + "]", typeof modified_obj);
        while( i > 0 ) {
            i-=3;
            if( base.clients[i+1] == code ) {
                j = cond.length;
                passedAll = true;
                while( j > 0 ) {
                    j -= 3;
                    if( !base.testCondition( modified_obj[cond[j+0]], cond[j+1], cond[j+2] ) ) {
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
    
    /* Clean: store data in the file depending on what has changed */
    this.clean = function( base ) {
        if( 'additemqueue' in base && base.additemqueue.length > 0 )
            this.addRecordsFinish(base);
        if( 'upditemqueue' in base && base.upditemqueue.length > 0 )
            this.updRecordsFinish(base);
       
        if( base.rebuildindex == 0 || typeof base.rebuildindex == 'undefined' ) return;
        //console.log(base.name, "clean", base.rebuildindex);
        if( (base.rebuildindex & 1) == 1 ) { // only index was modified/scripts already written
            base.rebuildindex -= 1;
            this.saveIndex(base);
        }
        if( (base.rebuildindex & 2) == 2 ) { // rewrite changed records
            //this.indexFromRecords(base);
            base.rebuildindex -= 2;
            this.saveIndex(base);
            this.saveScript(base); //! todo: only changed records
        }
        if( (base.rebuildindex & 4) == 4 ) { // rewrite deleted records
            base.rebuildindex -= 4;
            this.saveEmpties(base);
        }
        if( (base.rebuildindex & 8) == 8 ) { // rewrite all records (unused)
            base.rebuildindex -= 8;
            this.indexFromRecords(base);
            this.saveIndex(base);
            this.saveScript(base);
        }
        //console.log(base.name, "clean", base.rebuildindex);
    };
    
    /* enqueue: signals that it is ok to run 'clean()' */
    this.backgroundWrite = function( base, f ) {
        if( typeof base.rebuildindex == 'undefined' ) base.rebuildindex = f;
        base.rebuildindex = (base.rebuildindex | f);
        //console.log(base.name, "backgroundWrite(" + f + ")=" + base.rebuildindex);
    };

    /* sendMessages: sends updates via websockets */
    this._sendMessages = function( base, msgSet ) {
        var i, len = msgSet.length;
        var msg;
        
        for( i = 0; i < len; ++i ) {
            msg = msgSet[i];
            msg[0].send( { 'code': msg[1], 'data': msg[2] } );
        }
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
                fs.mkdirSync(buildpath);
            }
        }
    };
    
    
    /* cleanIndex: clear and prepare the main indices */
    this.cleanIndex = function(base) {
        for( i in base.indice ) {
            base.indice[i] = {};
        }
    };

    this.updRecordsBack = function( base, items ) {
        base.upditemqueue.push(items);
        base.haswrites = true;
    };
    this.updRecordsFinish = function( base ) {
        var i;
        var iq = base.upditemqueue;

        for( i=0; i<iq.length; ++i ) {
            this.updRecords(base, iq[i]);
        }
        base.upditemqueue = [];
        base.haswrites = false;
    };
    this.addRecordsBack = function( base, items ) {
        base.additemqueue.push(items);
        base.haswrites = true;
    };
    this.addRecordsFinish = function( base ) {
        var i;
        var iq = base.additemqueue;
        
        for( i=0; i<iq.length; ++i ) {
            this.addRecords(base, iq[i]);
        }
        base.additemqueue = [];
        base.haswrites = false;
    };
    
    this.updRecords = function( base, items ) {
        var i, idx, item;
        var handle, newrecords=[];
        var handles = [];
        var newItem;
        
        for( handle in items ) {
            if( handle < 0 || handle >= base.fileindex.length ) {
                newrecords.push(items[i]);
                continue;
            }
            if( base.fileindex.length < handle ) {
                console.info("UpdRecords: Does not exist handle " + handle + " of " + base.fileindex.length);
                return;
            }
            item = this.app.util.cloneObject( items[handle] );
            handles.push(handle);
            base.records[handle] = item;
            base.fileindex[handle][2] = this.indexFor( base, item );
            base.fileindex[handle][3] = item;
            base.fileindex[handle][4] = 1;
            this.constructIndexFor( base, handle );
            if( base.use_messaging )
                this.sendMessage( base, base.name + "_update", item );
        }
        if( newrecords.length > 0 ) {
            console.info("updRecords has new records");
            handles2=this.addRecords( base, newrecords );
            for( i=0; i<handles2.length; ++i ) {
                handles.push( handles2[i] );
            }
        }
        return handles;
    };
    
    /* addRecords: add records to the data storage space. */
    this.addRecords = function( base, items ) {
        var i, handle, updated=false, newIndex;
        var handles = [], newItem;
        console.log(base.name, "addRecords");
        
        for( i=0; i<items.length; i++ ) {
            updated=false;
            handle=false;
            newItem = this.app.util.cloneObject( items[i] );
            newIndex = this.indexFor( base, newItem );
            if( base.primary in base.unique ) {
                if( (handle=base.fetch( newItem[base.primary] )) !== false ) {
                    console.log("addRecords() on existing record. Use saveScriptForHandle or updRecords instead.");
                    base.fileindex[handle] = [ 0, 0, newIndex, newItem, 1 ];
                    this.constructIndexFor( base, handle );
                    handles.push(handle);
                    if( base.use_messaging )
                        this.sendMessage( base, base.name + "_update", newItem );
                    updated=true;
                }
            }
            if( !updated ) { // this is a new record indeed, put it at the end.
                handle = base.fileindex.length;
                base.fileindex.push( [ 0, 0, newIndex, newItem, 1 ] );
                this.constructIndexFor( base, handle );
                handles.push(handle);
                if( base.use_messaging )
                    this.sendMessage( base, base.name + "_append", newItem );
            }
        }
        if( typeof base.postLoad == 'function' ) {
            base.postLoad(items);
        }
        return handles;
    };
    
    this.removeIndex = function( base, idx ) {
        var mobj = base.fileindex[idx];
        // clear up used space
        this.clearSpace( base, mobj[0], mobj[1] );
        base.fileindex.splice( idx, 1 );
        // remove references from indice
        // adjust indice records -1
        var i, j, n, len;
        for( i in base.indice ) {
            //len = base.indice[i].length;
            for( j in base.indice[i] ) {//for( j=0; j<len; ++j ) {
                len = base.indice[i][j].length;

                for( n=0; n<len; ++n ) {
                    if( base.indice[i][j][n] == idx ) {
                        console.info("Found index " + idx);
                        base.indice[i][j].splice(n,1);
                        n--;
                        len--;
                    } else if( base.indice[i][j][n] > idx ) {
                        console.info("Found index>" + idx);
                        base.indice[i][j][n]--;
                    }
                }
            }
        }
    };
    
    
    
    
    

    
    /* findSpace: search empties for a space */
    this.findSpace = function( base, length ) {
        var i, len=base.fileindex.length, pos;
        
        for( i=0; i<len; ++i ) {
            if( base.fileindex[i][4] == 5 && base.fileindex[i][1] >= length ) {
                return i;
            }
        }
        
        var new_idx = base.fileindex.length;
        
        base.fileindex.push( [ base.eofmarker-1, length, false, false, 0 ] );
        
        return new_idx;
    };

    
    /* clearSpace: create a new empty record */
    this.clearSpace = function( base, idx, bytes ) {
    	// create a new handle to hold the empty space
    	var new_idx = base.fileindex.length;
        console.log("clearSpace(", idx, ",", bytes, ")");
    	base.fileindex.push( [ idx, bytes, false, false, 5 ] );
    	console.log("point 1");
    	this.saveScriptForHandle( base, base.fileindex.length-1 );
    	// push to empties list
    	//base.empties.push(new_idx);
    	console.log("clearSpace complete");
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
            	if( base.fileindex[i][4] == 1 )
            		base.fileindex[i][4] = 0; // 'not loaded'
            }
        }
        //console.log(ifn, " " + base.fileindex.length + " index records.");
    };
    
    
    
    /* loadScript: load all data from disk. */
    this.loadScript = function( base ) {
        var buf, fn = base.fn;
        
        
        this.loadIndex(base);
        this.buildDirFor(fn);
        for( i = 0; i < base.fileindex.length; ++i ) {
            try {
                this.loadRecords(base, [i]);
            } catch(e) {
                console.log("Error", e);
                console.log(buf.toString());
            }
        }
    };
   
    
    
    
    
    
    
    
    
    
    

    /* loadRecords: load handles to data. */
    this.loadRecords = function( base, fids ) {
        var buf, fn = base.fn;

        if( !fs.existsSync(fn) ) {
            console.log("Missing or new db file " + fn);
            return false;
        }
        
        var fd = fs.openSync(fn, 'r');
        
        var i, fidno, fidx, resultArray = [];
        if( !'records' in base )
            base.records = [];
        console.log("loadRecords(", base.name, fids, ")");
        for( i=0; i<fids.length; i++ ) {
            fidno = fids[i];
            if( !(fidno in base.fileindex) ) {
                console.log("Cannot locate record '" + fidno + "'(" + typeof fidno + ") in index!");
                console.log(base.fileindex);
                console.log(base.fileindex.length);
                continue;
            }
            if( !(fidno in base.records) ) {
                base.records[fidno] = {};
            }
            var fidx = base.fileindex[fidno];
            var bufstr;
            if( fidx[4] == 0 ) {
                buf = Buffer.alloc( fidx[1]+7 );
                fs.readSync( fd, buf, 0, fidx[1], fidx[0] );
                bufstr = buf.toString().substr(0, fidx[1]);
                try {
//                    console.log("buffer data", bufstr);
                    fidx[3] = JSON.parse(bufstr);
                    console.log("loadrecord", fidx[3]);
                } catch(err) {
                    console.log("Error");
                    console.log(err);
                    console.log("Buffer '", "-" + bufstr + "-", "'");
                    fidx[3] = false;
                }
                if( !isNaN(fidx[3]) ) {
                    base.records[fidno] = false;
                    fidx[3] = false;
                    fidx[2] = false;
                } else {
                    base.records[fidno] = fidx[3];
                    fidx[2] = this.indexFor( base, fidx[3] );
                    this.constructIndexFor( base, fidno ); // indices[]
                }
            }
            resultArray.push( fidx[3] );
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
        console.info("IndexFromRecords(" + base.name + ")");
        for( j=0; j<base.records.length; j++ ) {
            item = base.records[j];
            if( item == null ) continue;
            var itembuf = JSON.stringify( item );
            var itemsize = itembuf.length;
            base.fileindex[j] = [ fileoffset, itemsize, this.indexFor(base, item), item, 1 ];
            fileoffset += itemsize + 1;
            this.constructIndexFor(base, j);
        }
        this.backgroundWrite(base,2); // rewrite all data
    };

    /* constructIndex: build indices from fileindex */
    this.constructIndex = function(base)
    {
        var fidno, i, fidx, tealength=0;
        
        this.cleanIndex(base);
        console.info("ConstructIndex("+base.name+")");
        for( fidno=0; fidno<base.fileindex.length; ++fidno ) {
            fidx = base.fileindex[fidno];
            if( tealength == 0 ) tealength = 2;
            tealength += fidx[1];
            for( i in fidx[2] ) {
                if( !(fidx[2][i] in base.indice[i]) ) {
                    base.indice[i][ fidx[2][i] ] = [];
                }
                if( this.app.util.indexOf( base.indice[i][ fidx[2][i] ], fidno) === false )
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
        
        console.info("ConstructIndexFor("+base.name+","+fidno+")");
        for( i in base.indice ) {
            if( !(fi[i] in base.indice[i]) ) {
                base.indice[i][ fi[i] ] = [];
            }
            if( typeof base.indice[i][fi[i]] != 'object' ) {
                console.log("Irregular index: ", base.indice[i][fi[i]]);
            }
            if( this.app.util.indexOf( base.indice[i][ fi[i] ], fidno) === false )
                base.indice[i][ fi[i] ].push(fidno);
        }
        this.backgroundWrite(base,1);
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
            base.empties.push( remids[i] );
        }
        if( base.use_messaging )
            this.sendMessage( this, this.name + "_remove", ids );

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
     *  does not update the index
     */
    this.saveScriptForHandle = function( base, mainidx ) {
        var mobj = base.fileindex[ mainidx ];
        
        if( mobj[4] == 0 ) {
        	console.warn("saving an unloaded entry");
        }
        
        //console.log("write(", mobj, ")");
        console.log("write(", mobj, ") (", mainidx, ")");
        var item = mobj[3];
        if( item === false ) {
            
        } else if( typeof base.preSave == 'function' ) {
            base.preSave(item);
        }
        var temps = {};
        var fn = base.fn;
        var k, buf;

        if( mobj[4] == 5 || item === false ) {
            console.log("saving a blank entry as 0");
        	item = null;
        	buf = "0";
        	for( k=1; k<mobj[1]; ++k )
        		buf += " ";
        } else {
	        for( k in base.nosave ) {
	            if( base.nosave[k] in item ) {
	                temps[ base.nosave[k] ] = item[ base.nosave[k] ];
	                delete item[ base.nosave[k] ];
	            }
	        }
	        buf = JSON.stringify(item);
	        for( k in base.nosave ) {
	            if( base.nosave[k] in temps ) {
	                item[ base.nosave[k] ] = temps[ base.nosave[k] ];
	            }
	        }
        }
        
        var newsize = buf.length;
        var adjStart = 0;
        var adjEnd = 0;
        var atEOF = false;

        if( typeof base.eofmarker == 'undefined' )
            base.eofmarker = 0;
        
        if( mobj[0] == 0 && mobj[1] == 0 ) { // new record
            mobj[0] = base.eofmarker - 1;
            if( mobj[0] < 0 ) mobj[0] = 0;
            atEOF = true;
        } else if( newsize > mobj[1] ) {
            console.log(newsize, ">", mobj[1], ", move to end (", base.eofmarker, ")");
            try {
                this.clearSpace( base, mobj[0], mobj[1] );
            } catch( ex ) {
                console.info("clearSpace() had an error");
                console.info(ex);
            };
            //mobj[0] = base.eofmarker - 1;
            
            var itemcopy = cc.app.util.cloneObject(item);
            console.info("Copied item:", itemcopy);
            this.removeIndex( base, mainidx );
            mainidx = this.findSpace( base, newsize );
            mobj = base.fileindex[mainidx];
            mobj[3] = itemcopy;
            item = itemcopy;
            mobj[4] = 1;
            
            console.info("New index: ", mainidx, mobj);
            //
            
            if( mobj[0] < 0 ) mobj[0] = 0;
            console.log("eof after findSpace: ", base.eofmarker, ", ", mobj[0])
            atEOF = true;
        }
        if( newsize < mobj[1] ) {
            console.info("newsize<oldsize");
            while( newsize < mobj[1] ) {
                buf += " ";
                newsize++;
            }
        }
        mobj[1] = newsize;
        
        if( mobj[0] <= 1 ) { // first record
            adjStart = -1;
            adjEnd += 1;
            mobj[0] = 1;
            buf = "[" + buf;
        } else { // other records
            buf = "," + buf;
            adjStart = -1;
            adjEnd += 1;
        }
        if( ( mobj[0] + mobj[1] >= base.eofmarker ) || atEOF ) {
            buf += "]";
            adjEnd += 1;
            atEOF=true;
            base.eofmarker = mobj[0] + mobj[1] + adjEnd;
            console.info("Push eof to end @", base.eofmarker);
        }
        var fd = app.file.open(fn);
        //console.log("Script ", mobj[0], ",", adjustStart, " : ", mobj[1], ",", atEOF, ":", base.eofmarker, " bytes.");
        /*
        fs.writeSync( fd, buf, mobj[0]+adjStart, mobj[1] + adjEnd, 0 );
        fs.closeSync(fd);
        */
        console.info("Write ", buf, " at ", mobj[0]+adjStart);
        app.file.write( fd, mobj[0]+adjStart, buf, mobj[1] + adjEnd );
        app.file.close( fd );
        
        if( mobj[4] == 1 ) {
            mobj[2] = this.indexFor( base, item );
            mobj[3] = item;
            this.constructIndexFor( base, mainidx );
            mobj[4] = 1;
        }
        this.backgroundWrite(base,1);
        // this.saveIndexFor(base,item);
    };
    
    
    
    
    /* saveIndex: saves the current index to disk */
    this.saveIndex = function( base ) {
        var fn = base.ifn;
        
        console.log("Write index " + fn);
        this.buildDirFor(fn);

        var i;
        var fi = [], fi0;
        for( i=0; i<base.fileindex.length; ++i ) {
            fi0 = cc.app.util.cloneObject(base.fileindex[i]);
            fi0.splice(3,2,0,0);
            fi.push(fi0);
        }
        var buf = JSON.stringify(fi);
        console.log("Index: ", fi);
        fs.writeFileSync( fn, buf );
        
        base.rebuildindex = 0;
        if( base.state < 1 ) base.state=1;
    };
    
    
    this.loadRemnant = function( base ) {
        var i;
        var len = base.fileindex.length;
        var loadrecords = [];
        console.info("loadRemnant");
        for( i=0; i<len; ++i ) {
            if( base.fileindex[i][4] == 0 ) {
                loadrecords.push( i );
                console.info("handle " + i);
            }
        }
        this.loadRecords(base,loadrecords);
    };
    
    /* saveScript: saves all data to file. any data that has not been loaded will be destroyed. */
    this.saveScript = function( base ) {
        var fn = base.fn;
        
        //console.log("Write "+ fn);
        this.buildDirFor(fn);
        var i, offset=1, buf = "", smallbuf, k;
        var temps = {};
        var record, len = base.fileindex.length;
        
        this.loadRemnant(base);
        
        for( i=0; i<len; ++i ) {
            record = base.fileindex[i][3];
            
            if( i == 0 ) {
                smallbuf = "[";
            } else {
                smallbuf = ",";
            }

            if( base.fileindex[i][4] == 1 ) { 
	            if( typeof base.preSave == 'function' ) {
	                base.preSave(base.records[i]);
	            }
	            
	            for( k in base.nosave ) {
	                if( base.nosave[k] in record ) {
	                    temps[ base.nosave[k] ] = record[ base.nosave[k] ];
	                    delete record[ base.nosave[k] ];
	                }
	            }
	            smallbuf += JSON.stringify( record );
	            for( k in base.nosave ) {
	                if( base.nosave[k] in temps ) {
	                    record[ base.nosave[k] ] = temps[ base.nosave[k] ];
	                }
	            }
	            base.fileindex[i] = [offset,smallbuf.length-1,this.indexFor(base,record),record,1];
            } else if( base.fileindex[i][4] == 5 ) {
            	for( k=0; k<base.fileindex[i][2]; ++k ) {
            		smallbuf += " ";
            	}
            	base.fileindex[i][0] = offset;
            	base.fileindex[i][2] = 0;
            	base.fileindex[i][3] = 0;
            }
            buf += smallbuf;
            offset += smallbuf.length;
        }
        if( i != 0 )
            buf += "]";
        else
            buf = "[]";
        //console.log("Write: " + i + " records, " + buf.length + " bytes.");
        base.eofmarker = offset;
        fs.writeFileSync( fn, buf, 'utf8' );
        base.state = 2;
    };
};
