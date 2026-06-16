import { SimpleKVStore, LargeKVStore }  from './db.js';
import { StringTrie } from './zcastle.js';
import {Utils} from './util.js';
const util = new Utils();

export function startup(app)
{
  // util = app.util;
}

async function subWordInSimpleKV(wordRoots,word,pos=null)
{
  var lem, z;
  if( !isNaN(word) ) word = Number(word);

  lem = wordRoots.get(word);
  if( typeof lem == 'undefined' ) {
    console.log("unknown word " + word);
    return;
  }

  for( var i=0; i<lem.params.length; i++ ) {
    if( lem.params[i].title == 'pos' ) {
      let matched=false;
      if( typeof pos != 'string' ) {
        for( var j=0; j<pos.length; j++ ) {
          if( pos[j] == lem.params[i].value ) {
            matched=true;
            break;
          }
        }
      } else if( pos == lem.params[i].value ) {
        matched=true;
      }
      if( matched ) {
        lem.params.splice(i,1);
        console.log("Removed '" + pos + "' from '" + word + "'");
        i--;
      }
    }
  }

  await wordRoots.set(word, lem);
}

async function addWordToSimpleKV(wordRoots,word,pos=null,def=null,examples=[])
{
  var lem, z;
  if( !isNaN(word) ) word = Number(word);

  if( !wordRoots.has(word) ) {
    lem = {title:word,params:[]};
  } else {
    lem = wordRoots.get(word);
  }
  
  if( pos !== null ) {
    if( Array.isArray(pos) ) {
      for( var i=0; i<pos.length; i++ ) {
        lem.params.push({title:"pos",value:pos[i]});
      }
    } else {
      lem.params.push({title:"pos",value:pos});
    }
  }
  if( def !== null ) {
    lem.params.push({title:"def",value:def});
  }
  for( var i=0; i<examples.length; i++ ) {
    lem.params.push({title:"ex",value:examples[i]});
  }
  await wordRoots.set(word, lem);
}

export async function addSpecialPartsOfSpeech(wordRoots)
{
  let subwords = {
    'r': [ 'there', 'am' ],
    'n': [ 'am', 'divide', 'subtract', 'multiply', 'add', 'jumped', 'are' ],
    'v': [ 'cat' ],
    'a': [ 'i' ]
  };
  
  let addwords = {
  'det': ['the', 'a', 'an'],
  'part': [
  
    'ahead', 'apart', 'aside', 'astray',
    'inside', 'outside', 'past',
    'over', 'under', 'around', 'round', 'next',
    'through', 
    'in', 'on', 'off', 'with',

    'down', 'up',
    
    'forward', 'backward',
    'away', 'back', 'forth', 
    'through', 'across', 'along',
    'together',
    'about',
    'not'
  ],
  'prep': [
    'near', 'nearly',
    'like', 'almost',
    'by', 'via', 'with', 'above', 'beyond', 'below',
    'ahead', 'apart', 'aside', 'close',
    'inside', 'outside', 'past',
    'over', 'under', 'around', 'round', 'next',
    'through', 'beside',
    'for', 'of', 'from', 'to',
    'in', 'as', 'on', 'off', 'with', 'if',
    'than', 'greater', 'less', 'equal', 'not',
    'somewhere',
    'taken', 'given',
    'down', 'up', 'left', 'right',
    'forward', 'backward', 'front', 'behind',
    'away', 'back', 'forth', 
    'before', 'after',
    'between', 'among', 'amongst',
    'within', 'without',
    'into', 'onto', 'through', 'across', 'along',
    'per', 'versus', 'vs',
    'together',
    'about',
    'regarding', 'concerning',
    'according',
    'respect',
    'relative', 'relatively',
    'depending', 'depends',
    'such', 'except', 'that',
    'including', 'excluding',
    'counting',
    'not'
  ],
  'vprep': [
    'of', 'by', 'like', 'to', 'as', 'with',
    'from', 'for', 'near', 'almost',
    'nearly', 'beyond',
    'than', 'then',
    'before', 'after', 'while',
    'out', 'up', 'down', 'into',
    'on', 'onto', 'off'
  ],
  'h': [ 'how' ],
  // as verb actor:
  'e': [ 'he', 'she', 'they' ],
  // as noun:
  'm': [ 'him', 'her', 'them' ],
  'placen': [ 'there', 'here', 'nearby' ],
  // possessive:
  's': [ 'his', 'hers', 'their', 'theirs' ],
  'q': [ 'which', 'when', 'where', 'what',
  'why', 'who', 'whom', 'whose', 'how' ],
  'v': [ 'am', 'are', 'is', 'be', 'was', 'were', 'went', 'go', 'going', 'divide', 'subtract', 'multiply', 'add' ],

  'modal': [ 'can', 'will', "won't", 'wont',
    'might', 'may', 'could', 'should', 'would',
    "couldn't", "shouldn't", "wouldn't",
    'couldnt', 'shouldnt', 'wouldnt',
    'did', "don't", "did", 'dont', "must" ]
  };
  // add customized parts of speech to words:
  var remove_r;
  for( var pos in addwords ) {
    if( pos != 'r' ) {
      remove_r = true;
    } else {
      remove_r = false;
    }
    for( var word of addwords[pos] ) {
      await addWordToSimpleKV(wordRoots, word, pos);
      if( remove_r ) {
        await subWordInSimpleKV(wordRoots, word, ['r','a']);
      }
    }
  }
  for( var pos in subwords ) {
    for( var word of subwords[pos] ) {
      await subWordInSimpleKV(wordRoots, word, pos);
    }
  }
  return true;
}
