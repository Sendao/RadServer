import { SimpleKVStore, LargeKVStore }  from './db.js';
import { addSpecialPartsOfSpeech } from './partsOfSpeech.js';
import { Utils } from '../tool/util.js';
const util = new Utils();

let defs_created = 0;
var SortedList, StringTrie;


export function startup(app)
{
  app.db = app.dbx = new ContextDB(app);
  app.Node = Node;
  app.Param = Param;
  app.Table = app.NodeTable = NodeTable;
  app.SimpleKVStore = SimpleKVStore;
  app.LargeKVStore = LargeKVStore;
}

export async function init(app)
{
  StringTrie = app.StringTrie;
  SortedList = app.SortedList;
  await app.dbx.init(app);
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


export class Param {
	constructor(knowdb, key = -1, value = -1, weight = 1.0, source = -1, id=-1)
	{
		this.knowdb = knowdb;
		
		this.id = id;
		this.source = source;
		this.weight = weight; // float
		this.key = key; // number||Node
		this.value = value; // number||Node
    
    if( this.key === null ) {
      this.knowdb.app.util.throwStack("null key");
      throw "null key";
    }
		
		this.banKeyIndex = false;
		this.inKeyIndex = false;
		this.changed = true;

		if( this.key instanceof Node && this.value instanceof Node )
			this.addToKeyIndex();
	}
  async copyFrom(knowdb, key=-1, value=-1, weight=1.0, source=-1, id=-1)
  {
    this.knowdb = knowdb;
    this.id = id;
		this.source = source;
		this.weight = weight; // float
		this.key = key; // number||Node
		this.value = value; // number||Node

		this.banKeyIndex = false;
		this.inKeyIndex = false;
		this.changed = p.changed;

		if( this.key instanceof Node && this.value instanceof Node )
			this.addToKeyIndex();
  }

	async save()
	{
    if( this.id == -1 )
      await this.knowdb.getParamIdent(this);
    if( !this.inKeyIndex && this.key && !this.banKeyIndex )
      await this.addToKeyIndex();
		await this.knowdb.saveParam(this);
	}
  async setKeyV(key)
  {
    let node = await this.knowdb.Node(key);
    await this.setKey(node);
  }
  async setValueV(value)
  {
    let node = await this.knowdb.Node(value);
    await this.setValue(node);
  }

  async getKey()
  {
    if( !(this.key instanceof Node) )
      this.key = await this.knowdb.getNode(this.key);
    return this.key;
  }
  async getKeyV()
  {
    const node = await this.getKey();
    return node.title;
  }
  async getValue()
  {
    if( !(this.value instanceof Node) )
      this.value = await this.knowdb.getNode(this.value);
    return this.value;
  }
  async getValueV()
  {
    const node = await this.getValue();
    return node.title;
  }
    
	async setKey(key)
	{
		this.changed = true;
		if( this.inKeyIndex )
			await this.removeFromKeyIndex();
		this.key = key;
		await this.addToKeyIndex();
	}
	async setValue(value)
	{
		this.changed = true;
		if( this.inKeyIndex )
			await this.removeFromKeyIndex();
    if( value instanceof Param ) {
      console.log("Error, param value is a param not a node");
      throw "newp";
    }
    if( typeof value != 'number' && !(value instanceof Node) ) {
      console.log("Unsupported value type " + typeof value);
      throw "newp2";
    }
		this.value = value;
  	await this.addToKeyIndex();
	}

	async addToKeyIndex() {
		if( this.id == -1 || this.banKeyIndex || this.inKeyIndex )
		  return;
		const keyValue = await this.getKeyV();
		if( typeof keyValue != 'string' || keyValue == '' ) {
			console.log("unexpected found ", this['key'], "unexpected");
		}

		const idxList = await this.knowdb.getKeyIndex( keyValue );
		if( idxList === null ) {
      return;
    }

		// allowable key
    const valValue = await this.getValueV();
	  SortedList.prototype.Impact(idxList, valValue, this.source.id);
		await this.knowdb.updateKeyIndex(keyValue, idxList);
		this.inKeyIndex = true;
	}
	
	async removeFromKeyIndex()
	{
		if( this.id == -1 || !this.inKeyIndex )
		  return;
		if( !(this.source instanceof Node) )
		  return;
		const keyValue = await this.getKeyV();
	 	const idxList = await this.knowdb.getKeyIndex( keyValue );
		if( idxList === null || idxList[0].length == 0 )
		  return;
		
		const valValue = await this.getValueV();
	 	SortedList.prototype.Redact( idxList, valValue, this.source.id );
		await this.knowdb.updateKeyIndex(keyValue, idxList);
		this.inKeyIndex = false;
	}

}


export async function ParamFromParams(params) {
  return new Param(...params);
}
export async function ParamCopy(param, params) {
  await param.copyFrom(...params);
}


export async function NodeFromParams(params) {
  return new Node(...params);
}
export async function NodeCopy(node, params) {
  await node.copyFrom(...params);
}


export class Node {
	constructor(knowdb, title = '', id = -1, source = -1, params = [])
	{
    if( knowdb instanceof Node ) {
      // hmm maybe: copyFrom(knowdb);
      let copyNode = knowdb;
      this.knowdb = copyNode.knowdb;
      this.id = -1;
      this.title = String( copyNode.title );
      this.source = copyNode.source;
      this.params = [];
      this.changedParams = false;
      this.changed = true;
      for( var param of copyNode.params ) {
        this.changedParams = true;
        this.addParamN(param.key, param.value);
      }
      this.inTitledNodes = false;
      this.banFromTitledNodes = false;
      return;
    }
		this.knowdb = knowdb;
		this.id = id;
		this.title = title; // string
		this.source = source; // userid
		this.params = params; // [Param]
		this.changed = true;
		this.changedParams = false;
		this.inTitledNodes = false;
		this.banFromTitledNodes = false;
	}
  async copyFrom(knowdb, title='', id=-1, source=-1, params=[])
  {
    //if( arguments.length != 1 ) console.log("cf: ", arguments);
    this.knowdb = knowdb;
    this.id = id;
    this.title = String( title );
    this.source = source;
    this.params = [];
    this.changedParams = false;
    this.changed = true;
    for( var param of params ) {
      this.changedParams = true;
      await this.addParamN(param.key, param.value);
    }
    this.inTitledNodes = false;
    this.banFromTitledNodes = false;
  }

  async toCode()
  {
    if( this.stringing ) return this.title+":"+this.id;
    this.stringing = true;
    const buf = this.id + ":" + this.title + "([" + await this.paramsToCode() + "])";
    this.stringing = false;
    return buf;
  }
  async to_string() {
    return await toString();
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
	async paramsToCode()
	{
		let buf='';
		if( this.params.length == 0 )
			return '';
		for( var i=0; i<this.params.length; i++ ) {
			if( buf != '' ) buf += ',\n';
			const keyNode = await this.params[i].getKey();
			const valNode = await this.params[i].getValue();

			buf += await keyNode.toCode();
			buf += "=";
			buf += await valNode.toCode();
		}
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
			return '';
		for( i=0; i<this.params.length; i++ ) {
			if( buf != '' ) buf += ',\n';
			const keyNode = this.params[i].key == null ? null : ( this.params[i].key instanceof Node ? this.params[i].key : await this.knowdb.getNode(this.params[i].key) );
			const valNode = this.params[i].value == null ? null : ( this.params[i].value instanceof Node ? this.params[i].value : await this.knowdb.getNode(this.params[i].value) );

      if( !keyNode )
        buf += spaces + 'null';
      else
  			buf += spaces + await keyNode.toString(depth+1);
			buf += "=\n";
      if( !valNode )
        buf += spaces + 'null';
      else
        buf += spaces + await valNode.toString(depth+1);
		}
		return buf;
	}


	async save()
	{
  	await this.knowdb.saveNode(this);
	}

	async setTitle(title)
	{
		if( this.inTitledNodes ) {
      throw "setTitle after already indexed";
    }
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

		const pType = await this.getParam('type');
		let pTypeval = ( pType == null )
		? "_"
		: await this.knowdb.resolveNode(pType);
		
		const idxList = await this.knowdb.findTitledNodeIdents( this.title );
		if( idxList === null || typeof idxList == 'undefined' ) {
			return;
		}

    if( idxList[1].indexOf(this.id) != -1 ) {
      this.inTitledNodes = true;
      return;
    }
		
		SortedList.prototype.Impact( idxList, pTypeval, this.id );
		await this.knowdb.updateTitledNodes( this.title, idxList );
		this.inTitledNodes = true;
	}

	async removeFromTitledNodes()
	{
		this.inTitledNodes = false;
		if( this.id == -1 ) return;

		const pType = await this.getParam('type');
		let pTypeval = ( pType == null )
		 ? "_"
		 : await this.knowdb.resolveNode(pType);
		const idxList = await this.knowdb.findTitledNodeIdents( this.title );
		if( idxList === null ) return;

		SortedList.prototype.Redact( idxList, pTypeval, this.id );
		await this.knowdb.updateTitledNodes( this.title, idxList );
	}
	
	async copyParams( lst )
	{
	  	for( var i=0; i < lst.length; i++ ) {
	    	  await this.addParamN( lst[i].key, lst[i].value );
	  	}
	}
  async getParam( key )
  {
    // get any multiples stacked with newline
    let buf = '';
    let parms = await this.getParamsV(key);
    for( var i=0; i<parms.length; i++ ) {
      if( buf != '' ) buf += '\n';
      buf += parms[i];
    }
    return buf;
  }
   
  async getParamsV( key )
  {
    const params = await this.getParams(key);
    const results = [];
    for( var param of params ) {
      results.push( await this.knowdb.resolveNode(param.value) );
    }
    return results;
  }
	async getParams( key, debug=false )
	{
    const params = [];
		for( let i=0; i<this.params.length; i++ ) {
      const strkey = await this.knowdb.resolveNode(this.params[i].key);
      if( strkey.toLowerCase() == key.toLowerCase() ) {
        params.push(this.params[i]);
      }
		}
		return params;
	}

	async addParamV( key, value, in_db=true, allowNew=true )
	{
		const kn = await this.knowdb.Node(key, in_db, allowNew);
		const vn = await this.knowdb.Node(value, in_db, allowNew);
    return await this.addParamN(kn,vn);
	}
  async addParamNV( kn, value, in_db=true, allowNew=true )
  {
    const vn = await this.knowdb.Node(value, in_db, allowNew);
    return await this.addParamN(kn,vn);
  }
  async addParamVN( key, vn, in_db=true, allowNew=true )
  {
    const kn = await this.knowdb.Node(key, in_db, allowNew);
    return await this.addParamN(kn,vn);
  }
	async addParamN( kn, vn )
	{
    let key = await this.knowdb.resolveNode(kn);
    let value = await this.knowdb.resolveNode(vn);
    for( var i=0; i < this.params.length; i++ ) {
      if( await this.knowdb.resolveNode(this.params[i].key) == key ) {
        if( await this.knowdb.resolveNode(this.params[i].value) == value ) {
          return this.params[i];
        }
      }
    }
		this.changedParams = true;

		const p = await this.knowdb.Param(kn,vn,this,1.0);
		this.params.push(p);

		return p;
	}
};






export class NodeTable {
  constructor(app, handle, fields, indices=[])
  {
    this.app = app;
    this.handle = handle;
    this.fields = fields;
    if( this.fields.indexOf('id') == -1 )
      this.fields.push('id');
    if( indices.indexOf('id') == -1 )
      indices.push('id');
    this.knowdb = new KnowDB(app, 'tab_' + handle);
    this.knowdb.indices = indices;
  }
  
  async get( ident )
  {
	  var id;
    if( typeof ident == 'string' && ident != Number(ident) ) {
      console.log("get by string failure");
      throw "fail";
    }
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
      console.log("too many results for search: " + word + ", too many results");
      return null;
    }
    return results.length == 0 ? null : results[0];
  }

  async make(obj)
  {
    const r = await this.knowdb.Node();
    for( var i in obj ) {
      await r.setParam(i, obj[i]);
    }
    return r;
  }
  async create(obj,cb)
  {
    const r = await this.make(obj);
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
        keyParams = await this.knowdb.findTitledNodeIdents(value);
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
            await addKP( key, await this.knowdb.findKeyValueIdents(key, i) );
            await addKP( key, await this.knowdb.findKeyValueIdents(key, value[i]) );
          }
        }
      } else {
        await addKP( await this.knowdb.findKeyValueIdents(key, value) );
      }
    }
    let result = new Set();
    let nodes = [];
    const results = [];
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
        keyParams = await this.knowdb.findTitledNodeIdents(value.toLowerCase());
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
            await addKP( key, await this.knowdb.findKeyValueIdents(key, i) );
            await addKP( key, await this.knowdb.findKeyValueIdents(key, value[i]) );
          }
        }
      } else {
        await addKP( await this.knowdb.findKeyValueIdents(key, value) );
      }
    }
    const result = new Set();
    const results = [];
    for( var key in union ) {
      const lst = union[key];
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
    this.knowdb = knowdb;


    this.vprefabs = [
      'had', 'have', 'have', 'having',
      'had', 'have', 'have', 'having',
      'been', 'was', 'is', 'being',
      'been', 'were', 'are', 'being',
      'been', 'was', 'am', 'being',
      'been', 'were', 'are', 'being',
      'as', 'as', 'as', 'being',
      'as', 'as', 'as', 'being',
      'meant', 'meant', 'means', 'meaning',
      'meant', 'meant', 'mean', 'meaning',
      'swum', 'swam', 'swims', 'swimming',
      'swum', 'swam', 'swim', 'swimming',
      'run', 'ran', 'runs', 'running',
      'run', 'ran', 'run', 'running',
      'drunk', 'drank', 'drinks', 'drinking',
      'drunk', 'drank', 'drink', 'drinking',
      'sung', 'sang', 'sings', 'singing',
      'sung', 'sang', 'sing', 'singing',
      'comes', 'came', 'comes', 'coming',
      'come', 'came', 'come', 'coming',
      'gone', 'went', 'goes', 'going',
      'gone', 'went', 'go', 'going',
      'eaten', 'ate', 'eats', 'eating',
      'eaten', 'ate', 'eat', 'eating',
      'made', 'made', 'makes', 'making',
      'made', 'made', 'make', 'making',
      'taken', 'took', 'takes', 'taking',
      'taken', 'took', 'take', 'taking',
      'living', 'lived', 'lives', 'living',
      'living', 'lived', 'live', 'living', 
      'moving', 'moved', 'moves', 'moving',
      'moving', 'moved', 'move', 'moving',
      'arisen', 'arose', 'arises', 'arising',
      'arisen', 'arose', 'arise', 'arising',
      'awoken', 'awoke', 'awakes', 'awaking',
      'awoken', 'awoke', 'awake', 'awaking',
      'beaten', 'beat', 'beats', 'beating',
      'beaten', 'beat', 'beat', 'beating',
      'become', 'became', 'becomes', 'becoming',
      'become', 'became', 'become', 'becoming',
  'begun', 'began', 'begins', 'beginning', 'begun',
  'began', 'begin', 'beginning',
  'bent', 'bent', 'bends', 'bending',
  'bent', 'bent', 'bend', 'bending',
  'bitten', 'bit', 'bites', 'biting',
  'bitten', 'bit', 'bite', 'biting',
  'bled', 'bled', 'bleeds', 'bleeding', 
  'bled', 'bled', 'bleed', 'bleeding',
  'blown', 'blew', 'blows', 'blowing', 
  'blown', 'blew', 'blow', 'blowing',
  'broken', 'broke', 'breaks', 'breaking', 
  'broken', 'broke', 'break', 'breaking',
  'brought', 'brought', 'brings', 'bringing', 
  'brought', 'brought', 'bring', 'bringing',
  'built', 'built', 'builds', 'building', 
  'built', 'built', 'build', 'building',
  'bought', 'bought', 'buys', 'buying',
  'bought', 'bought', 'buy', 'buying',
  'caught', 'caught', 'catches', 'catching', 
  'caught', 'caught', 'catch', 'catching',
  'chosen', 'chose', 'chooses', 'choosing', 
  'chosen', 'chose', 'choose', 'choosing',
  'cost', 'cost', 'costs', 'costing', 
  'cost', 'cost', 'cost', 'costing',
  'cut', 'cut', 'cuts', 'cutting', 
  'cut', 'cut', 'cut', 'cutting',
  'done', 'did', 'does', 'doing',
  'done', 'did', 'do', 'doing',
  'drawn', 'drew', 'draws', 'drawing',
  'drawn', 'drew', 'draw', 'drawing',
  'dreamt', 'dreamt', 'dreams', 'dreaming',
  'dreamt', 'dreamt', 'dream', 'dreaming', // or dreamed
  'driven', 'drove', 'drives', 'driving', 
  'driven', 'drove', 'drive', 'driving',
  'fallen', 'fell', 'falls', 'falling',
  'fallen', 'fell', 'fall', 'falling',
  'felt', 'felt', 'feels', 'feeling',
  'felt', 'felt', 'feel', 'feeling',
  'found', 'found', 'finds', 'finding',
  'found', 'found', 'find', 'finding',
  'flown', 'flew', 'flies', 'flying',
  'flown', 'flew', 'fly', 'flying',
  'forgotten', 'forgot', 'forgets', 'forgetting', 
  'forgotten', 'forgot', 'forget', 'forgetting',
  'gotten', 'got', 'gets', 'getting',
  'gotten', 'got', 'get', 'getting',
  'given', 'gave', 'gives', 'giving',
  'given', 'gave', 'give', 'giving',
  'grown', 'grew', 'grows', 'growing',
  'grown', 'grew', 'grow', 'growing',
  'heard', 'heard', 'hears', 'hearing',
  'heard', 'heard', 'hear', 'hearing',
  'hidden', 'hid', 'hides', 'hiding',
  'hidden', 'hid', 'hide', 'hiding',
  'hit', 'hit', 'hits', 'hitting',
  'hit', 'hit', 'hit', 'hitting',
  'held', 'held', 'holds', 'holding',
  'held', 'held', 'hold', 'holding',
  'hurt', 'hurt', 'hurts', 'hurting',
  'hurt', 'hurt', 'hurt', 'hurting',
  'kept', 'kept', 'keeps', 'keeping',
  'kept', 'kept', 'keep', 'keeping',
  'known', 'knew', 'knows', 'knowing',
  'known', 'knew', 'know', 'knowing',
  'laid', 'laid', 'lays', 'laying',
  'laid', 'laid', 'lay', 'laying',
  'led', 'led', 'leads', 'leading',
  'led', 'led', 'lead', 'leading',
  'left', 'left', 'leaves', 'leaving',
  'left', 'left', 'leave', 'leaving',
  'lent', 'lent', 'lends', 'lending',
  'lent', 'lent', 'lend', 'lending',
  'let', 'let', 'lets', 'letting',
  'let', 'let', 'let', 'letting',
  'lost', 'lost', 'loses', 'losing',
  'lost', 'lost', 'lose', 'losing',
  'met', 'met', 'meets', 'meeting',
  'met', 'met', 'meet', 'meeting',
  'paid', 'paid', 'pays', 'paying',
  'paid', 'paid', 'pay', 'paying',
  'put', 'put', 'puts', 'putting',
  'put', 'put', 'put', 'putting',
  'read', 'read', 'reads', 'reading',
  'read', 'read', 'read', 'reading', // pronounced red in past
  'ridden', 'rode', 'rides', 'riding',
  'ridden', 'rode', 'ride', 'riding',
  'rung', 'rang', 'rings', 'ringing',
  'rung', 'rang', 'ring', 'ringing',
  'risen', 'rose', 'rises', 'rising',
  'risen', 'rose', 'rise', 'rising',
  'said', 'said', 'says', 'saying',
  'said', 'said', 'say', 'saying',
  'seen', 'saw', 'sees', 'seeing',
  'seen', 'saw', 'see', 'seeing',
  'sold', 'sold', 'sells', 'selling',
  'sold', 'sold', 'sell', 'selling',
  'sent', 'sent', 'sends', 'sending',
  'sent', 'sent', 'send', 'sending',
  'set', 'set', 'sets', 'setting',
  'set', 'set', 'set', 'setting',
  'shaken', 'shook', 'shakes', 'shaking',
  'shaken', 'shook', 'shake', 'shaking',
  'sat', 'sat', 'sits', 'sitting',
  'sat', 'sat', 'sit', 'sitting',
  'slept', 'slept', 'sleeps', 'sleeping',
  'slept', 'slept', 'sleep', 'sleeping',
  'spoken', 'spoke', 'speaks', 'speaking',
  'spoken', 'spoke', 'speak', 'speaking',
  'spent', 'spent', 'spends', 'spending',
  'spent', 'spent', 'spend', 'spending',
  'stood', 'stood', 'stands', 'standing',
  'stood', 'stood', 'stand', 'standing',
  'stolen', 'stole', 'steals', 'stealing',
  'stolen', 'stole', 'steal', 'stealing',
  'taught', 'taught', 'teaches', 'teaching',
  'taught', 'taught', 'teach', 'teaching',
  'told', 'told', 'tells', 'telling',
  'told', 'told', 'tell', 'telling',
  'thought', 'thought', 'thinks', 'thinking',
  'thought', 'thought', 'think', 'thinking',
  'thrown', 'threw', 'throws', 'throwing',
  'thrown', 'threw', 'throw', 'throwing',
  'understood', 'understood', 'understands', 'understanding',
  'understood', 'understood', 'understand', 'understanding',
  'won', 'won', 'wins', 'winning',
  'won', 'won', 'win', 'winning',
  'written', 'wrote', 'writes', 'writing',
  'written', 'wrote', 'write', 'writing'
];
  }

  async getNearWord(word)
  {
    const w = this.stripToBase(word);
    const t = await this.getWord(w, false);
    return t;
  }

  async getword(word, allowCreate=true)
  {
    let n = await this.getWord(word,false);
    if( !allowCreate ) return n;
    if( !n ) {
      let w = await this.createWord(word, [{title:'pos',value:'n'}]);
      return w;
    }
    return n;
  }
    
  async getWord(word, allowNear=true)
  {
    const wordlc = (typeof word == 'string' ? word.toLowerCase() : String(word));
    const cores = await this.knowdb.getTitledNodes(wordlc);
    if( cores.length == 0 && allowNear ) {
      let try2 = await this.getNearWord(word);
      return try2;
    }
    if( cores.length == 1 ) {
      return cores[0];
    }
    if( cores.length == 0 ) {
      return null;
    }
    //console.warn(cores.length + " results found for " + wordlc);
    //console.log( cores.map( (x) => x.title ) );
    return cores[0];
  }
  
  async init() 
  {
    console.log("Configuring WordDB");
    this.knowdb.useCache(true, 0.1);//0.01
    this.knowdb.useCacheDeep(false, 0.1);
    this.knowdb.useCacheLimit(50000);
    this.knowdb.useReadCache(true);
    this.knowdb.useReadCacheDeep(true);
    this.knowdb.indices = [ 'title', 'base' ];
    await this.knowdb.init();
    await this.knowdb.loosen();

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

      let count = 0;
      let last_with_def = null;
      let timer = Date.now() + 10000;
      console.log("Transfering " + roots.length + " wordroots to db...");
      util.perfMark('start');
      let temps = 0;
      this.knowdb.startBatch();

      for( var aname of roots ) {
        const root = wordstore.get(aname);
    	  if( Date.now() >= timer ) {
	   	    temps++;
	  	    timer = Date.now() + 10000;
          /*
          if( last_with_def != null ) {
            console.log("last with def: ", await last_with_def.toString());
            last_with_def=null;
          }
          */
		      console.log("tick temp " + temps + ", counts: ", count, aname, util.printJSON(root));
	      }
        count++;
        if( count%50000 == 0 ) {
          console.log("50000...");
          await this.knowdb.endBatch();
	        await this.knowdb.softheartbeat(true);
          this.knowdb.startBatch();
        }
        const w = await this.createWord(root.title, root.params);
        /*
        const defs = await w.getParams('def');
        if( defs.length > 0 ) {
          last_with_def = w;
        }
        */
      }
      console.log("Created words: " + this.createdWords);
      console.log("Words formed: " + this.wordForms);

      wordstore.unload();

      console.log("Writing db.");
      await this.knowdb.endBatch();
      console.log("Done importing words.");
      family = await this.getWord('family');
    }

    if( !family )
      console.log("still cannot find 'family' word.");
    else {
     console.log("Family",await family.toString());
    }

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
    if( rootword.title == 'fish' || rootword.title == 'cat'|| rootword.title == '0' ) {
      console.log("augmentWord >> ", await rootword.toString());
    }

    util.perfMark("aw");
    for( var param of params ) {
      switch( param.title ) {
        case 'def':
        case 'ex':
        case 'pos':
          if( rootword.title in this.overrides ) {
            if( !this.overridden.has(title) ) {
              this.overridden.add(title);
              await rootword.addParamV( 'pos', this.overrides[title].pos );
            }
            continue;
          }
          if( rootword.title == 'am' || rootword.title == 'there' ) {
            console.log(rootword.title,param.title,param.value, "(addparam am|there)");
          }
          await rootword.addParamV( param.title, param.value );
          continue;
      }
    }
    util.perfMark("aw", true);
  }

  // wordForm: tn = tense, -1=past, 0=present, 1=progress, 2=future, 3=noun
  // wordForm: pl = plurality, 0=false, 1=true, 2=undefined
  //
  isConsonant(p)
  {
    // staff staffing
    // beg begging
    // stab stabbing
    // stack stacking
    // seek seeking
    // seal sealing
    // grab grabbing
    let a = 'bcdfghjklmnpqrstvwxz';
    if( a.indexOf(p) == -1 ) return false;
    return true;
  }

  stripToBase(title)
  {
    var base = '';
    if( title.endsWith('ed') ) {
      base = title.substring(0,title.length-2);
    } else if( title.length > 4 && title.endsWith('en') ) {
      base = title.substring(0,title.length-2);
    } else if( title.length > 5 && title.endsWith('ing') ) {
      base = title.substring(0,title.length-3);
    } else if( title.endsWith('ss') ) {
      base = title;
    } else if( title.length > 3 && title.endsWith('s') ) {
      base = title.substring(0,title.length-1);
    }
    let doubles = [ 'cflkxs' ];
    if( base != '' ) {
      let len=base.length; // remove double consonants:
      if( len>2 && base[len-1] == base[len-2] && this.isConsonant(base[len-1]) && doubles.indexOf(base[len-1]) == -1 ) {
        base = base.substring(0,base.length-1);
      }
    } else {
      base = title;
    }
    return base;
  }

  formVerb(title, pl, tn)
  {
    // has run, ran, run!, running
    // has swum, swam, swim, swimming
    // petted pet petting
    // pandered pander pandering
    // jested jest jesting
    // carry carried carrying
    // has come, has been coming
    let p = this.vprefabs.indexOf(title);
    if( p != -1 ) {
      let pm = p%4;
      return this.vprefabs[pm + 4*pl + tn+2];
    }
    
    // otherwise, first reidentify the current root word
    var base = '';
    if( title.endsWith('ed') ) {
      base = title.substring(0,title.length-2);
    } else if( title.length > 4 && title.endsWith('en') ) {
      base = title.substring(0,title.length-2);
    } else if( title.length > 5 && title.endsWith('ing') ) {
      base = title.substring(0,title.length-3);
    } else if( title.endsWith('ss') ) {
      base = title;
    } else if( title.length > 3 && title.endsWith('s') ) {
      base = title.substring(0,title.length-1);
    }
    let doubles = [ 'cflkx' ];
    if( base != '' ) {
      let len=base.length; // remove double consonants:
      if( len>2 && base[len-1] == base[len-2] && this.isConsonant(base[len-1]) && doubles.indexOf(base[len-1]) == -1 ) {
        base = base.substring(0,base.length-1);
      }
    } else {
      base = title;
    }

    switch( pl ) {
      case 0: default:
        switch( tn ) {
          case -1:
            if( base.endsWith("e") ) {
              console.log("irregular " + base);
            }
            return base + "en";
          case 0:
            return base + "s";
          case 1: default:
            if( base.endsWith("e") ) {
              return base.substring(0,base.length-1) + "ing";
            } else if( this.isConsonant( base[base.length-1] ) ) {
              if( base[base.length-1] == base[base.length-2] || doubles.indexOf(base[base.length-1]) != -1 ) // already a double:
                return base + "ing";
              return base + base[base.length-1] + "ing";
            }
        }
      case 1:
        switch( tn ) {
          case -1:
            if( base.endsWith("e") ) {
              console.log("irregular1 " + base);
            }
            return base + "en";
          case 0:
            return base;
          case 1: default:
            if( base.endsWith("e") ) {
              return base.substring(0,base.length-1) + "ing";
            } else if( this.isConsonant(base[base.length-1]) ) {
              if( doubles.indexOf(base[base.length-1]) != -1 )
                return base + "ing";
              return base + base[base.length-1] + "ing";
            }
        }
      }
    console.log(pl,tn,base,"(unexpected pl,tn)");
    return base;
  }
  formNoun(title, pl)
  {
    // pl:    0      1
    // tn=-1:
    // (past)
    // tn= 0:
    // (present)
    // tn= 1:
    // (present progressive)
    // tn= 2:
    // (future)
    if( !('singles' in this) ) {
      this.singles = {
        'mice': 'mouse',
        'geese': 'goose',
        'sheep': 'sheep',
        'teeth': 'tooth',
        'feet': 'foot',
        'men': 'man',
        'women': 'woman',
        'people': 'person',
        'aircraft': 'aircraft',
        'lice': 'louse',
        'deer': 'deer',
        'fish': 'fish',
        'moose': 'moose',
        'salmon': 'salmon',
        'series': 'series',
        'species': 'species',
        'children': 'child',
        'dice': 'die',
        'data': 'datum',
        'criteria': 'criterion',
        'phenomena': 'phenomenon',
        'alumni': 'alumnus',
        'indices': 'index',
        'octopi': 'octopus',
        'bison': 'bison',
        'buffalo': 'buffalo',
        'carp': 'carp',
        'cod': 'cod',
        'elk': 'elk',
        'pike': 'pike',
        'trout': 'trout',
        'corps': 'corps',
        'offspring': 'offspring',
        'oxen': 'ox',
        'cherubim': 'cherub',
        'seraphim': 'seraph',
        'kudo': 'kudos',
        'opus': 'opera'
      };
    // kinda weird but
    // this.singles[ plural ] = singular
    // this.plurals[ singular ] = plural
      this.plurals = {};
      for( var key in this.singles ) this.plurals[ this.singles[key] ] = key;
    }

    if( pl == 0 && title in this.singles )
      return this.singles[title];
    if( pl == 1 && title in this.plurals )
      return this.plurals[title];

    if( pl == 0 ) { // to singular
      if( title in this.plurals ) return title; // special case
      if( title in this.singles ) return this.singles[title];

      if( title.endsWith("ies") ) {
        return title.substring(0,title.length-3) + "y";
      } else if( title.endsWith("ces") ) {
        return title.substring(0,title.length-3) + "ix";
      } else if( title.endsWith("ves") ) {
        return title.substring(0,title.length-3) + "f";
      } else if( title.endsWith("i") ) {
        return title.substring(0,title.length-1) + "us";
      } else if( title.endsWith("a") ) {
        return title.substring(0,title.length-1) + "um";
      } else if( title.endsWith("eaux") ) {
        return title.substring(0,title.length-1);
      } else if( title.endsWith("sses") ) {
        return title.substring(0,title.length-2);
      } else if( title.endsWith("is") ) {
        return title.substring(0,title.length-2) + "es";
      } else if( title.endsWith("s") ) {
        return title.substring(0,title.length-1);
      }

      return title;
    } else { // to plural
      if( title in this.singles ) return title; // special case
      if( title in this.plurals ) return this.plurals[title];

      if( title.endsWith("y") ) {
        return title.substring(0,title.length-1) + "ies";
      } else if( title.endsWith("us") ) {
        return title.substring(0,title.length-2) + "i";
      } else if( title.endsWith("fe") ) {
        return title.substring(0,title.length-2) + "ves";
      } else if( title.endsWith("f") ) {
        return title.substring(0,title.length-1) + "ves";
      } else if( title.endsWith("um") ) {
        return title.substring(0,title.length-2) + "a";
      } else if( title.endswith("eau") ) {
        return title + "x";
      } else if( title.endsWith("ix") ) {
        return title.substring(0,title.length-2) + "ces";
      } else if( title.endsWith("ss") ) {
        return title + "es";
      } else if( title.endsWith("s") ) {
        return title + "ses";
      }
      return title + "s";
    }
  }

  wordFormInfoNoun(title)
  {
    const wordForm = {};
    const plurals = [ 'mice', 'geese', 'sheep', 'wolves' ];
    const singles = [ 'this', 'his', 'hers', 'theirs',
      'news', 'series', 'species', 'gas',
    ];
    const duals = []; //  'theirs' but there's only one they
    // or something, don't ask me, grammar is hard dammit

    if( duals.indexOf(title) == -1 ) {
      wordForm.pl = 2;
    } else if( singles.indexOf(title) == -1 ) {
      wordForm.pl = 0;
    } else if( plurals.indexOf(title) != -1 || ( title.endsWith("s") ) && ( !title.endsWidth("ss") ) ) {
      wordForm.pl = 1;
    } else if( title.endsWith('fe') ) {
      wordForm.pl = 0;
    } else if( title.endsWith('f') ) {
      wordForm.pl = 0;
    } else if( title.endsWith('ics') ) {
      wordForm.pl = 0;
    } else {
      wordForm.pl = 0;
    }
    wordForm.tn = 3;
    return wordForm;
  }
  wordFormInfoVerb(title)
  {
    const wordForm = {};
    // rule mentions:
    // batted batted bat batting
    // vexed vexed vex vexing
    //
    // as rules:
    // - ends with e: strip e, a for past, o ppast, e present, ing future
    // - ends with in.: u., a., i.s, i.ing
    // - ends with 

    let p = this.vprefabs.indexOf(title);
    if( p != -1 ) {
      let pm = p%4, pdist = p - pm;
      wordForm.pl = pdist < 4 ? 0 : 1;
      wordForm.tn = (pdist%4) - 1;
    } else if( title.endsWith("ed") || title.endsWith("ew") ) {
      wordForm.tn = -1; // walked / flew
      wordForm.pl = 2; // support single+plural
    } else if( title.endsWith("ss") ) {
      wordForm.tn = 0;
      wordForm.pl = 1;
    } else if( title.endsWith("s") ) {
      wordForm.tn = 0; // run
      wordForm.pl = 0;
    } else if( title.endsWith("ing") ) {
      wordForm.tn = 1; // run
      wordForm.pl = 2; // support single+plural
    } else {
      wordForm.tn = 2; // running
      wordForm.pl = 1; // support plural by default
    }
    return wordForm;
  }

 // createWord( string, [ {title,value},... ] )
  async createWord(title, params)
  {
    if( !('createdWords' in this) ) {
      this.createdWords=0;
      this.wordForms=0;

      this.overrides = {
        'a': { pos: 'det' },
        'an': { pos: 'det' },
        'am': { pos: 'v' },
        'the': { pos: 'det' },
        'i': { pos: 'n' },
        'cat': { pos: 'n' },
      };
      this.overridden = new Set();
    }
    this.createdWords++;

    var rootword;

    if( this.knowdb.pool ) {
      rootword = await this.knowdb.pool.get( [this.knowdb, title] );
    } else {
      rootword = new Node(this.knowdb, title);
    }
    if( !(rootword instanceof Node) ) {
      console.warn("Couldn't create root word for '" + title + "'");
      console.trace();
    }
    const words = [];
    var alsos, also;
    await rootword.save(); // gets an id
    var tn;
    
    let wiVerb=null, wiNoun=null;
    let hasNoun=false, hasVerb=false;
    for( var param of params ) {
      switch( param.title ) {
        default:
          words.push(param);
          continue;
        case 'lem':
          words.push(param.value);
          continue;
        case 'def':
        case 'ex':
          await rootword.addParamV( param.title, param.value );
          continue;
        case 'pos':
          if( title in this.overrides && typeof this.overrides[title] != 'function' ) {
            if( !this.overridden.has(title) ) {
              this.overridden.add(title);
              console.log("override " + title + ":", this.overrides[title]);
              await rootword.addParamV( 'pos', this.overrides[title].pos );
            }
            continue;
          }
          await rootword.addParamV( 'pos', param.value );
          
          if( param.value == 'v' ) {
            hasVerb = true;
          } else if( param.value == 'n' ) {
            hasNoun = true;
          }

          continue;
      }
    }
    if( hasVerb ) {
      wiVerb = this.wordFormInfoVerb(title);
      await rootword.addParamV( 'pl', wiVerb.pl );
      await rootword.addParamV( 'tn', wiVerb.tn );
    } else if( hasNoun ) {
      wiNoun = this.wordFormInfoNoun(title);
      await rootword.addParamV( 'pl', wiNoun.pl );
    }

    await rootword.addParamV( 'base', ( Number(title) != title ? ( String(title).toLowerCase() ) : ( title ) ) );

    for( var wordobj of words ) {
      const synonym = wordobj.title;
      const vars = wordobj.params;
      if( synonym === rootword.title ) {
      	await this.augmentWord(rootword, vars);
      } else {
        const wordnode= await this.createWord(synonym, vars);
        if( wordnode instanceof Promise ) {
          util.throwStack("a fit");
          throw "a fit";
        }
        await wordnode.addParamV('root', rootword.title);
        await wordnode.save();

        await rootword.addParamVN('word', wordnode);
      }	
    }
    await rootword.save();
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
	  
    this.knowdb = app.knowdb = new KnowDB(app, 'know');
    app.wordlib = this.wordlib = new KnowDB(app, 'words');
    app.words = this.words = this.worddb = new WordDB(this.app, this.wordlib);
  }
  
  async table(handle, fields, indices)
  {
    this.tables[handle] = new NodeTable(this.app, handle, fields, indices);
    await this.tables[handle].knowdb.init();
    return this.tables[handle];
  }
  
  async init()
  {
    await this.words.init();
  }
}

export class KnowDB {
	constructor(app, filename)
	{
		this.app = app;
    this.pool = null;
    this.pool2 = null;
		this.filename = filename;
    this.noCache = false;
    this.batch = false; // don't update lists during batch mode
    this.batched = null;
		
		// nodes:
		this.Nodes = new LargeKVStore(this.app, "./know/n_" + filename + ".jsdb"); // object storage by id
		// params:
		this.Params = new LargeKVStore(this.app, "./know/p_" + filename + ".jsdb"); // object storage by id
		// nodekeys: nodes by title lists
		this.NodeKeys = new LargeKVStore(this.app, "./know/ns_" + filename + ".jsdb"); // node ids by title

		// nodeparams: params by node id lists
		this.NodeParams = new LargeKVStore(this.app, "./know/np_" + filename + ".jsdb");
    //
		// paramlists: nodes by key lists
		this.ParamLists = new LargeKVStore(this.app, "./know/pl_" + filename + ".jsdb"); // param ids by key, sorted lists by value


		// system: configuration table
		this.System = new SimpleKVStore("./know/s_" + filename + ".jsdb");

		this.mNodes = new Map(); // loaded nodes by id
		this.mParams = new Map(); // loaded params by id
    this.mNodeHits = new Map();
    this.mParamHits = new Map();
		this.indexedKeys = [];

    this.cacheLimit = 256;
	}

  startBatch()
  {
    this.batch=true;
    this.batched=new Map();
  }
  async endBatch()
  {
    if( !this.batch ) return;
    this.batch=false;

    let e = this.batched.entries();
    let count=0;

    console.log("Pre-batch compacting");
    await this.compact(true);

    for( var ent of e ) {
      let entry = ent[0];
      let value = ent[1];
      let parts = entry.split(":");
      let p1 = parts.slice(1).join(":");

      if( parts[0] == 'node' ) {
        await this.saveNode( value );
      } else if( parts[0] == 'parm' ) {
        await this.saveParam( value );
      } else if( parts[0] == 'title' ) {
        await this.updateTitledNodes( p1, value );
      } else if( parts[0] == 'key' ) {
        await this.updateKeyIndex( p1, value );
      } else if( parts[0] == 'np' ) {
        await this.updateNodeIdParams( Number(p1), value );
      } else {
        console.log("error--33333");
      }
      count++;
    }
    console.log("Resolved " + count + " entries of " + this.filename + ", compacting");
    await this.heartbeat(true);
  }

  resetCache()
  {
    if( this.noCache ) {
      this.mNodes = null;
      this.mParams = null;
      this.mNodeHits = null;
      this.mParamHits = null;
    }
    this.Nodes.resetCache();
    this.Params.resetCache();
    this.NodeKeys.resetCache();
    this.NodeParams.resetCache();
    this.ParamLists.resetCache();
  }
  releaseMemory(audible=false)
  {
    if( audible )
      console.log("releasing memory for " + this.filename);

    // first release the top cache
    // we need to tell the pool what we delete.
    if( !this.noCache ) {
      this.cleanCache(this.mNodes, this.mNodeHits);
      this.cleanCache(this.mParams, this.mParamHits);
    }

    // then release from the kvs as well
    this.Nodes.releaseMemory();
    this.Params.releaseMemory();
    this.NodeKeys.releaseMemory();
    this.NodeParams.releaseMemory();
    this.ParamLists.releaseMemory();
	}
  cleanCache(objMap, hitMap) {
    if( this.noCache ) {
      return false;
    }
    if( this.cacheCut == 1 ) {
      this.resetCache();
      return true;
    }
    let total = hitMap.size;
    if( total <= this.cacheLimit ) {
      return false;
    }

    const entries = hitMap.entries();
    let cut = total*this.cacheCut;
    let min_h = [];
    let cut2 = cut*2;
    var i;

    for( const entry of entries ) {
      let k = entry[0], v = entry[1];
      let found=false;
      for( i=0; i<min_h.length; i+=2 ) {
        if( typeof v != 'number' ) {
          console.log("v is", typeof v, v);
          throw "hah";
        }
        if( v < min_h[i] ) {
          min_h.splice(i,0,v,k);
          found=true;
          break;
        }
      }
      if( !found && min_h.length < cut2 ) {
        min_h.push(v,k);
      }
      if( min_h.length > cut2 ) {
        min_h.pop(); // only grab the least hit items
        min_h.pop();
      }
    } 
    for( i=0; i<min_h.length; i+=2 ) {
      objMap.delete(min_h[i+1]);
      hitMap.delete(min_h[i+1]);
    }
    return true;
  }
  useCache(setting, cacheCut)
  {
    this.noCache = !setting;
    this.cacheCut = cacheCut;
    if( this.noCache && this.mNodes != null ) {
      this.mNodes = null;
      this.mParams = null;
      this.mNodeHits = null;
      this.mParamHits = null;
    }
  }
  useCacheDeep(setting, cacheCut=0.5)
  {
    this.Nodes.useCache(setting, cacheCut);
    this.Params.useCache(setting, cacheCut);
		this.NodeKeys.useCache(setting, cacheCut);
		this.NodeParams.useCache(setting, cacheCut);
		this.ParamLists.useCache(setting, cacheCut);
	}
  useCacheLimit(setting)
  {
    this.cacheLimit = setting;
    this.Nodes.useCacheLimit(setting);
    this.Params.useCacheLimit(setting);
    this.NodeKeys.useCacheLimit(setting);
    this.NodeParams.useCacheLimit(setting);
    this.ParamLists.useCacheLimit(setting);
  }
  useReadCache(rc)
  {
    this.readCache = rc;
  }
  useReadCacheDeep(rc)
  {
    this.Nodes.readCache = rc;
    this.Params.readCache = rc;
    this.NodeKeys.readCache = rc;
    this.NodeParams.readCache = rc;
    this.ParamLists.readCache = rc;
  }

  usePooling()
  {
    console.log(this.filename + " pooling starting...");
    this.pc = new this.app.Pool.FunctionObj('n'+this.filename, NodeFromParams, NodeCopy);
    this.pool = this.pc.pool;
    this.pc2 = new this.app.Pool.FunctionObj('p'+this.filename, ParamFromParams, ParamCopy);
    this.pool2 = this.pc2.pool;
  }

  async softheartbeat(audible=false)
  {
    if( this.Nodes.hits != null && this.Nodes.hits.size > this.Nodes.cacheLimit )
      await this.heartbeat(audible);
  }

	async heartbeat(audible=false)
	{
    if( this.noCache ) {
      console.log("heartbeat() on db with no cache");
      return;
    }
    await this.compact(audible); // saves changes
    await this.loosen(); // releases db
	}
  async tighten(audible=false)
  {
    await this.compact(audible);
  }

	async init()
	{
    //this.app.util.throwStack();
		await this.Nodes.open();
		await this.NodeKeys.open();
		await this.ParamLists.open();
		await this.NodeParams.open();
		await this.Params.open();
		await this.System.load();

    if( !this.Nodes.noCache )
      await this.loosen();

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

		await console.log(this.filename + " soft loaded: nextnode=" + this.nextnode);
	}
	
	async loosen()
	{
    if( this.Nodes.noCache ) {
      return;
    }
		await this.Nodes.loosen();
		await this.Params.loosen();

		await this.NodeKeys.loosen();
		await this.ParamLists.loosen();
		await this.NodeParams.loosen();

		await this.System.loosen();
	}

	async compact(audible=false)
	{
    if( !this.noCache ) {
      this.noCache = true;

      const mn = this.mNodes.entries();
      for( const m of mn ) {
        const [id,node] = m;
        await this.saveNode(node);
      }
      const mp = this.mParams.entries();
      for( const p of mp ) {
        const [id,param] = p;
        await this.saveParam(param);
      }
      this.mNodes = new Map();
      this.mParams = new Map();

      this.noCache = false;
    }

    if( !this.Nodes.noCache ) {
      if( audible )
  		  console.log("Compacting " + this.filename + " knowdb (" + this.Nodes.hits.size + "|" + this.Params.hits.size + "|" + this.NodeParams.hits.size + "...");

		  await this.Nodes.compact();
		  await this.Params.compact();
		  await this.NodeKeys.compact();
		  await this.ParamLists.compact();
		  await this.NodeParams.compact(); // all largekvs

		  await this.System.rewrite(); // simple
      if( audible )
  		  console.log("Knowdb '" + this.filename + "' Compacted.");
    }
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

  async newNode( title, in_database=true )
  {
    const x = new Node(this, title);
    x.changed = true;
    if( in_database ) {
      await this.saveNode(x);
    }
		return x;
  }

	async Node( title, in_database=true, allowNew=true )
	{
    var list;
		list = await this.getTitledNodes(title);
 		if( ( list === null || list.length == 0 ) && allowNew ) {
      var x;
      if( this.pool ) {
        x = this.pool.get([this,title]);
      } else {
			  x = new Node(this, title);
      }
      if( in_database )
  			await this.saveNode(x);
			return x;
		}
    if( list.length > 0 ) return list[0];
		return null;
	}
	async getNode( inid )
	{
		var id;
		util.perfMark('getnode');
    if( Number(inid) != inid ) {
      console.log("getNode by name failure");
      throw "fail";
    }
		if( typeof inid == 'string' && !isNaN(inid) ) id = Number(inid);
		else if( typeof inid != 'number' ) {
			console.log("wrong getNode: use id", inid);
			util.throwStack("getnode-not-a-number");
			throw "getnode-not-a-number";
		} else id=inid;

    //console.log("getNode(" + typeof inid + ":", inid, ")");

		if( !this.noCache && this.mNodes.has(id) ) {
      let z = this.mNodeHits.get(id);
      if( isNaN(z) ) z=0;
      this.mNodeHits.set(id, z+1);
      return this.mNodes.get(id);
    }
		
		// try to load from disk
		if( !(await this.Nodes.has(id)) ) {
			return null;
		}

			//nc is a simple object node
		const nc = await this.Nodes.get(id);
		// create the actual Node class for data:
    var n;
    if( this.pool ) {
      n = await this.pool.get([this,nc.title,id,nc.source]);
      //console.log("pool node id " + n.id);
    } else {
		  n = new Node(this, nc.title, id, nc.source);
      //console.log("new node id " + n.id+ " title " + nc.title);
    }

		// get details
		const np = await this.getNodeParams( n );
		for( var i=0; i<np[1].length; i++ ) {
		  //const key = np[0][i];
		  const paramid = np[1][i];
      const p = await this.getParam(paramid);
		  n.params.push( p );
		}
		util.perfMark('getnode', true);
    if( !this.noCache && this.readCache ) {
      let z = this.mNodeHits.get(n.id);
      if( isNaN(z) ) z=0;
      this.mNodeHits.set(n.id, z+1);
  		this.mNodes.set(n.id, n);
    }
		return n;
	}
	async Param(key, value, source, weight=1.0)
	{
    var k;
    if( key instanceof Param ) {
      if( this.pool2 ) {
        k = await this.pool2.get([this,key.key,key.value,key.weight,key.source]);
      } else {
        k = new Param(this,key.key,key.value,key.weight,key.source);
      }
    } else {
	    if( !(key instanceof Node) )
	  	  key = await this.Node(key);
	    if( !(value instanceof Node) )
	  	  value = await this.Node(value);
      if( this.pool2 ) {
        //console.log("pool2.get",key,value,weight,source);
        k = this.pool2.get([this,key,value,weight,source]);
      } else {
  	    k = new Param(this,key,value,weight,source);
      }
    }
    if( k == null || k.key == null || k.value == null ) {
      this.app.util.throwStack("no comprende");
      throw "nope";
    }
	  return k;
	}
	async getParam( inid )
	{
	  var id;
    if( Number(inid) != inid ) {
      console.log("getParam by string failure");
      throw "fail";
    }
	  if( typeof inid == 'string' && !isNaN(inid) ) id = Number(inid);
	  else id = inid;
	  if( !this.noCache && this.mParams.has(id) ) {
      let z = this.mParamHits.get(id);
      if( isNaN(z) ) z=0;
      this.mParamHits.set(id, z+1);
      return this.mParams.get(id);
    }
		
	  const pc = await this.Params.get(id);
	  if( typeof pc == 'undefined' || pc === null ) {
		  console.log("Param " + (typeof id) + ":" + id + " not found.", typeof inid, inid);
      util.throwStack("noparam2");
		  throw "noparam2";
	  }

	  //this.solveParam(p); // to autoload
    var p;
    if( this.pool2 ) {
      p = this.pool2.get([this, pc.k, pc.v, pc.w, pc.s, pc.id]);
    } else {
	    p = new Param(this, pc.k, pc.v, pc.w, pc.s, pc.id );
    }
    if( !this.noCache && this.readCache ) {
      let z = this.mParamHits.get(pc.id);
      if( isNaN(z) ) z=0;
      this.mParamHits.set(pc.id, z+1);
  	  this.mParams.set(pc.id, p);
    }
	  return p;
	}
	
	async resolveNode( n )
	{
    if( n === null ) {
      this.app.util.throwStack("null node");
      throw "resolve null node";
    }
	  if( typeof n == 'string' ) {
	  } else if( typeof n == 'object' ) {
	    n = n.title;
	  } else if( typeof n == 'number' ) {
	    const node = await this.getNode(n);
	    n = node.title;
	  } else {
	    console.warn("resolveNode(): not a numbered node:", n);
      util.throwStack();
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

  async findKeyValueRange( key, value )
  {
    //console.log("findKeyValueRange",key,value);
		const idxList = await this.getKeyIndex(key);
		if( idxList === null || typeof idxList == 'undefined' ) return null;
		const list = new SortedList(idxList[0], idxList[1]);
		var result;

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
        util.throwStack();
				throw "unknown operator";
			}
		} else {
			result = list.findAllSpec(value);
		}
		return [list,result];
  }

	async findKeyValueIdents( key, value )
	{
		const idxList = await this.getKeyIndex(key);
		if( idxList === null || typeof idxList == 'undefined' ) return null;
		const list = new SortedList(idxList[0], idxList[1]);
		var result;

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
        util.throwStack();
				throw "unknown operator";
			}
		} else {
			result = list.findAllSpec(value);
		}
    const list2 = list.valuesFromRange(result);
		return list2;
	}

  async findKeyNodes( key, value )
  {
    return await this.findKeyValueIdents(key,value);
  }

	async getKeyNodes( key, value )
	{
		const [ list, range ] = await this.findKeyValueRange(key,value);
		const idents = await list.valuesFromRange(range);
    const result = [];
    for( var ident of idents ) {
      result.push( await this.getNode(ident) );
    }
		return result;
	}

	async updateTitledNodes( title, list )
	{
		if( list[2] ) {
      const lctitle = typeof title == 'number' ? String(title) : title.toLowerCase();
      if( this.batch ) {
        this.batched.set("title:"+lctitle,list);
        return;
      }
      list[2] = false;
			return await this.NodeKeys.set(lctitle, list);
		}
	}
	async getTitledNodes( title )
	{
		const nodes = [];
		util.perfMark('getnodenodes');
    const lctitle = typeof title == 'number' ? String(title) : title.toLowerCase();
		const toplist = await this.findTitledNodeIdents( lctitle );
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

	async findTitledNodeIdents( title )
	{
		var list;
    const lc = (typeof title == 'number')?String(title):title.toLowerCase();

  	if( this.indices.indexOf("title")  == -1 )
	    return null;

    if( this.batch && this.batched.has("title:" + lc) ) {
      return this.batched.get("title:"+lc);
    }
	
		if( !(await this.NodeKeys.has(lc)) ) {
			list = [[],[],true];
			await this.updateTitledNodes(lc,list);
		} else {
			list = await this.NodeKeys.get(lc);
		}
		if( !list || (typeof list != 'object' && typeof list != 'array') || list.length != 3 ) {
			console.log("Bad list detected for " + lc + ": ", typeof list, list);
			util.throwStack("bad list-1");
		}
		return list;
	}
	
	async updateNodeParams( node, list )
  {
    return await this.updateNodeIdParams(node.id,list);
  }
  async updateNodeIdParams( id, list )
	{
	  if( list[2] ) {
      if( typeof id != 'number' ) {
        if( id != Number(id) ) {
          console.log("updateNodeParams: nan id: " + id);
        }
        id = Number(id);
      }

      if( this.batch ) {
        this.batched.set('np:' + id, list);
        return;
      }
	    list[2] = false;
	    return await this.NodeParams.set(id, list);
	  }
	}
	async getNodeParams( node )
	{
		if( typeof node != 'object' ) {
			console.log("non-nodal object ", typeof node, node, "non-nodal object");
      util.throwStack("non-nodal " + typeof node);
			throw "non-nodal " + typeof node;
		}
    if( node.id == -1 || isNaN(node.id) ) {
			console.log("node has no id ", typeof node, node, "no id on node");
      util.throwStack("cant load node " + typeof node);
			throw "node w/ no id loading";
    }
    if( this.batch && this.batched.has('np:' + node.id) ) {
      return this.batched.get('np:' + node.id);
    }

		var list = await this.NodeParams.get(node.id);
    if( typeof list == 'undefined' || list === null ) {
			list = [[],[],true];
      if( this.batch ) {
        this.batched.set('np:' + node.id, list);
      } else {
  		  await this.updateNodeIdParams(node.id,list);
      }
      return list;
    }
		return list;
	}

	async getKeyIndex( key )
	{
  	if( !this.indices || this.indices.indexOf(key)  == -1 ) {
      //console.log("No indices/no " + key);
	    return null;
    }
	  
    if( this.batch && this.batched.has('key:' + key) )
      return this.batched.get('key:'+key);
	  
	  var list = await this.ParamLists.get(key);
    if( list === null || typeof list == 'undefined' ) {
  		list = [[],[],true];
	  	await this.ParamLists.set(key,list);
    }
    return list;
	}
	async updateKeyIndex( key, list )
	{
	  if( list[2] ) {
      if( this.batch ) {
        this.batched.set('key:'+key, list);
        return;
      }
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
	  if( typeof n.params == 'undefined' || n.params === null ) {
		  console.warn("invalid-2", n);
		  return false;
	  }
  	if( typeof n.id != 'number' || n.id == -1 ) {
	    return false;
	  }
	  if( n.inTitledNodes )
	    await n.removeFromTitledNodes();
	
  	await this.deleteNodeParams(n);

    if( !this.noCache ) {
      this.mNodes.delete( n.id );
      this.mNodeHits.delete( n.id );
    }

  	await this.Nodes.delete(n.id); // update db
  }

  async deleteNodeParams(n)
  {
	  for( var i=0; i<n.params.length; i++ ) { 
		  await this.deleteParam(n.params[i]);
	  }
	  await this.NodeParams.delete( n.id );
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

	  await this.Params.delete( p.id );

    if( !this.noCache ) {
      this.mParams.delete( p.id );
      this.mParamHits.delete( p.id );
    }
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
      util.throwStack("invalid-q");
			throw "invalid-q";
		}

		await this.getNodeIdent(n);
		if( !n.banFromTitledNodes && !n.inTitledNodes )
		  await n.addToTitledNodes();

		if( n.changedParams ) {
		  n.changedParams = false;
		  const np = await this.getNodeParams( n );
		  let npSort = new SortedList(np[0], np[1]);
		  let nps = new Set();
      let npb = new Set();

		  for( i=0; i<n.params.length; i++ ) { 
  			if( typeof n.params[i] == 'number' ) {
          npb.add( n.params[i] );
          continue;
        }
        if( n.params[i].id == -1 || n.params[i].changed )
          await this.saveParam( n.params[i] );
	  		const key = await this.resolveNode(n.params[i].key);
		  	nps.add(key);
			  if( !npSort.has(key, n.params[i].id) ) {
	  		  npSort.add( key, n.params[i].id );
	  		  np[2] = true;
	  		}
		  }

		  for( i=0; i<np[0].length; i++ ) {
  			if( !nps.has(np[0][i]) && !npb.has(np[1][i]) ) {
	  			np[0].splice(i,1);
		  		np[1].splice(i,1);
			  	if( !np[2] ) np[2] = true;
			  	--i;
			  }
		  }

		  await this.updateNodeParams(n, np);
		}

		if( !n.changed )
      return;
		n.changed = false;
		
		const nCopy = {
		  id: n.id,
		  source: n.source,
		  title: n.title
		}
		await this.Nodes.set(n.id, nCopy);
    if( !this.noCache ) {
      let z = this.mNodeHits.get(n.id);
      if( isNaN(z) ) z=0;
      this.mNodeHits.set(n.id,z+1);
  		this.mNodes.set(n.id, n);
    }
	}

	async solveParam( p )
	{
    if( typeof p.key == 'string' && p.key != Number(p.key) ) {
      console.log("key is string failure");
      throw "fail";
    }
    if( typeof p.value == 'string' && p.value != Number(p.value) ) {
      console.log("value is string fialure");
      throw "fail";
    }
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

    await p.addToKeyIndex();
	}
	async getNodeIdent( n )
	{
		if( n.id != -1 ) return;
		n.id = this.nextnode;
		this.nextnode++;
		n.changedParams = n.changed = true;
    n.inTitledNodes = false;
    if( !n.banFromTitledNodes ) {
      await n.addToTitledNodes();
    }
		await this.System.set("nextnode", this.nextnode);
	}

	async saveParam( p )
	{
		if( !(p instanceof Param) ) {
			console.log(typeof p, p, "saveParam is not a param");
      util.throwStack("invalid-4");
			throw "invalid-4";
		}
    if( p.key == null || p.value == null || p.key.id === null || p.value.id === null ) {
      console.log(typeof p.key, typeof p.value, p.key, p.value, "types of params");
      console.log("invalid param key or value",p.key,p.value,"invalid param key or value");
      this.app.util.throwStack("hm");
      throw "corruption";
    }
    if( p.id == -1 )
  		await this.getParamIdent(p);
    //console.log("saveparam(" + p.id + ")");

    if( p.key instanceof Node && (p.key.changed||p.key.changedParams) )
      await this.saveNode( p.key );
    if( p.value instanceof Node && (p.value.changed||p.value.changedParams) )
      await this.saveNode( p.value );

		if( !p.changed ) return;
		p.changed = false;

		const k = (p.key instanceof Node) ? p.key.id : p.key;
		const v = (p.value instanceof Node) ? p.value.id : p.value;
    const s = (p.source instanceof Node) ? p.source.id : p.source;

		const pc = { k, v, s,
		id: p.id, w: p.weight };
		
    if( !this.noCache ) {
      let z = this.mParamHits.get(p.id);
      if( isNaN(z) ) z=0;
      this.mParamHits.set(p.id, z+1);
  		this.mParams.set(p.id, p);
    }
    try {
  		await this.Params.set(p.id, pc);
    } catch( e ) {
      console.log(e);
      console.log("details",pc);
      console.log("paramid",p.id,p.key,p.value,"params");
      throw "stop";
    }
	}


};
