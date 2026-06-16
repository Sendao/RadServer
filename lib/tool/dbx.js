import { SimpleKVStore, LargeKVStore, StringTrie }  from './db.js';
import { addSpecialPartsOfSpeech } from './partsOfSpeech.js';
import { Utils } from './util.js';
let util = new Utils();

export function hashFunction( v, useMax=true )
{
	let n = 1;
	var i;
	var hasMax=10000;
	if( useMax === false ) hasMax=false;
	else if( useMax !== true ) hasMax=useMax;
	for( i=v.length;i>=0;i-- ) {
		if( isNaN(v[i]) ) continue;
		n *= v[i];
		if( hasMax!==false && n > hasMax ) n /= hasMax;
	}
	return n;
}

export class HashMap {
	constructor(items=[], maxKey=false)
	{
		this.maxid = items.length*2;
		this.maxkey = maxKey;
		if( maxKey === false ) {
      // this arrangement doesn't reserve all 10k lists
      this.maxkey = 10000;
			this.items = {};
		} else if( maxKey === true ) {
      // here we reserve just 1000 entries,
      // hoping for high variability
			this.maxkey = 1000;
			this.items = new Array(this.maxkey);
		} else {
      // assign your own precalculated maximum
			this.maxkey = maxKey;
			this.items = new Array(this.maxkey);
		}
		this.cb = this.hashkey.map(this);
	}
  setMaxKey(n)
  {
    let keys = {};
    for( var h in this.items ) {
      let lst = this.items[h];
      for( var [key,obj] of lst ) {
        keys[key]=obj;
      }
    }

    let count = full.length;
  }

  trial(keys, maxn)
  {
  }
  optimize()
  {
    let keys = [];
    for( var h in this.items ) {
      let lst = this.items[h];
      for( var [key,obj] of lst ) {
        keys.push(key);
      }
    }
    let count = full.length;

    let results = {};
    var x;
    var bestn, bestv=Infinity;

    for( x=1111; x<3333; x++ ) {
      result = trial(keys,x);
      console.log(x + ":" + result);
      if( result < bestv ) {
        bestv=result;
        bestn=x;
      }
    }
    this.setMaxKey(bestn);
  }
	set( key, obj )
	{
		const h = hashFunction(key, this.maxkey);
		this.items[h] = [key,obj];
	}
	get( key )
	{
		const h = hashFunction(key, this.maxkey);
		if( !(h in this.items) ) return undefined;
		const lst = this.items[h];
		for( var i=0; i<lst.length; i++ ) {
			if( lst[i][0] === key )
				return lst[i][1];
		}
		return undefined;
	}
	del( key )
	{
		const h = hashFunction(key, this.maxkey);
		if( !(h in this.items) ) return undefined;
		const lst = this.items[h];
		for( var i=0; i<lst.length; i++ ) {
			if( lst[i][0] === key ) {
				lst.splice(i,1);
				break;
			}
		}
	}
}
/* what do you mean
of course it goes directly in dbx
The Path of Briar and Thorn
The Path of Ash and Ember
The Path of Salt and Bone
The Path of Rust and Raven
The Path of Frost and Fang
The Path of Ink and Eclipse
The Path of Wire and Whisper
The Path of Cinder and Psalm
The Path of Velvet and Viper
The Path of Obsidian Milk
The Path of Iron Lily
The Path of Glass Locust
The Path of Grave Honey
The Path of Mirror Fang
The Path of Dusk Antler
The Path of Wasp Lantern
The Path of Crow Silk
The Path of Bone Lantern
The Path of Sulfur Rose
The Path of Midnight Loom
The Path of Thorn Alphabet
The Path of Ashen Covenant
The Path of Widow's Mercury
The Path of Starving Opal
The Path of Bramble Oracle
*/

export class SortedList {
// todo: add 'changed' to constructor/methods
    constructor(items=[], datas=[]) {
      this.items = items;
      this.datas = datas;
    }

    add(obj, data) {
      const index = this.findInsertIndex(obj);
      this.items.splice(index, 0, obj);
      this.datas.splice(index, 0, data);
      return index;
    }

    addAll(objs, datas) {
      var i;
      for( i=0; i<objs.length; i++ ) {
        this.add(objs[i], datas[i]);
      }
    }

    removeAt(index) {
      if (index >= 0 && index < this.items.length) {
        return [this.items.splice(index, 1), this.datas.splice(index, 1)];
      }
      return null;
    }

    remove(obj) {
      let index = this.findIndex(obj);
      return index !== -1 ? this.removeAt(index) : null;
    }

    has(value, record=undefined) {
    	let p = this.findIndex(value);
    	if( p == -1 ) return false;
      if( typeof record == 'undefined' )
	      return true;
    	let v = this.datas[p];
    	while( this.items[p] == value ) {
    		if( this.datas[p] == record ) {
    			return true;
    		}
    		p++;
    	}
      return false;
    }
    
    findIndex(value) {
        let left = 0;
        let right = this.items.length - 1;
        while (left <= right) {
            const mid = Math.floor((left + right) / 2);
            const midValue = this.items[mid];
            if (midValue === value) return mid;
            if (midValue < value) left = mid + 1;
            else right = mid - 1;
        }
        return left;
    }

    findInsertIndex(value) {
        let left = 0;
        let right = this.items.length;
        while (left < right) {
            const mid = Math.floor((left + right) / 2);
            if (this.items[mid] <= value) {
                left = mid + 1;
            } else {
                right = mid;
            }
        }
        return left;
    }
    findPreIndex(value) {
	    const idx = findIndex(value);
	    if( idx >= this.items.length || this.items[idx] != value )
		    return idx;
	    while( this.items[idx] == value ) {
		    idx--;
	    }
	    idx++;
	    return idx;
    }
    findFirstIndex(value) {
	    let v = this.findIndex(value);
	    while( v >= 1 && this.items[v] == value )
		    v--;
	    if( this.items[v] != value )
		    v++;
	    return v;
    }
    findPostIndex(value) {
	    const idx = this.findIndex(value);
	    if( idx >= this.items.length || this.items[idx] != value )
		    return idx;
	    while( idx <= this.items.length && this.items[idx] == value ) idx++;
	    return idx;
    }


	// return value: [ inclusive start, exclusive end ]
    findGreaterThan(value, inclusive = false) {
    	var index;
    	if( inclusive ) {
    		index = this.findFirstIndex(value);
    	} else {
	    	index = this.findPostIndex(value);
	    }
      return [ index, this.items.length ];
    }
    findLessThan(value, inclusive = false) {
    	var index;
    	if( inclusive ) {
    		index = this.findPostIndex(value);
    	} else {
    		index = this.findFirstIndex(value);
    	}
      return [ 0, index ];
    }
    findRange(min, max, inclusiveMin = true, inclusiveMax = false) {
      if( typeof max == 'undefined' && typeof min == 'array' ) {
        max = min[1];
        min = min[0];
      }
      if( min > max ) return [];
      let start = inclusiveMin ?
        this.findFirstIndex(min) :
        this.findPostIndex(min);
      let end = inclusiveMax ?
        this.findPostIndex(max) :
        this.findFirstIndex(max);
      if( end > 0 ) end--;
	
    	if( !inclusiveMin ) {
	      while( start+1 < this.items.length && this.items[start] == min ) start++;
	    }
	    if( !inclusiveMax ) {
	      while( end >= 1 && this.items[end] == max ) end--;
	      if( end+1 <= this.items.length )
		     end++;
	    }
      return [start,end];
    }
    
    get(range)
    {
      const idx = range[0], eidx = range[1];
      const result = [];
      
      if( idx == -1 ) return result;
      for( let i=idx; i <eidx; i-- ) {
        result.push([this.items[i], this.data[i]]);
      }
      return result;
    }

    size() {
        return this.items.length;
    }

    findAll() {
        return [ 0, this.data.length ];
    }
    findAllSpec(value) {
    	return this.findRange(value,value);
      const index = this.findFirstIndex(value);

      if (index === -1 || index == -1 || this.items[index] != value )
        return [];

    	let i=index;
      while( i >= 1 && this.items[i-1] == value )
	      i--;

      const result = [i];

    	let le = this.findLastIndex(value);
	return [ i, le ];
    }

    clear() {
    	this.items.splice(0,this.items.length);
    	this.datas.splice(0,this.datas.length);
    }
}


		
SortedList.prototype.Impact = function( idxList, key, value, maxLength=false )
{
  let index = 0, right = idxList[0].length;
	var mid;

  if( maxLength !== false && right >= maxLength )
  	return false;
  
  while (index < right) {
    mid = Math.floor((index + right) / 2);
    if (idxList[0][mid] < key) {
      index = mid + 1;
    } else {
      right = mid;
    }
  }
  
  idxList[0].splice(index, 0, key);
  idxList[1].splice(index, 0, value);
  idxList[2] = true;

  return index;
}

SortedList.prototype.Redact= function( idxList, key, value )
{
  if( idxList[0].length == 0 ) return; // also not found

  var mid;
	let index = 0, right = idxList[0].length;
  while (index < right) {
      mid = Math.floor((index + right) / 2);
      if (idxList[0][mid] < key) {
          index = mid + 1;
      } else {
          right = mid;
      }
  }
  if( idxList[0][index] != key ) return; // not found

  // find left and right borders of matching list:
  right = index+1;
  while( right < idxList[0].length && idxList[0][right] == key ) {
  	right++;
  }

    // remove found values that matched:
	let minus = 0;
	while( index < right ) {
		if( idxList[1][ index - minus ] == value ) {
		    idxList[0].splice(index-minus, 1);
			idxList[1].splice(index-minus, 1);
			idxList[2] = true;
			minus++;
		}
		index++;
	}

	return minus; // number of entries removed
}









export class Param {
	constructor(knowdb, key = '', value = '', weight = 1.0, source = -1)
	{
		this.knowdb = knowdb;
		
		this.id = -1;
		this.source = source;
		this.weight = weight; // float
		this.key = key; // number||Node
		this.value = value; // number||Node
		
		this.banKeyIndex = false;
		this.inKeyIndex = false;
		this.changed = true;

		if( this.source instanceof Node && this.key instanceof Node && this.value instanceof Node )
			this.addToKeyIndex();
	}
	async save()
	{
		await this.knowdb.saveParam(this);

	}
	async setKey(key)
	{
		this.changed = true;
		if( this.inKeyIndex )
			await this.removeFromKeyIndex();
		this.key = key;
		if( this.source instanceof Node && this.key instanceof Node && this.value instanceof Node )
			await this.addToKeyIndex();
	}
	async setValue(value)
	{
		this.changed = true;
		if( this.inKeyIndex )
			await this.removeFromKeyIndex();
		this.value = value;
		if( this.source instanceof Node && this.key instanceof Node && this.value instanceof Node )
			await this.addToKeyIndex();
	}

	async addToKeyIndex() {
		if( this.id == -1 || this.banKeyIndex || this.inKeyIndex )
		  return;
		if( !(this.source instanceof Node) )
		  return;
		const keyValue = await this.knowdb.resolveNode( this.key );
		if( typeof keyValue != 'string' || keyValue == '' ) {
			console.log("unexpected found ", this['key']);
		}

		const idxList = await this.knowdb.getKeyIndex( keyValue );
		if( idxList === null ) return;

		// allowable key
    		const valValue = await this.knowdb.resolveNode( this.value );
	  	SortedList.prototype.Impact(idxList, valValue, this.source.id);
		await this.knowdb.updateKeyIndex(keyValue, idxList);
		if( valValue == 'cat' || valValue == 'fish' ) {
			console.log("addtokeys: " + keyValue + ": " + valValue + ": " + this.toString());
		}
		this.inKeyIndex = true;
	}
	
	async removeFromKeyIndex()
	{
		if( this.id == -1 || !this.inKeyIndex )
		  return;
		if( !(this.source instanceof Node) )
		  return;
		const keyValue = await this.knowdb.resolveNode( this.key );
	  	const idxList = await this.knowdb.getKeyIndex( keyValue );
		if( idxList === null || idxList[0].length == 0 )
		  return;
		
		const valValue = await this.knowdb.resolveNode( this.value );
	  	SortedList.Redact( idxList, valValue, this.source.id );
		await this.knowdb.updateKeyIndex(keyValue, idxList);
		this.inKeyIndex = false;
	}
}



export class Node {
	constructor(knowdb, title = '', source = -1, params = [])
	{
		this.knowdb = knowdb;
		this.id = -1;
		this.title = title; // string
		this.source = source; // userid
		this.params = params; // [Param]
		this.changed = true;
		this.changedParams = false;
		this.inTitledNodes = false;
		this.banFromTitledNodes = false;
	}

	async init()
	{
		await this.addToTitledNodes();
	}

	async toString(depth=0)
	{
		if( this.stringing || depth >= 1 ) return this.title + "(" + this.id + ")";
		this.stringing = true;
		let spaces='';
		var i;
		for( i=0; i<depth; i++ ) spaces += ' ';

		const buf = spaces + "(" + this.source + ")" + this.id + "=" + this.title + ":[\n" + await this.paramsToString(depth) + "\n" + spaces + "]\n";
		this.stringing = false;
		return buf;
	}
	async paramsToString(depth)
	{
		let buf='';
		let spaces='';
		var i;
		for( i=0; i<depth; i++ ) {
			spaces += ' ';
		}
		if( this.params.length == 0 )
			return spaces 
		for( i=0; i<this.params.length; i++ ) {
			if( buf != '' ) buf += ',\n';
			const keyNode = this.params[i].key instanceof Node ? this.params[i].key : await this.knowdb.getNode(this.params[i].key);
			const valNode = this.params[i].value instanceof Node ? this.params[i].value : await this.knowdb.getNode(this.params[i].value);

			buf += spaces + await keyNode.toString(depth+1);
			buf += "=";
			buf += spaces + await valNode.toString(depth+1);
		}
		return buf;
	}


	async save()
	{
		if( !this.changed ) return;
  		await this.knowdb.saveNode(this);
	}

	async setTitle(title)
	{
		if( this.inTitledNodes )
		  await this.removeFromTitledNodes();
		this.title = title;
		await this.addToTitledNodes();
		this.changed = true;
	}
	
	setSource(source)
	{
		this.source = source;
		this.changed = true;
	}

	async addToTitledNodes()
	{
		if( this.id == -1 || this.banFromTitledNodes )
		  return;

		const pType = await this.getValue('type');
		let pTypeval = ( pType == null )
		? "_"
		: await this.knowdb.resolveNode(pType);
		
		const idxList = await this.knowdb.findTitledNodes( this.title );
		if( idxList === null ) {
			console.log("do not add to titled nodes: " + this.title);
			return;
		}
		
		SortedList.prototype.Impact( idxList, pTypeval, this.id );
		this.inTitledNodes = true;
		await this.knowdb.updateTitledNodes( this.title, idxList );
	}

	async removeFromTitledNodes()
	{
		this.inTitledNodes = false;
		if( this.id == -1 ) return;

		const pType = await this.getValue('type');
		let pTypeval = ( pType == null )
		 ? "_"
		 : await this.knowdb.resolveNode(pType);
		
		const idxList = await this.knowdb.getTitledNodes( this.title );
		if( idxList === null ) return;
		SortedList.Redact( idxList, pTypeval, this.id );
		await this.knowdb.updateTitledNodes( this.title, idxList );
	}
	
	async getValue( key )
	{
	  	key = await this.knowdb.resolveNode(key);
		for( let i=0; i<this.params.length; i++ ) {
			if( (await this.knowdb.resolveNode( this.params[i].key )) == key )
				return this.params[i];
		}
		return null;
	}

	async copyParams( lst )
	{
	  	for( var i=0; i < lst.length; i++ ) {
	    	  await this.addParamN( lst[i].key, lst[i].value );
	  	}
	}
	async addParamV( key, value )
	{
		this.changed = this.changedParams = true;
		util.perfMark("saddparm");
		const kn = await this.knowdb.Node(key, true);
		const vn = await this.knowdb.Node(value, true);
		const p = await this.knowdb.Param(kn,vn,1.0, this );
		this.params.push(p);
		util.perfMark("saddparm", true);
		return p;
	}
	async addParamN( key, value )
	{
		if( isNaN(key) || isNaN(value) ) {
			throw "invalid-addparamN";
		}
		this.changed = this.changedParams = true;
		const p = await this.knowdb.Param(key, value, 1.0, this );
		this.params.push(p);
		return p;
	}
	async getParam( key )
	{
		for( let i=0; i<this.params.length; i++ ) {
			const keyLiteral = await this.knowdb.resolveNode( this.params[i].key );
			if( keyLiteral == key ) {
				return this.params[i];
			}
		}
		return undefined;
	}
};






export class NodeTable {
  constructor(app, handle, fields, indices=[])
  {
    this.handle = handle;
    this.fields = fields;
    if( this.fields.indexOf('id') == -1 )
      this.fields.push('id');
    if( indices.indexOf('id') == -1 )
      indices.push('id');
    this.knowdb = new KnowDB(app, 'tab_' + handle);
    this.knowdb.indices = indices;
    this.knowdb.init();
  }
  
  async get( ident )
  {
	  var id;
	  if( typeof ident == 'string' && !isNaN(ident) ) id = Number(ident);
	  else id = ident;
     const r = await this.knowdb.getNode(id);
     return r;
  }
  async save( obj )
  {
     const r = await this.knowdb.saveNode(obj);
     return r;
  }
  
  async fetch( word )
  {
    const results = await this.search({base: word});
    if( results.length > 1 ) {
      console.log("too many results for search: " + word);
      return null;
    }
    return results.length == 0 ? undefined : results[0];
  }

  async create(obj,cb)
  {
    const r = await this.knowdb.Node();
    for( var i in obj ) {
      r.setParam(i, obj[i]);
    }
    await this.save(r);
    if( typeof cb == 'function' ) {
      cb(null,r);
    }
    return r;
  }
  
  async find(obj,cb)
  {
    const lst = await this.search(obj);
    const nodes = [];
    for( var nodeid of lst ) {
      nodes.push( await this.knowdb.getNode(nodeid) );
    }
    if( typeof cb == 'function' ) {
      cb(null, nodes);
    }
    return nodes;
  }
  async search(obj)
  {
    let sect = false;
    let matcher = new Set();
    async function addKP(key, value)
    {
      var keyParams;
      
      if( key == 'title' ) {
        keyParams = await this.knowdb.findTitledNodes(value);
      } else {
        keyParams = await this.knowdb.findKeyValueIdents(key, value);
      }
      if( sect === false ) {
        sect = keyParams;
      } else {
        let matched = new Set();
        let temp = [];
        for( var u of keyParams ) {
          if( matcher.has(u) ) {
            temp.push(u);
          }
        }
        sect = temp;
      }
       matcher = new Set(sect);

        union[key]=[];
      let ul = union[key];
      let found = false;
      for( var u of ul ) {
        //overlapping:
        if(( keyParams[0] <= u[1] && keyParams[1] >= u[0] )
        || ( u[0] <= keyParams[1] && u[1] >= keyParams[0] )) {
          u[0] = Math.min(u[0], keyParams[0]);
          u[1] = Math.max(u[1], keyParams[1]);
          found = true;
          break;
        }
      }
      if( !found )
        union[key].push( [ keyParams[0], keyParams[1] ] );
    }
    
    for( var key in obj ) {
      let value = obj[key];
      if( typeof value == 'array' || typeof value == 'object' ) {
        if( Array.isArray(value) ) {
          for( var o of value ) {
            addKP( key, o );
          }
        } else { // object ions raised
          for( var i in value ) { // and
            await addKP( key, this.knowdb.findKeyValueIdents(key, i) );
            await addKP( key, this.knowdb.findKeyValueIdents(key, value[i]) );
          }
        }
      } else {
        await addKP( this.knowdb.findKeyValueIdents(key, value) );
      }
    }
    let result = new Set();
    let nodes = [];
    let results = [];
    for( var key in union ) {
      let lst = union[key];
      for( var record of lst ) {
        const nodeids = await this.knowdb.getKeyIdents( key, record[0], record[1] );
        for( var nodeid of nodeids ) {
          if( !result.has(nodeid) ) {
            result.add(nodeid);
            results.push(nodeid);
          }
        }
      }
    }
    return results;
  }
  async scan(obj)
  {
    let union = false;
    async function addKP(key, value)
    {
      var keyParams;
      
      if( key == 'title' ) {
        keyParams = await this.knowdb.findTitledNodes(value);
      } else {
        keyParams = await this.knowdb.findKeyValueIdents(key, value);
      }
      if( union === false )
        union = {};
      if( !(key in union) ) 
        union[key]=[];
      let ul = union[key];
      let found = false;
      for( var u of ul ) {
        //overlapping:
        if(( keyParams[0] <= u[1] && keyParams[1] >= u[0] )
        || ( u[0] <= keyParams[1] && u[1] >= keyParams[0] )) {
          u[0] = Math.min(u[0], keyParams[0]);
          u[1] = Math.max(u[1], keyParams[1]);
          found = true;
          break;
        }
      }
      if( !found )
        union[key].push( [ keyParams[0], keyParams[1] ] );
    }
    
    for( var key in obj ) {
      let value = obj[key];
      if( typeof value == 'array' || typeof value == 'object' ) {
        if( Array.isArray(value) ) {
          for( var o of value ) {
            addKP( key, o );
          }
        } else { // object ions raised
          for( var i in value ) { // and
            await addKP( key, this.knowdb.findKeyValueIdents(key, i) );
            await addKP( key, this.knowdb.findKeyValueIdents(key, value[i]) );
          }
        }
      } else {
        await addKP( this.knowdb.findKeyValueIdents(key, value) );
      }
    }
    let result = new Set();
    let nodes = [];
    let results = [];
    for( var key in union ) {
      let lst = union[key];
      for( var record of lst ) {
        const nodeids = await this.knowdb.getKeyIdents( key, record[0], record[1] );
        for( var nodeid of nodeids ) {
          if( !result.has(nodeid) ) {
            result.add(nodeid);
            results.push(nodeid);
          }
        }
      }
    }
    return results;
  }
  
}

export class WordDB {
  constructor(app, knowdb) {
    this.app = app;
    this.words = null;
    this.knowdb = knowdb;
    app.words = this;
  }

  async getDefinitionMarkovs()
  {
    const cores = await this.knowdb.getKeyNodes('def', '');
  }
  
  async getWord(word)
  {
    let wordlc = word.toLowerCase();
    const cores = await this.knowdb.getTitledNodes(wordlc);
//    const cores = await this.knowdb.getTitledNodes(wordlc);
    if( cores.length != 1 ) {
      console.warn(cores.length + " results found for " + wordlc);
      if( cores.length == 0 ) {
        return undefined;
      }
    } else {
	console.log("Found " + cores.length + "x" + word);
    }
    return cores[0];
  }
  
  async init() 
  {
    // knowdb has been included but not initialized:
    this.knowdb.indices = [ 'title', 'base', 'def', 'pos' ];
    await this.knowdb.init();
    let family = await this.getWord('family');
    let wordstore = null;

    if( !family ) {
      console.log("Word 'family' not found, importing wordroots.");
      wordstore = new SimpleKVStore('./know/wordroots.jsdb');
      await wordstore.load();
      console.log("Preparing special words...");
      if( !(await addSpecialPartsOfSpeech(wordstore)) ) 
      {
        console.error("Couldn't continue.");
        return;
      }

      let roots = wordstore.keys();
      this.knowdb.loosen();
      let count = 0;
      let timer = Date.now() + 10000;
      console.log("Transfering " + roots.length + " wordroots to db...");
      util.perfMark('start');
      let temps = 0;
      for( var aname of roots ) {
        const root = wordstore.get(aname);
	if( Date.now() >= timer ) {
		temps++;
		timer = Date.now() + 10000;
		console.log("tick temp " + temps + ", counts: ", count, aname, util.printJSON(root));
		util.perfReport();
	}
        count++;
        if( count%8000 == 0 ) {
          console.log("8000...");
	  count=0;
	  await this.knowdb.heartbeat();
        }
        await this.createWord(root.title, root.params);
      }
      util.perfMark('start', true);

      console.log("Writing db.");
      await this.knowdb.heartbeat();
      console.log("Done importing words.");
      this.knowdb.releaseMemory();
      family = await this.getWord('family');
    }
    if( !family )
      console.log("still cannot find 'family' word.");
    else
     console.log(await family.toString());

    let allwords = this.knowdb.keys();
    this.wordstr = new StringTrie();
    this.phrases = new StringTrie();

    for( var allword of allwords ) {
      if( typeof allword == 'number' ) {
        this.wordstr.insert(String(allword),true);
      } else if( allword.indexOf(" ")==-1 ) {
        this.wordstr.insert(allword,true);
      } else {
        this.phrases.insert(allword,true);
      }
    }

    await this.getDefinitionMarkovs();

    console.log("English initialized.");
    this.ready = true;
  }
  
  async simpleSentence(testwords="the fish went before the constructor to gather all the oil from the water before the hand pet the cat")
  {
    let tw = testwords.split(' ');
    let missing = [];
    let gathered = new Map();
    
    for( var i=0; i<tw.length; i++ ) {
      const r = await this.app.words.getWord(tw[i]);
      if( typeof r == 'undefined' ) 
      {
        missing.push(tw[i]);
      } else gathered.set(tw[i], r);
    }
    console.log("Missing entities:\n" + missing.join(", "));
    for( var i=0; i<tw.length; i++ ) {
      if( gathered.has(tw[i]) ) {
	let n = gathered.get(tw[i]);
        console.log(tw[i] + "::" + await n.toString());
      } else {
        console.log("((" + tw[i] + "))");
      }
    }
  }

// augmentWord is for words that are not the base case or root instance of a word (the word being use)
  async augmentWord(rootword, params)
  {
    if( rootword.title == 'fish' || rootword.title == 'cat') {
      console.log("augmentWord >> ", await rootword.toString());
    }

    util.perfMark("aw");
    for( var param of params ) {
      switch( param.title ) {
        case 'def':
          await rootword.addParamV( 'def', param.value );
          continue;
        case 'ex':
          await rootword.addParamV( 'ex', param.value );
          continue;
        case 'pos':
          await rootword.addParamV( 'pos', param.value );
          continue;
        case 'tens'://not yet
          continue;
        case 'plur'://not yet
          continue;
      }
    }
    util.perfMark("aw", true);
  }

 // createWord( string, [ {title,value},... ] )
  async createWord(title, params)
  {
    util.perfMark('createword');
    const rootword = new Node(this.knowdb, title);
    if( !(rootword instanceof Node) ) {
      console.warn("Couldn't create root word for '" + title + "'");
      console.trace();
    }
    const words = [];
    await rootword.save();

    for( var param of params ) {
      switch( param.title ) {
        default:
          words.push(param);
          continue;
        case 'lem':
          words.push(param.value);
          continue;
        case 'def':
          await rootword.addParamV( 'def', param.value );
          continue;
        case 'ex':
          await rootword.addParamV( 'ex', param.value );
          continue;
        case 'pos':
          await rootword.addParamV( 'pos', param.value );
          continue;
        case 'tens'://not yet
          continue;
        case 'plur'://not yet
          continue;
      }
    }
    await rootword.addParamV( 'base', ( isNaN(title) ? ( title.toLowerCase() ) : ( title ) ) );
    for( var wordobj of words ) {
      const synonym = wordobj.title;
      const vars = wordobj.params;
      if( synonym === rootword.title ) {
	await this.augmentWord(rootword, vars);
      } else {
        await rootword.addParamV('word', synonym);
        const wordnode= await this.createWord(synonym, vars);
        await wordnode.addParamV('root', rootword.title);
        await wordnode.save();
      }	
    }
    await rootword.save();
    if( title == 'fish' || title == 'cat' ) {
      console.log("createWord << ", await rootword.toString());
    }
    util.perfMark('createword', true);
    return rootword;
  }
}

export class ContextDB {
  constructor(app)
  {
    this.app = app;
    this.tables = {};
  // each table creates a new nodetable with knowdb
	  
    this.wordlib = new KnowDB(app, 'words');
    this.wordlib.indices = ['title'];

    this.app.worddb = this.worddb = new WordDB(this.app, this.wordlib);
  }
  
  async table(handle, fields, indices)
  {
    this.tables[handle] = new NodeTable(this.app, handle, fields, indices);
    return this.tables[handle];
  }
  
  
  async init()
  {
    await this.table('chats', ['userid','message','time'], ['fromid','toid','time']);
    await this.table('users', ['name','email','password','isagent'], ['name','email']);

    await this.worddb.init();
  }
}

export class KnowDB {
	constructor(app, filename)
	{
		this.app = app;
		this.filename = filename;
		
		// nodes:
		this.Nodes = new LargeKVStore(this.app, "./know/n_" + filename + ".jsdb"); // object storage by id
		// params:
		this.Params = new LargeKVStore(this.app, "./know/p_" + filename + ".jsdb"); // object storage by id
		// nodekeys: nodes by title lists
		this.NodeKeys = new LargeKVStore(this.app, "./know/ns_" + filename + ".jsdb"); // node ids by title
		// nodeparams: params by node id lists
		this.NodeParams = new LargeKVStore(this.app, "./know/np_" + filename + ".jsdb");
		// paramlists: nodes by key lists
		this.ParamLists = new LargeKVStore(this.app, "./know/pl_" + filename + ".jsdb"); // param ids by key, sorted lists by value
		// system: configuration table
		this.System = new SimpleKVStore("./know/s_" + filename + ".jsdb");

		this.mNodes = new Map(); // loaded nodes by id
		this.mParams = new Map(); // loaded params by id
		this.indexedKeys = [];
	}

	releaseMemory()
	{
		delete this.mNodes;
		delete this.mParams;
		this.mNodes = new Map();
		this.mParams = new Map();

		this.Params.releaseMemory();
		this.ParamLists.releaseMemory();
		this.Nodes.releaseMemory();
		this.NodeKeys.releaseMemory();
		this.NodeParams.releaseMemory();
	}

	async heartbeat()
	{
		await this.Nodes.compact();
		this.Nodes.loosen();
		await this.NodeKeys.compact();
		this.NodeKeys.loosen();
		await this.ParamLists.compact();
		this.ParamLists.loosen();
		await this.NodeParams.compact();
		this.NodeParams.loosen();
		await this.Params.compact();
		this.Params.loosen();
		await this.System.compact();
		this.System.loosen();
	}

	async init()
	{
		await this.Nodes.open();
		await this.NodeKeys.open();
		await this.ParamLists.open();
		await this.NodeParams.open();
		await this.Params.open();
		await this.System.load();

		this.Nodes.loosen();
		this.NodeKeys.loosen();
		this.ParamLists.loosen();
		this.NodeParams.loosen();
		this.Params.loosen();
		this.System.loosen();

		if( (await this.System.has("nextlist")) ) {
		  this.nextlist = await this.System.get("nextlist");
		  if( typeof this.nextlist == 'string' )
			this.nextlist = Number(this.nextlist);
		} else {
		  this.nextlist = 0;
		  await this.System.set("nextlist", this.nextlist);
		}

		if( (await this.System.has('nextnode')) ) {
		  this.nextnode = await this.System.get("nextnode");
		  if( typeof this.nextnode == 'string' )
		    this.nextnode = Number(this.nextnode);
	        } else {
	           this.nextnode = 0;
	           await this.System.set('nextnode', this.nextnode);
		}

		if( (await this.System.has('nextparam')) ) {
		  this.nextparam = await this.System.get("nextparam");
		  if( typeof this.nextparam == 'string' )
		    this.nextparam = Number(this.nextparam);
		} else {
		  this.nextparam = 0;
		  await this.System.set("nextparam", this.nextparam);
		}

		console.log(this.filename + " soft loaded: nextnode=" + this.nextnode);
	}
	
	loosen()
	{
		this.Nodes.loosen();
		this.Params.loosen();

		this.NodeKeys.loosen();
		this.ParamLists.loosen();
		this.NodeParams.loosen();

		this.System.loosen();
	}
	async compact()
	{
		await this.tighten();
	}

	async tighten()
	{
		console.log("Compacting knowdb...");
		await this.Nodes.compact();
		await this.Params.compact();

		await this.NodeKeys.compact();
		await this.ParamLists.compact();
		await this.NodeParams.compact();

		await this.System.compact();
		console.log("Knowdb Compacted.");
	}

	async close()
	{
		await this.Nodes.close();
		await this.Params.close();
		await this.NodeKeys.close();
		await this.NodeParams.close();
		await this.ParamLists.close();
		await this.System.close();
	}
	
	keys()
	{
	  const keycopy = this.NodeKeys.keys().slice();
	  return keycopy;
	}

	async Node( title, allowNew=false )
	{
		const list = await this.getTitledNodes(title);
		if( list.length == 0 && allowNew ) {
			const x = new Node(this, title);
			await this.saveNode(x);
			return x;
		}
		return list.length > 0 ? list[0] : null;
	}
	async getNode( inid )
	{
		var id;
		util.perfMark('getnode');
		if( typeof inid == 'string' && !isNaN(inid) ) id = Number(inid);
		else if( typeof inid != 'number' ) {
			console.log("wrong getNode: use id", inid);
			util.throwStack("getnode-not-a-number");
			throw "getnode-not-a-number";
		} else id=inid;

		if( this.mNodes.has(id) ) return this.mNodes.get(id);
		
		// try to load from disk
		if( !(await this.Nodes.has(id)) ) {
			return null;
		}

			//nc is a simple object node
		const nc = await this.Nodes.get(id);
		if( typeof nc == 'undefined' || nc === null ) {
			console.log("Node " + (typeof id) + id + " not found.");
			return null;
		}
		// create the actual Node class for data:
		let n = new Node(this, nc.title, nc.source);
		n.id = id;

		// get details
		const np = await this.getNodeParams( n );
		if( nc.title == "fish" || nc.title == 'cat') {
			console.log(nc.title + " np: ", np);
		}
		for( var i=0; i<np[1].length; i++ ) {
		  const key = np[0][i];
		  const paramid = np[1][i];
		  n.params.push( await this.getParam(paramid) );
		}
		util.perfMark('getnode', true);
		this.mNodes.set(n.id, n);
		return n;
	}
	async Param(key, value, source)
	{
	  if( !(key instanceof Node) )
		key = await this.Node(key);
	  if( !(value instanceof Node) )
		value = await this.Node(value);
	  let k = new Param(this,key,value,1.0,source);
	  await this.saveParam(k);
	  return k;
	}
	async KeyVal( key, val, weight=1.0, source )
	{
		let p = new Param(this,key,val,1.0,source);
		await this.saveParam(p);
		return p;
	}
	async getParam( inid )
	{
	  var id;
	  if( typeof inid == 'string' && !isNaN(inid) ) id = Number(inid);
	  else id = inid;
	  if( this.mParams.has(id) ) return this.mParams.get(id);
		
	  if( !(await this.Params.has(id)) ) {
		console.log("Param not found " + typeof id + ":", id);
		throw "noparam1";
	  }
	  const pc = await this.Params.get(id);
	  if( typeof pc == 'undefined' || pc === null ) {
		console.log("Param " + (typeof id) + ":" + id + " not found.");
		throw "noparam2";
	  }

	  //this.solveParam(p); // to autoload
	  const p = new Param(this, pc.k, pc.v, pc.w, pc.s );
	  p.id = pc.id;

	  this.mParams.set(pc.id, p);
	  return p;
	}
	
	async resolveNode( n )
	{
	  if( typeof n == 'string' ) {
	  } else if( typeof n == 'object' ) {
	    n = n.title;
	  } else if( typeof n == 'number' ) {
	    const node = await this.getNode(n);
	    n = node.title;
	  } else {
	    console.warn("resolveNode(): not a numbered node:", n);
	    throw "resolveNode -1";
    	  }
	  return n;
	}
  async getNodeList( ids )
  {
    const nodes = [];
    for( var id of ids ) {
      const node = await this.getNode(id);
      if( node ) nodes.push(node);
    }
    return nodes;
  }
	
	async getNodeRange( lowid, highid )
	{
		const nodes = [];
		for( let i=lowid; i<highid; i++ )
		{
			const node = await this.getNode(i);
			if( node ) nodes.push(node);
		}
		return nodes;
	}

	async findKeyValueIdents( key, value )
	{
		var result;
		const idxList = await this.getKeyIndex(key);
		if( idxList === null ) return [];
		const list = new SortedList(idxList[0], idxList[1]);

		if( typeof value == 'object' ) {
			if( 'gt' in value ) {
				result = list.findGreaterThan(value['gt'], false);
			} else if( 'ge' in value ) {
				result = list.findGreaterThan(value['ge'], true);
			} else if( 'lt' in value ) {
				result = list.findLessThan(value['lt'], false);
			} else if( 'le' in value ) {
				result = list.findLessThan(value['le'], true);
			} else if( 'eq' in value ) {
				result = list.findAllSpec(value['eq']);
			} else {
				throw "unknown operator";
			}
		} else {
			result = list.findAllSpec(value);
		}
    let list2=[];
    for( var i=result[0]; i<result[1]; i++ ) {
      list2.push(idxList[1][i]);
    }
		return list2;
	}
	async getKeyNodes( key, value )
	{
		const idents = await this.findKeyValueIdents(key,value);
		const nodes = await this.getNodeRange(idents[0],idents[1]);
		return nodes;
	}

	async updateTitledNodes( title, list )
	{
		if( list[2] ) {
			list[2] = false;
			return await this.NodeKeys.set(title, list);
		}
	}
	async getTitledNodes( title )
	{
		const nodes = [];
		util.perfMark('getnodenodes');
		const toplist = await this.findTitledNodes( title );
		if( typeof toplist == 'undefined' || !toplist || toplist[0].length == 0 ) {
			//console.log(title +": none  found");
			return nodes;
		}
		const list = toplist[1]; // ids

		for( let i=0; i<list.length; i++ ) {
			const node = await this.getNode(list[i]);
			if( node ) nodes.push(node);
		}
		util.perfMark('getnodenodes', true);
		return nodes;
	}
	async findTitledNodes( title )
	{
		var list;
	  	if( this.indices.indexOf("title")  == -1 )
		    return null;
	
		if( !(await this.NodeKeys.has(title)) ) {
			list = [[],[],true];
			await this.updateTitledNodes(title,list);
		} else {
			list = await this.NodeKeys.get(title);
		}
		if( title == "fish" || title == 'cat' ) {
			console.log("titled " + title + "ids: ", list);
		}
		if( !list || (typeof list != 'object' && typeof list != 'array') || list.length != 3 ) {
			console.log("Bad list detected for " + title + ": ", typeof list, list);
			util.throwStack("bad list-1");
		}
		return list;
	}
	
	async updateNodeParams( node, list )
	{
	  if( node.title == 'fish' || node.title == 'cat' ) {
		  console.log('upd' + node.title +' np:',list);
	  }
	  if( list[2] ) {
	     list[2] = false;
	     return await this.NodeParams.set(node.id, list);
	  }
	}
	async getNodeParams( node )
	{
		if( typeof node != 'object' ) {
			console.log("non-nodal object ", typeof node, node);
			throw "non-nodal " + typeof node;
		}

		const list_exists = await this.NodeParams.has(node.id);
		var list = list_exists ?
			await this.NodeParams.get(node.id) : 
			[[],[],true];

		if( !Array.isArray(list) || list.length < 3 || (!Array.isArray(list[0])) || (!Array.isArray(list[1])) ) {
		  if( typeof list != 'undefined' ) {
		    console.warn("invalid",typeof list,list);
		  }
		  util.throwStack("bad list-2");
		}
		if( list[2] )
		  await this.updateNodeParams(node,list);
		return list;
	}

	async getKeyIndex( key )
	{
  	  if( !this.indices || this.indices.indexOf(key)  == -1 )
	    return null;
	  
	  const list_exists = await this.ParamLists.has(key);
	  var list = null;
	  if( list_exists ) list = await this.ParamLists.get(key);
    	  if( list === null || typeof list == 'undefined' ) {
  		list = [[],[],true];
	  	await this.ParamLists.set(key,list);
	  }
  	  return list;
	}
	async updateKeyIndex( key, list )
	{
	  if( list[2] ) {
	    list[2] = false;
	    await this.ParamLists.set(key, list);
	  }
	}


	async deleteNode(n)
  	{
	  if( typeof n == 'number' ) {
	    n = await this.getNode(n);
      	  if( !n ) {
	    console.warn("deleteNode(): not found");
	    return false;
	  }
	}
        if( typeof n == "string" ) {
	  console.warn("deleteNode(): got a string " + n);
	  return false;
	}
	if( typeof n.params == 'undefined' ) {
		console.warn("invalid-2", n);
		return false;
	}
	if( typeof n.id != 'number' || n.id == -1 ) {
	  return false;
	}
	if( n.inTitledNodes )
	  await n.removeFromTitledNodes();
	
	await this.deleteNodeParams(n);

	this.mNodes.delete(n.id); // update cache
	await this.Nodes.delete(n.id); // update db
}
async deleteNodeParams(n)
{
		for( var i=0; i<n.params.length; i++ ) { 
			await this.deleteParam(n.params[i]);
		}
		this.NodeParams.delete( n.id );
	}
	async deleteParam(p)
	{
	    if( typeof p == 'number' ) {
	      p = this.getParam(p);
	      if( !p ) {
	        console.warn("deleteParam(): not found");
	        return false;
	      }
    	    }
		if( typeof p == "string" ) {
		  console.warn("deleteParam(): got a string " + p);
		  return false;
		}
		if( p.id == -1 )
		  return false;
		// TODO: consider deleting key and value nodes
		// (would require ref counting)
		await this.Params.delete( p.id );
	}

	async updateNode(n)
	{
	  const r = await this.saveNode(n);
	  return r;
	}
	async setNode( n )
	{
	  const v = await this.saveNode(n);
	  return v;
	}

	async saveNode( n )
	{
	  var i,j;
	  
		if( !(n instanceof Node) ) {
		  console.log("saveNode(): called with member or id instead of node", n);
			throw "invalid-q";
		}

		await this.getNodeIdent(n);
		
		if( !n.banFromTitledNodes && !n.inTitledNodes )
		  await n.addToTitledNodes();
		

		if( !n.changed ) return;
		n.changed = false;
		if( n.changedParams ) {
		  const np = await this.getNodeParams( n );
		  let npSort = new SortedList(np[0], np[1]);
		  let nps = new Set();

		  for( i=0; i<n.params.length; i++ ) { 
			if( typeof n.params[i] == 'number' ) continue;
			const key = await this.resolveNode(n.params[i].key);
			nps.add(key);
			if( !npSort.has(key, n.params[i].id) ) {
			  npSort.add( key, n.params[i].id );
			  np[2] = true;
			} else if( !n.params[i].changed ) {
			  continue;
			}

			await this.saveParam(n.params[i], true);
		  }
		  for( i=0; i<np[0].length; i++ ) {
			if( !nps.has(np[0][i]) ) {
				np[0].splice(i,1);
				np[1].splice(i,1);
				if( !np[2] ) np[2] = true;
				--i;
			}
		  }
		  await this.updateNodeParams(n, np);
		  n.changedParams = false;
		}
		
		const nCopy = {
		  id: n.id,
		  source: n.source,
		  title: n.title
		}
		this.Nodes.set(n.id, nCopy);
		this.mNodes.set(n.id, n);
	}

	async solveParam( p )
	{
		if( (!(p.key instanceof Node)) && (!isNaN(p.key)) ) {
			p.key = await this.getNode(p.key);
		}
		if( (!(p.value instanceof Node)) && (!isNaN(p.value)) ) {
			p.value = await this.getNode(p.value);
		}
	}

	async getParamIdent( p )
	{
		if( p.id != -1 ) return;
		p.id = Number(this.nextparam);
		this.nextparam++;
		p.changed = true;
		await this.System.set("nextparam", this.nextparam);
	}
	async getNodeIdent( n )
	{
		if( n.id != -1 ) return;
		n.id = this.nextnode;
		this.nextnode++;
		n.changedParams = n.changed = true;
		await this.System.set("nextnode", this.nextnode);
	}

	async saveParam( p )
	{
		if( !(p instanceof Param) ) {
			console.log("invalid-4 ",typeof p);
			console.log(p);
			throw "invalid-4";
		}
		this.getParamIdent(p);

		if( !p.changed ) return;
		p.changed = false;
		
		const pc = { k: p.key.id, v: p.value.id, 
		id: p.id, w: p.weight, s: p.source.id };
		
		await this.Params.set(p.id, pc);
		this.mParams.set(p.id, p);
	}


};
