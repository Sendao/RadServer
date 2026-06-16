/*
function mRandom(l,u)
{
  if( typeof u == 'undefined' )
    return Math.floor( qRandom(l) );
  return Math.round( qRandom(l, u-l) );
}
*/
var exploring = false;

function markyPick( mmind, preword )
{
  if( !(preword in mmind) ) return '';
  var i, found, w = mmind[preword].s; // words
  var l = w.length;
  if( l <= 0 ) return 'uhh';
  var n = qRandom( mmind[preword].t ); // total

  for( i=0; i<l; i += 2 ) {
    n -= w[i+1];
    if( n < 0 )
      return w[i];
  }
  return 'uhh';
}

function markCompile( answers )
{
  var i;
  var mind, words;
  var combined = {};

  for( i=0; i<answers.length; ++i ) {
    mind = radVar("lines." + answers[i]);
    words = radVar("words." + answers[i]);
    for( var j in words ) {
      if( !(j in combined) ) {
        combined[j] = cloneObject( words[j] );
        continue;
      }

      for( var n in words[j].s ) {
        combined[j].s.push( words[j].s[n] );
      }
      combined[j].t += words[j].t;
    }
  }

  return combined;
}

function markSort( comb )
{
  for( var word in comb ) {
    var l = [];
    for( var x=0; x<comb[word].s.length; x+=2 ) {
      l.push( [ comb[word].s[x], comb[word].s[x+1] ] );
    }
    l.sort( (a,b) => (b[1] - a[1]) );
    //console.log(l);
    comb[word].s = [];
    for( var x=0; x<l.length; x++ ) {
      comb[word].s.push( l[x][0], l[x][1] );
    }
  }
}

var marky_timer=-1;
var marky_repeat=false;

function markyRefresh()
{
  if( marky_repeat ) return;
  marky_repeat=true;
  setTimeout( markyBrain, 0 );
}

var nest = null, explored = false;
function markyExploreStart()
{
  exploring = true;
  markyExplore();
}
function markyExplore()
{
  //var tgt = gE("marky_out_brain");

  var mmind = radVar("words.");
  var buf = '';

  var i, n, lastword, word;
  var mib = radVar("marky_in_brain");

  var words = mib.keywords.split(" ");
  var desired = mib.linelength;
  var count = 0;
  var lines = mib.linecount;
  var lcount = 0;

  var ptargets = [], vtargets;
  var stock = [];

  // collect words from all selected answers
  var answers = [];
  var afrom = document.forms.mselector.listid.options;
  var found = false;
  for( i=0; i<afrom.length; ++i ) {
    if( afrom[i].selected ) {
      answers.push( afrom[i].value );
      found=true;
    }
  }
  if( !found ) return;

  var mmind = markCompile(answers);
  markSort(mmind);
  nest = mmind;

  var mdata = "";

  var counts = {}, cl = [];

  for( var word in nest ) {
    let node = nest[word];
    for( var i=0; i < node.s.length; i+= 2 ) {
      if( !(node.s[i] in counts) ) counts[ node.s[i] ] = 0;
      counts[ node.s[i] ] += parseInt(node.s[i+1]);
    }
  }
  for( var w in counts ) {
      cl.push( [w, counts[w]] );
  }
  cl.sort( (a,b) => (b[1] - a[1]));

  explored = cl;

  mdata = "<div class=fl>";
  for( var i=0; i < cl.length; i++ ) {
      mdata += "<div class=fl onClick='markyExploreWord(\"" + cl[i][0] + "\")'>" + cl[i][0] + ":" + cl[i][1] + "</div>";
  }
  mdata += "</div><div class=cl></div><!--end-->";

  radStore("markyexplore", mdata)
}
function markyExploreWord( w )
{
  var mdata = radVar("markyexplore");

  var xp = mdata.lastIndexOf("<!--end-->");
  if( xp < 0 ) return;

  xp += 10;
  mdata = mdata.substr(0,xp) + "<BR><div class=fl>&nbsp;</fl><div class=cl>&nbsp;</div><BR>";

  if( (w in nest) ) {
    var mnode = nest[w];

    for( var i=0; i<mnode.s.length; i+= 2 ) {
      mdata += "<div class=fl onClick='markyExploreWord(\"" + mnode.s[i] + "\")'>" + mnode.s[i] + ":" + mnode.s[i+1] + "</div>";
    }

  }
  radStore("markyexplore", mdata);

}

let mn = false;
let lastrecord = null;
function clearMemory()
{
  if( mn === false ) mn = randStr(5);
  window[mn] = [ 0, new Map(), 0, 0 ];
  localStorage['mm'] = 'undefined';
  //radStore("markytrove", "");
  radStore("markynest", {});
}
let strtab = [];
let strref = {};
let limrecord=3;
let limwords=2;

let dislist = {};

function listifymap(m)
{
  var stack = [false,m];
  let base = [], key;

  while( stack.length > 0 ) {
    key = stack.shift();
    if( key !== false ) {
      base.push(key);
    }
    m = stack.shift();
    base.push( m[0], m[2], m[3], m[1].size );
    if( m[1].size > 0 ) {
      for( var [k, val] of m[1].entries() ) {
        stack.unshift(val);
        stack.unshift(k);
      }
    }
  }

  return base;
}
function serializemap(m)
{
  var mapbuf=listifymap(m).join(",");
  localStorage['mm'] = mapbuf;
}
function deserializemap()
{
  var mapbuf = localStorage['mm'];
  if( typeof mapbuf == 'undefined' || mapbuf == 'undefined' ) return [0, new Map(), 0, 0];
  var maplist = mapbuf.split(",");
  var root = [];
  let stack = [ root ];
  var endpt = [ maplist.length ];
  var node;
  for( var i=0; i<maplist.length; i+=5 ) {
    if( endpt.length > 1 )
      endpt[ endpt.length-2 ] -= 1;
    node = stack[ stack.length-1 ];
    node.push( parseInt( maplist[i] ));
    node.push( new Map() );
    node.push( parseInt( maplist[i+1] ) );
    node.push( parseInt( maplist[i+2] ) );
    var sz = parseInt(maplist[i+3]);
    if( sz == 0 ) {
      endpt.pop();
      stack.pop();
      do {
        if( endpt[ endpt.length-1 ] > 0 ) break;
        endpt.pop();
        stack.pop();
      } while( stack.length > 0 );
      if( stack.length <= 0 ) {
        console.log("Early end @ " + i + "/" + maplist.length);
        break;
      }
      node = stack[ stack.length-1 ];
    } else {
      endpt[ endpt.length-1 ] = sz;
    }
    if( i+4 >= maplist.length ) break;
    var o = [];
    node[1].set( maplist[i+4], o );
    stack.push( o );
    endpt.push( -1 );
  }
  return root;
}

let memspot=-1;

function markyBrainStart()
{
  exploring = false;
  paused = false;
  markyBrain();
}

function markyBrain()
{
  var mmind = radVar("words.");
  var buf = '';

  var i, n, lastword, word;
  var mib = radVar("marky_in_brain");

  limrecord = mib.limrecord;
  limwords = mib.limwords;

  let banned = ['undefined', 'retarded'];
  var words = mib.keywords.split(" ");
  var desired = mib.linelength;
  var count = 0;
  var lines = mib.linecount;
  var lcount = 0;

  var ptargets = [], vtargets;
  var stock = [];

  // collect words from all selected answers
  var answers = [];
  var afrom = document.forms.mselector.listid.options;
  var found = false;
  for( i=0; i<afrom.length; ++i ) {
    if( afrom[i].selected ) {
      answers.push( afrom[i].value );
      found=true;
    }
  }
  if( !found ) return;
  var mmind = markCompile(answers);

  for( i=0; i<words.length; ++i ) {
    if( ptargets.indexOf(words[i]) == -1 && words[i] in mmind ) {
      ptargets.push( words[i] );
    }
  }
  vtargets = Array.from(ptargets);

  var linebufs = "";
  var history = [];

  if( mn === false ) {
    mn = randStr(6);
    window[mn] = [0,new Map(),0,0];
  } else if( false ) {
    if( mn !== false ) delete window[mn];
    mn = randStr(5);
    window[mn] = deserializemap();
  }

  let trace = function(cp, cpe)
  {
    if( cpe-cp > 25 ) {
      console.log("!!",cp,cpe);
    }
    let node = window[mn];
    for( var i=cp; i<cpe; i++ ) {
      let word=history[i];
      if( !node[1].has( word ) ) {
        var o = [ 1, new Map(), cp, i ];
        node[1].set( word, o );
        node = o;
      } else {
        node = node[1].get(word);
      }
    }
    node[0]++;
  }


  let setcount = function(buf, count)
  {
    let lst = buf.split(" ");
    let node = window[mn];
    for( var i=0; i<lst.length; i++ ) {
      let word=lst[i];
      if( !node[1].has( word ) ) {
        var o = [ 1, new Map(), 0, i ];
        node[1].set( word, o );
        node = o;
      } else {
        node = node[1].get(word);
      }
    }
    node[0]=count;
  }

  let fullbuf = "";

  for( lcount=0; lcount<lines; lcount++ ) {

    buf = "";
    word = 'uhh';
    for( count=0; count<desired; ++count ) {
      if( word == 'uhh' || word == '' ) {
        history.push(false);
        if( ptargets.length <= 0 )
          ptargets = Array.from(vtargets);
        word = ptargets.shift();
      }

      if( buf == '' ) {
        buf = word;
      } else {
        buf = buf + " " + word;
      }
      history.push(word);
      strtab.push(word);

      if( !(word in mmind) ) {
        console.log("Not found word: " + word);
        word = "a";
      }

      word = markyPick(mmind,word);
    }

    linebufs = linebufs + "<br />" + buf;
    fullbuf += " " + buf;
  }
  radStore("markytextfull", fullbuf);

  // full memory method
  for( var i=0; i<history.length; i++ ) {
    for( var j=i; j<history.length; j++ ) {
      if( history[j] === false ) {
        break;
      }
      for( var k=j+1; k<history.length; k++ ) {
        if( history[k] === false ) break;
        trace(j,k);
      }
    }
    i = j;
  }
  /* reduced method
  for( var i=0; i<history.length; i++ ) {
    var mh = [ history[i] ];
    for( var j=i+1; j<history.length; j++ ) {
      if( history[j] === false ) {
        trace(i,j);
        i = j;
        break;
      }
    }
  }
  */


  var memnest = new Map();
  let scan = function(node, prefix="") {
    let stack = [[node,prefix,0]];
    let lastval = false;
    while( stack.length > 0 ) {
      [node,prefix,lastval] = stack.shift();

      let prefix_stored=false;

      for( var [word, val] of node.entries() ) {
        if( banned.indexOf(word) >= 0 ) continue;
        let buf = "";
        if( prefix != "" ) buf = prefix + " ";
        buf += word;

        if( !prefix_stored && val[0] < lastval ) {
          prefix_stored=true;
          if( memnest.has(prefix) ) memnest.set(prefix, memnest.get(prefix) + (lastval-val[0]) );
          else memnest.set(prefix, lastval-val[0]);
        }

        if( val[1].size == 0 ) {
          if( memnest.has(buf) ) memnest.set(buf, memnest.get(buf) + val[0]);
          else memnest.set(buf, val[0]);
        } else {
          stack.push( [val[1], buf, val[0]] );
        }
      }
    }
  }
  scan(window[mn][1]);
  //console.log(memnest);

  var memrecord = [];
  for( var [buf,count] of memnest.entries() ) {
    memrecord.push([buf,count]);
  }
  memrecord.sort( (a,b) => (a[1] - b[1]) );

  var output = "";
  var lastn=-1;

  var newrecord = {};
  var buf, oldrec=false;
  var lines = [];
  var rightside = 0;
  var numn=limrecord;
  let head="";

  let outputs = {};

  if( radVar("markynest") == null ) radStore("markynest", {});

  for( var i=0; i<memrecord.length; i++ ) {
    var a = memrecord[i][0], b = memrecord[i][1];
    if( b != lastn ) {
      if( lines.length > 0 ) {
        let tmp = lines.join("<div class=cl></div>");
        radStore("markynest." + lastn, tmp);
        output += tmp;
        lines = [];
        rightside=0;
      }
      lastn = b;
      if( b > limrecord )
        numn++;
      if( lastn >= limrecord ) {
        buf = "<div class=cl></div><div class=cl>&nbsp;</div>\n";
        buf += "<div class=fl><div class=fl>" + numn + ":</div><button id=anchorbtn" + numn + " onClick='toggleAnchor(" + numn + ")'>" + (anchorno == numn ? "Release" : "Anchor") + "</button></div>\n";
        newrecord[numn] = [];
        head = buf;
        if( lastrecord !== null && numn in lastrecord ) {
          oldrec = lastrecord[numn];
        } else {
          oldrec = false;
        }
      }
    }

    if( lastn >= limrecord ) {
      if( lastn > numn ) {
        setcount(a, numn);
      }
      if( a.split(" ").length >= limwords ) {
        buf = "<div class=fl>" + a + "</div>";
        if( head != "" ) {
          buf = head + buf;
          head = "";
        }

        lines.push(buf);
        if( oldrec !== false ) {
          var x = oldrec.indexOf(a);
          if( x >= 0 ) {
            oldrec.splice(x,1);
          } else {
            while( lines.length <= rightside ) lines.push("");
            lines[rightside] += "<div class=fr>" + a + "</div>";
            rightside++;
          }
        } else {
          while( lines.length <= rightside ) lines.push("");
          lines[rightside] += "<div class=fr>" + a + "</div>";
          rightside++;        
        }
        newrecord[numn].push(a);
      }
    }
  }
  lastrecord = newrecord;
  if( lines.length > 0 ) {
    let tmp = lines.join("<div class=cl></div>");
    radStore("markynest." + lastn, tmp);
    output += tmp;
  }
  output += "<div class=cl></div>\n";
  //serializemap(window[mn]);

  //radStore("markytrove", output);
  output = "";
  var sorted=[];
  for( var i in dislist ) {
    sorted.push( [ i, dislist[i] ] );
  }
  sorted.sort( (a,b) => ( a[1] - b[1] ) );
  lastn=-1;
  let remakes=[];
  for( var i=0; i<sorted.length; i++ ) {
    var b = sorted[i][1];
    if( b != lastn ) {
      output += "<div class=fl>" + b + ": </div>";
      lastn = b;
    }
    output += "<div class=fl>" + sorted[i][0] + "</div><div class=cl></div>";
    if( sorted[i][0].split(" ").length == mib.linecount ) {
      remakes.push( sorted[i][0] );
    }
  }
  radStore("markydisc", output);

  if( mib.remake == 1 && remakes.length > 0 ) {
    let rm = Math.floor( qRandom( remakes.length ) );
    mib.keywords = remakes[ rm ];
  }
  radStore("markyrender", linebufs + "<br />");

  marky_repeat=false;
  if( mib.refreshrate == 0 ) {
    if( gravTimer != -1 ) {
      clearTimeout(gravTimer);
    }
    registerRadPost(markyRefresh);
    //setImmediate(intanimate);
  } else {
    if( marky_timer != -1 ) {
      clearInterval(marky_timer);
      marky_timer = -1;
    }
    marky_timer = setInterval('markyRefresh()', mib.refreshrate*1000 );
  }
}

function animate() {
  if( exploring ) {
    markyExplore();
  } else {
    markyBrain();
  }
}
function oldanimate() {
  if( running )
    return;
  else
    running = true;

  if( paused ) {
    animdone();
    return;
  }

  var tn = new Date();
  registerRadPost(animdone);
  markyBrain();
  var tx = new Date();

  var td = tx - tn;
  var chg=false;
  if( gravTimeout < td*6 ) { // using too much cpu.
    gravTimeout = td*6;
    chg=true;
  } else if( gravTimeout > td ) { // going too slowly.
    gravTimeout = td;
    chg=true;
  }

  if( gravTimer === -1 ) chg=true;
  if( gravTimeout > 5000 )
    console.log("gt="+gravTimeout);

  running=false;
  //animdone();
}



function gotMarkyData(details) {
  var o = JSON.parse( details );
  var d = o.data;
  var listid, lists = {}, words = {};
//    console.log("gotMD(" + details + ")");

  for( listid in d ) {
    lists[listid] = d[listid].name;
    words[listid] = d[listid].words;
  }
  radStore("words", words);
  radStore("lists", lists);

  console.log("Loaded");
}

// Interface stuff


  var isAnchored = false;
  var anchorno=-1;
  function anchorKeys(ev) {
    if( !isAnchored ) return;
    if( ev.keyCode == 35 ) { // end
      setAnchorTo(1000);
    } else if( ev.keyCode == 36 ) { // home
      setAnchorTo(limrecord);
    }
    if( ev.code == "ArrowUp" ) {
      if( anchorno == limrecord ) return;
      gE("anchorbtn" + anchorno).innerHTML = "Anchor";

      do {
        anchorno--;
        if( anchorno <= limrecord ) {
          break;
        }
      } while( gE("anchorbtn" + anchorno) === null );

      setAnchorTo(anchorno);
    } else if( ev.code == "ArrowDown" ) {
      if( anchorno == 1000 ) return;
      gE("anchorbtn" + anchorno).innerHTML = "Anchor";
      do {
        anchorno++;
        if( anchorno >= 1000 ) {
          break;
        }
      } while( gE("anchorbtn" + anchorno) === null );
      setAnchorTo(anchorno);
    }
  }
  function anchored() {
    if( !isAnchored ) return;
    setTimeout("anchored2()",50);
  }
  let scrollopts = { behavior: 'instant', block: 'center', inline: 'nearest' };
  function anchored2()
  {
    if( anchorno < 0 ) {
      isAnchored=false;
    } else {
      var e = gE("anchorbtn" + anchorno);
      if( !e && anchorno == limrecord ) {
        var x = limrecord+1;
        do {
          e = gE("anchorbtn" + x);
          x++;
        } while( !e );
        e.scrollIntoView(scrollopts);
      }
      if( e ) {
        e.scrollIntoView(scrollopts);
      } else if( anchorno != 100 ) {
        anchorno = 100;
        anchored2();
      }
    }
  }
  var anchor_set=false;
  function toggleAnchor(x) {
    if( !anchor_set ) {
      anchor_set=true;
      //radHook( "markytrove", anchored );
      radHook( "markynest", anchored );
      document.addEventListener( 'keydown', anchorKeys );
    }
    if( anchorno == x ) {
      isAnchored = !isAnchored;
    } else {
      isAnchored = true;
    }
    if( isAnchored )
      setAnchorTo(x);
    else if( anchorno != -1 ) {
      gE("anchorbtn" + anchorno).innerHTML = "Anchor";
      anchorno=-1;
    }
  }
  function setAnchorTo(x) {
    if( anchorno != -1 ) {
      let e = gE("anchorbtn" + anchorno);
      if( e )
        e.innerHTML = "Anchor";
    }
    anchorno = x;
    let e = gE("anchorbtn" + x);
    if( e ) {
      e.innerHTML = "Release";
      e.scrollIntoView(scrollopts);
    }
  }
function sendMarkyData()
{
  var f = radVar("marky.input");
  RadPost("/marky/upload", { 'name': f.name, 'text': f.text, 'private': f.private ? f.private : 0 });
}