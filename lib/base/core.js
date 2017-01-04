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
            if( base.tables[i].rebuildindex != 0 ) {
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
                fs.mkdir(buildpath);
            }
        }
    };
    
    
    /* cleanIndex: clear and prepare the main indices */
    this.cleanIndex = function(base) {
        for( i in base.indice ) {
            base.indice[i] = {};
        }
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
                // We would ideally search for a deleted slot to use
                // however for now just use the end since deleted slots aren't saved&loiaded yet.
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
    
    
    /* calculateEmpties: figures out the empties list. */
    this.calculateEmpties = function( base ) {
        var i, len = base.fileindex.length;
        var slot;
        base.empties=[];
        for( i=0; i<len; ++i ) {
            if( base.fileindex[i][4] == 5 ) { // deleted
                base.empties.push(i);
            }
        }
    };
    
    
    /* loadEmpties: load a list of empties that new records can be placed in. */
    this.loadEmpties = function( base ) {
        var fn = base.slotfn;
        var buf;

        if( !fs.existsSync(fn) ) {
            //console.log("Missing or new db file " + fn);
            buf = "[]";
        } else {
            //console.log("Read: " + fn);
            buf = fs.readFileSync( fn, "utf8" );
        }
        base.empties = JSON.parse(buf);
    };
    
    /* saveEmpties: saves the slot list. */
    this.saveEmpties = function( base ) {

        var fn = base.slotfn;
        var buf = "";
        var i;
        
        this.calculateEmpties(base);

        var buf = JSON.stringify(base.empties);
        
        fs.writeFileSync( fn, buf );
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
        
        // console.log("Read", buf.toString());
        try {
            base.records = JSON.parse(buf.toString());
        } catch(e) {
            console.log("Error", e);
            console.log(buf.toString());
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
            var bufstr;
            if( fidx[4] == 0 ) {
                buf = Buffer.alloc( fidx[1]+1 );
                if( fidx[0] != 1 )
                    fs.readSync( fd, buf, 0, fidx[1], fidx[0] );
                else
                    fs.readSync( fd, buf, 0, fidx[1], 1 );
                bufstr = buf.toString().substr(0, fidx[1]);
                try {
                    fidx[3] = JSON.parse(bufstr);
                } catch(err) {
                    console.log("Error");
                    console.log(err);
                    console.log("Buffer '" + bufstr + "'");
                }
                base.records[fidno] = fidx[3];
                fidx[2] = this.indexFor( base, fidx[3] );
                this.constructIndexFor( base, fidno );
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
        
        console.info("ConstructIndexFor("+base.name+","+fidno+")");
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
        
        //console.log("write(", mobj, ")");
        console.log("write(", mobj, ") (", mainidx, ")");
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
        
        var newsize = buf.length;
        var adjStart = 0;
        var adjEnd = 0;
        var atEOF = false;

        if( typeof base.eofmarker == 'undefined' )
            base.eofmarker = 0;
        
        if( mobj[0] == 0 && mobj[1] == 0 ) { // new record
            mobj[0] = base.eofmarker-1;
            if( mobj[0] < 0 ) mobj[0] = 0;
            base.eofmarker += newsize;
            if( mainidx != 0 ) base.eofmarker++;
            atEOF = true;
        } else if( newsize > mobj[1] ) {
            mobj[0] = base.eofmarker-1;
            if( mobj[0] < 0 ) mobj[0] = 0;
            base.eofmarker += newsize;
            if( mainidx != 0 ) base.eofmarker++;
            atEOF = true;
        } else if( newsize < mobj[1] ) {
            while( newsize < mobj[1] ) {
                buf += " ";
                newsize++;
            }
        }
        mobj[1] = newsize;
        
        if( ( mobj[0] + mobj[1] >= base.eofmarker ) || atEOF ) {
            buf += "]";
            adjEnd += 1;
            atEOF=true;
        }
        if( mobj[0] == 0 ) {
            adjStart = -1;
            adjEnd += 1;
            mobj[0] = -adjStart;
            buf = "[" + buf;
            base.eofmarker += 2; // one for [, the other for ]
        } else {
            buf = "," + buf;
            adjStart = -1;
            adjEnd += 1;
            base.eofmarker += 1;
        }
        var fd;
        if( !fs.existsSync(fn) ) {
            fd = fs.openSync(fn, 'w');
        } else {
            fd = fs.openSync(fn, 'r+');
            //console.log("File opened r+");
            var tbuf = new Buffer(5);
            fs.readSync(fd,tbuf,0,4,0);
        }
        var buf2 = new Buffer(buf);
        //console.log("Script ", mobj[0], ",", adjustStart, " : ", mobj[1], ",", atEOF, ":", base.eofmarker, " bytes.");
        fs.writeSync( fd, buf, mobj[0]+adjStart, mobj[1] + adjEnd, 0 );
        fs.closeSync(fd);
        this.constructIndexFor( base, mainidx );
        mobj[2] = this.indexFor( base, item );
        mobj[3] = item;
        mobj[4] = 1;
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
    
    
    this.loadRemnant = function( base ) {
        var i;
        var len = base.fileindex.length;
        var loadrecords = [];
        
        for( i=0; i<len; ++i ) {
            if( base.fileindex[i][3] == 0 ) {
                loadrecords.push( i );
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
            
            if( typeof base.preSave == 'function' ) {
                base.preSave(base.records[i]);
            }
            
            for( k in base.nosave ) {
                if( base.nosave[k] in record ) {
                    temps[ base.nosave[k] ] = record[ base.nosave[k] ];
                    delete record[ base.nosave[k] ];
                }
            }
            if( i == 0 ) {
                smallbuf = "[";
            } else {
                smallbuf = ",";
            }
            for( k in base.nosave ) {
                if( base.nosave[k] in temps ) {
                    record[ base.nosave[k] ] = temps[ base.nosave[k] ];
                }
            }
            smallbuf += JSON.stringify( record );
            base.fileindex[i] = [offset,smallbuf.length-1,this.indexFor(base,record),record,1];
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
