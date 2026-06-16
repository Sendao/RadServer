var myapp, SimpleKVStore, central;
var enc, dec;
export function startup(app) {
  myapp = app;
  app.MarkovChainMap = MarkovChainMap;
  app.MarkovChainDB = MarkovChainDB;
  enc = new TextEncoder();
  dec = new TextDecoder();
}
var xyzzy;
var be4_dot = new Set();

export function Castle() {
  this.modlocaL = function() {
    console.log("Castle Data Types Established");
  };
}
export function compEndFunc( key1, key2 )
{
  if( key1.length == 0 ) return 1;
  if( key2.length == 0 ) return -1;

  var i=key1.length-1, j=key2.length-1;
  return ( key1[i] - key2[j] );
}

export function compareFunction( key1, key2, allowIncomplete=false )
{
  if( key1.length == 0 ) {
    console.log("empty key1");
    myapp.util.throwStack("empty key1");
    throw "huh";
  }
  if( key2.length == 0 ) {
    console.log("empty key2");
    myapp.util.throwStack("empty key2");
    throw "huh";
  }

  if( !allowIncomplete && key1.length != key2.length ) return key1.length-key2.length;
//  if( !allowIncomplete && key1.length < key2.length 

  for( var i=key1.length-1, j=key2.length-1; i>=0 && j>=0; i--, j-- ) {
    if( key1[i] != key2[j] ) return key1[i]-key2[j];
  }
  return 0;
}

export function hashEndFunc( key, useMax=true )
{
  if( key.length == 0 ) return 0;
	let n = 1;
	var i;

	var hasMax=10000;
	if( useMax === false ) hasMax=false;
	else if( useMax !== true ) hasMax=useMax;

  n = key[ key.length-1 ];
	if( isNaN(n) ) {
    console.warn("nan hashendfunc", key, typeof key, n);
    myapp.util.throwStack("nan hashendfunc");
    throw "die dammit";
    return 0;
  }
	while( hasMax!==false && n >= hasMax )
     n = n - hasMax;
	return n;
}


export function hashFunction( key, useMax=true )
{
  return hashEndFunc(key,useMax);
  /*
	for( i=key.length-1; i>=0; i-- ) {
		if( isNaN(key[i]) ) continue;
		n += key[i];
		if( hasMax!==false && n > hasMax ) n = parseInt(n/hasMax);
	}
  */
}
export class MarkovChainDB {
	constructor(app, mdb)
	{
    console.log("new MarkovChainDB");
    this.app = app;
    this.maxkey = 8000;
    this.items = mdb;
    this.items.indices = [];
    this.items.useCache(true, 0.05);
    this.items.useCacheDeep(false, 0.05);
    this.items.useReadCache(false);
    this.items.useReadCacheDeep(false);
    this.items.useCacheLimit(8000);

    this.loaded = false;
    this.normalized = false;
    this.loadN = new Array(this.maxkey).fill(false);
    this.changedRecords = 0;
  }

  async init() // load db
  {
    await this.items.init();
    await this.items.loosen();

    central = this.app.tools['Central'];
    xyzzy = new Set();
    this.loadN = new Array(this.maxkey).fill(false);
    let test = await this.items.getNode(0);
    if( test === null ) {
      console.log("Initializing MarkovChainDB");
      let emptylist = "[]";
      let emptynest = "";

      var i;
      for( i=0; i<this.maxkey; i++ ) {
        const n = await this.items.newNode('',false);
        n.id = i;
        n.changed = true;
        n.changedParams = true;
        await n.save();
      }
      this.items.nextnode = i;

      for( i=0; i<this.maxkey; i++ ) {
        const n = await this.items.getNode(i);
        var n1 = await this.items.newNode(emptylist);
        var n2 = await this.items.newNode(emptynest);
        await n.addParamVN('l', n1);
        await n.addParamVN('n', n2);
        await n.save();
        this.loadN[i] = [ [], [], n1, n2, true, n ];
      }
      console.log("Initialized.");
    } else {
      console.log("MarkovChainDB exists on disk");
      this.normalized = true;
      this.loaded = true;
    }
  }

  async load( inkey )
  {
    if( !this.normalized ) {
      throw "tried to load before normalized";
    }
    if( isNaN(inkey) ) {
      console.log("tried to load nan key " + typeof inkey, inkey);
      throw "nope";
    }
    let key = inkey;
    while( key >= this.maxkey ) key -= this.maxkey;
    if( key in this.loadN && this.loadN[key] !== false )
      return;

    const pn = await this.items.getNode(key);

    const vx = await pn.getParams('l');

    const itemlistp = vx[0];
    const itemlistn = typeof itemlistp.value == 'number' ? await this.items.getNode(itemlistp.value) : itemlistp.value;
    const itemlist = this.app.util.parseJSONTo( itemlistn.title, this.pool );
      
    const vy = await pn.getParams('n');
    const tokenmapp = vy[0];
    const tokenmapn = typeof tokenmapp.value == 'number' ? await this.items.getNode(tokenmapp.value) : tokenmapp.value;
    const tokenmaps = [];

    if( tokenmapn.title != "" ) {
      let bx = tokenmapn.title.split(";");
      for( var ax of bx ) {
        if( ax == 'null' ) {
          tokenmaps.push(null);
          continue;
        }
        const c = new MarkovLists(Uint32Array);
        try {
          c.deserialize(ax);
        } catch ( e ) {
          console.log(e);
          console.log("ax was: ",ax);
          console.log(tokenmapn.title);
        }
        //console.log("c", ax.length, ax.length < 20 ? ax : "[empty]", c.items.byteLength, c.datas.byteLength, "bx length: ", bx.length);
        //console.log("i", itemlist.length, itemlist);
        tokenmaps.push(c);
      }
    }

    this.loadN[key] = [ itemlist, tokenmaps, itemlistn, tokenmapn, false, pn ];
  }

  async normalize()
  {
    this.normalized = true;
    return;
    if( this.normalized ) {
      throw "already normalized";
    }
    console.log("Normalizing markov chains");

    for( var key=0; key < this.maxkey; key++ ) {
      const tokenmaps = this.loadN[key][1];
      if( tokenmaps === null ) continue;

      for( var i=0; i<tokenmaps.length; i++ ) {
        let sum=0;
        // const detlist = itemlist[i];
        const tokenmap = tokenmaps[i];
        if( tokenmap === null ) continue;
        for( var j=0; j<tokenmap.length; j++ ) {
          sum += tokenmap.datas[j];
        }
        let v = new MarkovLists(Float32Array);
        if( sum != 0 ) {
          for( var j=0; j<tokenmap.length; j++ ) {
            let x = tokenmap.datas[j]/sum;
            if( x == 0 ) x = 0.01;
            if( x > 1 ) {
              console.log(x + ">1, sum=" + sum + ", original = " + tokenmap.datas[j]);
              console.log(tokenmap.datas);
              throw "does not computer";
            }
            v.set( Number(tokenmap.items[j]), x );
          }
        }
        tokenmaps[i] = v;
      }
      this.loadN[key][4] = true;
    }
    this.normalized = true;
    await this.heartbeat();
  }

  async save_all(audible=false)
  {
    if( !this.normalized ) return;
    if( audible ) console.log("Markov save_all");
    for( var i=0; i<this.maxkey; i++ ) {
      await this.save(i);
    }
  }
  async heartbeat(audible=false)
  {
    if( !this.normalized ) return;
    if( audible ) console.log("Markov heartbeat");
    await this.save_all();
    await this.items.heartbeat(audible); // save all current changes
    this.releaseMemory(audible);
    this.changedRecords=0;
  }
  async softheartbeat(audible=false)
  {
    if( this.changedRecords < this.items.cacheLimit ) return;
    if( audible )
      console.log("Changed: " + this.changedRecords);
    await this.heartbeat(audible);
    this.changedRecords=0;
  }
  releaseMemory(audible=false)
  {
    if( !this.normalized ) return;
    if( audible )
      console.log("chain releaseMem");
    this.items.releaseMemory();
    this.loadN = new Array(this.maxkey).fill(false);
  }
  async save( inkey )
  {
    if( !this.normalized ) {
      console.log("cannot save before normalize");
      return;
    }
    let key = inkey;
    while( key >= this.maxkey ) key -= this.maxkey;

    const x = this.loadN[key];
    if( x === false || x[4] === false ) return;
    var l1 = x[0];
    var l2 = x[1];
    var n1 = x[2];
    var n2 = x[3];

    let newtitle = this.app.util.printJSON(l1);
    if( newtitle != n1.title ) {
      n1 = x[2] = await this.items.Node(newtitle);
    }
    await n1.save();
    let buf = '';
    for( var i=0; i<l2.length; i++ ) {
      if( buf != '' ) buf += ';';
      buf += (l2[i]==null)?'null':l2[i].serialize();
    }
    if( n2.title != buf ) {
      n2 = x[3] = await this.items.Node(buf);
    }
    await n2.save();
    const n = x[5];
    for( var v=0; v<n.params.length; v++ ) {
      let k = await this.items.resolveNode(n.params[v].key);
      if( k == 'l' ) {
        await n.params[v].setValue(n1);
      } else if( k == 'n' ) {
        await n.params[v].setValue(n2);
      }
    }
    n.changedParams = true;

    x[4] = false;
    await n.save();
  }

  compress( key )
  {
    const x = this.loadN[key];
    const l1 = x[0];
    const l2 = x[1];

    var i,j,k;
    let tgtlen = Infinity;
    let tgtmax = -Infinity;

    for( i=0; i<l1.length; i++ ) {
      if( typeof l1[i] != 'array' && typeof l1[i] != 'object' ) {
        console.log(key,i,l1);
        throw "not an array";
      }
      if( l2[i] == null ) continue;

      let len = l1[i].length;
      tgtlen = Math.min(tgtlen,len);
      tgtmax = Math.max(tgtmax,len);
      //let count = tm.length;
    }

    if( tgtlen == tgtmax )
      tgtlen--;
    if( tgtlen < 1 ) tgtlen = 1;

    let compressed=false;
    for( i=0; i<l1.length; i++ ) {
      while( l1[i].length > tgtlen ) {
        l1[i].shift();
        compressed=true;
      }
    }
    x[4] = true;
    if( compressed ) {
      this.dedupe(key);
    }
  }

  dedupe( key )
  {
    const x = this.loadN[key];
    const lists = x[0];
    const maps = x[1];
    
    var i, j, k, v;

    for( i=0; i<lists.length; i++ ) {
      const gl= lists[i];
      const gm= maps[i];
      for( j=i+1; j<lists.length; j++ ) {
        const hl = lists[j];
        const hm = maps[j];

        if( compareFunction(gl,hl,true) == 0 ) {
          if( gm != null && hm != null ) {
            for( k=0; k<hm.length; k++ ) {
              let q = hm.items[k];
              let z = hm.datas[k];

              if( typeof q == 'string' ) {
                console.log("String while deduping",q);
              }
              v = (gm.has(q) ? gm.get(q) : 0) + z;
              gm.set(q,v);
            }
          }
          lists.splice(j,1);
          maps.splice(j,1);
          --j;
        }
      }
    }
    x[4] = true;
  }


  async setAlpha( token, alphakey, value )
  {
    const word = central.xdict[token];
    const node = await this.app.words.getword(word, true);

    const parms = await node.getParams('al');
    let dbg=false;
/*    if( word == "the" ) {
      console.log("the+alpha " + alphakey + "=" + value);
      dbg=true;
    } */
    if( parms.length == 0 ) {
      const param = await node.addParamV('al', alphakey + ":" + value);
      await param.save();
      if(dbg)console.log("part1");
    } else {
      const param = parms[0];
      const node2 = await param.getValue();
      const lst = String(node2.title).split(",");
      let changed=false;
      for( var i=0; i<lst.length; i++ ) {
        const details = lst[i].split(":");
        if( details[0] == alphakey ) {
          lst[i] = alphakey + ":" + value;
          if(dbg)console.log("part2");
          changed=true;
          break;
        }
      }
      if( !changed ) {
        if(dbg)console.log("part3");
        lst.push(alphakey + ":" + value);
      }
        
      await param.setValueV(lst.join(","));
      (await param.getValue()).save();
      await param.save();
    }
  }

  async getAlphasWord( word )
  {
    const token = central.getToken(word);
    return await this.getAlphas(token);
  }
  async getAlphas( token )
  {
    const word = central.xdict[token];
    const node = await this.app.words.getword(word, true);
    const alphas = {};

    if( node ) {
      const parms = await node.getParams('al');
      if( parms.length > 0 ) {
        const param = parms[0];
        //console.log( await param.toString() );
        const node2 = await param.getValue();
        const lst = String(node2.title).split(",");
        for( var i=0; i<lst.length; i++ ) {
          const details = lst[i].split(":");
          alphas[Number(details[0])] = Number(details[1]);
        }
      }
    }
    return alphas;
  }
  async addBefore( token, addtoken )
  {
    const token_word = central.xdict[token];
    const token_node = await myapp.words.getword(token_word, true);
    if( !token_node ) {
      console.warn("Cannot find wordnode for " + token_word);
      throw "nonexiste";
    }
    var token_lc = typeof token_word == 'string' ? token_word.toLowerCase() : String(token_word);
    var title_lc = typeof token_node.title == 'string' ? token_node.title.toLowerCase() : String(token_node.title);
    if( title_lc != token_lc ) {
      console.log(token_node.title + "!= " + token_word);
      throw "wrong node for adding token " + token_node.title;
    }

    const parms = await token_node.getParams('be4');
    if( parms.length <= 0 ) {
      const tk_param_node = await token_node.addParamV('be4',String(addtoken));
      await tk_param_node.save();
    } else {
      const tk_param = parms[0];
      const tk_param_node = await tk_param.getValue();
      const strs = String(tk_param_node.title).split(",");
      if( strs.indexOf( String(addtoken) ) != -1 ) return true;

      const newtitle = tk_param_node.title + "," + addtoken;

      await tk_param.setValueV(newtitle);
      (await tk_param.getValue()).save();
      await tk_param.save();
    }
    await token_node.save();

    return true;
  }
  async getBefores( token )
  {
    const token_word = central.xdict[token];
    const token_node = await myapp.words.getword(token_word, true);
    if( !token_node ) return [];
    const parms = await token_node.getParams('be4');
    if( parms.length <= 0 ) return [];
    const tk_param = parms[0];
    const tk_param_node = await tk_param.getValue();
    let strs = String(tk_param_node.title).split(",");
    let nums = strs.map( (x) => Number(x) );

    return nums;
  }

  async chain( list, token )
  {
    if( list.length <= 0 ) {
      console.log("chain: list too short (0) " + token);
      myapp.util.throwStack("nochain");
      throw "missing chains";
    }

    const listcpy = list.slice();
    const keytoken = Number( list[list.length-1] );

    token = Number(token);

    await this.addBefore( token, keytoken );

    const key = hashEndFunc(list, this.maxkey);
    var itemlist, tokenmaps, itemlistn, tokenmapn;
    var found;

    if( typeof token != 'number' ) {
      console.log("Invalid token");
      myapp.util.throwStack("token");
      throw "huhmmm";
    }

    const x = this.loadN[key];
    itemlist = x[0];
    tokenmaps = x[1];

    var count, g;
    let loops=0;

    // count and compress overlapping keys to <16
    /*
    found = false;
    const ini_max = itemlist.length;
    do {
      if( itemlist.length < 12 ) break;
      found = true;
      this.compress(key);
      loops++;
    } while( loops < 50 );
    if( found ) {
      //console.log("compressed " + key + " from " + ini_max + " to " + itemlist.length);
    }
    */

    found = false;
    for( g=0; g<itemlist.length; g++ ) {
      if( compareFunction(list, itemlist[g]) == 0 ) {
        found=true;
        if( tokenmaps[g] === null ) {
    /*    } else if( tokenmaps[g].length > 48 ) {
          console.log("Removed chains ending in " + keytoken + ": " + central.xdict[keytoken] + ": " + tokenmaps[g].length + " nexts");
          tokenmaps[g] = null; */
          console.log("missing" + g);
        } else if( !tokenmaps[g].has(token) ) {
          if( tokenmaps[g].isBroken() ) {
            console.log("broken map found in chain-2");
            console.log(token, g, list, itemlist.length);
            throw "hm";
          }
          tokenmaps[g].set(token, 1);
          if( tokenmaps[g].isBroken() ) {
            console.log("broken map found in chain-3");
            console.log(list,g);
            throw "hmrph";
          }
        } else {
          if( tokenmaps[g].isBroken() ) {
            console.log("broken map found in chain-1");
            console.log(list);
            throw "hm";
          }
          //console.log("inc token " + token + ":" + tokenmaps[g].get(token));
          tokenmaps[g].set(token, tokenmaps[g].get(token)+1);
          if( tokenmaps[g].isBroken() ) {
            console.log("broken map found in chain-4");
            console.log(list,g);
            throw "hmrph";
          }
        }
        break;
      }
    }

    if( !found ) {
      var v;
      if( this.pool )
        v = this.pool.get();
      else
        v = new MarkovLists(Uint32Array);
      v.set(token, 1);
      if( v.isBroken() ) {
        console.log("broken map from start");
        console.log(list,tokenmaps.length);
        throw "ack";
      }
      tokenmaps.push(v);
      itemlist.push(listcpy);
    }
    if( !x[4] )
      this.changedRecords++;
    x[4] = true; // modified.
  }
  async search( inlist, debug=false )
  {
    let key = hashEndFunc(inlist, this.maxkey);
    var itemlist, tokenmaps, itemlistn, tokenmapn;

    if( this.loadN[key] === false )
      await this.load(key);

    const x = this.loadN[key];
    itemlist = x[0];
    tokenmaps = x[1];

    let result = {};
    for( var i=inlist.length-1; i>=0; i-- ) {
      const list = inlist.slice(i);

      for( var j=0; j<itemlist.length; j++ ) {
        if( tokenmaps[j] == null ) continue;
        if( compareFunction(itemlist[j], list, true) == 0 ) {
          for( var k=0; k<tokenmaps[j].length; k++ ) {
            const key2 = Number(tokenmaps[j].items[k]);
            const b = Number(tokenmaps[j].datas[k]);
            if( key2 in result ) result[key2] += b;
            else result[key2] = b;
          }
        } else if( debug ) {
          console.log("no match for " + j + ": ", itemlist[j], list);
        }
      }
    }
    /*
    let sum=0;
    for( var k in result ) {
      sum += result[k];
    }
    for( var k in result ) {
      result[k] = result[k]/sum;
    }
    */
    return result;
  }
}

export class MarkovChainMap {
	constructor()
	{
    this.maxkey = 8000;
    this.items = new Array(16000);
    this.loaded = false;
  }

  chain( list, token )
  {
    let listcpy = list.slice();
    let keytoken = list[list.length-1];
    let key = hashEndFunc(list, this.maxkey);
    
    if( typeof this.items[k2] == 'undefined' ) {
      this.items[k2] = [listcpy];
      let v = {};
      v[token] = 1;
      this.items[k2+1] = [v];
      return;
    }
    let itemlist = this.items[k2];
    let tokenmaps = this.items[k2+1];
    let found=false;

    for( var g=0; g<itemlist.length; g++ ) {
      if( list.length == itemlist[g].length &&
        compareFunction(list, itemlist[g], true) == 0 ) {
        if( !(token in tokenmaps[g]) ) tokenmaps[g][token]=1;
        else tokenmaps[g][token]++;
        found=true;
        break;
      }
    }
    if( !found ) {
      let v = {};
      v[token] = 1;
      
      tokenmaps.push(v);
      itemlist.push(listcpy);
    }
  }
  search( inlist, debug=true )
  {
    // cleanup input:
    for( var k=0; k<inlist.length; k++ ) {
      if( typeof inlist[k] != 'number' ) {
        inlist[k] = Number(inlist[k]);
      }
    }

    let key = hashEndFunc(inlist, this.maxkey);
    let k2 = 2*key;
    if( typeof this.items[k2] == 'undefined' ) return undefined;
    let itemlist = this.items[k2];
    let tokenmap = this.items[k2+1];
    let result = {};
    for( var i=inlist.length-1; i>=0; i-- ) {
      const list = inlist.slice(i);

      for( var j=0; j<itemlist.length; j++ ) {
        if( compareFunction(itemlist[j], list, true) == 0 ) {
          if( debug ) { console.log("match list " + j + ": ", itemlist[j], list, Object.keys(tokenmap[j])); }
          for( var ix=0; ix<tokenmap[j].length; ix++ ) {
            const key2 = tokenmap[j].items[ix];
            const val2 = tokenmap[j].datas[ix];
            if( !(key2 in result) ) result[key2]=0;
            result[key2] += val2*list.length;
          }
        } else if( debug ) {
          console.log("no match for " + j + ": ", itemlist[j], list);
        }
      }
    }
    return result;
  }
}

export class HashMap {
	constructor(useEnd=true, maxKey=false)
	{
    this.hash = useEnd?hashEndFunc:hashFunction;
    this.comp = useEnd?compEndFunc:compareFunction;

		if( maxKey === false ) {
      // this arrangement doesn't reserve all 10k lists
      this.maxkey = 10000;
			this.items = {};
      this.aux = {};
      this.xtype = 0;
		} else if( maxKey === true ) {
      // here we reserve just 1000 entries,
      // hoping for high variability
			this.maxkey = 1000;
			this.items = new Array(this.maxkey);
      this.aux = new Array(this.maxkey);
      this.xtype = 1;
		} else {
      // assign your own precalculated maximum
			this.maxkey = maxKey;
      if( this.maxkey < 1000 ) {
        this.items = {};
        this.aux = {};
        this.xtype = 0;
      } else {
  			this.items = new Array(this.maxkey);
        this.aux = new Array(this.maxkey);
        this.xtype = 1;
      }
		}
    console.log("maxkey: " + this.maxkey + ", " + typeof this.items);
	}
  keys()
  {
    let k = new Set();
    if( this.xtype == 0 ) {
      for( const h in this.items ) {
        const hoi = this.items[h];
        for( var n=0; n<hoi.length; n++ ) {
          k.add(hoi[n]);
        }
      }
    } else {
      for( var h=0; h<this.items.length; h++ ) {
        const hoi = this.items[h];
        if( typeof u == 'undefined' ) continue;
        for( var n=0; n<hoi.length; n++ ) {
          k.add(hoi[n]);
        }
      }
    }
    console.log("keys: size: " + k.size);
    return Array.from( k );
  }
  keyvals()
  {
    let k = [];
    if( this.xtype == 0 ) {
      for( const h in this.items ) {
        const hoi = this.items[h];
        for( var n=0; n<hoi.length; n++ ) {
          k.push( hoi[n] );
          k.push( this.aux[h][n] );
        }
      }
    } else {
      for( var h=0; h<this.items.length; h++ ) {
        const hoi = this.items[h];
        if( typeof hoi == 'undefined' ) continue;
        for( var n=0; n<hoi.length; n++ ) {
          k.push( hoi[n] );
          k.push( this.aux[h][n] );
        }
      }
    }
    return k;
  }
	set( key, obj, allkeys=true, debug=false )
	{
    for( var c=0; c<key.length; c++ ) {
      let skey = key.slice(c, key.length-c);
		const h = this.hash(skey, this.maxkey);
		if( !(h in this.items) ) {
      this.items[h] = [];
      this.aux[h] = [];
      if( debug ) console.log("set-add-new " + h);
    }
		const lst = this.items[h];
      let found=false;
		for( var i=0; i<lst.length; i++ ) {
			if( compareFunction(lst[i], skey) == 0 ) {
        this.aux[h][i] = obj;
        if( debug ) {
          console.log("set-renew h=",h,"skey=",skey,"obj=",obj);
        }
        found=true;
        break;
      }
    }
    if( debug ) {
          console.log("set-renew h=",h,"skey=",skey,"obj=",obj);
    }
    if( !found ) {
      lst.push(skey);
      this.aux[h].push(obj);
    }
      if( !allkeys ) break;
    }
	}
  getExact( key, debug=false )
  {
		const h = hashFunction(key, this.maxkey);
		if( !(h in this.items) || (typeof this.items[h] == 'undefined') )
      return undefined;

		const lst = this.items[h];
    if( debug ) console.log("eget items[" + h + "].length=" + lst.length);
    for( var i=0; i<lst.length; i++ ) {
			if( compareFunction(lst[i], key) == 0 ) {
        if( debug ) {
          console.log("eget ",h,lst[i],key,this.aux[h][i]);
        }
        return this.aux[h][i];
      }
		}
    if( debug ) console.log("!eget ",h,key);
		return undefined;
	}
	get( key, debug=false )
	{
		const h = this.hash(key, this.maxkey);
		if( !(h in this.items) || (typeof this.items[h] == 'undefined') ) return undefined;

		const lst = this.items[h];
    let results = [];
    if( debug ) console.log("items[" + h + "].length=" + lst.length);
    for( var i=0; i<lst.length; i++ ) {
			if( this.comp(lst[i], key) == 0 ) {
        if( debug ) {
          console.log("get ",h,lst[i],key,this.aux[h][i]);
        }
        results.push(this.aux[h][i]);
      }
		}
    if( debug ) console.log("!get ",h,key);
		return results;
	}
  hasExact( key )
  {
		const h = hashFunction(key, this.maxkey);
		if( !(h in this.items) ) return false;

		const lst = this.items[h];
    for( var i=0; i<lst.length; i++ ) {
			if( compareFunction(lst[i], key) ) {
				return true;
      }
		}
		return false;
  }
  has( key )
  {
		const h = this.hash(key, this.maxkey);
		if( !(h in this.items) ) return false;

		const lst = this.items[h];
    for( var i=0; i<lst.length; i++ ) {
			if( this.comp(lst[i], key) ) {
				return true;
      }
		}
		return false;
  }
	del( key )
	{
		const h = hashFunction(key, this.maxkey);
		if( !(h in this.items) ) return false;

		const lst = this.items[h];
		for( var i=0; i<lst.length; i++ ) {
			if( compareFunction(lst[i], key) ) {
				lst.splice(i,1);
        this.aux[h].splice(i,1);
        return true;
			}
		}
    return false;
	}
}

// SortedList2 holds number-to-object mappings
export class SortedList2 {
  constructor(pool=null, ia=Uint32Array, ib=Uint16Array) {
    this.len = 8;
    this.length = 0;
    this.pool = pool;
    this.numbers = ia;
    this.floats = ib;
    this.itembuf = new ArrayBuffer(this.len*4);
    this.items = new this.numbers(this.itembuf);
    this.datas = [];
  }

  isBroken() {
    for( var i=0; i<this.length; i++ ) {
      if( typeof this.items[i] == 'undefined' ) {
        return true;
      }
    }
    return false;
  }

  deserialize( buf ) {
    let [length,t1,t2] = buf.split("|");
    this.length = Number(length);

    var b1,b2;

    b1 = Buffer.from(t1, 'base64');
    this.items = new this.numbers(b1.buffer, b1.byteOffset, b1.length / this.numbers.BYTES_PER_ELEMENT);
    this.itembuf = this.items.buffer;

    this.datas = myapp.util.parseJSON( t2 );
    this.len = this.length;

    if( this.isBroken() ) {
      console.log("broken");
      console.log("ds from: ", this.len, this.length, this.items, this.datas, t1.length, t2.length);
      console.log(buf);
      myapp.util.throwStack("Deserializing");
      throw "deser hm";
    }
  }

  serialize() {
    //const txt1 = Buffer.from( this.itembuf ).toString('base64');
    //const txt2 = Buffer.from( this.databuf ).toString('base64');
    if( this.isBroken() ) {
      console.log("broken serialize");
      throw "no";
    }
    const b8 = Buffer.from( this.items.buffer,
      this.items.byteOffset, this.items.byteLength );
    const txt1 = b8.toString('base64');
    const b9 = Buffer.from( this.datas.buffer,
      this.datas.byteOffset, this.datas.byteLength );
    const txt2 = b9.toString('base64');
    return this.length + "|" + txt1 + "|" + txt2;
  }

  reset() {
    if( this.pool ) {
      this.items = this.pool.get();
    } else {
      this.len = this.length;
      this.itembuf = new ArrayBuffer(this.len*4);
      this.items = new this.numbers(this.itembuf);
      this.datas = new Array(this.len);
    }
    this.length = 0;
  }

  clear(start,end) {
    var i;
    for( i=start; i<=end; i++ ) {
      this.items[i] = 0;
      this.datas[i] = 0;
    }
    this.length = 0;
  }

  keys() {
    var i;
    let keys = [];
    for( i=0; i<this.length; i++ ) {
      keys.push(this.items[i]);
    }
    return keys;
  }

  expand() {
    this.len *= 4;
    
    var buf = new ArrayBuffer(this.len*4);
    var olditems = this.items;
    this.items = new this.numbers(buf);
    this.itembuf = buf;

    var olddatas = this.datas;
    this.datas = new Array(this.len);

    this.items.set(olditems.subarray(0,this.length),0);
    for( var i=0; i<olddatas.length; i++ )
      this.datas[i] = olddatas[i];
  }

  set(value, obj) {
    const p = this.findIndex(value);
    if( p == -1 ) {
      return this.add(value,obj);
    }
    while( p >= this.len )
      this.expand();
    if( p+1 > this.length )
      this.length = p+1;

    this.items[p] = value;
    this.datas[p] = obj;

    if( this.isBroken() ) {
      console.log("broken now: ", this.len, this.length);
      console.log(p,value,obj,this.items[p],this.datas[p]);
      myapp.util.throwStack();
      throw('ok');
    }
  }

  get(value) {
    let p = this.findIndex(value);
    if( p == -1 || this.items[p] != value ) return null;
    return this.datas[p];
  }

  shiftRight( start, count ) {
    while( this.length + count >= this.len )
      this.expand();

    this.items.set( this.items.subarray(start, this.length), start+count );
    let empty = new Array(count).fill(0);
    this.datas.splice(start, 0, ...empty);
    this.length += count;
  }

  shiftLeftOf( start, count ) {
    this.items.set(this.items.subarray(start+count, this.length), start);
    this.datas.splice(start, count);
    this.length -= count;
  }

  add(item, data) {
    const index = this.findInsertIndex(item);
    if( index < this.length )
      this.shiftRight(index, 1);

    while( this.len <= index+1 )
      this.expand();
    this.items[index] = item;
    this.datas[index] = data;

    if( data == 0 ) {
      console.log("data is zero");
      throw "0 no";
    }

    if( index >= this.length ) this.length=index+1;
    if( this.isBroken() ) {
      console.log("broken after add");
      throw "Argh";
    }

    return index;
  }

  addAll(items, datas) {
    var i;
    for( i=0; i<items.length; i++ ) {
      this.add(items[i], datas[i]);
    }
  }

  removeAt(index, count=1) {
    if (index >= 0 && index < this.length) {
      var a,b;

      a = this.items.subarray(index, index+count);
      b = this.datas.slice(index, index+count);
      this.shiftLeftOf(index, count);
      return [a, b];
    }
    return null;
  }

  remove(item) {
    let index = this.findIndex(item);
    return index !== -1 ? this.removeAt(index) : null;
  }

  has(item) {
  	let p = this.findIndex(item);
  	if( p == -1 ) return false;
    if( this.items[p] == item ) return true;
    return false;
  }
    
    findIndex(value,logging=false) {
        let left = 0;
        let right = this.length-1;
        while (left <= right) {
            const mid = Math.floor((left + right) / 2);
            const midValue = this.items[mid];
            if( logging ) console.log("m",mid,midValue,left,right,value);
            if (midValue === value) {
              if( left == mid )
                return left;
              if( right != mid )
                right = mid;
            } else if (midValue < value) {
              left = mid + 1;
            } else {
              right = mid - 1;
            }
        }
        return left;
    }

    findInsertIndex(value) {
        let left = 0;
        let right = this.length;
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
    findPreIndex(value, logging=false) {
	    const idx = findIndex(value, logging);
	    while( idx-1>=0 && this.items[idx-1] == value )
		    idx--;
      if( this.items[idx] == value ) idx--;
      if( logging ) console.log("pre:"+idx);
	    return idx;
    }
    findFirstIndex(value, logging=false) {
	    let idx = this.findIndex(value,logging);
	    while( idx-1>=0 && this.items[idx-1] == value )
		    idx--;
      if( logging ) console.log("first:"+idx);
	    return idx;
    }
    findLastIndex(value, logging=false) {
	    const idx = this.findIndex(value, logging);
	    while( idx+1 < this.length && this.items[idx+1] == value )
        idx++;
      if( logging ) console.log("last:"+idx);
	    return idx;
    }

    findPostIndex(value, logging=false) {
	    const idx = this.findIndex(value, logging);
	    if( idx >= this.length )
		    return this.length;
	    while( idx < this.length && this.items[idx] == value ) idx++;
      if( logging ) console.log("post:"+idx);
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
      return [ index, this.length ];
    }
    findLessThan(value, inclusive = false) {
    	var index;
    	if( inclusive ) {
    		index = this.findPostIndex(value);
    	} else {
    		index = this.findPreIndex(value)+1;
    	}
      return [ 0, index ];
    }
    findRange(min, max, inclusiveMin = true, inclusiveMax = true) {
      if( typeof max == 'undefined' ) {
        if( typeof min == 'undefined' ) {
          console.log("findAll");
          return this.findAll();
        }
        if( typeof min == 'array' ) {
          max = min[1];
          min = min[0];
        } else {
          max = min;
        }
      }
        console.log("m:" + min + ",x:" + max);
      if( min > max ) return [];
      let start = inclusiveMin ?
        this.findFirstIndex(min) :
        this.findPostIndex(min);
      let end = inclusiveMax ?
        this.findLastIndex(max) :
        this.findPreIndex(max);
      if( end > 0 ) end--;
      if( min == -Infinity ) {
        console.log(start,end);
      }
      return [start,end];
    }
    
    keysFromRange(range)
    {
      const aidx = range[0], eidx = range[1];
      if( aidx == -1 ) return this.items.subarray(0,this.length);
      return this.items.subarray(aidx,eidx+1);
    }

    valuesFromRange(range)
    {
      const aidx = range[0], eidx = range[1]-1;
      return this.datas.slice(aidx, eidx+1);
    }

    fromRange(range) // inclusive btw.
    {
      const aidx = range[0], eidx = range[1];
      const A = [], B = [];
      const result = [A,B];
      if( aidx == -1 ) return result;
      for( let i = aidx; i < eidx; i-- ) {
        A.push(this.items[i]);
        B.push(this.datas[i]);
      }
      return result;
    }

    size() {
        return this.length;
    }

    findAll() {
        return [ 0, this.length-1 ];
    }
    findAllSpec(value) {
    	return this.findRange(value,value,true,true);
    }
}
export class MarkovLists {
  constructor(ib=Uint32Array) {
    this.len = 8;
    this.length = 0;
    this.pool = null;
    this.numbers = Uint32Array;
    this.floats = ib;
    this.itembuf = new ArrayBuffer(this.len*4);
    this.items = new this.numbers(this.itembuf);
    //this.items.fill(0);
    this.databuf = new ArrayBuffer(this.len*4);
    this.datas = new this.floats(this.databuf);
    //this.datas.fill(0);
  }

  isBroken() {
    for( var i=0; i<this.length; i++ ) {
      if( typeof this.items[i] == 'undefined' || this.datas[i] == 0 ) {
        return true;
      }
    }
    return false;
  }

  deserialize( buf ) {
    let [length,t1,t2] = buf.split("|");
    this.length = Number(length);

    var b1,b2;
    b1 = Buffer.from(t1, 'base64');
    this.items = new this.numbers(b1.buffer, b1.byteOffset, b1.length / this.numbers.BYTES_PER_ELEMENT);

    b2 = Buffer.from(t2, 'base64');
    this.datas = new this.floats(b2.buffer, b2.byteOffset, b2.length / this.floats.BYTES_PER_ELEMENT);

    this.itembuf = this.items.buffer;
    this.databuf = this.datas.buffer;

    this.len = this.length;

    if( this.isBroken() ) {
      console.log("broken from load");
      console.log("ds from: ", this.len, this.length, this.items, this.datas, t1.length, t2.length);
      console.log(buf);
      myapp.util.throwStack("Deserializing");
      throw "deser hm";
    }
  }

  serialize() {
    //const txt1 = Buffer.from( this.itembuf ).toString('base64');
    //const txt2 = Buffer.from( this.databuf ).toString('base64');
    if( this.isBroken() ) {
      console.log("broken serialize");
      throw "no";
    }
    const b8 = Buffer.from( this.items.buffer,
      this.items.byteOffset, this.items.byteLength );
    const txt1 = b8.toString('base64');
    const b9 = Buffer.from( this.datas.buffer,
      this.datas.byteOffset, this.datas.byteLength );
    const txt2 = b9.toString('base64');
//    const txt1 = Buffer.from( this.items.buffer, this.items.byteOffset, this.items.byteLength ).toString('base64');
 //   const txt2 = Buffer.from( this.datas.buffer, this.datas.byteOffset, this.datas.byteLength ).toString('base64');
    return this.length + "|" + txt1 + "|" + txt2;
  }

  reset() {
    if( this.pool ) {
      this.items = this.pool.get();
    } else {
      this.len = this.length;
      this.itembuf = new ArrayBuffer(this.len*4);
      this.items = new this.numbers(this.itembuf);
      //this.items.fill(0);

      this.databuf = new ArrayBuffer(this.len*4);
      this.datas = new this.floats(this.databuf);
      //this.datas.fill(0);
    }
    this.length = 0;
  }

  clear(start,end) {
    var i;
    for( i=start; i<=end; i++ ) {
      this.items[i] = 0;
      this.datas[i] = 0;
    }
    this.length = 0;
  }

  keys() {
    var i;
    let keys = [];
    for( i=0; i<this.length; i++ ) {
      keys.push(this.items[i]);
    }
    return keys;
  }

  expand() {
    this.len *= 4;
    
    var buf = new ArrayBuffer(this.len*4);
    var olditems = this.items;
    this.items = new this.numbers(buf);
    this.itembuf = buf;

    var olddatas = this.datas;
    var buf2 = new ArrayBuffer(this.len*4);
    this.datas = new this.floats(buf2);
    this.databuf = buf2;

    //this.items.fill(0);
    //this.datas.fill(0);

    this.items.set(olditems.subarray(0,this.length),0);
    this.datas.set(olddatas.subarray(0,this.length),0);
  }

  set(value, obj) {
    const p = this.findIndex(value);
    if( p == -1 ) {
      return this.add(value,obj);
    }
    while( p >= this.len )
      this.expand();
    if( p+1 > this.length ) {
      this.length = p+1;
      this.items[p] = value;
      this.datas[p] = obj;
    } else if( this.items[p] == value ) {
      this.datas[p] = obj;
    } else {
      this.shiftRight(p,1);
      this.items[p] = value;
      this.datas[p] = obj;
    }

    if( this.isBroken() ) {
      console.log("broken now: ", this.len, this.length);
      console.log(p,value,obj,this.items[p],this.datas[p]);
      myapp.util.throwStack();
      throw('ok');
    }
  }

  get(value) {
    let p = this.findIndex(value);
    if( p == -1 || this.items[p] != value ) return null;
    return this.datas[p];
  }

  shiftRight( start, count ) {
    while( this.length + count >= this.len )
      this.expand();

    this.items.set( this.items.subarray(start, this.length), start+count );
    this.datas.set( this.datas.subarray(start, this.length), start+count );
    this.length += count;
  }

  shiftLeftOf( start, count ) {
    this.items.set(this.items.subarray(start+count, this.length), start);
    this.datas.set(this.datas.subarray(start+count, this.length), start);
    this.length -= count;
  }

  add(item, data) {
    const index = this.findInsertIndex(item);
    if( index < this.length )
      this.shiftRight(index, 1);

    while( this.len <= index+1 )
      this.expand();
    this.items[index] = item;
    this.datas[index] = data;

    if( data == 0 ) {
      console.log("data is zero");
      throw "0 no";
    }

    if( index >= this.length ) this.length=index+1;
    if( this.isBroken() ) {
      console.log("broken after add");
      throw "Argh";
    }

    return index;
  }

  addAll(items, datas) {
    var i;
    for( i=0; i<items.length; i++ ) {
      this.add(items[i], datas[i]);
    }
  }

  removeAt(index, count=1) {
    if (index >= 0 && index < this.length) {
      var a,b;

      a = this.items.subarray(index, index+count);
      b = this.datas.subarray(index, index+count);
      this.shiftLeftOf(index, count);
      return [a, b];
    }
    return null;
  }

  remove(item) {
    let index = this.findIndex(item);
    return index !== -1 ? this.removeAt(index) : null;
  }

  has(item) {
  	let p = this.findIndex(item);
  	if( p == -1 ) return false;
    if( this.items[p] == item ) return true;
    return false;
  }
    
    findIndex(value,logging=false) {
        let left = 0;
        let right = this.length-1;
        while (left <= right) {
            const mid = Math.floor((left + right) / 2);
            const midValue = this.items[mid];
            if( logging ) console.log("m",mid,midValue,left,right,value);
            if (midValue === value) {
              if( left == mid )
                return left;
              if( right != mid )
                right = mid;
            } else if (midValue < value) {
              left = mid + 1;
            } else {
              right = mid - 1;
            }
        }
        return left;
    }

    findInsertIndex(value) {
        let left = 0;
        let right = this.length;
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
    findPreIndex(value, logging=false) {
	    const idx = findIndex(value, logging);
	    while( idx-1>=0 && this.items[idx-1] == value )
		    idx--;
      if( this.items[idx] == value ) idx--;
      if( logging ) console.log("pre:"+idx);
	    return idx;
    }
    findFirstIndex(value, logging=false) {
	    let idx = this.findIndex(value,logging);
	    while( idx-1>=0 && this.items[idx-1] == value )
		    idx--;
      if( logging ) console.log("first:"+idx);
	    return idx;
    }
    findLastIndex(value, logging=false) {
	    const idx = this.findIndex(value, logging);
	    while( idx+1 < this.length && this.items[idx+1] == value )
        idx++;
      if( logging ) console.log("last:"+idx);
	    return idx;
    }

    findPostIndex(value, logging=false) {
	    const idx = this.findIndex(value, logging);
	    if( idx >= this.length )
		    return this.length;
	    while( idx < this.length && this.items[idx] == value ) idx++;
      if( logging ) console.log("post:"+idx);
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
      return [ index, this.length ];
    }
    findLessThan(value, inclusive = false) {
    	var index;
    	if( inclusive ) {
    		index = this.findPostIndex(value);
    	} else {
    		index = this.findPreIndex(value)+1;
    	}
      return [ 0, index ];
    }
    findRange(min, max, inclusiveMin = true, inclusiveMax = true) {
      if( typeof max == 'undefined' ) {
        if( typeof min == 'undefined' ) {
          console.log("findAll");
          return this.findAll();
        }
        if( typeof min == 'array' ) {
          max = min[1];
          min = min[0];
        } else {
          max = min;
        }
      }
        console.log("m:" + min + ",x:" + max);
      if( min > max ) return [];
      let start = inclusiveMin ?
        this.findFirstIndex(min) :
        this.findPostIndex(min);
      let end = inclusiveMax ?
        this.findLastIndex(max) :
        this.findPreIndex(max);
      if( end > 0 ) end--;
      if( min == -Infinity ) {
        console.log(start,end);
      }
      return [start,end];
    }
    
    keysFromRange(range)
    {
      const aidx = range[0], eidx = range[1];
      if( aidx == -1 ) return this.items.subarray(0,this.length);
      return this.items.subarray(aidx,eidx+1);
    }

    valuesFromRange(range)
    {
      const aidx = range[0], eidx = range[1]-1;
      return this.datas.subarray(aidx, eidx+1);
    }

    fromRange(range) // inclusive btw.
    {
      const aidx = range[0], eidx = range[1];
      const A = [], B = [];
      const result = [A,B];
      if( aidx == -1 ) return result;
      for( let i = aidx; i < eidx; i-- ) {
        A.push(this.items[i]);
        B.push(this.datas[i]);
      }
      return result;
    }

    size() {
        return this.length;
    }

    findAll() {
        return [ 0, this.length-1 ];
    }
    findAllSpec(value) {
    	return this.findRange(value,value,true,true);
    }
}









		
export class MinHeap {
    constructor(max, valname='val', idxname='pos')
    {
        if( typeof max == 'undefined' ) {
            this.maxsize = 32;
        } else {
            this.maxsize = max;
        }
        this.size = 0;
        this.heap = new Array(this.maxsize);
        this.vx = valname;
        this.ix = idxname;
    }

    print() {
        let i;
        let buf = "";
        var l,r;

        console.log("Printing MinHeap: Maxsize " + this.maxsize + ", Size " + this.size);

        for( i=0; i<this.size/2; i++ ) {
            buf = "Parent: " + this.heap[i][this.vx];
            l = this.left(i); r = this.right(i);
            if( l < this.size && this.heap[l][this.vx] != Infinity )
                buf += " Left: " + this.heap[l][this.vx];
            if( r < this.size && this.heap[r][this.vx] != Infinity )
                buf += " Right: " + this.heap[r][this.vx];
            console.log(buf);
        }
    }

    go(n) {
        let l,r;
        if( this.leaf(n) ) return;
        
        l = this.left(n);
        r = this.right(n);
        //console.log("go(" + n + ") (" + l + "," + r + ") " + this.size);
        if( l >= this.size ) {
            if( r >= this.size ) {
                return;
            }
            if( this.heap[n][this.vx] > this.heap[r][this.vx] ) {
                this.swap(n, r);
                this.go(r);
            }
        } else if( r >= this.size ) {
            if( this.heap[n][this.vx] > this.heap[l][this.vx] ) {
                this.swap(n, l);
                this.go(r);
            }
        } else if( this.heap[n][this.vx] > this.heap[l][this.vx] ||
            this.heap[n][this.vx] > this.heap[r][this.vx] ) {
            if( this.heap[l][this.vx] < this.heap[r][this.vx] ) {
                this.swap(n, l);
                this.go(l);
            } else {
                this.swap(n, r);
                this.go(r);
            }
        }
    }

    parent(index) { return parseInt((index-1)/2); }
    left(index) { return parseInt(2*index)+1; }
    right(index) { return parseInt(2*index)+2; }
    leaf(index) { return (2*index)+1>=this.size && index < this.size; }

    swap(a,b) {
        [this.heap[a], this.heap[b]] = [this.heap[b], this.heap[a]];        
        this.heap[a][this.ix] = a;
        this.heap[b][this.ix] = b;
    }

    removeIdx(n) {
        var l,r;
        if( this.leaf(n) ) {
            this.heap[n] = {}; this.heap[n][vx] = Infinity; this.heap[n][ix] = n;
            while( this.size > 0 && this.heap[ this.size-1 ][this.vx] == Infinity ) this.size--;
            return;
        }

        l = this.left(n);
        r = this.right(n);

        if( l >= this.size ) {
            this.heap[n] = this.heap[r];
            this.heap[n][this.ix] = n;
            this.removeIdx(r);
        } else if( r >= this.size ) {
            this.heap[n] = this.heap[l];
            this.heap[n][this.ix] = n;
            this.removeIdx(l);
        } else if( this.heap[l][this.vx] < this.heap[r][this.vx] ) {
            this.heap[n] = this.heap[l];
            this.heap[n][this.ix] = n;
            this.removeIdx(l);
        } else {
            this.heap[n] = this.heap[r];
            this.heap[n][this.ix] = n;
            this.removeIdx(r);
        }
    }

    remove(num) {
        let stack = [0];
        var i;

        while( stack.length > 0 ) {
            i = stack.shift();

            if( this.heap[i][this.vx] == num ) {
                this.removeIdx(i);
                return true;
            }
            stack.push( this.left(i) );
            stack.push( this.right(i) );
        }
        return false;
    }

    removeAll(num) {
        while( this.remove(num) ) continue;
    }

    push(obj)
    {
        if( this.size+1 >= this.maxsize ) {
            this.heap.concat( new Array(this.maxsize) );
            this.maxsize *= 2;
        }
        obj[this.ix] = this.size;
        this.heap[this.size] = obj;

        let i = this.size;
        let p = this.parent(i);
        while( this.heap[i][this.vx] < this.heap[p][this.vx] ) {
            this.swap(i, p);
            i = p;
            p = this.parent(i);
        }
        this.size++;
    }

    pop()
    {
        if( this.size == 0 ) return Infinity;
        let v = this.heap[0];
        this.size--;
        if( this.size == 0 ) {
            this.heap[0] = {}; this.heap[0][vx] = Infinity; this.heap[0][ix] = 0;
            return v;
        }
        this.heap[0] = this.heap[this.size];
        this.heap[this.size] = {}; this.heap[this.size][vx] = Infinity; this.heap[this.size][ix] = this.size;
        if( this.size != 1 )
            this.go(0);
        return v;
    }

    peek()
    {
        if( this.size == 0 ) return Infinity;
        let v = this.heap[0];
        return v;
    }
}

export class MaxHeap {

    constructor(max, valname='val', idxname='pos')
    {
        if( typeof max == 'undefined' ) {
            this.maxsize = 32;
        } else {
            this.maxsize = max;
        }
        this.size = 0;
        this.heap = new Array(this.maxsize);
        this.vx = valname;
        this.ix = idxname;
    }

    print() {
        let i;
        let buf = "";
        var l,r;

        console.log("Printing MaxHeap: Maxsize " + this.maxsize + ", Size " + this.size);

        for( i=0; i<this.size/2; i++ ) {
            buf = "Parent: " + this.heap[i][this.vx];
            l = this.left(i); r = this.right(i);
            if( l < this.size && this.heap[l][this.vx] != -Infinity )
                buf += " Left: " + this.heap[l][this.vx];
            if( r < this.size && this.heap[r][this.vx] != -Infinity )
                buf += " Right: " + this.heap[r][this.vx];
            console.log(buf);
        }
    }

    go(n) {
        let l,r;
        if( this.leaf(n) ) return;
        
        l = this.left(n);
        r = this.right(n);
        if( l >= this.size ) {
            if( r >= this.size ) {
                return;
            }
            if( this.heap[n][this.vx] < this.heap[r][this.vx] ) {
                this.swap(n, r);
                this.go(r);
            }
        } else if( r >= this.size ) {
            if( this.heap[n][this.vx] < this.heap[l][this.vx] ) {
                this.swap(n, l);
                this.go(l);
            }
        } else if( this.heap[n][this.vx] < this.heap[l][this.vx] ||
            this.heap[n][this.vx] < this.heap[r][this.vx] ) {
            if( this.heap[l][this.vx] > this.heap[r][this.vx] ) {
                this.swap(n, l);
                this.go(l);
            } else {
                this.swap(n, r);
                this.go(r);
            }  
        }
    }

    parent(index) { return parseInt((index-1)/2); }
    left(index) { return parseInt(2*index)+1; }
    right(index) { return parseInt(2*index)+2; }
    leaf(index) { return (2*index)+1>=this.size && index < this.size; }

    swap(a,b) {
        [this.heap[a], this.heap[b]] = [this.heap[b], this.heap[a]];        
        this.heap[a][this.ix] = a;
        this.heap[b][this.ix] = b;
    }

    removeIdx(n) {
        var l,r;
        if( this.leaf(n) ) {
            this.heap[n] = {}; this.heap[n][vx] = -Infinity; this.heap[n][ix] = n;
            while( this.size > 0 && this.heap[ this.size-1 ][this.vx] == -Infinity ) this.size--;
            return;
        }

        l = this.left(n);
        r = this.right(n);

        if( l >= this.size ) {
            this.heap[n] = this.heap[r];
            this.heap[n][this.ix] = n;
            this.removeIdx(r);
        } else if( r >= this.size ) {
            this.heap[n] = this.heap[l];
            this.heap[n][this.ix] = n;
            this.removeIdx(l);
        } else if( this.heap[l][this.vx] > this.heap[r][this.vx] ) {
            this.heap[n] = this.heap[l];
            this.heap[n][this.ix] = n;
            this.removeIdx(l);
        } else {
            this.heap[n] = this.heap[r];
            this.heap[n][this.ix] = n;
            this.removeIdx(r);
        }
    }

    remove(num) {
        let stack = [0];
        var i;

        while( stack.length > 0 ) {
            i = stack.shift();

            if( this.heap[i][this.vx] == num ) {
                this.removeIdx(i);
                return;
            }
            stack.push( this.left(i) );
            stack.push( this.right(i) );
        }
        //! not found
    }

    push(obj)
    {
        if( this.size+1 >= this.maxsize ) {
            this.heap.concat( new Array(this.maxsize) );
            this.maxsize *= 2;
        }
        obj[this.ix] = this.size;
        this.heap[this.size] = obj;

        let i = this.size;
        let p = this.parent(i);
        while( this.heap[i][this.vx] > this.heap[p][this.vx] ) {
            this.swap(i, p);
            i = p;
            p = this.parent(i);
        }
        this.size++;
    }

    pop()
    {
        if( this.size == 0 ) return 0;
        let v = this.heap[0];
        this.size--;
        if( this.size == 0 ) {
            this.heap[0] = {}; this.heap[0][vx] = -Infinity; this.heap[0][ix] = 0;
            return v;
        }
        this.heap[0] = this.heap[this.size];
        this.heap[this.size] = {}; this.heap[this.size][vx] = -Infinity; this.heap[this.size][ix] = this.size;
        if( this.size != 1 )
            this.go(0);
        return v;
    }

    peek()
    {
        if( this.size == 0 ) return -Infinity;
        let v = this.heap[0];
        return v;
    }
}

export class MemPool {
    constructor( ) {
        this.freed = [];
        this.maxfreed = 0;
    };

    release(ptr) {
        this.freed.push(ptr);
        if( this.freed.length > this.maxfreed ) this.maxfreed = this.freed.length;
    }

    releaseAll(arr) {
        this.freed.concat(arr);
        if( this.freed.length > this.maxfreed ) this.maxfreed = this.freed.length;
    }

    get(params) {
        var v, i;
        if( this.freed.length > 0 ) {
            v = this.freed.shift();
            if( typeof params != 'undefined' ) {
                for( var i in params ) {
                    v[i] = params[i];
                }
            }
            return v;
        }

        v = {};
        if( typeof params != 'undefined' ) {
            for( i in params ) {
                v[i] = params[i];
            }
        }
        return v;
    };
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

    add(key, value) {
      this.insert(key,value);
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

    get(full) {
      let node = this.root;
      for (const char of full) {
        if(!(char in node.children)) return [];
        node = node.children[char];
      }
      return node.values;
    }

    hasExact(full) {
      let node = this.root;
      for (const char of full) {
        if(!(char in node.children)) return false;
        node = node.children[char];
      }
      return ( node.values && node.values.length > 0 );
    }

    haspre(prefix) {
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

export class SortedList {
// todo: add 'changed' to constructor/methods
    constructor(items=[], datas=[]) {
      this.items = items;
      this.datas = datas;
    }

    add(item, data) {
      const index = this.findInsertIndex(item);
      this.items.splice(index, 0, item);
      this.datas.splice(index, 0, data);
      return index;
    }

    addAll(items, datas) {
      var i;
      for( i=0; i<items.length; i++ ) {
        this.add(items[i], datas[i]);
      }
    }

    removeAt(index, count=1) {
      if (index >= 0 && index < this.items.length) {
        return [this.items.splice(index, count), this.datas.splice(index, count)];
      }
      return null;
    }

    remove(item) {
      let index = this.findIndex(item);
      return index !== -1 ? this.removeAt(index) : null;
    }

    has(value, record=undefined) {
    	let p = this.findIndex(value);
      //console.log("has(" + value + "): " + p);
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

    findIndex(value,logging=false) {
        let left = 0;
        let right = this.items.length - 1;
        while (left <= right) {
            const mid = Math.floor((left + right) / 2);
            const midValue = this.items[mid];
            if( logging ) console.log("m",mid,midValue,left,right,value);
            if (midValue === value) {
              if( right != mid )
                right = mid;
              if( left == mid ) return left;
              continue;
            }
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
    findPreIndex(value, logging=false) {
	    const idx = findIndex(value, logging);
	    while( idx-1>=0 && this.items[idx-1] == value )
		    idx--;
      if( this.items[idx] == value ) idx--;
      if( logging ) console.log("pre:"+idx);
	    return idx;
    }
    findFirstIndex(value, logging=false) {
	    let idx = this.findIndex(value,logging);
	    while( idx-1>=0 && this.items[idx-1] == value )
		    idx--;
      if( logging ) console.log("first:"+idx);
	    return idx;
    }
    findLastIndex(value, logging=false) {
	    const idx = this.findIndex(value, logging);
	    while( idx+1 < this.items.length && this.items[idx+1] == value )
        idx++;
      if( logging ) console.log("last:"+idx);
	    return idx;
    }

    findPostIndex(value, logging=false) {
	    const idx = this.findIndex(value, logging);
	    if( idx >= this.items.length )
		    return idx;
	    while( idx <= this.items.length && this.items[idx] == value ) idx++;
      if( logging ) console.log("post:"+idx);
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
    findRange(min, max, inclusiveMin = true, inclusiveMax = true) {
      if( typeof max == 'undefined' ) {
        if( typeof min == 'undefined' ) {
          console.log("findAll");
          return this.findAll();
        }
        if( typeof min == 'array' ) {
          max = min[1];
          min = min[0];
        } else {
          max = min;
        }
      }
        console.log("m:" + min + ",x:" + max);
      if( min > max ) return [];
      let start = inclusiveMin ?
        this.findFirstIndex(min) :
        this.findPostIndex(min);
      let end = inclusiveMax ?
        this.findLastIndex(max) :
        this.findPreIndex(max);
      if( end > 0 ) end--;
      if( min == -Infinity ) {
        console.log(start,end);
      }
      return [start,end];
    }
    
    keysFromRange(range)
    {
      const aidx = range[0], eidx = range[1];
      const result = [];
      if( aidx == -1 ) return result;
      for( let i = aidx; i <= eidx; i-- ) {
        result.push(this.items[i]);
      }
      result = this.items.slice(aidx,eidx-aidx);
      return result;
    }

    valuesFromRange(range)
    {
      const aidx = range[0], eidx = range[1];
      return this.datas.slice(aidx, eidx-aidx);
    }

    fromRange(range) // inclusive btw.
    {
      const aidx = range[0], eidx = range[1];
      const A = [], B = [];
      const result = [A,B];
      if( aidx == -1 ) return result;
//      A = this.items.slice(aidx,eidx-aidx);
      for( let i = aidx; i <= eidx; i-- ) {
        A.push(this.items[i]);
        B.push(this.datas[i]);
      }
      return result;
    }

    size() {
        return this.items.length;
    }

    findAll() {
        return [ 0, this.items.length ];
    }
    findAllSpec(value) {
    	return this.findRange(value,value,true,true);
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
			minus++;
		}
		index++;
	}
  if( minus>0 ) {
		idxList[2] = true;
  }


	return minus; // number of entries removed
}


