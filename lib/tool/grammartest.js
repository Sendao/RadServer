const { Node, Param, nodeCode, printNode, printParam } = require('./dbx.js');
const { processGrammarNodes } = require('./encoder.js');
const { parseEnglish } = require('./grammar.js');

let phrases = [
  'the quick brown dog jumps over the lazy fox'
  ];
  
for( var i=0; i<phrases.length; i++ ) {
  let phr = phrases[i];
  
  let r = parseEnglish(phr);
  console.log(i,phr);
  console.log(r);
}
