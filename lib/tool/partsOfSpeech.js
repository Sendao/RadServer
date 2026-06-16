import { SimpleKVStore, LargeKVStore, StringTrie }  from './db.js';
import {Utils} from './util.js';
const util = new Utils();

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
  let addwords = {
  'det': ['the', 'a', 'an'],
  'prep': [
    // Your originals (noun-attaching)
    'near', 'nearly',
    'like', 'almost',
    'by', 'via', 'with', 'above', 'beyond', 'below',
    'over', 'under', 'around', 'next',
    'through', 'beside',
    'for', 'of', 'from', 'to',
    'in', 'as', 'on', 'with', 'if',
    'than', 'greater', 'less', 'equal', 'not',
    'somewhere',
    'taken', 'given',
    'down', 'up', 'left', 'right',
    'forward', 'backward', 'front', 'behind',
    'before', 'after',
    'between', 'among', 'amongst',
    'within', 'without',
    'into', 'onto', 'through', 'across',
    'per', 'versus', 'vs',
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
  // possessive:
  's': [ 'his', 'hers', 'their', 'theirs' ],
  'q': [ 'which', 'when', 'where',
  'why', 'who', 'whom', 'whose', 'how' ],
  'modal': [ 'can', 'will', "won't", 'wont',
    'might', 'may', 'could', 'should', 'would',
    "couldn't", "shouldn't", "wouldn't",
    'couldnt', 'shouldnt', 'wouldnt',
    'did', "don't", "did", 'dont', "must" ]
  };
  // add customized parts of speech to words:
  for( var pos in addwords ) {
    for( var word of addwords[pos] ) {
      await addWordToSimpleKV(wordRoots, word, pos);
    }
  }
  return true;
}
