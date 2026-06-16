//const Thesaurus = await import('./thesaurus.js');
//const Sentiments = await import('./sentiments.js');
const fs = await import('fs');
const os = await import('os');
const process = await import('process');
let corpus2=null, sentiments=null;
var central, mdb, myapp;

export function startup(app)
{
  myapp = app;

  app['MarkovEpsilon'] = MarkovEpsilon;
  app['MarkovSpace'] = MarkovSpace;

  return ['dbx','Central'];
}
export async function routes(router)
{
  console.log("Epsilon got router");
}

export async function init(app)
{
  console.log("Setting up markov stats.");
  central = app['central'] = app.tools['Central'];
  sentiments = app.util.sentiments;

  console.log("markov.init()");

  /*
  mdb = new app.util.KnowDB(app, 'markov');
  const me = app['me'] = new MarkovEpsilon(app, mdb);
  await app['me'].init();

  if( me.data.loaded ) {
    app['ms'] = new MarkovSpace(app['me']);
    console.log("Markov data Loaded");
  } else {
    app['ms'] = new MarkovSpace(app['me']);

    app.wordlib.startBatch();

    if( app.util.corpus ) {
      console.log("Chaining corpus text");
      await app.me.addTextContinuing(app.util.corpus);
    }
    else throw "corpus not found";

    let oc=0, ob=0;

    console.log("Fetching word list for markov analysis");
    const [ list, range ] = await app.wordlib.findKeyValueRange('base');
    const idents = list.valuesFromRange(range);

    for( const ident of idents ) {
      oc++;
      const node = await app.wordlib.getNode(ident);
      if( node === null ) {
        console.log("Word node not found ", ident, idents.length + " total");
        throw "huh";
      }
      if( node.title.length > 6 ) continue;

      const fields = ['def','ex'];
      let ident_text = '';
      async function procText()
      {
        await me.addTextContinuing(ident_text);
        ident_text = '';
      }
      async function addText(txt)
      {
        if( ident_text.length > 2000 )
          await procText();
        ident_text += txt;
      }
      for( var fieldno=0; fieldno<fields.length; fieldno++ ) {
        const fx = await node.getParams(fields[fieldno]);
        for( var def of fx ) {
          let nval = await app.wordlib.resolveNode( def.value );
          if( typeof nval == 'string' && nval.length > 0 ) {
            ob++;
            if( ob%5000 == 0 ) {
              console.log("ob%5000 mem free: " + os.freemem());
              await app.wordlib.softheartbeat(true);
            }
            if( fieldno == 0 ) {
              await addText(node.title + ": " + nval + "\n");
            } else {
              await addText(nval + "\n");
            }
          }
        }
      }
      if( ident_text != '' )
        await procText();
    }
    await app.wordlib.endBatch();
    console.log("Finished chaining dictionary. Normalizing.");
    app.me.data.items.startBatch();
    await me.data.normalize();
    await app.me.data.items.endBatch();
    console.log("Writing dbs...");
    await me.data.heartbeat(true);
    await app.wordlib.heartbeat(true);
    await central.save();
  }
  await me.findbuzzers();
  console.log("Propagating alphas.");
  try {
    await me.calculateAlphas();
  } catch( e ) {
    console.log("failed",e);
  }
  */
}

export class MarkovSpace {
  constructor(epsilon)
  {
    this.dims = [ 64, 64 ];
    this.datagrid = null;
    this.markov = epsilon;
  }

  setDims(d)
  {
    this.dims = d;
  }

  init()
  {
    initmem();
    initspace();
  }

  initmem()
  {
    this.byIdent = {};

    var ix = new Array();
    this.dl = this.dims.length;

    while( ix.length < this.dl ) {
      ix.push(Math.random()*this.dims[ix.length]);
    }

    var i, dptr, stack=[];

    this.datagrid = [];
    stack.push(0, this.datagrid);

    while( stack.length > 0 ) {
      dimn = stack.shift();
      dptr = stack.shift();
      for( i=0; i<this.dims[dimn]; i++ ) {
        const els = [];
        dptr.push(els);
        if( dimn+1 < this.dl ) {
          stack.push(dimn+1,els);
        }
      }
    }
  }

  initspace()
  {
  //  add(
  }

  add(id, p=null)
  {
    var i;
    if( p== null ) {
      p= new Array(this.dl);
      for( i=0; i<this.dl; i++ ) {
        p[i] = Math.random()*this.dims[i];
      }
    }
    const obj = {id,pos};
    this.byIdent[obj.id] = obj;
    let dptr = this.datagrid;
    for( i=0; i<this.dl; i++ ) {
      dptr = dptr[parseInt(p[i])];
    }
    dptr.push( obj );
  }
  remove(id)
  {
    const obj = this.byIdent[id];
    var i;
    let pptr = null, dptr = this.datagrid;
    const p = obj.p;

    for( i=0; i<this.dl; i++ ) {
      pptr = dptr;
      dptr = dptr[parseInt(p[i])];
    }

    for( i=0; i<dptr.length; i++ ) {
      if( dptr[i].id == id ) {
        dptr.splice(i,1);
        return;
      }
    }

    if( pptr!=null && dptr.length == 0 ) {
      pptr.splice(parseInt(p[this.dl-1]), 1);
    }

  }

  sim_acc()
  {
  }
  sim_vel()
  {
  }
  sim_pos()
  {
  }

};
export class MarkovEpsilon {
constructor(app, mdb)
{
  this.app = app;
  this.mdb = mdb;
  this.primes = [];
	this.setMode = 8;
	this.genWords = 70;
  this.sentiments = sentiments;
	this.alphaScores = { // for backup only
    // prefer sentiments.js calculated readings
   	a: 2, b: 3, c: 3, d: -4, e: 3, f: 0, g: 0,
		h: 5, i: 3, j: 0, k: 1, l: 5, m: -6, n: 3,
		o: 7, p: 8, q: 9, r: 2, s: -4, t: -3, u: -6,
		v: -4, w: 8, x: -3, y: -2, z: -5,
    0: 0, 1: 3, 2: 2, 3: 6, 4: -3, 5: 3, 6: -1,
		7: -8, 8: 4, 9: 5
	};
	this.notEmotions = [
	".",",","the","of","a","in","and","to","is","i","you","it","that","my",
	"s","can","have","your","be","on","for","with",
	"0","1","2","3","4","5","6","7","8","9","-","all","this","not","t","are","me","or","so",
	"more","some","will"
	];
  this.buzzWords = [ 'a', 'the', 'in', 'by', 'is', 'what' ];

	this.opposites = {
	'love': 'dark',
  'dark': 'flow',
  'light': 'then',
	'god': 't',
	'then': 'will',
	'will': 'flow',
  'i': 'love',
  'river': 't',
	'you': 's',
	's': 'a',
	't': 'god',
	'a': 'y',
  'y': 'river',
  'flow': 'love'
  };
	this.cc = {
		a: 'a'.charCodeAt(0), z: 'z'.charCodeAt(0),
		A: 'A'.charCodeAt(0), Z: 'Z'.charCodeAt(0),
		zero: '0'.charCodeAt(0), nine: '9'.charCodeAt(0)
	};

  this.senses = {};
  this.data = null;
  this.tokenbuffer = [];
  // initialize basic numbers and symbols:
  let zerocorpus = `0 1 2 3 4 5 6 7 8 9 10 , . ; : ! @ # $ % ^ & * ( ) - = _ + [ ] { } \\ | ' " , . / < > ? \` ~ || == >= <= || &&`;
  let cheating = zerocorpus.split(' ');
  for( var cheat of cheating ) {
    central.addWord(cheat);
  }
}

async init()
{
  this.data = new this.app.MarkovChainDB(this.app, this.mdb);
  await this.data.init();
}
async save()
{
  console.log("Markov DB save");
  await this.data.save();
}

routes(router)
{
  console.log("setting up get route for Epsilon /word.json, /ep.json");
  router.get('/word.json').bind(this.requestWord.bind(this));
  router.get('/ep.json').bind(this.requestNexts.bind(this));
  console.log("routes complete");
}

async requestWord( req, res, params ) {
  const word = req['w'];
  const token = central.getToken(word);
  const a = this.alphaSentiment(word);
  const s = this.getSentiment(word);
  const alphas = await this.getAlphas(token);
  const result = { word, token, a, s, alphas };
  this.app.response.jsonOk(result);
};

async requestNexts( req, res, params ) {
  const words = req['w'];
  const tokens = this.toTokens(words);
  try {
    const nexts = await this.data.search(tokens);
  } catch ( e ) {
    console.log("RequestNexts");
    console.log(e);
    this.app.response.jsonOk({});
    return;
  }
  const result = { words, tokens, nexts };
  this.app.response.jsonOk(result);
};

hasWord( word )
{
  return ( central.tokens.hasExact(word) );
}

addTextQuick( text )
{
  const tokens = central.toTokens(text);
  this.tokenbuffer.push(tokens);
}
async rechain()
{
  console.log("rechain");
  this.generatePrimes(central.xdict.length);
  //this.data = new this.app.MarkovChainDB(this.app, this.mdb);
  for( var i=0; i<this.tokenbuffer.length; i++ ) {
    await this.qchain(this.tokenbuffer[i],6);
  }
  //this.tokenbuffer = [];
}
async recalculate()
{
  await this.findbuzzers();
  await this.calculateAlphas();
}
async addText( text )
{
  let tokens = central.toTokens(text);
  this.tokenbuffer.push(tokens);

  await this.rechain();
  await this.recalculate();
}
async addTextContinuing(text)
{
  this.tokenbuffer = [];
  const tokens = central.toTokens(text);
  if( tokens.length <= 0 ) {
    console.log("empty tokens");
    return;
  }
  await this.qchain(tokens);
}

generatePrimes( n ) {
	this.primeMax = n;
	let pr = this.primes.length == 0 ? 1 : this.primes[this.primes.length-1];
	while( this.primes.length < this.primeMax ) {
		pr++;
		while( !this.isPrime(pr) ) pr++;
		this.primes.push(pr);
	}
	console.log("Last prime: " + this.primes[this.primes.length-1]);
}

isPrime( x ) {
	var v;
  if( isNaN(x) ) {
    console.log("huh?");
    console.log(x);
    throw "nope";
  }
	for( var i=0; i<this.primes.length; i++ ) {
		v = x/this.primes[i];
		if( parseInt(v) == v ) {
			return false;
		}
	}
	return true;
}
alphaSentiment(word) {
  var i;
  var score=0;
  var wl = word.toLowerCase();
  for( i = 0; i < word.length; i++ ) {
    if( !(wl[i] in this.alphaScores) ) {
      score++;
      continue;
    }
    score += this.alphaScores[wl[i]];
  }
  if( score == 0 || word.length == 0 ) return 0;

  score/=word.length;
  return score;
}
getSentiment(phrase)
{
	const words = central.splitWords(phrase);
	let sent = 0;
	for( var i=0; i<words.length; i++ ) {
		if( words[i] in this.sentiments ) {
			let s = this.sentiments[words[i]];
			sent += 10*(s[0] + s[1] - s[2]) / words.length;
		} else {
			sent += 10*(this.alphaSentiment(words[i])) / words.length; // consider using cofactors here.
		}
	}
	return sent;
}
sortSentiments( sentimentList )
{
	sentimentList.sort( (a,b) => { this.getSentiment(central.xdict[a]) - this.getSentiment(central.xdict[b]) } );
}

getThesaurus(phrase)
{
	let result = [];
	const words = central.splitWords(phrase);
	var i;
	if( words.length > 1 || !(phrase in this.thesaurus) ) return result;

	for( i in this.thesaurus[phrase] ) {
		result.push(i);
	}
	return result;
}

removeSynonyms( patternList )
{
	var x = [];
	var found = new Set();
	for( var i=0; i<patternList.length; i++ ) {
		if( found.has(patternList[i]) ) continue;
		found.add(patternList[i]);
		x.push( patternList[i] );

    
		let these = this.getThesaurus(patternList[i]);
		for( var j=0; j<these.length; j++ ) {
			found.add( these[j] );
		}
	}
	return x;
}

nextof( nest )
{
	var t = 0;
	for( var i in nest ) {
		t += nest[i];
	}
	var x = Math.random()*t;
	for( var i in nest ) {
		x -= nest[i];
		if( x <= 0 ) return i;
	}
	return k[ k.length - 1 ];
}

async qchain(tokens,n=6)
{
	var i, k, v, x, y;
  var m=0;
  //let newline = central.getToken("\n");
  let p = [];

	for( i=0; i<tokens.length; i++ ) {
		const t = tokens[i];
    /*
    if( t == newline ) {
      p = [];
      continue;
    }
    */
    if( typeof t != 'number' || isNaN(t) )
      console.log("alert: t nan " + t);

    if( p.length > 0 )
      await this.data.chain(p, t);

    p.push(t);
    if( p.length > n ) p.shift();
	}
}

nextword0()
{
	var q = qRandom(0,this.datasum);
	for( var t of central.dict ) { // all tokens
    let x = this.data.get(t);
    if( typeof x == 'undefined' ) continue;
    for( var z of x ) {
      for( var w2 in z ) {
       q -= z[w2];
	  	  if( q <= 0 ) {
		      var o = {};
		      o[t] = 1;
		      return o;
		    }
      }
    }
  }

	var z = {};
	z[ central.dict['the'] ] = 1;
	return q;
}
nextwordn(ws=[])
{
	var i;
	let nx = {};
  let x = [];
	for( i=ws.length-1; i>=0; i-- ) {
    w = ws[i];
		if( x.length == 0 ) x = [w];
    else x.unshift(w);

    let v = this.data.get(x);
    if( typeof v == 'undefined' ) continue;
    if( !(w in v) ) continue;

    if( w in nx ) nx[w] += v[w];
    else nx[w] = v[w];

    const k = ws.length-i;
	  for( var w2 in nx ) {
	  	w[w2] = nx[w2] * 1/Math.pow(2,k);
	  }
  }

	if( nx.length == 0 ) return [ nextword0() ];
	return nx;
}

nextof( nest )
{
	var t = 0;
	for( var i in nest ) {
		t += nest[i];
	}
	var x = Math.random()*t;
	for( var i in nest ) {
		x -= nest[i];
		if( x <= 0 ) return central.dict[i];
	}
	var k = Object.keys(nest);
	return central.dict[ k[ k.length - 1 ] ];
}




async findbuzzers()
{
  let buzzers = [];
  let sum=0, count=0;
  var avg;

  console.log("findbuzzers()");

  for( var tok=0; tok<central.xdict.length; tok++ ) {
    //let word = central.xdict[tok];
    let results = await this.data.search([tok]);
    count = 0;
    for( var key in results ) {
      sum += results[key];
    }
    //sum += Object.keys( results ).length;
    count++;
  }
  
  //avg = sum/count; // find middle
  //avg = 0.4*avg; // aim for slightly-rare words
  //avg = 1.5*avg; // aim for the high end of average
  //
  const buzzer_count = 5;
  const buzzn = buzzer_count*2;

  for( var tok=0; tok<central.xdict.length; tok++ ) {
    let word = central.xdict[tok];
    let results = await this.data.search([tok]);
    count = 0;
    for( var key in results ) {
      count += results[key];
    }
    //let dist = Math.abs(count-avg);
    let dist = count;

    if( buzzers.length == 0 ) {
      buzzers.push( dist, word );
      continue;
    }
    let found=false;
    for( var b=0; b<buzzers.length; b+= 2 ) {
      //if( dist < buzzers[b] ) {
      if( dist > buzzers[b] ) {
        buzzers.splice(b,0, dist, word);
        found=true;
        break;
      }
    }
    if( !found && buzzers.length < buzzn )
      buzzers.push( dist, word );
    else if( buzzers.length > buzzn ) {
      buzzers.splice(buzzn, buzzers.length-buzzn);
    }
  }

  this.buzzWords = [];
  for( var b=1; b<buzzers.length; b+=2 ) {
    this.buzzWords.push( buzzers[b] );
  }
  console.log("this.buzzWords=",this.buzzWords);
}

async quickdist(atoken, btoken)
{
  if( atoken == btoken ) return 0;
  let total=0, count=0;
  let aprimes = await this.getAlphas(atoken);
  let bprimes = await this.getAlphas(btoken);

  for( const h of this.buzzWords ) {
    const x = central.getToken(h);

    var dist;
    if( !(x in aprimes) ) {
      if( (x in bprimes) )
        dist = bprimes[x];
    } else if( !(x in bprimes) ) {
      dist = aprimes[x];
    } else {
      //dist=0;
      continue;
    }

    count++;
    console.log("qd " + atoken + " " + btoken + " dist += " + dist);
    total += dist;
  }
  if( count == 0 ) return Infinity;
  return total/count;
}
async distance(str)
{
  let words = str.split(" ");
  const tokens = central.toTokens(str);
  const result = {};

  for( var i=0; i<tokens.length; i++ ) {
    const ti = tokens[i];
    result[ti] = {};
    for( var j=i+1; j<tokens.length; j++ ) {
      const ji = tokens[j];
      result[ti][ji] = await this.semdist(ti,ji);
      console.log(words[i] + "-" + words[j] + ": " + result[ti][ji]);
    }
  }

  return result;
}

async bufdist(astr, bstr, debug=true)
{
  let acount=0,bcount=0;
  let shared_words=0;
  const btween = {};
  const atween = {};
  const atokens = central.toTokens(astr);
  const btokens = central.toTokens(bstr);
  var alpha_a, alpha_b;

  if( debug ) {
    //console.log("bufdist");
    //console.log(astr + ": ", atokens);
    //console.log(bstr + ": ", btokens);
  }
  for( const h of this.buzzWords ) {
    const token = central.getToken(h);
    atween[token] = 0;
    btween[token] = 0;
  }
  for( const atok of atokens ) {
    if( btokens.indexOf(atok) != -1 ) {
      shared_words++;
      continue;
    }

    alpha_a = await this.getAlphas(atok);

    for( const h of this.buzzWords ) {
      const token = central.getToken(h);

      const val = alpha_a[token];
      if( typeof val == 'undefined' || isNaN(val) || val < 0 )
        continue;
      atween[token] += val;
    }
    acount++;
  }
  for( const btok of btokens ) {
    if( atokens.indexOf(btok) != -1 ) {
      continue;
    }

    alpha_b = await this.getAlphas(btok);

    for( const h of this.buzzWords ) {
      const token = central.getToken(h);
      const val = alpha_b[token];
      if( typeof val == 'undefined' || isNaN(val) || val < 0 )
        continue;
      btween[token] += val;
    }
    bcount++;
  }

  let total=0;
  if( acount == 0 ) acount=1;
  if( bcount == 0 ) bcount=1;
  for( const key in atween ) {
    var aval, bval;
    if( acount == 0 ) aval = 0;
    else aval = ( atween[key] / acount );
    if( bcount == 0 ) bval = 0;
    else bval = ( btween[key] / bcount );
    total += Math.abs( aval - bval );
  }
  let tcount = acount+bcount;
  if( debug ) {
    for( var a in this.atween ) {
      console.log(central.xdict[a] + ": " + JSON.stringify(atween[a]) + " vs " + JSON.stringify(btween[a]));
    }
    console.log("total:", total, ", tc: ", tcount, ", shared: ", shared_words);
  }
  if( tcount <= 0 ) tcount=1;

  return total/tcount;
}
mcoord( buf )
{
  const tok = central.toTokens(buf);
  let coord = {};
  for( var h of this.buzzWords ) {
    const x = central.getToken(h);
  }
}

insert(lst,aux,tgt,val)
{
	for( var i=0;i<lst.length;i++ ) {
		if( aux[i] > val ) {
			lst.splice(i,0,tgt);
      aux.splice(i,0,val);
			return;
		}
	}
	lst.push(tgt);
  aux.push(val);
}

async semdist(edge1, edge2, searchAlpha)
{
  let lowest_match=Infinity;
  var o, p;
	const q = [[edge1]];
  const r = [0];
  const s = [[edge2]];
  const t = [0];

  if( isNaN(edge1) || isNaN(edge2) ) {
    this.app.util.throwStack("nan edge");
    throw "error";
  }
  var e,n,d,f,m;

  async function checkTo(bot,e,n,q,r,edge2,searchAlpha=undefined) {
    var val, f, d;
    if( n >= lowest_match ) return;
    const nest = bot.data.search(e);
    for( const key in nest ) { // next word is key
      val = nest[key]; // val is count
      d = 1/val;
      if( key == edge2 && n+d < lowest_match ) {
        lowest_match = n+d;
        continue;
      }

      f = e.slice();
      f.push(key);
      if( f.length > 6 ) f.shift();

  	  bot.insert( q,r, f,n+d );

      // allow for prediscovered paths:
      if( typeof searchAlpha != 'undefined' ) {
        const alphas = await this.getAlphas(key);
        const a = alphas[searchAlpha];
        if( typeof a != 'undefined' && a != -1 ) {
          if( n+d+a < lowest_match ) {
            lowest_match=n+d+a;
          }
        }
      }
		}
  }
	while( s.length > 0 || q.length > 0 ) {
    if( q.length > 0 ) {
      e = q.shift();
      n = r.shift();
      await checkTo(this,e,n,q,r,edge2,searchAlpha);
    }

    if( s.length > 0 ) {
      f = s.shift();
      m = t.shift();
      await checkTo(this,f,m,s,t,edge1,searchAlpha);
    }
	}

  if( lowest_match == Infinity ) return -1;
	return lowest_match;
}

async getAlphas(token)
{
  return await this.data.getAlphas(token);
}
async normalize()
{
  await this.data.normalize();
}
async calculateAlphas()
{
  let count=0;
  const buzzwords = this.buzzWords.length;
  var token, word, node, alphas, param, parms;
  var lastn, n, amt, pastdist;
  var distdats, mindist, lastdist;
  var hits, alphatoken;

  console.log("Running alpha propagation");
  let fin = [];

  for( var key of this.buzzWords ) {
    alphatoken = central.getToken(key);
    distdats = [ [ alphatoken, 0 ] ];
    fin = new Set();
    dist = lastdist = 0;
    lastn = 0;
    console.log("Propagate " + key);
    hits=0;

  this.app.wordlib.startBatch();
  while( true ) {
    var target,dist;
    let found=false;

    for( dist=lastdist; dist<distdats.length; dist++ ) {
      if( lastn >= 5000 ) {
        distdats[dist].splice(0,5000);
        lastn -= 5000;
      }
      if( distdats[dist].length <= lastn ) {
        distdats[dist] = [];
        lastn = 0;
        continue;
      }
      //console.log(distdats[dist], lastn);
      target = distdats[dist][lastn];
      pastdist = distdats[dist][lastn+1];
      lastn += 2;
      found = true;
      break;
    }
    if( !found ) {
      lastn=0;
      for( dist=0; dist<distdats.length; dist++ ) {
        if( distdats[dist].length > 0 ) {
          found=true;
          break;
        }
      }
      if( !found )
        break;

      //lastn=0;
      target = distdats[dist][0];
      pastdist = distdats[dist][1];
      lastn=2;
    }
    lastdist=dist;
    if( typeof target != 'number' ) target = Number(target);

    let b4 = await this.data.getBefores(target);
    if( !b4 ) {
      console.log("no befores for " + target);
      continue;
    }
    //console.log("b4 length="+b4.length + ", target=" + target);

    let missing=0;

    for( var i=0; i<b4.length; i++ ) {
      const b5 = Number(b4[i]);
      const alphas = await this.getAlphas(b5);
      if( isNaN(b5) ) {
        console.log("nan b5: ", i, b4);
        throw "wut";
      }

      const arr = await this.data.search([b5]);
      if( !(target in arr) ) {
        console.log("search(" + b5 + "-" + central.xdict[b5] + ") missing next of " + target + "-" + central.xdict[target] + ": " + JSON.stringify(arr));
        console.log(central.xdict[b5], central.xdict[target]);
        throw "missing";
        missing++;
        continue;
      }

      if( arr[target] > 0.9999 ) {
        amt = pastdist + 0.0001;
      } else {
        amt = pastdist + ( 1-arr[target] );
      }
      const tgtdist = Math.floor(amt*10);

      if( alphatoken in alphas && alphas[alphatoken] < amt ) continue;
      await this.data.setAlpha(b5,alphatoken,amt);
      
      if( !fin.has(b5) ) {
        while( tgtdist >= distdats.length ) distdats.push([]);
        //console.log("amt=" + amt + ", tgtdist=" + tgtdist);
        distdats[tgtdist].push(b5,amt);
        fin.add(b5);
      }

      count++;
      if( count%5000 == 0 ) {
        console.log("propagate(5000) tgtdist=" + tgtdist + ", length=" + distdats[tgtdist].length + ", lastn=" + lastn, ", amt=" + amt + ", dist=" + dist + ", lastdist=" + lastdist);
        await this.data.items.endBatch();
        await myapp.wordlib.endBatch();
        await this.data.softheartbeat(true);
        await myapp.wordlib.softheartbeat(true);
        this.data.items.startBatch();
        myapp.wordlib.startBatch();
      }
    }
    if( missing > 0 ) {
      console.log("missing hits: " + missing + "/" + b4.length);
      //console.log(b4);
      //console.log(arr);
    }
  }
    await this.app.wordlib.endBatch();
  }
}


changeEmotions(currentEmotions, word)
{
	var mindist = Infinity, minword;
	let required_for_change = 0.095;
  let token = central.addWord(word);
	for( var x in this.alphas[token] ) {
		if( x == token ) return; // we don't want to use direct buzz words but adjacent ones.
		if( this.alphas[token][x] < mindist ) {
			mindist = this.alphas[token][x];
			minword = x;
		}
	}
	// minimum distance is mindist, label is minword, mintoken will be the token
	if( mindist >= required_for_change ) {
		//console.log(tokenWord + " too far " + mindist);
		return;
	}
	if( currentEmotions.indexOf(token) >= 0 ) return; // already included
	var replaceIndex;
	if( currentEmotions.length < buzzWords.length/2 ) {
		currentEmotions.push( token );
		return;
	}
	// replace one at random
	replaceIndex = Math.floor( Math.random() * currentEmotions.length );
	if( replaceIndex == currentEmotions.length ) replaceIndex=currentEmotions.length-1; // nearly impossible but it might happen
	currentEmotions.splice(replaceIndex, 1, token);
}

gen(buf, sensebuf, changing) {
	if( buf[0] == "/" || buf[0] == '-' ) {
		let ctype = buf[0];

		let args = buf.split(" ");
		let cmd = args.shift().substring(1);

		if( ctype == '/' ) {
			setMode = parseInt(cmd);
		} else if( ctype == '-' ) {
			genWords = parseInt(cmd);
		}
		buf = args.join(" ");
	}
	if( buf == "" ) buf = "The";

	this.senses = central.toTokens(sensebuf);

	let ws = [], ts = [];
	let bufs = buf.split(" ");
	for( var i=0; i<bufs.length; i++ ) {
		ws.push(bufs[i]);
	}
	var lastToken=-1;

	var storage={};
  var w=null, t=0;

	for( i=0; i<genWords; i++ ) {
		ts=[];
		for( k=0; k<ws.length && k<setMode; k++ ) {
			const a = central.toTokens(ws[k]);
			ts.push( a );
		}
		var startPt;
		if( setMode > ws.length )
			startPt = ws.length;
		else
			startPt = setMode;
		w = this.nextwordn(ts);

		if( lastToken in w )
			delete w[lastToken];

		if( this.senses.length > 0 ) {
			for( var x in w ) {
				if( !(x in this.alphas) ) {
					console.log("Missing word " + x);
					continue;
				}
				let adjust = 0;
				for( var j=0; j<this.senses.length; j++ ) {
					for( var b of this.buzzWords ) {
            const y = central.addWord(b);
						adjust += Math.abs( this.alphas[x][y] - this.alphas[this.senses[j]][y] );
					}
				}
				w[x] += adjust;
			}
		}

		if( changing && this.senses.length > 0 ) {
			this.changeEmotions(this.senses, lastToken);
		}

		t = this.nextof(w);
		w = central.xdict[t];

		if( typeof w == 'undefined' )
			w = "a";

		if( ws.length < setMode ) {
			ws.push(w);
		} else {
			for( k=0; k+1<ws.length && k+1<setMode; k++ ) {
				ws[k] = ws[k+1];
			}
			ws[k] = w;
		}

		buf = this.joinWord(buf,w);
    lastToken = t;
	}
	/*
	if( changing ) {
		let highest = [];
		let hvalues = [];
		let maxemote = 10;
		let maxhi = Math.ceil( Math.random() * (maxemote+flavcopy.length) * 0.66 );
		if( maxhi > maxemote ) maxhi = maxemote;
		if( maxhi == 1 ) maxhi=2;
		for( i=0; i<maxhi; i++ ) {
			hvalues[i]=0;
		}

		for( var x in storage ) {
			let w = dict[x];
			if( notEmotions.indexOf(w)>=0 ) continue;
			if( flavcopy.indexOf(x)>=0 ) continue;
			if( !(w in sentiments) ) continue;
			let z = sentiments[w][2];
			if( sentiments[w][0] < z && sentiments[w][1] < z ) continue;
			//console.log(w,sentiments[w]);
			for( var k=maxhi-1; k>=0; k-- ) {
				if( storage[x] > hvalues[k] ) {
					for( var g=0; g<k; g++ ) {
						hvalues[g] = hvalues[g+1];
						highest[g] = highest[g+1];
					}
					hvalues[g] = storage[x];
					highest[g] = x;
					break;
				}
			}
		}
		sensebuf = "";
		i=0;
		console.log(flavcopy,highest);
		flavcopy = flavcopy.slice( 0, maxemote-highest.length );

		for( i=highest.length-1; i>=0; i-- ) {
			flavcopy.push( highest[i] );
		}
		for( i=0; i<flavcopy.length; i++ ) {
			if( sensebuf == "" ) sensebuf = dict[flavcopy[i]];
			else sensebuf = joinWord(sensebuf, dict[flavcopy[i]]);
		}
	}
	*/
	if( changing ) {
		sensebuf = "";
		for( var i of this.senses ) {
			if( sensebuf != "" ) sensebuf += " ";
			sensebuf += central.xdict[i];
		}
	}
	return [buf,sensebuf];
}

}

