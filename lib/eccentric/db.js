import fs from 'fs';
import path from 'path';
import {Utils} from '../tool/util.js';
const util = new Utils();
var myapp;
let readBuffer = null;
const readlen = 50000;

export function startup(app)
{
  myapp = app;
  app['lkv'] = LargeKVStore;
  app['skv'] = SimpleKVStore;
  app['crc'] = stringsum;
  readBuffer = Buffer.alloc(readlen);
}

export function stringsum(str) {
    let n = 3000;
    for( var i=0; i<str.length; i++ ) {
	    n = ( n + str.charCodeAt(i) ) % 8000;
    }
    return n;
}

export class DiskBackedChunk {
  constructor(path) {
    this.path = path;
    this.fd = null;
  }
  async init() {
    this.fd = fs.openSync(this.path, "a+");
  }

  async get(offset, length) {
    if( this.fd === null ) {
      throw "file not initialized for diskbackedchunk";
    }

    let bytesRead = 0;
    let bytes = 0;
    let left = length;

    while( bytes < length ) {
      bytesRead = fs.readSync(
        this.fd,
        readBuffer,
        0,
        left > readlen ? readlen : left,
        offset+bytes
      );
      left -= bytesRead;
      bytes += bytesRead;
    }
    if( bytes < length )
      readBuffer.fill(0, bytes, left);
    return readBuffer;
  }

  async set(offset, length, value) {
    if (!Buffer.isBuffer(value) && !(value instanceof Uint8Array)) {
      throw new Error("value must be Buffer or Uint8Array");
    }

    if (value.length < length) {
      throw new Error("value length < length");
    }

    fs.writeSync(
      this.fd,
      value,
      0,
      length,
      offset
    );
  }

  async close() {
    fs.closeSync( this.fd );
    this.fd = null;
  }
}


export class SimpleKVStore {
  constructor(filename, erasePre=false) {
    this.filename = filename;
    this.store = new Map(); // In-memory cache
    this.loose = false;
    this.changed = false;
    this.loaded = false;
    this.cached = false;
    this.erase = erasePre;
    if( typeof this.filename != 'string' ) {
      console.log("Bad usage in db");
      throw "bad use";
    }
  }
  async init() {
    await this.load();
  }
  async load() {
    if( this.cached ) return;
    if( fs.existsSync(this.filename) ) { 
      if( this.erase ) {
        console.log("Overwrite sim--pull store " + this.filename);
        fs.unlinkSync(this.filename);
        fs.writeFileSync(this.filename, '');
	      this.erase = false;
	      this.loaded = true;
        this.cached = true;
	      return;
    	}
    } else {
	    console.log("New sim--pull store " + this.filename);
	    this.erase = false;
    	this.loaded = true;
      fs.writeFileSync(this.filename, '');
      this.cached = true;
      return;
    }
    if( this.changed || this.loaded ) {
      console.warn("requested reload of database over existing data: " + this.filename);
      throw "don't";
      return;
    }

    const lines = fs.readFileSync(this.filename, 'utf-8').split('\n');
    console.log("Loading sim--pull store " + this.filename + ", " + lines.length + " entries.");
    let count=0;
    for( const line of lines ) {
      if( line.length == 0 ) continue;
      try {
        const parsedLine = util.parseJSON(line);
        var [ inkey, value, deleted ] = parsedLine;
      	var key;
	      if( typeof inkey == 'string' )
          key = inkey.toLowerCase();
        else
          key = inkey;
        if( deleted ) {
          this.store.delete(key);
      	  count--;
        } else {
          this.store.set(key, value);
          count++;
        }
      } catch (err) {
        console.error('Failed to parse line:' + line, err);
      }
    }
    this.loaded = true;
    this.cached = true;
  }
  unload() { // the only way to reverse unload() is load()
    this.cached = false;
    delete this.store;
    this.store = new Map();
  }
  has(key) {
    if( !this.cached ) return false;
    return this.store.has(key);
  }
  get(key) {
    if( !this.cached ) return null;
    return this.store.get(key);
  }

  async add_str(buf) {
    if( !this.loaded ) {
      fs.writeFileSync(this.filename, buf + '\n');
    } else {
      fs.appendFileSync(this.filename, buf + '\n');
    }
  }


  async set(key, value) {
    if( !this.cached ) {
      console.log("simplekv not cached; cannot write");
      throw "nope";
    }

    this.store.set(key, value);
    
    if( this.loose ) {
      if( !this.changed ) this.changed=true;
      return;
    }
    
    const safeLine = util.printJSON([ key, value ]);
    await this.add_str(safeLine);
  }

  async delete(key) {
    if( !this.cached ) return false;

    this.store.delete(key);
    if( this.loose ) {
      if( !this.changed ) this.changed=true;
      return;
    }
    const safeLine = util.printJSON([ key, null, true ]);
    await this.add_str(safeLine);
  }

  async loosen() {
    if( !this.cached ) {
      console.log("Loosen() on non-cached SimpleKV");
      return;
    }
    if( !this.loose )
      await this.rewrite();
    this.loose = true;
  }
  async heartbeat() {
    if( !this.cached ) {
      console.log("Heartbeat() on non-cached SimpleKV");
      myapp.util.throwStack("simplekv");
      throw "nope";
    }
    await this.rewrite();
    await this.loosen();
  }

  async tighten() {
    await this.rewrite();
  }

  async rewrite() { // write the db as one chunk
    if( !this.cached ) {
      return false;
    }
    const tmpFilename = this.filename + '.tmp';
    let buf = '', safeLine=null;
    const max_buflen = 4096;
      
    if( fs.existsSync(tmpFilename) )
      fs.unlinkSync(tmpFilename);

    for (const [key, value] of this.store.entries()) {
      try {
        safeLine = util.printJSON([key, value]);
      } catch( err ) {
        console.log(err);
        throw "printJSON failed";
      }
      buf += safeLine + '\n';
      if( buf.length >= max_buflen ) {
        fs.appendFileSync(tmpFilename, buf);
        buf = '';
      }
    }
    if( buf != '' )
    	fs.appendFileSync(tmpFilename, buf);

    if( safeLine !== null )
      fs.renameSync(tmpFilename, this.filename);

    this.loose = false;
    this.changed = false;
  }

  keys() {
    return [...this.store.keys()];
  }
}

export class LargeKVStore {
  constructor( app, dataFile ) {
	  this.app = app;
	  let fileParts = dataFile.split('/');
	  let realfn = '';
    let realfn_base = '';
	  for( var i=0; i<fileParts.length; i++ ) {
	    if( realfn != '' ) {
	      realfn += '/';
	      realfn_base += '/';
	    }
	    if( i == fileParts.length-1 ) {
	      realfn += "i_";
	    }
	    realfn += fileParts[i];
	    realfn_base += fileParts[i];
	  }

	  this.idxFile = realfn;
    this.indexKV = new SimpleKVStore(this.idxFile);
	  this.indexKV.load();

	  this.cache = new Map();
    this.hits = new Map();
    this.noCache = false;
    this.readCache = true;

    this.readBuffer = Buffer.alloc(readlen);
    this.dataFile = realfn_base;
    this.dataFh = null;
    this.eof = null;
    this.loose = true;
    this.cacheCut = 0.5;
    this.cacheLimit = 10000;
  }


  useCacheLimit(setting=256) {
    this.cacheLimit = setting;
  }
  useCache(setting, cacheCut=0.5) {
    this.noCache = !setting;
    this.cacheCut = cacheCut;
    if( this.noCache ) {
      delete this.cache;
      this.cache = null;
      delete this.hits;
      this.hits = null;
      this.loose = false;
    }
  }

  resetCache() { // hardcore reset
    if( this.noCache ) {
      return;
    }
    console.log(this.dataFile + ": resetCache");
    this.hits = new Map();
    this.cache = new Map();
  }

  releaseMemory(audible=false) {
    if( this.noCache ) 
      return;
    //console.log(this.dataFile + " clear cache from " + this.hits.size);
    if( this.cacheCut == 1 ) {
      this.resetCache();
      return;
    }

    let total = this.hits.size;
    while( total > this.cacheLimit ) {
      const entries = this.hits.entries();
      let reverseCut=false;
      if( this.cacheCut < 0.5 ) {
        reverseCut=true;
      }
      const cut = Math.floor( total*this.cacheCut );
      let min_h = [];
      let cut2 = cut*2;

      for( const entry of entries ) {
        let k = entry[0], v = Number(entry[1]);
        let found=false;
        for( var i=0; i<min_h.length; i+=2 ) {
          if( reverseCut && v > min_h[i] ) {
            min_h.splice(i,0,v,k);
            found=true;
            break;
          } else if( !reverseCut && v < min_h[i] ) {
            min_h.splice(i,0,v,k);
            found=true;
            break;
          }
        }
        if( !found && min_h.length < cut2 ) {
          min_h.push(v,k);
        } else if( min_h.length > cut2 ) {
          min_h.pop(); // only grab the least hit items
          min_h.pop();
        }
      } 
      if( reverseCut ) {
        const newhits = new Map();
        const newcache = new Map();
        for( var i=0; i<min_h.length; i+=2 ) {
          const key = min_h[i+1];
          const hits = this.hits.get(key);
          newhits.set( key, hits );
          const cache = this.cache.get(key);
          newcache.set( key, cache );
        }
        this.hits = newhits;
        this.cache = newcache;
      } else {
        for( var i=0; i<min_h.length; i+=2 ) {
          this.cache.delete(min_h[i+1]);
          //do not remove from hits.
        }
      }
      if( audible )
        console.log("removed " + i + ", " + this.hits.size + " size");
      total = this.hits.size;
    }
  }

  keys() {
    return this.indexKV.keys();
  }

  async open(use_tempfile=false) {
	  let fn = this.dataFile;
    
    // Ensure data file exists
    if( !(fs.existsSync(fn)) )
      fs.writeFileSync(fn, '');

	  if( use_tempfile ) {
		  fn = fn + "~";
		  this.in_tempfile = true;
		  fs.copyFileSync(this.dataFile, fn);
	  } else {
	  	this.in_tempfile = false;
	  }

	  const stats = fs.statSync(fn);
	    //console.log("opened " + fn);
    this.eof = stats.size;

    this.dataFh = fs.openSync(fn, 'r+');
  	if( !this.in_tempfile ) {
  		//console.log(fn + " opened");
    }
  }

   async close() {
     fs.closeSync(this.dataFh);
    //console.log(this.dataFile + ": close()");
     this.dataFh = null;
   }

   async has(inkey) {
     if( this.dataFh === null )
	     await this.open();
	
	   var key;
     key = typeof inkey == 'string' ? inkey.toLowerCase() : inkey;

	   if( (!this.noCache && this.cache.has(key)) )
		   return true;

     if( this.indexKV.has(key) )
       return true;

     return false;
   }

   async get(inkey) {
 	   var key;
	   key = typeof inkey == 'string' ? inkey.toLowerCase() : inkey;

	   if( !this.noCache && this.cache.has(key) ) {
	     let v = this.cache.get(key);
       let w = this.hits.get(key);
       if( isNaN(w) ) w = 0;
	     if( v[1] == 2 ) return undefined;
       this.hits.set(key, w+1);
       v[1] = 1; // be suspicious of the programmer for he often forgets things
   	   return v[0];
	   }
	
	   if( !(this.indexKV.has(key)) ) {
	     return undefined;
	   }

	   const info = this.indexKV.get(key);
	   for( var q=0; q<info.length; q++ ) {
		   if( isNaN(info[q]) ) {
			   this.app.util.throwStack('nan' + info[q]);
		   }
       info[q]=Number(info[q]);
	   }
        
     let bytesRead=0;
     let offset = info[0];
     let length = info[1];
     const buffer = length > readlen ? Buffer.alloc(length) : this.readBuffer;
     try {
       if( this.dataFh == null )
	       await this.open();
       if( this.dataFh == null )
         throw "Open did not work.";

       bytesRead = fs.readSync(this.dataFh,
         buffer,
         0,
         length,
         offset 
       );
	   } catch( err ) {
  	   console.log(this.dataFile + ": ", err);
	     console.log(this.dataFh, info);
	   }

     var str;
     if( buffer.length > length ) {
       str = buffer.subarray(0,length).toString();
     } else {
	    str = buffer.toString();
     }
	   let ssum = stringsum(str);

	   if( info[2] != ssum ) {
		   console.log("Invalid checksum for " + key);
		   console.log(str, info);
		   console.log(ssum);
		   console.log("Buffer length: " + str.length);

		   throw "bad-checksum-1";
	   }
	
     var value;
     try {
       value = util.parseJSON(str);
     } catch( e ) {
       console.log("Couldn't parse request for " + key + ": value.len=" + info[1] + ", offset=" + info[0] + ", str=" + str);
       throw "parse failed";
       value = null;
     }
     if( !this.noCache && this.readCache ) {
    	 this.cache.set(key,[value,0]);
       let w = this.hits.get(key);
       if( isNaN(w) ) w = 0;
       this.hits.set(key, w+1);
     }
     return value;
   }
   setQuick(key, value) {
     return this.delayedSet(key, value);
   }
   delayedSet(inkey, value) {
  	 var key;
	   key = typeof inkey == 'string' ? inkey.toLowerCase() : inkey;
     if( !this.noCache ) {
       let w = this.hits.get(key);
       if( isNaN(w) ) w = 0;
       this.hits.set(key, w+1);
  	   return this.cache.set(key, [value, 1]);
     } else {
       throw "delayedSet with no cache.";
     }
   }

   async set(inkey, value) {
	    var key;
	    key = typeof inkey == 'string' ? inkey.toLowerCase() : inkey;
      if( !this.noCache ) {
        let w = this.hits.get(key);
        if( w == undefined ) w = 0;
        this.hits.set(key, w+1);
  	    this.cache.set(key, [value, 1]);
        if( this.loose )
		      return;
      }
      const buf = util.printJSON(value);
      if( buf.indexOf("null") != -1 && buf.length < 512 ) {
        //console.log("Save value ", value, "buf", buf, "value has null");
        //this.app.util.throwStack("save-null");
      }
      var data;
      if( buf.length < readlen ) {
        this.readBuffer.write(buf);
        data = this.readBuffer;
      } else {
        data = Buffer.from(buf);
      }
	    const ssum = stringsum(buf);

      var info;
	    if( this.indexKV.has(key) ) {
		    info = this.indexKV.get(key);
		    if( info[1] != buf.length || ssum != info[2] ) {
	   		  if( buf.length > info[1] ) {
				    info[0] = this.eof + 0;
			   	  this.eof += buf.length;
			    }
			    info[1] = buf.length;
			    info[2] = ssum;
		    }
	    } else {
	  	  let endmark = this.eof + 0;
 		    info = [ endmark, buf.length, ssum ];
		    this.eof += buf.length;
	    }
      await this.indexKV.set(key, info);
      if( this.dataFh === null )
   	    await this.open();

      fs.writeSync(this.dataFh, data, 0, info[1], info[0]);
    }

async delete(inkey) {
	var key;
	key = typeof inkey == 'string' ? inkey.toLowerCase() : inkey;
  await this.indexKV.delete(key);
	if( !this.noCache ) {
    if( this.cache.has(key) )
	    this.cache.delete(key);
    let w = this.hits.get(key);
    if( w == undefined ) w = 0;
    this.hits.set(key, w+1);
  	this.cache.set(key,[null,2]);
  }
}

async loosen() {
  if( this.noCache ) {
    console.log("loosen() requires cache=true");
    return;
  }
  await this.tighten();
  await this.indexKV.loosen();
  this.loose = true;
}

async tighten(audible=false) {
  await this.compact(audible);
}

async compact(audible=false) {
  if( this.noCache ) {
	  await this.indexKV.rewrite();
    this.releaseMemory();
    this.loose = false;
    return;
  }
  if( this.dataFh !== null ) {
    fs.closeSync( this.dataFh );
    this.dataFh = null;
  }
  if( audible ) {
    console.log("Compact " + this.dataFile);
  }
  await this.open(true);
  const entrs = this.cache.entries();
  let records_changed = new Map();
  //let bytes=0;
  for( const entr of entrs ) {
    const [key,v] = entr;
	  //const v = this.cache.get(key);
	  if( v[1] != 1 ) continue;

	  const buf = util.printJSON(v[0]);
    var data;
    if( buf.length < readlen ){
      this.readBuffer.write(buf);
      data = this.readBuffer;
    } else {
      data = Buffer.from(buf);
    }
	  const ssum = stringsum(buf);
	  var eofpos=Number(this.eof);
	  var info = false;
	  if( this.indexKV.has(key) ) {
		  info = this.indexKV.get(key);
		  if( info[1] < buf.length ) {
			  info[0] = eofpos;
			  this.eof += buf.length;
		  }
		  info[1] = buf.length;
		  info[2] = ssum;
	  } else {
	 	  info = [ eofpos, buf.length, ssum ];
		  this.eof += buf.length;
	  }
	  await this.indexKV.set(key, info);

    fs.writeSync(this.dataFh, data, 0, info[1], info[0]);
  }
  fs.closeSync( this.dataFh );
  this.dataFh = null;
  await this.indexKV.rewrite();
  fs.renameSync(this.dataFile + "~", this.dataFile);
  this.releaseMemory();
  this.loose = false;
  await this.open(false);
}

// end of class:
}

