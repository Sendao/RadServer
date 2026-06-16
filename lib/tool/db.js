import fs from 'fs';
import path from 'path';
import {Utils} from './util.js';
let util = new Utils();

export function stringsum(str) {
    let n = 3000;
    for( var i=0; i<str.length; i++ ) {
	    n = ( n + str.charCodeAt(i) ) % 8000;
    }
    return n;
}


export class SimpleKVStore {
  constructor(filename, erasePre=false) {
    this.filename = filename;
    this.store = new Map(); // In-memory cache
    this.loose = false;
    this.changed = false;
    this.loaded = false;
    this.erase = erasePre;
    if( typeof this.filename != 'string' ) {
      console.log("Bad usage in db");
      throw "bad use";
    }
  }
  async load() {
    if( fs.existsSync(this.filename) ) { 
        if( !this.loaded && this.erase ) {
            console.log("Overwrite sim--pull store " + this.filename);
            fs.unlinkSync(this.filename);
	    this.erase = false;
	    this.loaded = true;
	    return;
	} else {
            console.log("Loading sim--pull store " + this.filename);
	}
    } else {
	console.log("New sim--pull store " + this.filename);
	this.erase = false;
	this.loaded = true;
        return;
    }
    if( this.changed || this.loose || this.loaded ) {
      console.warn("requested reload of database over existing data: " + this.filename);
      return;
    }

    const lines = await fs.readFileSync(this.filename, 'utf-8').split('\n');
    let count=0;
    for( const line of lines ) {
      if( line.length == 0 ) continue;
      try {
        const parsedLine = util.parseJSON(line);
        var [ inkey, value, deleted ] = parsedLine;
    	var key;
    	if( typeof inkey == 'string' && !isNaN(inkey) ) key = Number(inkey);
	else key = typeof inkey == 'string' ? inkey.toLowerCase() : inkey;
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
    console.log(this.filename + ": " + count + " records.");
    this.loaded = true;
  }
  has(key) {
    return this.store.has(key);
  }
  get(key) {
    return this.store.get(key);
  }

  async add_str(buf) {
    if( !this.loaded ) {
      await fs.writeFileSync(this.filename, buf + '\n');
    } else {
      await fs.appendFileSync(this.filename, buf + '\n');
    }
  }


  async set(key, value) {
    this.store.set(key, value);
    
    if( this.loose ) {
      if( !this.changed ) this.changed=true;
      return;
    }
    
    const safeLine = util.printJSON([ key, value ]);
    await this.add_str(safeLine);
  }

  async delete(key) {
    this.store.delete(key);

    if( this.loose ) {
      if( !this.changed ) this.changed=true;
      return;
    }

    const safeLine = util.printJSON([ key, null, true ]);
    await this.add_str(safeLine);
  }

  loosen() {
    this.loose = true;
  }

  async compact() { // write the db as one chunk
    const tmpFilename = this.filename + '.tmp';
    let buf = '', safeLine=null;
    const max_buflen = 40000000; // 40Mb
      
    if( await fs.existsSync(tmpFilename) )
      await fs.unlinkSync(tmpFilename);

    for (const [key, value] of this.store.entries()) {
      try {
        safeLine = util.printJSON([key, value]);
      } catch( err ) {
        console.log(err);
        throw "printJSON failed";
      }
      if( buf.length+safeLine.length >= max_buflen ) {
        //console.log("Write(" + buf.length + ")");
        await fs.appendFileSync(tmpFilename, buf);
        buf = '';
      }
      buf += safeLine + '\n';
    }
    if( buf != '' )
	await fs.appendFileSync(tmpFilename, buf);

    if( safeLine !== null )
        await fs.renameSync(tmpFilename, this.filename);

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

        this.dataFile = realfn_base;
        this.dataFh = null;
        this.eof = null;
        this.loose = true;
    }

    releaseMemory() {
        this.cache = new Map();
    }

    keys() {
       return this.indexKV.keys();
    }

    async open(use_tempfile=false) {
	let fn = this.dataFile;
	if( use_tempfile ) {
		fn = fn + "~";
		this.in_tempfile = true;
		await fs.copyFileSync(this.dataFile, fn);
	} else {
		this.in_tempfile = false;
	}
        // Ensure data file exists
        if( !(await fs.existsSync(fn)) )
            await fs.writeFileSync(fn, '');

	const stats = await fs.statSync(fn);
	    //console.log("opened " + fn);
        this.eof = stats.size;

        try {
          this.dataFh = await fs.openSync(fn, 'r+');
	} catch( err ) {
	  this.dataFh = null;
	  this.eof = null;
	  console.log("Couldn't open " + fn);
	  throw "error-42";
	}
	if( !this.in_tempfile )
		console.log(fn + " opened");
    }

    async close() {
        await fs.closeSync(this.dataFh);
    //console.log(this.dataFile + ": close()");
	this.dataFh = null;
    }


    async has(inkey) {
        if( this.dataFh === null )
	    await this.open();
	
	var key;
	if( typeof inkey == 'string' && !isNaN(inkey) ) key = Number(inkey);
	else key = typeof inkey == 'string' ? inkey.toLowerCase() : inkey;

	if( this.cache.has(key) || await this.indexKV.has(key) ) {
		return true;
	}
	return false;
    }

    async get(inkey) {
	var key;
	if( typeof inkey == 'string' && !isNaN(inkey) ) key = Number(inkey);
	else key = typeof inkey == 'string' ? inkey.toLowerCase() : inkey;

	if( this.cache.has(key) ) {
	    let v = this.cache.get(key);
	    if( v[1] == 2 ) return undefined;
 	    return v[0];
	}
	
	if( !(await this.indexKV.has(key)) ) {
	    console.log("key not found ", key);
	    return undefined;
	}

	const info = await this.indexKV.get(key);
	    //console.log("found " + key);
	for( var q=0; q<info.length; q++ ) {
		if( isNaN(info[q]) ) {
			this.app.util.throwStack('nan' + info[q]);
		}
	       info[q]=Number(info[q]);
	}
        
        const buffer = Buffer.alloc(info[1]);
        try {
          if( this.dataFh === null )
	    await this.open();

          await fs.readSync(this.dataFh, buffer, 0, info[1], info[0]);
	} catch( err ) {
  	  console.log(this.dataFile + ": ", err);
	  console.log(this.dataFh, info);
	}

	let str = buffer.toString();
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
            console.log("Couldn't parse request for " + key + ": value.len=" + meta[1] + ", offset=" + meta[0] + ", str=" + str);
            value = null;
        }
	this.cache.set(key,[value,0]);
        return value;
    }
    setQuick(key, value) {
        return this.delayedSet(key, value);
    }
    delayedSet(inkey, value) {
	var key;
	if( typeof inkey == 'string' && !isNaN(inkey) ) key = Number(inkey);
	else key = typeof inkey == 'string' ? inkey.toLowerCase() : inkey;
	return this.cache.set(key, [value, 1]);
    }

    async set(inkey, value) {
	var key;
	if( typeof inkey == 'string' && !isNaN(inkey) ) key = Number(inkey);
	else key = typeof inkey == 'string' ? inkey.toLowerCase() : inkey;
	this.cache.set(key, [value, 1]);
        if( this.loose )
		return;
        const buf = util.printJSON(value);
        const data = Buffer.from(buf);
	const ssum = stringsum(buf);

        var info;
	if( await this.indexKV.has(key) ) {
		info = await this.indexKV.get(key);
		if( info[1] != data.length || ssum != info[2] ) {
			if( data.length > info[1] ) {
				info[0] = this.eof + 0;
				this.eof += data.length;
			}
			info[1] = data.length;
			info[2] = ssum;
		}
	} else {
		let endmark = this.eof + 0;
		info = [ endmark, data.length, ssum ];
		this.eof += data.length;
	}
       	await this.indexKV.set(key, info);
        if( this.dataFh === null )
	  await this.open();

        await fs.writeSync(this.dataFh, data, 0, info[1], info[0]);
    }

    async delete(inkey) {
	var key;
	if( typeof inkey == 'string' && !isNaN(inkey) ) key = Number(inkey);
	else key = typeof inkey == 'string' ? inkey.toLowerCase() : inkey;
        await this.indexKV.delete(key);
	if( this.cache.has(key) )
	    this.cache.delete(key);
	this.cache.set(key,[null,2]);
    }

    loosen() {
        this.indexKV.loosen();
        this.loose = true;
    }

    async compact() {
        if( this.dataFh !== null ) {
            await fs.closeSync( this.dataFh );
        }
        await this.open(true);
	const keys = this.cache.keys();
	let records_changed = new Map();
	let bytes=0;
	for( const key of keys ) {
		const v = this.cache.get(key);
		if( v[1] != 1 ) continue;

	        const buf = util.printJSON(v[0]);
       	        const data = Buffer.from(buf);
		const ssum = stringsum(buf);
		var eofpos=this.eof;
		var info = false;
		if( this.indexKV.has(key) ) {
			info = this.indexKV.get(key);
			if( info[1] < data.length ) {
				info[0] = eofpos;
				this.eof += data.length;
			}
			info[1] = data.length;
			info[2] = ssum;
		} else {
			info = [ eofpos, data.length, ssum ];
			this.indexKV.set(key, info);
			this.eof += data.length;
		}
		this.indexKV.set(key, info);

		bytes += info[1];
        	await fs.writeSync(this.dataFh, data, 0, info[1], info[0]);
	}
	await fs.closeSync( this.dataFh );
	await fs.renameSync(this.dataFile + "~", this.dataFile);
	await this.open(false);

	await this.indexKV.compact();
	this.releaseMemory();
        this.loose = false;
    }
}

export class TrieNode {
    constructor() {
        this.children = {};
        this.values = [];
    }
}

export class StringTrie {
    constructor() {
        this.root = new TrieNode();
    }

    insert(key, value) {
        let node = this.root;
        for (const char of key) {
            if( !(char in node.children) ) {
                node.children[char] = new TrieNode();
            }
            node = node.children[char];
        }
        node.values.push(value); // Store the object/value
    }

    _collectAll(node, results) {
	if( 'values' in node )
            results.push(...node.values);
        for (const child in node.children) {
            this._collectAll(node.children[child], results);
        }
    }

    remove(key, value)
    {
	    delete(key,value);
    }

    delete(key, value) {
	let node = this.root;
	for( const char of key ) {
	    if( !(char in node.children) ) return;
	    node = node.children[char];
	}
	if( !('values' in node) ) return;
	var pos;
	do {
		pos = node.values.indexOf(value);
		if( pos == -1 ) break;
		node.values = node.values.splice(pos,1);
	} while( true );
    }

    has(prefix) {
        let node = this.root;
        for (const char of prefix) {
            if(!(char in node.children)) return false;
            node = node.children[char];
        }
        return true;
    }

    scan(prefix) {
        let node = this.root;
        for (const char of prefix) {
            if(!(char in node.children)) return [];
            node = node.children[char];
        }
        const results = [];
        this._collectAll(node, results);
        return results;
    }
}
