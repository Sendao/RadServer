let thesaurus = require('./thesaurus.js');
let sentiments = require('./sentiments.js');
let alphas = require('./alpha.js');
let { Util, HashMap } = require('./dbx.js');

export class MarkovEpsilon {

constructor(corpus)
{
	this.setMode = 8;
	this.genWords = 70;
	this.vp = ".,!@#$%^&*_+-=\\|'\"";
	this.vowels = ['e','a','i','o','u','y','h','s','w'];
	this.consonants = ['b','c','d','f','g','j','k','l','m','n','p','q','r','t','v','x','z'];
	this.alphaScores = {
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
	this.buzzWords = [
	"love", "hate", "god", "power", "will", "i", "you", "s", "t", "a", "y" 
	];
	this.opposites = {
	'love': 'hate',
	'god': 't',
	'power': 'will',
	'will': 'power',
  'hate': 'y',
	'i': 'you',
	'you': 'i',
	's': 'a',
	't': 'god',
	'a': 's',
  'y': 'love'
  };
	var l2list = this.tokenize_n(corpus);
	var l3list = new Array(l2list.length/2);
	var j=0;
	this.dict = {};
	this.xdict = [];
	for( var i=0; i<l2list.length; i += 2 ) {
		let w = l2list[i][0], count = l2list[i][1];
		this.dict[w] = this.xdict.length+0;
		this.xdict.push(w);
	}
	
	this.corpus_pattern = this.removeSynonyms(this.dict);
	this.corpus_sorted = this.sortSentiments(this.corpus_pattern);
	
	this.cc = {
		a: 'a'.charCodeAt(0), z: 'z'.charCodeAt(0),
		A: 'A'.charCodeAt(0), Z: 'Z'.charCodeAt(0),
		zero: '0'.charCodeAt(0), nine: '9'.charCodeAt(0)
	};

	this.generatePrimes(this.corpus_sorted.length);

	this.xflavor = {};
	this.flavor = {};
	for( var i=0; i<this.corpus_sorted.length; i++ ) {
		this.xflavor[ this.primes[i] ] = this.corpus_sorted[i];
		this.flavor[ this.corpus_pattern[i] ] = this.primes[i];
	}

	this.tokens = this.toTokens(corpus);
  this.data = new HashMap();
	this.qchain(corpn,6);
	this.dataSum();
}

generatePrimes( n ) {
	this.primeMax = n;
	console.log("Generating primes...");
	console.log(this.primes[this.primes.length-1]);
	this.primes = [];
	let pr = 1;
	while( this.primes.length < this.primeMax ) {
		pr++;
		while( !this.isPrime(pr) ) pr++;
		this.primes.push(pr);
	}
}
isPrime( x ) {
	var v;
	for( var i=0; i<this.primes.length; i++ ) {
		v = x/this.primes[i];
		if( parseInt(v) != v ) {
			return false;
		}
	}
	return true;
}
dataSum()
{
	let m=0;
	for( var w in this.dict ) {
		if( !(w in this.data) ) continue;
		m += this.data[w].length;
	}
	this.datasum = m;
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
	const words = this.splitWords(phrase);
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
	sentimentList.sort( (a,b) => { this.getSentiment(a) - this.getSentiment(b) } );
}

getThesaurus(phrase)
{
	let result = [];
	const words = this.splitWords(phrase);
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

splitWords(phrase)
{
	var i;
	var w = "";
	let words = [];

	for( i=0; i<phrase.length; i++ ) {
		if( this.letterType(phrase[i]) != 0 ) {
			if( w != "" ) {
				words.push(w);
				w = "";
			}
			if( phrase[i] != ' ' )
				w += phrase[i];
		} else {
			w += phrase[i];
		}
	}
	if( w != "" ) words.push(w);

	return words;
}

letterType( c  )
{
	let n = c.charCodeAt(0);
	if( ( n >= cc.a && n <= cc.z ) || ( n >= cc.A && n <= cc.Z ) )
		return 0;
	if( n >= cc.zero && n <= cc.nine )
		return 1;
	if( c == ' ' || c == '\n' || c == '\r' || c == '\t' )
		return 2;
	if( this.vp.indexOf(c) >= 0 ) return 3;
	return 4;
}

joinWord(phrase, word1)
{
	let t = this.letterType(word1[0]);
	let u = this.letterType(phrase[phrase.length-1]);
	let includeSpace=true;
	if( u == 2 ) includeSpace=false;
	switch( t ) {
	case 0: // alphabet
		return phrase + (includeSpace?" ":"") + word1;
	case 1: // numeric
		if( u == 1 ) return phrase + word1;
		else return phrase + (includeSpace?" ":"") + word1;
	case 2: // spacing
		return phrase + (includeSpace?" ":"");
	case 3: // punctuation
		if( word1 == "-" ) {
			return phrase + (includeSpace?" ":"") + "-";
		} else {
			if( !includeSpace ) return phrase.substring(0, phrase.length-1) + word1;
			else return phrase + word1;
		}
	}
	return phrase + " " + word1;
}


toTokens( str )
{
	var i,t;
	let w="",tokens=[];
	let type=-1;
	if( str == "" ) return [];

	str = str.toLowerCase();
	for( i=0; i<str.length; i++ ) {
		t = this.letterType(str[i]);
		if( t == type ) {
			switch( t ) {
			case 1: case 3:
				if( w != "" ) {
					if( !(w in this.dict) ) {
						this.dict[w] = this.xdict.length+0;
						this.xdict.push(w);
					}
					tokens.push(this.dict[w]);
					w = "";
				}
			case 0:
				w += str[i];
				break;
			case 2:
				break;
			}
		} else {
			if( w != "" ) {
				if( !(w in this.dict) ) {
					this.dict[w] = this.xdict.length;
					this.xdict.push(w);
				}
				tokens.push(this.dict[w]);
				w = "";
			}
			type=t;
			if( t != 2 )
				w += str[i];
		}
	}
	if( w != "" ) {
		if( !(w in this.dict) ) {
			this.dict[w] = this.xdict.length;
			this.xdict.push(w);
		}
		tokens.push(this.dict[w]);
	}
	return tokens;
}

nextof( nest )
{
	var t = 0;
	for( var i in nest ) {
		t += nest[i];
	}
	var x = Math.random()*t;
	var k = Object.keys(nest);
	for( var i in nest ) {
		x -= nest[i];
		if( x <= 0 ) return i;
	}
	return k[ k.length - 1 ];
}

tokenize_n( str )
{
	var i,t,q;
	let w="",tokens=[];
	let type=-1;
	let dupes = new Map();

	addTok(w)
	{
		if( w == "" ) return;
		if( !dupes.has(w) ) {
			q = 1;
			dupes.set(w,[q]);
		} else {
			q = dupes.get(w)[0];
			q++;
		}
		tokens.push(w,q);
	}

	str = str.toLowerCase();
	for( i=0; i<str.length; i++ ) {
		t = letterType(str[i]);
		if( t == type ) {
			switch( t ) {
			case 1: case 3:
				if( w != "" ) {
					addTok(w);
					w = "";
				}
			case 0:
				w += str[i];
				break;
			case 2:
				w = " ";
				break;
			}
			continue;
		} else {
			if( w != "" ) {
				addTok(w);
			}
			type=t;
			w=str[i];
		}
	}
	if( w != "" ) {
		addTok(w);
	}

	return tokens;
}

fromTokens( tk )
{
	var i,len=tk.length;
	var tokens = "";
	for(i=0;i<len;i++){
		if( typeof tk[i] == 'undefined' || isNaN(tk[i]) ) continue;
		tokens = this.joinWord(tokens, this.xdict[tk[i]]);
	}
	return tokens;
}

qchain(tokens,n)
{
	var i, k, v, p, t;
	for( i=0; i<tokens.length; i++ ) {
		t = tokens[i];
		for( k=0; k<n; k++ ) {
			v = i-(n-k);
			if( k == 0 ) p = tokens[v];
      else p = tokens[v]+","+p;

			if( !(p in this.data) ) this.data[p] = {};
			if( !(t in this.data[p]) ) this.data[p][t] = 1;
			else this.data[p][t]++;
		}
	}
}
/*
normalize(obj)
{
	let sum = 0;
	var k;
	for( k in obj ) {
		sum += Math.abs( obj[k] );
	}
	for( k in obj ) {
		obj[k] = obj[k] / sum;
	}
}
*/

nextword0()
{
	var q = qRandom(0,this.datasum);
	for( var w of this.dict ) {
		if( !(w in this.data) ) continue;

		q -= this.data[w].length;
		if( q <= 0 ) {
			var q = {};
			q[w] = 1;
			return q;
		}
	}

	var q = {};
	q[ xdict['the'] ] = 1;
	return q;
}
nextwordn(ws=[])
{
	var i,x;
	let nx=[];
	for( i=ws.length-1; i>=0; i-- ) {
		if( x != "" ) x = "," + x;
		x = ws[i].toLowerCase() + x;

		if( x != "" && x in this.data ) {
			nx = nx.concat( this.data[x] );
		}
	}
	for( var j in nx ) {
		w[j] = nx[j] * 1/Math.pow(4,ws.length-k);
	}

	if( nx.length == 0 ) return [ nextword0() ];
	return nx;
}

function nextof( nest )
{
	var t = 0;
	for( var i in nest ) {
		t += nest[i];
	}
	var x = Math.random()*t;
	for( var i in nest ) {
		x -= nest[i];
		if( x <= 0 ) return this.dict[i];
	}
	var k = Object.keys(nest);
	return this.dict[ k[ k.length - 1 ] ];
}



insert(lst,tgt,val)
{
	for( var i=0;i<lst.length;i++ ) {
		if( lst[i][1] > val ) {
			lst.splice(i,0,[tgt,val]);
			return;
		}
	}
	lst.push([tgt,val]);
}

semdist(edge1, edge2, searchFor)
{
	let q = [[edge1,0]];
	var e,d,i,v = new Set();
	if( !(edge1 in this.data) ) return -1;
	v.add(edge1);

	while( q.length > 0 ) {
		[e,d] = q.shift();

		for( i in this.data[e] ) {
			if( i == edge2 ) return d+(1.1-this.data[e][i]);
			if( !(i in this.data) ) continue;
			if( v.has(i) ) continue;
			if( i in this.alphas && this.alphas[i][searchFor] != -1 ) {
				return d+(1-this.data[e][i])+this.alphas[i][searchFor];
			}
			this.insert( q, i, d+(1.1-data[e][i]) );
		}
	}
	return -1;
}
alphaCalc()
{
	let f = new Set();
	let fs = require('fs');
	for( var i=0; i<corpn.length; i++ ) {
		if( f.has(corpn[i]) ) continue;
		f.add(corpn[i]);
		w=corpn[i];
		alphas[w] = {};
		//betas[w] = {};
		let sum=0;
		for( var h of buzzWords ) {
			var x = xdict[h];
			if( x == w ) continue;
			alphas[w][h] = semdist(w, x, h);
			//betas[w][x] = semdist(x, w,true);
			sum += alphas[w][h];
		}
		for( var h of buzzWords ) {
			alphas[w][h] /= sum;
		}
		console.log(dict[w] + "-" + w + "/" + Object.keys(data).length);
	}

	fs.writeFileSync('alphas.js', "module.exports = " + JSON.stringify(alphas));
	//fs.writeFileSync('betas.js', JSON.stringify(betas));
}

function changeEmotions(currentEmotions, token)
{
	var mindist = Infinity, minword;
	let required_for_change = 0.095;
	let tokenWord = dict[token];
	for( var x in alphas[token] ) {
		if( x == tokenWord ) return; // we don't want to use direct buzz words but adjacent ones.
		if( alphas[token][x] < mindist ) {
			mindist = alphas[token][x];
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

let gen = function(buf, flavorbuf, changing) {
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

	flavors = toTokens(flavorbuf);

	let ws = [], ts = [];
	let bufs = buf.split(" ");
	for( var i=0; i<bufs.length; i++ ) {
		ws.push(bufs[i]);
	}
	var lastToken=-1;

	var storage={};

	for( i=0; i<genWords; i++ ) {
		var w = {};
		ts=[];
		for( k=0; k<ws.length && k<setMode; k++ ) {
			a = toTokens(ws[k]);
			ts.push( a );
		}
		var startPt;
		if( setMode > ws.length )
			startPt = ws.length;
		else
			startPt = setMode;
		for( k=startPt; k>1; k-- ) {
			v = nextwordn(ts.slice(startPt-k));
			//console.log("v " + k + ":", v);
			let fact = 1/Math.pow(2,startPt-k);
			for( var j in v ) {
				if( !(j in w) ) w[j]=0;
				w[j] += v[j] * fact;
				if( w[j] > fact ) w[j] = fact;
			}
		}
		//console.log("W", ws, w);
		if( lastToken in w )
			delete w[lastToken];
		if( flavors.length > 0 ) {
			for( var x in w ) {
				if( !(x in alphas) ) {
					console.log("Missing word " + x);
					continue;
				}
				let adjust = 0;
				for( var j=0; j<flavors.length; j++ ) {
					for( var b of buzzWords ) {
						adjust += Math.abs( alphas[x][b] - alphas[flavors[j]][b] );
					}
				}
				//console.log("adjust " + dict[x] + " " + adjust);
				w[x] += adjust;
			}
		}
		w = nextof(w);
		lastToken = xdict[w];
		if( changing && flavors.length > 0 ) {
			changeEmotions(flavors, lastToken);
		}

		if( typeof w == 'undefined' ) {
			w = "a";
		}

		if( ws.length < setMode ) {
			ws.push(w);
		} else {
			for( k=0; k+1<ws.length && k+1<setMode; k++ ) {
				ws[k] = ws[k+1];
			}
			ws[k] = w;
		}

		buf = joinWord(buf,w);
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
		flavorbuf = "";
		i=0;
		console.log(flavcopy,highest);
		flavcopy = flavcopy.slice( 0, maxemote-highest.length );

		for( i=highest.length-1; i>=0; i-- ) {
			flavcopy.push( highest[i] );
		}
		for( i=0; i<flavcopy.length; i++ ) {
			if( flavorbuf == "" ) flavorbuf = dict[flavcopy[i]];
			else flavorbuf = joinWord(flavorbuf, dict[flavcopy[i]]);
		}
	}
	*/
	if( changing ) {
		flavorbuf = "";
		for( var i of flavors ) {
			if( flavorbuf != "" ) flavorbuf += " ";
			flavorbuf += dict[i];
		}
	}
	return [buf,flavorbuf];
}



//gen("Hello");
/*
const readline = require('node:readline');
const x = readline.createInterface({ input: process.stdin, output: process.stdout });
function xQ() {
	x.question("> ", result => { if( result != "" ) { console.log(gen(result)); xQ(); } else { x.close(); } });
}
xQ();
*/
if( typeof module != 'undefined' )
	module.exports = {'ac':alphaCalc,'sd':semdist,'data':data,'cn':corpn,xdict,dict};
