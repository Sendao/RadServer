var fs = require('fs');
var objtool = require('../tool/object.js');
/*
 * Todo:
 * 
 ** Write an idle loop through app.js global routing to save dirty index
 ** Load index on startup
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
	this.bases = {};
	this.control = function(dbname) {
		this.mydbname = dbname;
		cc.bases[ dbname ] = [];
		
		this.workcycle = function() {
			cc.workCycle(this.mydbname);
		};
	};

    this.workCycle = function(dbname) {
    	var i;
    	
    	//console.log("db workCycle ", dbname, cc.bases[dbname].length);
    	
    	for( i=0; i < cc.bases[dbname].length; i++ ) {
    		this.workcycle( cc.bases[dbname][i] );
    	}
    };
    this.convey = function(dbname) {
    	this.db = cc;
    	this.mydbname = dbname;
    	cc.bases[dbname].push(this);
        this.records = []; // recordno: record
        this.queue = [];
        this.unique = [];
        this.fileindex = []; // recordno: offset, size, { index_backref }
        this.state = 0;
        this.workTimer = 0;
        this.quietDelay = 1000; // one second delay after every operation
        this.quietMax = 180; // 3 minute maximum before saving anyway
        
        if( typeof this.loadall == 'undefined' ) {
        	this.loadall = false;
        }
        if( typeof this.unique == 'undefined' ) {
        	this.unique = [];
        } else if( typeof this.unique == 'string' ) {
        	this.unique = [ this.unique ];
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
        	for( var i in this.indice ) {
        		this.primary = i;
        		if( this.unique.indexOf(i) == -1 )
        			this.unique.push(i);
        		break;
        	}
        }
        
        this.db.loadIndex(this);
        if( this.dirtyindex != 0 ) {
        	this.workTimer = 0;
        }
        
        this.loadRecords = function() {
        	this.db.loadScript(this);
        };
        
        this.importRecords = function( new_records ) {
            this.db.addRecords( this, new_records );
        };
        
        // clients should not have to use these two functions:
        this.indexKeyFor = function( field, value ) {
        	return value;
        };
        
        this.save = function( new_record ) {
            if( typeof this.preSave == 'function' ) {
                if( !this.preSave(new_record) )
                    return;
            }
            var handles = this.db.addRecords( this, [ new_record ] );
            this.db.saveHandles( this, handles );
        };
        
        this.get = function( ident ) {
        	var recordids = this.find( this.primary, ident );
        	if( recordids === false )
        		return false;
        	return this.fetch(recordids);
        };
        
        this.fetch = function( recordid ) {
        	if( typeof recordid != 'object' )
        		recordid = [ recordid ];
        	var results = this.retrieve( recordid );
        	if( results.length <= 0 || results === false )
        		return false;
        	if( results.length != 1 ) {
        		console.log("Expected only one result for primary key ", recordid, results);
        	}
        	return results[0];
        };
        
        this.search = function( by, value )
        {
        	var ids = this.find(by, value);
        	var results = this.retrieve(ids);
        	return results;
        };
        
        this.retrieve = function( found_ids ) {
        	if( found_ids === false ) return false; // gigo
        	if( typeof found_ids != 'object' )
        		found_ids = [ found_ids ];
        	console.log("retrive ", found_ids, " from ", this.fileindex);
        	return this.db.loadRecords(this, found_ids); 
        };
        
        // Level 1 interface - new items
        // create([params]) creates a new object and returns it.
        // addRecords([obj]) will add the object to the database.
        // saveRecord(obj) will then save that object.
        
        // Level 2 interface - operates by using handles to row indices
        
        // find(by,value) returns an array of handles
        // edit(handle, object) updates the handle
        // save(handle) saves the handle as it exists
        // exists(handle) says if a handle has been loaded
        
        this.exists = function(handle) {
        	return this.db.isLoaded(handle);
        };
        this.edit = function(handle, obj, autoClear=false) {
        	var rec, isnew=false;
        	
        	if( this.db.isLoaded(handle) ) {
        		rec = this.db.fetchRecord(handle);
        	} else if( !autoClear ) {
        		rec = this.db.loadRecord(handle);
        	} else {
        		rec = false;
        	}
        	if( rec == false || rec == null ) {
        		// new object (this.create());
        		rec = objtool.cloneObject( base.defaults );
        		isnew = true;
        	}
        	
        	// update the values in the record
        	objtool.cloneValues( rec, obj );
        	
        	// save the record
        	if( isnew ) {
        		this.db.addRecords( [rec] );
        	}
        	this.db.saveScriptFor(rec);
        	
        	return rec;
        };
        
        this.write = function( idx ) {
        	return this.db.saveScriptForHandle(idx);
        };
        
        this.find = function( by, value ) {
            if( by in this.indice ) {
                if( value in this.indice[by] ) {
                    return this.indice[by][value];
                } else {
                	console.log("No '" + value + "' found in ", this.indice[by]);
                }
            } else {
            	console.log("No index found for '" + by + "'");
            }
            return false;
        };
        
        this.create = function(values) {
            var a = objtool.cloneObject( this.defaults );
            if( this.primary == 'id' && this.unique.indexOf('id') != -1 ) {
            	if( typeof values == 'undefined' || !('id' in values) ) {
            		a['id'] = this.newid();
            		console.log("Using id " + a['id']);
            	}
            }
            if( typeof values != 'undefined' )
            	objtool.cloneValues( a, values );
            return a;
        };

        // this is called automatically by table.create(obj)
        this.newid = this.newident = function() {
            var i=1;
            if( this.state == 0 ) {
                this.db.loadScript(this);
            }
            while( i in this.indice[this.primary] ) {
                ++i;
            }
            return i;
        };
    };
    
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
    
    this.workcycle = function( base ) {
    	var timeNow = new Date().getTime();
    	
    	if( base.dirtyindex != 0 ) {
    		this.workTime = 0;
    		console.log("Work queue", base.name, base.queue.length);
   			this.clean(base);
   			base.queue = [];
   			base.dirtyindex = 0;
    		return true;
//    	} else {
//    		console.log("Skip queue", base.name, base.workTimer, timeNow);
    	}
    	return false;
    };
    this.enqueue = function( base, f ) {
    	base.queue.push(f);
    	console.log( base.fn, "enqueue" );
    };
    
    this.quietWorker = function( base ) {
    	var timeNow = new Date().getTime();
    	
    	if( base.quietStart == 0 ) {
    		base.quietStart = timeNow;
    	}
    	if( base.quietStart < timeNow-base.quietMax ) {
    		base.workTimer = 0; // go now
    		return;
    	}
    	base.workTimer = timeNow + base.quietDelay;
    };
    
    this.cleanIndex = function(base) {
    	base.fileindex = [];
    	for( i in base.indice ) {
    		base.indice[i] = {};
    	}
    };
    
    this.clean = function( base ) {
    	console.log("db " + base.name + " clean");
    	if( base.dirtyindex == 0 ) return;
    	if( base.dirtyindex == 1 ) { // only index was modified/scripts already written
    		this.saveIndex(base);
    		base.dirtyindex=0;
    	} else if( base.dirtyindex == 2 ) { // rewrite changed records
    		//this.indexFromRecords(base);
    		this.saveIndex(base);
    		this.saveScript(base); //! todo: only changed records
    		base.dirtyindex=0;
    	} else if( base.dirtyindex == 3 ) { // rewrite all records
    		this.indexFromRecords(base);
    		this.saveIndex(base);
    		this.saveScript(base);
    		base.dirtyindex=0;
    	}
    };
    
    //! return a list of handles
    this.addRecords = function( base, items ) {
    	var i, j, updated=false, newIndex;
    	var handles = [];
    	
    	for( i=0; i<items.length; i++ ) {
    		updated=false;
    		newIndex = this.indexFor( base, items[i] );
    		if( base.primary in base.unique ) {
    			if( (j=base.fetch( items[i][base.primary] )) != false ) {
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
    		this.constructIndexFor(base, j);
    	}
    	return handles;
    };
    
    
    this.loadIndex = function( base ) {
    	if( base.state != 0 ) return;
    	base.state = 1;
    	var buf, ifn = base.ifn;
    	
    	this.quietWorker(base);
    	this.cleanIndex(base);
    	
    	this.buildDirFor(ifn);
    	if( !fs.existsSync(ifn) ) {
    		console.log("Missing or old index", ifn);
    		this.loadScript(base);
    		console.log("Index reconstructed.", ifn);
    	} else {
    		buf = fs.readFileSync( ifn, "utf8" );
        	base.fileindex = JSON.parse(buf);
        	this.constructIndex(base); // builds base.indice from base.fileindex
        	console.log("Index loaded.", ifn);
    	}
    	var i;
    	for( i=0; i<base.fileindex.length; ++i ) {
    		base.fileindex[i][4] = 0; // 'not loaded'
    	}
    	console.log(ifn, " " + base.fileindex.length + " index records.");
    };
    
    this.loadScript = function( base ) {
        if( base.state > 1 ) return;
        base.state = 2;
        var buf, fn = base.fn;

        this.buildDirFor(fn);
        if( !fs.existsSync(fn) ) {
        	console.log("Missing or new db file " + fn);
            buf = "[]";
            base.eofmarker = 0;
        } else {
            console.log("Read: " + fn);
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
    };

    this.loadRecords = function( base, fids ) {
        var buf, fn = base.fn;
        var fidclone = objtool.cloneObject(fids);

        if( !fs.existsSync(fn) ) {
        	console.log("Missing or new db file " + fn);
            return false;
        }
        
        var fd = fs.openSync(fn, 'r');
        
        var i, fidno, fidx, resultArray = [];
        console.log("loadRecords(" + fids.length + ")");
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
        		console.log("Read ", fidx[1], " bytes from offset ", fidx[0]);
        		fs.readSync( fd, buf, 0, fidx[1], fidx[0] );
        		//console.log("Buffer ", buf, buf.toString());
        		fidx[3] = JSON.parse(buf.toString());
        		fidx[2] = this.indexFor( base, fidx[3] );
            	console.log("after index:", fids.length, fids);
            	this.constructIndexFor( base, fidno );
            	console.log("after construct:", fids.length, fids);
        	}
        	resultArray.push( fidx[3] );
        	//console.log("next of " + fids.length);
        }
        //this.indexDirty(base,1);
        if( resultArray.length == 0 )
        	return false;
        return resultArray;
    };
    
    this.indexFromRecords = function(base) {
    	var i, j, idx, item;
    	
    	// build the index based on records.
    	this.cleanIndex(base);
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
        this.indexDirty(base,2);
    };

    this.constructIndex = function(base)
    {
    	var fidno, i, fidx;
    	
    	this.cleanIndex(base);
    	for( fidno=0; fidno<base.fileindex.length; ++fidno ) {
    		fidx = base.fileindex[fidno];
        	for( i in fidx[2] ) {
        		if( !(fidx[2][i] in base.indice[i]) ) {
        			base.indice[i][ fidx[2][i] ] = [];
        		}
        		if( base.indice[i][ fidx[2][i] ].indexOf(fidno) == -1 )
        			base.indice[i][ fidx[2][i] ].push(fidno);
        	}
    	}
        this.indexDirty(base,1);
    };
    
    this.constructIndexFor = function(base, fidno)
    {
    	var fi = base.fileindex[fidno][2];
    	var i;
    	
    	for( i in base.indice ) {
    		if( !(fi[i] in base.indice[i]) ) {
    			base.indice[i][ fi[i] ] = [];
    		}
    		if( typeof base.indice[i][fi[i]] != 'object' ) {
    			console.log("Irregular: ", base.indice[i][fi[i]]);
    		}
    		if( base.indice[i][ fi[i] ].indexOf(fidno) == -1 )
    			base.indice[i][ fi[i] ].push(fidno);
    	}
    };
    
    this.indexDirty = function(base, val)
    {
    	console.log(base.fn, "indexDirty");
    	if( base.dirtyindex == 0 )
    		this.enqueue( base, this.clean );
    	if( base.dirtyindex < val )
    		base.dirtyindex = val;
    }
        
    this.deleteRecordsById = function( base, ids ) {
        var i, idkey, remids = [], deleted = 0;
        var remids = [], q;
        
    	this.quietWorker(base);
    	
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
        
        this.db.indexDirty(base,2);
        if( deleted != ids.length ) {
        	console.log("!!! Deleted " + deleted + " instead of " + ids.length + " records!!!");
        }
        return deleted;
    };
    
    this.isLoaded = function( base, n ) {
    	if( base.fileindex[n][4] == 1 )
    		return true;
    };

    this.indexFor = function( base, item ) {
    	var i, idx = {};
    	
    	for( i in base.indice ) {
    		//console.log(i, item[i]);
    		idx[i] = item[i];
    	}
    	//console.log("Calculate index: ", idx, "For: ", item);
    	return idx;
    };
    
    this.saveHandles = function( base, handles ) {
    	var i;
    	
    	for( i = 0; i < handles.length; i++ ) {
    		this.saveScriptForHandle(base,handles[i]);
    	}
    };
    
    this.saveScriptForHandle = function( base, mainidx ) {
    	var item = base.fileindex[mainidx][3];
    	if( typeof base.preSave == 'function' ) {
    		base.preSave(item);
    	}
    	
    	var mobj = base.fileindex[ mainidx ];
    	console.log("save(", mobj, ")");
    	var fn = base.fn;
    	var k;
    	for( k in base.nosave ) {
    		if( base.nosave[k] in base.records[i] ) {
    			temps[ base.nosave[k] ] = base.records[i][ base.nosave[k] ];
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
    	console.log("1");
		if( typeof base.eofmarker == 'undefined' )
			base.eofmarker = 0;
		if( mobj[0] == 0 && mobj[1] == 0 ) { // new record
			mobj[0] = base.eofmarker-1;
    		if( mobj[0] < 0 ) mobj[0] = 0;
    		base.eofmarker += newsize-1;
    		atEOF = true;
		} else if( newsize > mobj[1] ) {
    		mobj[0] = base.eofmarker-1;
    		if( mobj[0] < 0 ) mobj[0] = 0;
    		base.eofmarker += newsize-1;
    		atEOF = true;
    	} else if( newsize < mobj[1] ) {
    		// pad with spaces
    		while( newsize < mobj[1] ) {
    			buf += " ";
    			newsize++;
    		}
    	}
		console.log("2", mobj[0], mobj[1]);
    	mobj[1] = newsize;
    	
    	if( ( mobj[0] + mobj[1] >= base.eofmarker ) || atEOF ) {
    		buf += "]";
    		atEOF=true;
    	}
    	var adjustStart = 0;
    	if( mobj[0] == 0 ) {
    		mobj[0] = 1;
    		buf = "[" + buf;
    		adjustStart = -1;
    	}
    	var fd;
    	if( !fs.existsSync(fn) ) {
    		fd = fs.openSync(fn, 'w');
    	} else {
    		fd = fs.openSync(fn, 'r+');
    		console.log("File opened r+");
    		var tbuf = new Buffer(5);
    		fs.readSync(fd,tbuf,0,5,0);
    	}
    	var buf2 = new Buffer(buf);
    	console.log("Script ", mobj[0], ",", adjustStart, " : ", mobj[1], ",", atEOF, " bytes.");
    	fs.writeSync( fd, buf, mobj[0]+adjustStart, mobj[1] + (atEOF ? 1 : 0), 0 );
    	fs.closeSync(fd);
    	    	
    	mobj[2] = this.indexFor( base, item );
    	mobj[3] = item;
    	mobj[4] = 0;
    	
        this.indexDirty(base,1);
    	// this.saveIndexFor(base,item);
    };
    
    // saveScriptFor: saves a single item and rebuilds its index.
    this.saveScriptFor = function( base, item ) {
    	var mainidx = this.mainIndexFor(base,item);
    	
    	//! update handle?
    	this.saveScriptForHandle(base, mainidx);
    };
    
    // saveIndex: saves the current index
    this.saveIndex = function( base ) {
		var fn = base.ifn;
		
		console.log("Write index " + fn);
		this.buildDirFor(fn);
		// rebuild the fileindex as clear.
		//! separate records from the fileindex again, but properly this time.
		var i;
		var fi = [], fi0;
		for( i=0; i<base.fileindex.length; ++i ) {
			fi0 = objtool.cloneObject(base.fileindex[i]);
			fi0[3] = 0;
			fi0[4] = 0;
			fi.push(fi0);
		}
		var buf = JSON.stringify(fi);
		//console.log("Index: ", fi0);
		fs.writeFileSync( fn, buf );
		base.dirtyindex = 0;
		if( base.state < 1 ) base.state=1;
    };
    
    // saveScript: saves the script and rebuilds the file index.
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
    		base.fileindex[i] = [offset,smallbuf.length,this.indexFor(base,base.records[i]),record,1];
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
