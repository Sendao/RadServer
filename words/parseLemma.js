import fs from 'fs';
import readline from 'readline';
import he from 'he';
function decodeHtmlEntities(str) {
  const decoded = he.decode(str);
  return decoded;
}
import { SimpleKVStore, LargeKVStore } from '../lib/eccentric/db.js';
import { StringTrie } from '../lib/eccentric/zcastle.js';
import {Utils} from '../lib/tool/util.js';
const util = new Utils();

const XML_FILE = 'english-wordnet-2025-plus.xml';
const XML_FILE2 = "english-wordnet-2025.xml";

let lemmas = [];
let currentEntry = null;
let currentLemma = null;
let currentPos = null;
let currentSense = null;
let currentSynsetId = null;
let inDefinition = false;
let inExample = false;
let currentText = '';


let created_props = 0;

let synsetDefs = new Map();
let senseCount = 0;
let entryCount = 0;
let outputCount = 0;

let lemmaToSenses = new Map();
let lemmaCount = 0;
let synsetCount = 0;
let exampleCount = 0;
let definitionCount = 0;
let exampleCount1 = 0;
let definitionCount1 = 0;

function parseLemmas(line)
{
  var i;
  const trimmed = line.trim();
  var trimmedb;
  
  if (currentSynsetId && trimmed.includes('<Definition>')) {
    inDefinition = true;
    currentText = '';
  } else if (currentSynsetId && trimmed.includes('<Example>')) {
    inExample = true;
    currentText = '';
  }
  
  var position;
  
  if (inDefinition) {
    trimmedb = ''+trimmed;
    position = trimmedb.indexOf("<Definition>");
    if( position != -1 ) {
      trimmedb = trimmedb.substring(position+12);
    }
    position = trimmedb.indexOf("</Definition>");
    if( position != -1 ) {
      inDefinition = false;
      trimmedb = trimmedb.substring(0,position);
    }
    trimmedb = trimmedb.trim();
    if( trimmedb )
      currentText = (currentText ? (currentText+' ') : '') + trimmedb;

    if( !inDefinition ) {
      if( !synsetDefs.has(currentSynsetId) ) {
	      synsetDefs.set(currentSynsetId, {});
      }
      let cdef = synsetDefs.get(currentSynsetId);
      let defv = decodeHtmlEntities(currentText);
      
      if( !('def' in cdef) ) cdef['def'] = defv;
      else {
        let lines = cdef['def'].split('\n');
      	if( lines.indexOf(defv) == -1 ) {
          cdef['def'] += "\n" + defv;
        }
      }
      definitionCount1++;
    }
    return;
  } else if(inExample) {
    trimmedb = ''+trimmed;
    position = trimmedb.indexOf("<Example>");
    if( position != -1 ) {
      trimmedb = trimmedb.substring(position+9);
    }
    position = trimmedb.indexOf("</Example>");
    if( position != -1 ) {
      inExample = false;
      trimmedb = trimmedb.substring(0,position);
    }
    trimmedb = trimmedb.trim();
    if( trimmedb )
      currentText = (currentText ? (currentText+' ') : '') + trimmedb;

    if( !inExample ) {
      if( !synsetDefs.has(currentSynsetId) ) {
        synsetDefs.set(currentSynsetId, {});
      }
      let cdef = synsetDefs.get(currentSynsetId);
      let defv = decodeHtmlEntities(currentText);
	    
      if( typeof defv == 'undefined' ) {
        console.log("what");
        throw "what";
      }
      if( defv == '' || defv == '0' ) {
        console.log("Empty ex field");
        return;
      }

      if( !('ex' in cdef) ) cdef['ex'] = defv;
      else {
        let lines = cdef['ex'].split('\n');
        if( lines.indexOf(defv) == -1 ) {
            cdef['ex'] += "\n" + defv;
        }
      }
      exampleCount1++;
    }
    return;
  }
  
  if (trimmed.startsWith('<LexicalEntry')) {
    currentEntry = true;
    currentLemma = null;
    currentPos = null;
    currentSense = null;
  } else if (currentEntry && trimmed.startsWith('<Lemma ')) {
    const wfMatch = trimmed.match(/writtenForm="([^"]+)"/i);
    const posMatch = trimmed.match(/partOfSpeech="([^"]+)"/i);
    
    currentLemma = currentPos = null;
    
    if (wfMatch)
      currentLemma = wfMatch[1];
    if (posMatch)
      currentPos = posMatch[1];
      
    if( currentLemma && currentPos ) {
	var sense;
	if( lemmaToSenses.has(currentLemma) ) {
		sense = lemmaToSenses.get(currentLemma);
		if( Array.isArray(sense.pos) ) {
			if( sense.pos.indexOf(currentPos) == -1 ) {
				sense.pos.push(currentPos);
			}
		} else if( sense.pos != currentPos ) {
			sense.pos = [sense.pos, currentPos];
		}
	} else {
		sense = { pos: currentPos, senses: [] };
      		lemmaToSenses.set(currentLemma, sense);
	}

      lemmaCount++;
    }
  } else if (currentEntry && trimmed.startsWith('<Sense ')) {
    const idMatch   = trimmed.match(/id="([^"]+)"/);
    const synMatch  = trimmed.match(/synset="([^"]+)"/);
    
    if (synMatch && currentLemma) {
      currentSense = {
        sense_id: idMatch ? idMatch[1] : null,
        synset_id: synMatch[1]
      };
      if( !lemmaToSenses.has(currentLemma) ){
        console.log("Extra lemma/sense: " + currentLemma);
      } else {
        lemmaToSenses.get(currentLemma).senses.push(currentSense);
        senseCount++;
      }
    }
  } else if (trimmed.startsWith('<Synset ')) {
    const idMatch = trimmed.match(/id="([^"]+)"/);
    
    if (idMatch) {
      currentSynsetId = idMatch[1];
      if (!synsetDefs.has(currentSynsetId)) {
        synsetDefs.set(currentSynsetId, {});
        synsetCount++;
      }
    }
  }
  
  if (trimmed.includes('</LexicalEntry>') || trimmed.includes('/>') && currentEntry) {
    if (currentLemma && currentPos && currentSense)
      entryCount++;
    
    currentEntry = currentLemma = currentPos = currentSense = null;
  } else if (trimmed.includes('</Sense>')) {
    currentSense = null;
  } else if (trimmed.includes('</Synset>')) {
    currentSynsetId = null;
  } 
}

console.log(`Starting parse of ${XML_FILE}...`);

const rl = readline.createInterface({
  input: fs.createReadStream(XML_FILE, { encoding: 'utf8' }),
  crlfDelay: Infinity
});
rl.on('line', parseLemmas);
rl.on('close', finishFirstFile);

async function finishFirstFile()
{
  console.log(`Processed file 1. Entries: ${entryCount}, Senses: ${senseCount}, Lemmas: ${lemmaToSenses.size}, Synsets: ${synsetCount}, Synsets with defs: ${synsetDefs.size}, exc1: ${exampleCount1}, defc1: ${definitionCount1}`);
  entryCount = 0;
  senseCount = 0;
  lemmaCount = 0;
  synsetCount = 0;
  exampleCount1 = 0;
  definitionCount1 = 0;
  console.log(`Starting parse of ${XML_FILE2}...`);
  const rl2 = readline.createInterface({
    input: fs.createReadStream(XML_FILE2, { encoding: 'utf8' }),
    crlfDelay: Infinity
  });
  rl2.on('line', parseLemmas);
  rl2.on('close', finishProcessing);
}

const output = [];
let lemmings = new Map();;
var node, nodeLemNodes, nodeLem, op;
var q, pl, px;
var an;

function attachProperty( propName )
{
  var keyval = null;
  let px = nodeLem.params;
  if( nodeLem.title == 'cat' && propName == 'pos' ) {
	  console.log(propName + ": ", util.printJSON(nodeLem), ", op: " + util.printJSON(op));
  }

  if( typeof op[propName] == 'string' ) {
    keyval = { title: propName, value: op[propName] };
    px.push(keyval);
  } else if( propName in op ) {//pos
    if( typeof op[propName] == 'string' ) {
      op[propName] = [ op[propName] ];
    }
    for( var z=0; z<op[propName].length; z++ ) {
    	let found=false;
      var add_value = op[propName][z];
	    for( var y=0; y<px.length; y++ ) {
		    if( px[y].title == propName && px[y].value == add_value ) {
			    found=true;
          keyval = px[y];
			    break;
	    	}
	    }
	    if( !found ) {
		    keyval = { title: propName, value: add_value };
      	px.push(keyval);
	    }
    }
  } else {
    for( var y=0; y<op.senses.length; y++ ) {
      let se = op.senses[y];
      if( propName in se ) {
        if( typeof se[propName] == 'string' ) {
          keyval = { title: propName, value: se[propName] };
          px.push(keyval);
        } else {
      		console.log("invalid",propName,se);
		      throw "I-said-invalid";
        }
      }
    }
  }
  if( created_props<10 && propName == 'def' && keyval && keyval.value ) {
    created_props++;
    console.log("Definition: " + keyval.value);
  }
}

var storage=null;
async function finishProcessing()
{
  console.log(`Processed file 2. Entries: ${entryCount}, Senses: ${senseCount}, Lemmas: ${lemmaToSenses.size}, Synsets: ${synsetCount}, Synsets with defs: ${synsetDefs.size}, exc1: ${exampleCount1}, defc1: ${definitionCount1}`);
    
  for (const [lemma, info] of lemmaToSenses) {
    const enriched = info.senses.map(s => {
      const d = synsetDefs.get(s.synset_id) || {};
      const r = {
        sense_id: s.sense_id || null,
        synset_id: s.synset_id };
      if( 'def' in d ) r.def = d.def;
      if( 'ex' in d ) r.ex = d.ex;
      return r;
    });

    output.push({
      lemma: decodeHtmlEntities(lemma),
      pos: info.pos,
      senses: enriched
    });
  }
  lemmaToSenses = null;

  //output.sort((a, b) => a.lemma.localeCompare(b.lemma));
  let reportList = [ 'real', 'fish', 'cat', 'dog', 'hair', 'pull' ];
  
  for( var o=0; o<output.length; o++ ) {
    op = output[o];

	  if( reportList.indexOf(op.lemma) != -1 )
		  console.log(op);
    
    an = op.lemma; // util.alphaName(op.lemma);
    px = []; // create new params list here.
    nodeLem = {title: op.lemma, params: px};
    
    if( lemmings.has(an)) {
      // join to existing
      node = lemmings.get(an);
      if( !('params' in node) ) {
        console.log(an + ": no params");
        throw "Unexpected lack";
      }
      if( an === nodeLem.title ) {
        nodeLem = node;
      } else {
        node.params.push ({title:'lem',value:nodeLem});
      }
    } else if( an === nodeLem.title ) {
      node = nodeLem;
      /*
        title: an,
        params: [{
          title: 'lem',
          value: nodeLem
        }]
      };
      */
    	lemmings.set(an, node);
    }
    
    attachProperty('pos', 'pos');
    attachProperty('def', 'def');
    attachProperty('ex', 'ex');
  }
  
  storage = new SimpleKVStore('wordroots.jsdb', true); // erase pre existing
  await storage.init();

  storage.loosen();
  let pullCount=0;
  for( var [ uniqueName, lem ] of lemmings.entries() ) {
    //let lem = lemmings[uniqueName];
    storage.set( uniqueName, lem );
    if( pullCount < 10 || reportList.indexOf(uniqueName) != -1 ) {
      let a = util.printJSON(lem);
      console.log("printJSON: ", a);
    }
    pullCount++;
  }
  
  let simpleAddWord = function(word,pos=null,def=null,examples=[])
  {
    let aname = util.alphaName(word);
    var lem, problem, n;
    
    if( !(aname in lemmings) ) {
      lem = lemmings[aname] = {title:word,params:[problem={title:word,params:[]}]};
    } else {
      problem = {title:word,params:[]};
      lem = lemmings[aname];
      lem.params.push(problem);
    }
    if( pos !== null ) {
      problem.params.push({title:"pos",value:pos});
    }
    if( def !== null ) {
      problem.params.push({title:"def",value:def});
    }
    for( var i=0; i<examples.length; i++ ) {
      problem.params.push({title:"ex",value:examples[i]});
    }
    if( reportList.indexOf(word) != -1 ) {
      console.log(word + ":",util.printJSON(problem));
    }
  }
  
  console.log("Write to disk");
  await storage.rewrite();
  console.log(`Storage written: ${pullCount} unique word roots.`);
}
