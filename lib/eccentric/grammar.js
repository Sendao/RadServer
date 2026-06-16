var myapp = null, worddb, Node, Param, nodeCode, processGrammarNodes, central, mem, kb;

export function startup(app)
{
  myapp = app;
  return ['dbx','encoder','markov','Central'];
}
export async function init(app)
{
  if( myapp != app ) throw "hissy fit";
  Node = app.Node;
  Param = app.Param;
  central = app.central;
  mem = app.dbx.words; // the KnowDB
  kb = app.dbx.knowdb; // the words db
  processGrammarNodes = app.util.encoder.processGrammarNodes;
  console.log("grammar initialized - " + typeof Node);
}

function makeGNode(w, t, q) {
  const n = { w, t, q: [] };
  if( typeof w != 'string' ) {
    console.log("makeGNode: w not a string!", w, t, q);
  }
  for( var [rel,o] of q ) {
    n.q.push( [rel,copyNode(o)] );
  }
  //console.log("makeGNode(",w,t,q,")");
  return n;
}
function sliceNodeptrs(nodes, start, end=-1) {
  const nx = [];
  if( end == -1 )  end = nodes.length;
  if( end > nodes.length ) end = nodes.length;
  for( var i=start; i<end; i++ ) {
    nx.push(nodes[i]);
  }
  return nx;
}
function sliceNodes(nodes, start, end=-1) {
  const nx = [];
  if( end == -1 )  end = nodes.length;
  if( end > nodes.length ) end = nodes.length;
  for( var i=start; i<end; i++ ) {
    nx.push(copyNode(nodes[i]));
  }
  return nx;
}
async function printGNode(n) {
  return await echoFromGNode(n) + "\n";
}
async function printGNodes1(nodes) {
  let buf = '{';
  for( var n of nodes ) {
    buf += await echoFromGNode(n[1]) + "\n";
  }
  buf += "}";
  return buf;
}
async function printGNodes(nodes) {
  let buf = '{';
  for( var n of nodes ) {
    buf += await echoFromGNode(n) + "\n";
  }
  buf += "}";
  return buf;
}
    


function cloneGNodes(nodes) {
    return nodes.map(copyNode);
}
function copyNode(o) {
  if( typeof o.w == 'string' ) {
    return copyGNode(o);
  }
  const n = new Node(o);
  return n;
}
function copyGNode(o) {
  const n = { w: o.w, t: o.t.slice(), q: [] };
  const bq = [n, o.q];
  let i=0;
  while( i < bq.length ) {
    const m = bq.shift();
    const mq = bq.shift();
    // add mq to m:
    for( var [rel,oq] of mq ) {
      const oq2 = { w: oq.w, t: oq.t.slice(), q: [] };
      m.q.push([rel,oq2]);
      // if mq.child[n] has children, add to m.child[n]
      bq.push(oq2);
      bq.push(oq.q);
    }
  }
  return n;
}

async function echoFromGNode(n) {
  if( n instanceof Node )
    return await n.toString();
  else if( Array.isArray(n.t) ) {
    return echoFromNode(n.w,n.t,n.q);
  } else {
    console.log("Error: unrecognized node.");
    console.log(typeof n);
    console.log(n);
    myapp.util.throwStack();
    throw "Unknown node";
  }
}
// word:type,type,type:rel;child,rel;child,rel;child
async function echoFromNode(w,t,q,d=0) {
    let key = w;
    let buf = '';
    for( var i=0; i<d; i++ ) {
      buf += '   ';
    }
    let first = true;
    for( var pos of t ) {
      if( first ) {
        first=false;
        key += ": types ";
      } else key += ",";
      key += pos;
    }
    first=true;
    for( var [rel,child] of q ) {
      if( first ) {
        first=false;
        key += "\n" + buf + "children:\n" + buf;
      } else key += "\n" + buf;
      if( Array.isArray(child.t) ) {
        key += rel + "=" + await echoFromNode(child.w, child.t, child.q, d+1);
      } else {
        console.log("c",child);
        throw "invalid child c";
      }
    }
    if( q.length > 0 ) {
      key += "\n" + buf + "end\n";
    }
    return key;
}

async function codeFromGNode(n) {
  if( n instanceof Node )
    return await n.toString();
  else if( Array.isArray(n.t) ) {
    return codeFromNode(n.w,n.t,n.q);
  } else {
    console.log(n);
    throw "Unknown node";
  }
}
// word:type,type,type:rel;child,rel;child,rel;child
async function codeFromNode(w,t,q) {
    let key = w;
    let first = true;
    for( var pos of t ) {
      if( first ) {
        first=false;
        key += ":";
      }
      key += pos;
    }
    first=true;
    for( var [rel,child] of q ) {
      if( first ) {
        first=false;
        key += ":";
      }
      if( Array.isArray(child.t) ) {
        key += rel + ";" + await codeFromNode(child.w, child.t, child.q);
      } else {
        console.log("c",child);
        throw "invalid child c";
      }
    }
    return key;
}


export function charType(c) {
    const code = c.charCodeAt(0);
    if( (code >= 65 && code <= 90) || (code >= 97 && code <= 122) ) return 0;
    if( (code >= 48 && code <= 57) ) return 1;
    if( c==' ' || c=='\r' || c=='\n' || c=='\t' ) return 2;
    return 3;
}
export function isAlpha(c) {
  const code = c.charCodeAt(0);
  return (code >= 65 && code <= 90) || (code >= 97 && code <= 122);
}
export function isAlphastring(s) {
    for( var c of s ) {
        if( !isAlpha(c) ) return false;
    }
    return true;
}
export function isDigit(c) {
  const code = c.charCodeAt(0);
  return code >= 48 && code <= 57;
}

export async function parseEnglish(sentence) {
    const startTime = Date.now();
    const timeLimit = 4000; // milliseconds

    let phrase = myapp.dbx.words.phrases;
    let markov = myapp.me;

    let tokens = central.toTokens(sentence);
    //console.log("parse:tokens:",tokens);

    const resultSet = new Set();
    let results = [];
    let maxScore = -Infinity;
    let currentResult = false;

    let i,n,k,y,z,m;

//! todo: handle '-ly' adverbs separately
    /*
    it might make sense to add 'v', 'n2' => 'v' as any time a verb can be used, you can use a verb with an object
    */
    const rules = [
      // stage 0: join like words
        [['a', 'a'], 'a', 3.0, 0], // blue green
        [['r', 'r'], 'r', 3.0, 0], // fast short
        [['n', 'n'], 'n', 3.0, 0], // grocery store

      // stage 1: connect identifying parts
        [['v', 'r'], 'v', 2.0, 1], // kick quickly
        [['r', 'v'], 'v', 2.0, 1], // fast kick
        [['a', 'n'], 'n', 2.0, 1], // blue frog
        
      // stage 2: pre-determinants
        [['q','n'], 'n2', 1.2, 2], // which frog

      // stage 4: determinants (final stage for noun)
        [['det', 'n'], 'n2', 1.2, 4], // the mouse
        [['det', 'v', 'n'], 'n2', 2.3, 4], // the hugged mouse
        [['det', 'v'], 'n2', 1.8, 4], // the kiss 
        [['det', 'r'], 'n2', 1.2, 4],
        [['det', 'a'], 'n2', 1.2, 4],

      // stage 5: proper nouns, located nouns, and locations
        [['n'], 'n2', 0, 5], // only proper nouns, fix later
     
      // stage 6:  compound nouns
        [['n2', 'c', 'n2'], 'n2', 2.2, 6], // bob and sally
      // stage 7
        [['v', 'c', 'v'], 'v', 2.2, 6], // kiss and hold

      // stage 12: compile prepositions -> ways
        [['prep', 'n2'], 'nway', 2.0, 7], // of the frog
        [['vprep', 'n2'], 'vway', 2.0, 7], // over the frog
        [['vprep', 'v'], 'vway', 2.0, 7], // by holding/of flying
        [['vprep', 'vprep'], 'vway', 2.2, 7],
        [['vprep'], 'vway', 0, 7], // beyond or away from

        [['n2', 'nway'], 'n2', 2.0, 8], // leg of the frog
        [['n2', 'vway'], 'n2', 2.0, 8], // strength of the swing
        [['v', 'nway'], 'v', 2.0, 8], // kick of the frog
        [['v', 'vway'], 'v', 2.0, 8], // kick beyond
      
      // stage 13: events (partial sentences)
        [['n2', 'v', 'part', 'n2'], 'event', 4.0, 12],
        [['n2', 'v',  'n2', 'part'], 'event', 4.0, 12],
        [['n2', 'v', 'n2'], 'event', 3.0, 12],
        [['n2', 'v'], 'event', 2.0, 12],

        [['v', 'n2', 'part'], 'event', 3.0, 12], // pick the book up
        [['v', 'part', 'n2'], 'event', 3.0, 12], // pick up the book

        [['vprep', 'event'], 'vway', 2.0, 13], // by picking up the book


      // stage 10: compounds and attachments
        [['h','r'], 'q', 2.0, 8], // how fast
        [['h','a'], 'q', 2.0, 8], // how long
        [['h','i'], 'q', 2.0, 8], // how many

      // stage 14: modals -> verbs
        [['modal', 'event'], 'event', 1.3, 14], // can hug
        [['smodal', 'event'], 'event', 1.0, 14], // he'll fly

      // stage 18: composition
        [['c', 'c'], 'c', 0, 18], // and so, and but, etc

      // stage 20: sentences
      // bounded (0s at end) :
        [[0, 'event', 0], 'pred', 4.0, 20], // he flies
        [[0, 'modal', 0], 'qry', 2.0, 20], // can he fly
        [[0, 'h', 'modal', 0], 'qry', 2.0, 20], // how can the mouse fly
        [[0, 'modal', 0], 'qry', 2.5, 20], // can the mouse fly
        [[0, 'q', 'event', 0], 'qry', 2.0, 20], // which mouse flew

      // stage 22: compound sentences
        [[0, 'pred', 'c', 'pred', 0], 'pred', 0.8, 22], // bob fucks alice and bob does not fuck cindy
        [[0, 'imp', 'c', 'imp', 0], 'imp', 0.8, 22], // fly a kite and lose it
        [[0, 'qry', 'c', 'qry', 0], 'qry', 1.8, 22]
    ];
    let rulelevels = [];
    let rulelevellengths = [];

    for( i=0; i<rules.length; i++ ) {
        while( rulelevels.length <= rules[i][3] ) {
          rulelevels.push([]);
          rulelevellengths.push([]);
        }
        rulelevels[rules[i][3]].push(rules[i]);

        let rulelength=0;
        for( n=0; n<rules[i][0].length; n++ ) {
            if( rules[i][0][n] === 0 ) continue;
            rulelength++;
        }
        rulelevellengths[rules[i][3]].push(rulelength);
    }
    for( i=0; i<rulelevellengths.length; i++ ) {
        console.log(rulelevellengths[i]);
    }

    let compounds = [ ',', ';', 'and', 'but', ':', '.' ];
    let ctokens = central.toTokens(compounds.join(' '));

    // Tokenization and initial node generation
    const inputs = [];
    for (i = 0; i < tokens.length; i++) {
      let t = tokens[i];
      if( !(t in central.xdict) ) {
        console.log("unrecognized word", t, tokens);
        break;
      }
      let w = central.xdict[t];
      if( ctokens.includes(t) ) {
        inputs.push(makeGNode( w, ['c'],  [] ));
        continue;
      }

      let found = false;
      let candidate = '';
      for (let span = tokens.length - i; span > 0; span--) {
        if( !(tokens[i+span] in central.xdict) ) {
          break;
        }
        candidate = central.joinWord(candidate, central.xdict[tokens[i+span]]);

        if (phrase.has(candidate))
        {
          const deets = await mem.getWord(candidate);
          if( deets === null || !(deets instanceof Node) )
            continue;
          const types = await deets.getParamsV('pos');
          if( types.length == 0 ) continue;
          inputs.push(makeGNode( candidate, types, [] ));
          i += span - 1;
          found = true;
          break;
        }
      }

      if (!found) {
        let deets = await mem.getWord(w);
        if( deets === null || !(deets instanceof Node) ) {
          // consider checking for -ly or other clues
          if( w.endsWith("ed") || w.endsWith("ing") ) {
            inputs.push(makeGNode( w, ['v'], []));
          } else if( w.endsWith("ly") ) {
            inputs.push(makeGNode( w, ['r'], [] ));
          } else {
            inputs.push(makeGNode( w, ['v','n'], [] ));
          }
        } else {
          const types = await deets.getParamsV('pos');
          inputs.push(makeGNode( w, types, [] ));
        }
      }
    }
    console.log(inputs);

    const queue = [[0, inputs, 0]];

    while (queue.length > 0) {
      if (Date.now() - startTime > timeLimit) break;

      //queue.sort((a, b) => b[0] - a[0]);
      const [score, seq, startPoint] = queue.shift();
      let maxExec=0;
      //console.log(score,seq,startPoint);

      //console.log("m="+startPoint);
      for( m=startPoint; m<rulelevels.length; m++ ) {
        const rulelist = rulelevels[m];
        const rulelengths = rulelevellengths[m];
        for( k=0; k<rulelist.length; k++ ) {
          const [pattern, resultTag, weight, execNo] = rulelist[k];
          //if( resultTag == lastTag ) continue;

          for (i = 0; i <= seq.length - rulelengths[k]; i++) {
            const children = [];
            let matched = true;
            z=0;
            for( n=0; n+z<pattern.length; n++ ) {
            	if( pattern[n+z] === 0 && n+z == 0 ) {
            		if( i+n-1 >= 0 && !seq[i+n-1].t.includes('c') ) {
            			matched=false;
            			break;
            		}
                z++;
                n--;
            	} else if( pattern[n+z] === 0 ) {
            		if( i+n < seq.length && !seq[i+n].t.includes('c') ) {
            			matched=false;
            			break;
            		}
                z++;
                n--;
            	} else if( seq[i+n].t.includes(pattern[n+z]) ) {
            		children.push( [pattern[n+z], seq[i+n]] );
              } else {
                matched=false;
                break;
             	}
            }
            if (!matched) continue;
            //console.log("matched",resultTag,pattern,weight);
            //printGNodes1(children);

            let newSeq = sliceNodeptrs(seq, 0, i);
            var newWord = '';
            if( children.length == 1 )
              newWord = children[0][1].w;

            const parent = makeGNode(newWord, [resultTag], children);
            newSeq.push(parent);
            if( seq.length >= i+children.length )
              newSeq = newSeq.concat(sliceNodeptrs(seq, i + children.length));

            if (newSeq.length === 1) {
              const res = newSeq[0];
              const code = await codeFromGNode(res);
              if (!resultSet.has(code)) {
                results.push([score + weight, res, code]);
                if (score + weight > maxScore) {
                  maxScore = score + weight;
                  currentResult = res;
                }
                resultSet.add(code);
              }
            } else {
              let found=false;
              const newScore = score + weight;
              for( var xy=0; xy<queue.length; xy++ ) {
                if( queue[xy][0] < newScore ) {
                  queue.splice(xy,0, [newScore, newSeq, m]);
                  found=true;
                  break;
                }
              }
              if( !found )
                queue.push([score + weight, newSeq, m]);
            }
          }
        }
      }
    }

    results.sort((a, b) => b[0] - a[0]);
    if( results.length == 0 ) {
      console.log("No results on parse", inputs);
      return [];
    }

    console.log("Got results(" + results.length + ")");
    if( results.length > 0 ) {
      console.log('Score ' + results[0][0]);
      console.log('Node ' + await printGNode(results[0][1]));
      console.log('Code: ' + results[0][2]);
      if( results.length > 1 ) {
        console.log('Score ' + results[1][0]);
        console.log('Node ' + await printGNode(results[1][1]));
        console.log('Code: ' + results[1][2]);
      }
    }
    
    let valid_types = [ 'pred', 'qry', 'imp' ];
    let convert_types = { 'n2': 'n' };
    var final = [], nonpreds = [];

  while( queue.length > 0 ) queue.shift();

    for (i = 0; final.length < 5; i++ ) {
    	if( i >= results.length ) {
    		if( nonpreds !== null && nonpreds.length > 0 ) {
    			results = results.concat(nonpreds);
    			nonpreds = null;
          i--;
    		}
        break;
    	}
    	if( valid_types.indexOf(results[i][1].t[0]) == -1 && nonpreds !== null ) {
    		nonpreds.push(results[i]);
    		results.splice(i,1);
    		--i;
    		continue;
    	}

    	queue.push(results[i][1].q); // q = [ [rel,child], ... ]
    	while( queue.length > 0 ) {
    		let c = queue.shift();
    		for (let j=0; j<c.length; j++ ) {
    			if( Array.isArray(c[j]) && c[j].length == 2 ) {
            if( c[j][0] == 'q' ) { // event is interrogative
              c[j][1].t = ['qry'];
            }
            if( c[j][0] in convert_types ) {
              c[j][0] = convert_types[ c[j][0] ];
            }
            for( let k=0; k<c[j][1].t.length; k++ ) {
              if( c[j][1].t[k] in convert_types ) {
                c[j][1].t[k] = convert_types[ c[j][1].t[k] ];
              }
            }
    				queue.push( c[j][1].q );
    			} else {
            console.error(j, results[i], c[j]);
            throw "wtf";
          }
    		}
    	}
    	const copy = copyNode(results[i][1]);
      const proc = await processGrammarNodes(kb, copy);
      const fullness = await rateNodeFullness(proc);
      if( fullness < 0 ) {
        //console.log("Invalid (" + fullness + ") interpretation: ", await printGNode(copy) );
        try {
          //console.log("Partial parse: ", await printGNode(proc));
        } catch( e ) {
          //console.log("(some nodes were not complete)");
          //console.log(this.app.util.printJSON(proc));
        }
        continue;
      }

    	final.push( [results[i][1], proc, fullness] ); // remove pointers linked between results, then process into knowdb format
    }
    final.sort((a,b) => b[2] - a[2]);
    console.log("Final results [" + final.length + "]",myapp.util.printJSON(final, true));
    return final;
}

export async function rateNodeFullness(n)
{
    let scores = [];
    let q = [n];
    while( q.length > 0 ) {
        n = q.shift();

        if( typeof n == 'number' ) // empty node
            continue;
        if( typeof n != 'object' || (!(n instanceof Node)) ) {
            //console.log("Incomplete",typeof n,n);
            return -1;
        }

        if( n.params.length <= 0 ) continue;
        let ns = new Set();
        var keyval;
        for( var i=0; i<n.params.length; i++ ) {
            const p = n.params[i];
            if( typeof p == 'number' ) {
                continue;
                //n.params[i] = p = await .getParam(p);
            }
          /* this is good in theory, but check only the deepest tag available?
            const keyval = await kb.resolveNode(p.key);
            if( ns.has(keyval) ) {
                //console.log("double-key",await printGNode(n));
                return -1;
            }
            */
            ns.add(keyval);
            //console.log("look deeper at " + keyval);
            if( p.value instanceof Node )
              q.push(p.value);
        }
        scores.push( n.params.length );
    }
    let avg = 0;
    for( var i=0; i<scores.length; i++ ) {
        avg += scores[i];
    }
    avg /= scores.length;
    return avg;

}

