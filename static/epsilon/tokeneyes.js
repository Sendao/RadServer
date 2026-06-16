let alphas =null;

let cc = {
	a: 'a'.charCodeAt(0), z: 'z'.charCodeAt(0),
	A: 'A'.charCodeAt(0), Z: 'Z'.charCodeAt(0),
	zero: '0'.charCodeAt(0), nine: '9'.charCodeAt(0)
};
let vp = ".,!@#$%^&*_+-=\\|'\"";


let sentiments = null, thesaurus = null;
function prepareTokenLibs( s, t ) {
	sentiments = s;
	thesaurus = t;
}

let notEmotions = [
	".",",","the","of","a","in","and","to","is","i","you","it","that","my",
	"s","can","have","your","be","on","for","with",
	"0","1","2","3","4","5","6","7","8","9","-","all","this","not","t","are","me","or","so",
	"more","some","will"
	];
/*let buzzWords = [
	"love", "hate", "god", "power", "will", "i", "you", "s", "t", "a" 
	];*/
let opposites = {
	'love': 'hate',
	'god': 't',
	'power': 'will',
	'will': 'power',
	'i': 'you',
	'you': 'i',
	's': 'a',
	't': 'god',
	'a': 's'
};
let flavoids = {}, lastflavors=[], minFlavor=Infinity;
let routes = {};
let flavors = [];


let dict = [];
let xdict = {};
let pdict = {};
let top_xdict=0;
var corpn, corpp;
let data = {}, dlabels = {};
let corpus = "";

let setMode = 8;
let genWords = 70;


function letterType( c  )
{
	let n = c.charCodeAt(0);
	if( ( n >= cc.a && n <= cc.z ) || ( n >= cc.A && n <= cc.Z ) )
		return 0;
	if( n >= cc.zero && n <= cc.nine )
		return 1;
	if( c == ' ' || c == '\n' || c == '\r' || c == '\t' )
		return 2;
	if( vp.indexOf(c) >= 0 ) return 3;
	return 4;
}

function resetText()
{
	corpus="";
}
function addText(corpus_append)
{
	let a = tokenize1(corpus_append);
	dict = dict.concat(a);
	
}

function setText(corpus_input)
{
	if( corpus.indexOf(corpus_input) != -1 ) return;
	if( corpus == "" ) corpus = "" + corpus_input;
	else corpus += "\n" + corpus_input;

	corpusTokenize();
}

function tokenize1( str )
{
	var i,t;
	let w="",tokens=[];
	let type=-1;
	let dupes = new Set();

	str = str.toLowerCase();
	for( i=0; i<str.length; i++ ) {
		t = letterType(str[i]);
		if( t == type ) {
			switch( t ) {
			case 1: case 3:
				if( w != "" ) {
					if( !dupes.has(w) ) {
						dupes.add(w);
						tokens.push(w);
					}
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
				if( !dupes.has(w) ) {
					dupes.add(w);
					tokens.push(w);
				}
			}
			type=t;
			w=str[i];
		}
	}
	if( w != "" ) {
		if( !dupes.has(w) ) {
			dupes.add(w);
			tokens.push(w);
		}
	}

	return tokens;
}

function ex_token_eyes( str )
{
	var i,t;
	let w="",tokens=[];
	let type=-1;
	let words = new Map();

	let mapWord = function(w) {
		if( w == "" ) return;
		let n = tokens.length;
		tokens.push(w);

		let wx = words.get(w);
		if( wx === undefined ) {
			words.set(w,{ c: 1, t: [n], p: [] });
			return;
		}
		wx.t.push(n);
		wx.c++;
	};

	str = str.toLowerCase();
	for( i=0; i<str.length; i++ ) {
		t = letterType(str[i]);
		if( t == type ) {
			switch( t ) {
			case 0: case 1:
				w += str[i];
				break;
			case 2:
				w = "";
				break;
			case 3:
				mapWord(w);
				w = str[i];
				break;
			}
		} else {
			mapWord(w);
			w = str[i];
			type=t;
		}
	}
	if( w != "" ) {
		if( !dupes.has(w) ) {
			dupes.add(w);
			tokens.push(w);
		}
	}

	for( w in words ) {
		let wx = words[w];

		for( var x=0; x<wx.t.length; x++ ) {
			wx.p.push( wx.t[x]/tokens.length );
		}
	}

	return [words,tokens];
}
function corpusTokenize()
{
	xdict = {};
	pdict = {};
	data = {};
	dlabels = {};
	for( var w=0; w<dict.length; w++ ) {
		xdict[ dict[w] ] = w;
		if( dict[w]+1 >= top_xdict ) top_xdict=dict[w]+1;
	}

	//[corpn,corpp] = toTokensp(corpus);
	let glare = ex_token_eyes(corpus);
	corpn = eyes_to_tokens(glare);
	//corpn = toTokens(corpus);

	for( var n=1; n<6; n++ ) {
		let datarow = {};
		mchainn(corpn,datarow,n);
		for( var g in datarow ) {
			data[g] = datarow[g];
		}
	/*
		datarow={};
		mchainpn(corpp,datarow,n);
		for( var g in datarow ) {
			dlabels[g] = datarow[g];
		}*/
	}

	for( var i in data ) {
		let sum=0;
		for( var e in data[i] ) {
			sum += data[i][e];
		}
		if( Math.abs(sum-1) < 0.01 ) continue;

		for( var e in data[i] ) {
			data[i][e] = data[i][e]/sum;
		}
	}
}

function joinWord(phrase, word1)
{
	if( typeof word1 != 'string' ) {
		console.error("word should be a string ", word1);
		if( typeof phrase == 'undefined' ) return "";
		return phrase;
	}
	if( typeof phrase == 'undefined' || phrase == "" ) return word1;

	let t = letterType(word1[0]);
	let u = letterType(phrase[phrase.length-1]);
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

function newWord(x)
{
	console.log("newWord(" + x + ")=" + dict.length);
	xdict[x] = 0+dict.length;
	let v = 0+dict.length;
	dict.push(x);
	top_xdict=v+1;
	return v;
}

//console.log(dict);
function fromTokens( tk )
{
	var i,len=tk.length;
	var tokens = "";
	for(i=0;i<len;i++){
		if( typeof tk[i] == 'undefined' || isNaN(tk[i]) ) continue;
		tokens = joinWord(tokens, dict[tk[i]]);
	}
	return tokens;
}
function eyes_to_tokens( eyes )
{
	let [eye0, eye1] = eyes; // [w], {w:{c,t,p}}
	let mouth = [];

	for( var w of eye0 ) {
		if( !(w in xdict) )	mouth.push( newWord(w) );
		else mouth.push(xdict[w]);
	}

	return mouth;
}

function toTokens( str )
{
	var i,t;
	let w="",tokens=[];
	let type=-1;
	if( typeof str == 'undefined' ) return tokens;
	if( str == "" ) return tokens;

	str = str.toLowerCase();
	for( i=0; i<str.length; i++ ) {
		t = letterType(str[i]);
		if( t == type ) {
			switch( t ) {
			case 1: case 3:
				if( w != "" ) {
					if( !(w in xdict) ) tokens.push( newWord(w) );
					else tokens.push(xdict[w]);
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
				if( !(w in xdict) ) tokens.push( newWord(w) );
				else tokens.push(xdict[w]);
				w = "";
			}
			type=t;
			if( t != 2 && t != 4 ) {
				w += str[i];
			}
		}
	}
	if( w != "" ) {
		if( !(w in xdict) ) tokens.push( newWord(w) );
		else tokens.push(xdict[w]);
	}

	return tokens;
}
function toTokensp( str )
{
	var i,t;
	let w="",tokens=[],labels=[];
	let type=-1;
	if( str == "" ) return [];

	str = str.toLowerCase();
	for( i=0; i<str.length; i++ ) {
		t = letterType(str[i]);
		if( t == type ) {
			switch( t ) {
			case 1: case 3:
				if( w != "" ) {
					if( w in xdict ) {
						tokens.push(xdict[w]);
						if( w in parts )
							labels.push(parts[w]);
						else
							labels.push(['n']);
					}
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
				if( w in xdict ) {
					tokens.push(xdict[w]);
					if( w in parts )
						labels.push(parts[w]);
					else
						labels.push(['n']);
				}
				w = "";
			}
			type=t;
			if( t != 2 )
				w += str[i];
		}
	}
	if( w != "" && w in xdict ) {
		tokens.push(xdict[w]);
		if( w in parts )
			labels.push(parts[w]);
		else
			labels.push(['n']);
	}

	return [tokens,labels];
}

let mchainn = function(tokens,nexts,n)
{
	let prevs = new Array(n);
	var prev = "";
	var i,k;

	for( i=0; i<n; i++ ) {
		prevs[i] = tokens[i];
		if( prev != "" ) prev += ",";
		prev += prevs[i];
	}

	for( i=n; i<tokens.length; i++ ) {

		if( !(prev in nexts) ) nexts[prev] = {};
		if( !(tokens[i] in nexts[prev]) ) nexts[prev][tokens[i]] = 1;
		else nexts[prev][tokens[i]]++;
		
		prev = "";
		for( k=0; k<n-1; k++ ) {
			prevs[k] = prevs[k+1];
			if( prev != "" ) prev += ",";
			prev += prevs[k];
		}
		prevs[k] = tokens[i];
		if( prev != "" ) prev += ",";
		prev += prevs[k];
	}

	for( i in nexts ) {
		let arr = nexts[i];
		let sum=0;
		for( k in arr ) {
			sum += arr[k];
		}
		for( k in arr ) {
			arr[k] = arr[k] / sum;
		}
	}

	return nexts;
}
let mchainpn = function(tokens,nexts,n)
{
	let prevs = new Array(n);
	var i,j,k;
	let search = [];

	for( i=0; i<n; i++ ) {
		prevs[i] = tokens[i];
		if( search.length == 0 ) {
			search = prevs[i];
		} else {
			let new_search = [];
			for( k=0; k<search.length; k++ ) {
				for( j=0; j<prevs[i].length; j++ ) {
					new_search.push(search[k] + "," + prevs[i][j])
				}
			}
			search = new_search;
		}
	}

	for( i=n; i<tokens.length; i++ ) {
		for( j=0; j<search.length; j++ ) {
			let prev = search[j];

			if( !(prev in nexts) ) nexts[prev] = {};
			for( k=0; k<tokens[i].length; k++ ) {
				if( !(tokens[i][k] in nexts[prev]) ) nexts[prev][tokens[i][k]] = 1;
				else nexts[prev][tokens[i][k]]++;
			}
			
			prev = "";
			for( k=0; k<n-1; k++ ) {
				prevs[k] = prevs[k+1];
				if( search.length == 0 ) {
					search = prevs[i];
				} else {
					let new_search = [];
					for( k=0; k<search.length; k++ ) {
						for( j=0; j<prevs[i].length; j++ ) {
							new_search.push(search[k] + "," + prevs[i][j])
						}
					}
					search = new_search;
				}
			}
			prevs[k] = tokens[i];
			if( search.length == 0 ) {
				search = prevs[i];
			} else {
				let new_search = [];
				for( k=0; k<search.length; k++ ) {
					for( j=0; j<prevs[i].length; j++ ) {
						new_search.push(search[k] + "," + prevs[i][j])
					}
				}
				search = new_search;
			}
		}
	}

	for( i in nexts ) {
		let arr = nexts[i];
		let sum=0;
		for( k in arr ) {
			sum += arr[k];
		}
		for( k in arr ) {
			arr[k] = arr[k] / sum;
		}
	}

	return nexts;
}

let nextword0 = function()
{
	var m = 0;
	for( var w in dict ) {
		if( !(w in data) ) continue;
		m += data[w].length;
	}
	var q = qRandom(0,m);
	for( var w in dict ) {
		if( !(w in data) ) continue;

		q -= data[w].length;
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

let nextwordn = function(ws=[])
{
	var x = "";
	var i;

	for( i=0; i<ws.length; i++ ) {
		if( x != "" ) x += ",";
		x += ws[i];
	}
	x = x.toLowerCase();

	if( x != "" && x in data ) {
		return data[x];
	} else if( ws.length > 1 ) {
		return nextwordn( ws.slice(1) );
	} else {
		return nextword0();
	}
}
let nextwordpn = function(ws,ps)
{
	var x = "";
	var i, j, k;

	for( i=0; i<ws.length; i++ ) {
		if( x != "" ) x += ",";
		x += ws[i];
	}
	x = x.toLowerCase();

	var ys = [];
	for( i=0; i<ps.length; i++ ) {
		if( typeof ps[i] == 'undefined' || ps[i] === 'undefined' ) continue;
		var new_ys = [];
		for( j=0; j<ps[i].length; j++ ) {
			for( k=0; k<ys.length; k++ ) {
				new_ys.push( ys[k] + "," + ps[i][j] );
			}
		}
		ys = new_ys;
	}

	var a,b;

	if( x in data ) {
		a = data[x];
	} else if( ws.length > 1 ) {
		return nextwordpn( ws.slice(0,ws.length-1), ps.slice(0,ps.length-1) );
	} else {
		x = dict["the"];
		var q = {};
		q[x] = 1;
		a = q;
	}

	b=[];
	for( k=0; k<ys.length; k++ ) {
		y = ys[k];
		if( y in dlabels ) {
			b = b.concat(dlabels[y]);
		} else {
			y = 'n';
			var q = {};
			q[y] = 1;
			b = q;
		}
	}

	return [a,ys];
}

function nextofp( nestw, nestp )
{
	var t = 0;
	for( var i in nestp ) {
		t += nestp[i];
	}
	var x = Math.random()*t;
	let part = "";
	for( var i in nestp ) {
		x -= nestp[i];
		if( x <= 0 ) {
			part = i;
			break;
		} 
	}

	t = 0;
	for( var i in nestw ) {
		if( pdict[i].indexOf(part) >= 0 )
			t += nestw[i];
	}
	x = Math.random()*t;
	for( var i in nestw ) {
		if( pdict[i].indexOf(part) == -1 ) continue;
		x -= nestw[i];
		if( x <= 0 ) return dict[ i ];
	}
	var k = Object.keys(nestw);
	return dict[ k[ k.length - 1 ] ];
}

//console.log("-");

let genp = function(buf) {
	var i,k;
	var a,b;
	var u,v;

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

	let ws = [], ts = [], ps = [];
	let bufs = buf.split(" ");
	for( var i=0; i<bufs.length; i++ ) {
		ws.push(bufs[i]);
	}


	for( i=0; i<genWords; i++ ) {
		var w = {}, z = {};
		ts=[];
		ps=[];
		for( k=0; k<ws.length && k<setMode; k++ ) {
			[a,b] = toTokens(ws[k]);
			ts.push( a );
			ps.push( b );
//			if( i < 5 ) console.log("T",ts);
			[v,u] = nextwordpn(ts,ps);
			for( var j in v ) {
				w[j] = v[j] * 1/Math.pow(4,ws.length-k);
			}
			for( var j in u ) {
				z[j] = u[j] * 1/Math.pow(4,ws.length-k);
			}
		}
		w = nextofp(w,z);
		if( typeof w == 'undefined' ) {
			w = "a";
		}

		for( k=0; k+1<ws.length && k+1<setMode; k++ ) {
			ws[k] = ws[k+1];
		}
		ws[k] = w;

		for( k=0; k+1<ps.length && k+1<setMode; k++ ) {
			ps[k] = ps[k+1];
		}
		ps[k] = parts[w];

		buf = joinWord(buf,w);
	}
	return buf;
}

function canFinishSentence( wordlist, sentence )
{
	let sentences = [ // Generative forms
		"n is a v",
		"n is a n",
		"n v",
		"s and s",
		"s but s",
		"s while s",
		"s then s"
		];
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
		if( x <= 0 ) return dict[i];
	}
	var k = Object.keys(nest);
	return dict[ k[ k.length - 1 ] ];
}

let insert = function(lst,tgt,val)
{
	for( var i=0;i<lst.length;i++ ) {
		if( lst[i][1] > val ) {
			lst.splice(i,0,[tgt,val]);
			return;
		}
	}
	lst.push([tgt,val]);
}

let semdist = function(edge1, edge2, searchFor)
{
	let q = [[edge1,0]];
	var e,d,i,v = new Set();
	if( !(edge1 in data) ) return -1;
	v.add(edge1);

	while( q.length > 0 ) {
		[e,d] = q.shift();

		for( i in data[e] ) {
			if( i == edge2 ) return d+(1.1-data[e][i]);
			if( !(i in data) ) continue;
			if( v.has(i) ) continue;
			if( i in alphas && alphas[i][searchFor] != -1 ) {
				return d+(1-data[e][i])+alphas[i][searchFor];
			}
			insert( q, i, d+(1.1-data[e][i]) );
		}
	}
	return -1;
}
function getParams()
{
	let f = new Set();
	let params = {};
	for( var i=0; i<corpn.length; i++ ) {
		if( f.has(corpn[i]) ) continue;
		f.add(corpn[i]);
		w=corpn[i];
		params[w]=true;
	}
	// find some buzzers
	let similars = [];
	let themes = [];

	for( var w in params ) {
		let x = {};


		params[w] = x;
	}


	for( )

	let categories = [];




		//betas[w] = {};
		let sum=0;
		for( var h of buzzWords ) {
			if( xdict[h] == w ) continue;
			params[w][h] = semdist(w, xdict[h], h);
			//betas[w][x] = semdist(x, w,true);
			sum += params[w][h];
		}
		for( var h of buzzWords ) {
			params[w][h] /= sum;
		}
		console.log(dict[w] + "-" + w + "/" + Object.keys(data).length);
	}

	//downloadFile(JSON.stringify(params), "params.json"); -> i mean, we could, but let's just ... it only takes a moment.
	alphas = params;
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
				//if( x in flavoids ) w[x] *= flavoids[x];
				//else w[x] *= minFlavor/2;
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
