export class Stage {
  constructor(app)
  {
    this.app = app;
  }

  startup(app)
  {
    this.app = app;
    console.log("staging initiaizlied, app: " + typeof app);
    return ['markov','grammar','dbx'];
  }

  async init()
  {
    await this.stage_words();
    //await this.demo_sentences();
  }
  async stage_words()
  {
    const [ list, range ] = await this.app.wordlib.findKeyValueRange('base');
    const idents = list.valuesFromRange(range);
    var oc=0, i, found;
    var already_found=0, new_records=0;

    console.log("stage_words(): " + idents.length);
    // make sure all writes are instant:
    await this.app.wordlib.tighten();

    // first we'll find all adjectives
    for( const ident of idents ) {
      const node = await this.app.wordlib.getNode(ident);
      oc++;
      if( node.title.length > 8 ) continue;
      let word = node.title;
      let token = this.app.central.toTokens(word);

      let rels = await node.getParamsV('rel');
      if( rels.length > 0 ) {
        already_found++;
        //console.log( word + ": " + rels.join("\n"));
        continue;
      }

      let mpos = await node.getParamsV('pos');
      found = mpos.indexOf("a") != -1;
      if( !found ) {
        continue;
      }
      if( node.title == 'quick' ) {
        console.log("Quick found", await node.toString());
      }

      // now map any -ness words, any adjectives in desc, any adverbs
      // into "rel"
      let desc = await node.getParam('def');
      let exa = await node.getParam('ex');
      if( desc == '' && exa == '' ) continue;

      //console.log("find rels in " + word + ": ", desc, exa);

      let tokens = this.app.central.toTokens(desc + "\n" + exa);
      let related = "";

      for( i=0; i<tokens.length; i++ ) {
        let t = tokens[i];
        let w = this.app.central.xdict[t];
        var node2 = await this.app.words.getWord(w);
        if( !node2 )
          continue;

        mpos = await node2.getParamsV('pos');
        let adject = mpos.indexOf("a") != -1;
        let adverb = mpos.indexOf("r") != -1;
        let nessness = w.endsWith("ness");

        if( adject || adverb || nessness ) {
          if( related != '' ) related += ',';
          related += w;
        }
      }

      if( related != '' ) {
        new_records++;
        //console.log(word + ": " + related.length + " len");
        await node.addParamV('rel', related);
        await node.save();
      }
      //if( new_records % 250 == 0 ) {
        //console.log("250 wordstage", await node.toString());
      //}
    }
    await this.app.wordlib.softheartbeat();
    console.log("Done relating words, already found: " + already_found + ", new records: " + new_records);
    //await this.app.wordlib.heartbeat();
  }
  async demo_sentences()
  {
    const sentences = ['the quick brown fox jumped over the lazy dog',
    'he went to the grocery store to pick up apples and milk',
    'there are forty two ways to divide seven by nine',
    'i am a cat'
    ];
    
    this.parseEnglish = this.app.util.grammar.parseEnglish;
    console.log("Doing staging::parseEnglish");
    for( var sent of sentences ) {
      let results = await this.parseEnglish(sent);
      if( results.length == 0 ) console.log("(no results)");
      for( var result of results ) {
        console.log("result:");
        console.log(this.app.util.printJSON(result[0]));
        console.log(await result[1].toString());
        console.log(result[2]);
      }
      let tokens = this.app.central.toTokens(sent);
      let buf = '';
      for( var token of tokens ) {
        let word = this.app.central.xdict[token];
        if( buf != '' ) buf += " ; ";
        buf += word + "(" + token + "): ";
        let a = this.app.me.getAlphas(token);
        let buf2 = '';
        for( var w in a ) {
          if( buf2 != '' ) buf2 += ',';
          buf2 += w + ":" + a[w];
        }
        buf += buf2;
      }
      console.log(buf);
    }
  }

  async printNodes(nx)
  {
    let buf = '';
    for( var i=0; i<nx.length; i++ ) {
      buf += nx.toString() + "\n";
    }
    return buf;
  }

}



