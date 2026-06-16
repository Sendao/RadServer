var myapp = null, Node, Param, StringTrie;

export class Central {
  constructor(app)
  {
    this.app = app;
	  this.xdict = [];
    this.tokens = null;
    this.words = app.words;
    this.A = 'A'.charCodeAt(0);
    this.a = 'a'.charCodeAt(0);
    this.Z = 'Z'.charCodeAt(0);
    this.z = 'z'.charCodeAt(0);
    this.zero = '0'.charCodeAt(0);
    this.nine = '9'.charCodeAt(0);

  	this.vp = ".,!@#$%^&*_+-=";
    this.vo = "\\|'\"`";
  	this.vowels = ['e','a','i','o','u','y','h','s','w'];
  	this.consonants = ['b','c','d','f','g','j','k','l','m','n','p','q','r','t','v','x','z'];
  }
  startup(app)
  {
    myapp = app;
    return ['dbx'];
  }
  async init(app)
  {
    Node = app.Node;
    Param = app.Param;
    StringTrie = app.StringTrie;
    app.central = this;

    this.tokens = new StringTrie();
    this.tokendb = new this.app.SimpleKVStore('know/tokens_markov.jsdb');
    await this.load();

    console.log("Central TRIE: " + this.xdict.length + " words.");
  }

  letterType( c  )
  {
  	let n = c.charCodeAt(0);
  	if( ( n >= this.a && n <= this.z ) || ( n >= this.A && n <= this.Z ) )
  		return 0;
  	if( n >= this.zero && n <= this.nine )
  		return 1;
  	if( c == ' ' || c == '\n' || c == '\r' || c == '\t' )
  		return 2;
  	if( this.vp.indexOf(c) >= 0 ) return 3;
    if( this.vo.indexOf(c) >= 0 ) return 5;
  	return 4;
  }

  async save()
  {
    console.log("Serialize central trie");
    const buf = this.serialize();
    this.tokendb.cached = true; // we don't need to load it now
    console.log("Saving");
    await this.tokendb.set(0, buf);
    this.tokendb.unload(); // remove cached memory
    console.log("Done");
  }
  async load()
  {
    await this.tokendb.load();
    const buf = this.tokendb.get(0);
    this.tokendb.unload();
    if( buf )
      this.deserialize(buf);
  }

  serialize()
  {
    let buf = '';
    for( var word of this.xdict ) {
      const processed = this.app.util.escape( word.replaceAll("\\", "\\|").replaceAll(",","\\;") );
      if( buf == '' ) buf += processed;
      else buf += "," + processed;
    }
    console.log("Serialized " + this.xdict.length + " words.");
    return buf;
  }
  deserialize(buf)
  {
    let words = buf.split(",");
    for( var word of words ) {
      const processed = this.app.util.unescape( word ).replaceAll("\\;", ",").replaceAll("\\|", "\\");
      this.addWord(processed);
    }
    console.log("Deserialized " + this.xdict.length + " words into tokens.");
  }

  addWord( word )
  {
    var tokenValues = this.tokens.get(word);
    if( tokenValues.length == 0 ) {
      const token = this.xdict.length;
      this.xdict.push(word);
      this.tokens.add(word, token);
      return token;
    }

    if( tokenValues.length > 1 ) {
      console.log("Multiple values for '" + word + "': ", tokenValues);
    }
    return tokenValues[0];
  }
  getToken( word )
  {
    let tokenValues = this.tokens.get(word);
    if( tokenValues.length != 1 ) {
      console.log("stringtrie cannot find token '" + word + "'");
      return null;
    }
    return tokenValues[0];
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

  // fromTokens: approximate return with possibly corrected punctuation
  fromTokens( tk )
  {
  	var i,len=tk.length;
  	var tokens = "";
  	for(i=0;i<len;i++){
  		if( typeof tk[i] == 'undefined' || isNaN(tk[i]) ) continue;
  		tokens = this.joinWord(tokens, central.xdict[tk[i]]);
  	}
  	return tokens;
  }

  joinWord(phrase, word1)
  {
  	let t = this.letterType(word1[0]);
  	let u = this.letterType(phrase[phrase.length-1]);
  	let includeSpace=(u!=2);

  	switch( t ) {
  	case 0: // alphabet
	  	return phrase + (includeSpace?" ":"") + word1;
  	case 1: // numeric
  		if( u == 1 ) return phrase + word1;
  		else return phrase + (includeSpace?" ":"") + word1;
  	case 2: // spacing
  		return phrase + (includeSpace?" ":"");
  	case 3: // punctuation
  		//if( word1 == "-" ) {
  		return phrase + (includeSpace?" ":"") + word1;
	  	/*} else {
        return (includeSpace?phrase.substring(0,phrase.length-1):phrase) + word1;
  		}*/
  	}
  	return phrase + " " + word1;
  }


  // toTokens: convert to numbers
  toTokens( str )
  {
  	var i,t;
  	let w="",tokens=[];
  	let type=-1;
  	if( str == "" ) return [];

  	str = str.toLowerCase();
  	for( i=0; i<str.length; i++ ) {
  		t = this.letterType(str[i]);
      /*
      if( str[i] == '\n' ) {
        if( w != "" ) {
          tokens.push( this.addWord(w) );
          w = "";
        }
        tokens.push( this.addWord('\n') );
        type = 2;
        continue;
      }
      */
  		if( t == type && t != 5 ) {
  			switch( t ) {
        case 0: case 1: case 3:
  				w += str[i];
  				break;
        case 2: default:
  				break;
  			}
  		} else {
  			if( w != "" ) {
  				tokens.push( this.addWord(w) );
  				w = "";
  		  }
  		  type=t;
  		  if( t != 2 )
  			  w += str[i];
      }
  	}
  	if( w != "" ) {
      tokens.push( this.addWord(w) );
  	}
  	return tokens;
  }

};

