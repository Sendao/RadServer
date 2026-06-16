var Async = require('async');

module.exports = function AIData() {

  this.tzadjust = -8;
  this.aimodel = 'meta-llama/llama-3.2-90b-vision-instruct:free';

  this.request_queue = [];

  this.startup = function() {
    console.log("Installing AI module.");
    this.app.recycle(this.setup.bind(this));
  };

  this.setup = function() {
      this.people = {};
      this.persons = {};
      this.aicon = {};
      this.aikey = {};
      this.xkey = {};
      this.usingxai = {};
      /*
      this.objs.Personas.update( { private: false }, { private: true }, function(e,docs) {} );
      this.objs.Personas.find( {}, function(err,docs) {
          var i;
          console.log("Loading actors....");
          for( i=0; i<docs.length; i++ ) {
            let obj = docs[i].toObject();
              this.people["" + obj._id] = obj;
              this.persons[obj.name] = "" + obj._id;
          }
          console.log("AI Module ready.");
      }.bind(this) );
      */
  };

  this.workcycle = function() {
    let dn = new Date();
    while( this.request_queue.length > 0 ) {
      let handler = request_queue.shift();
      if( dn.getTime() >= handler[0] ) {
        handler[1]();
      }
    }
  };
  this.requestQueue = function(cb) {
    request_queue.push(cb);
  };

// Utilities
  this.parseDate = function(dtn) {
    var dtt = new Date( dtn.getTime() + (this.tzadjust * 60 * 60 * 1000) );
    let hr = dtt.getHours();
    let ampm = hr<12 ? "am" : "pm";
    if( hr > 12 ) hr -= 12;
    if( hr == 0 ) hr = 12;
    var mins = dtt.getMinutes();
    if( mins < 10 ) mins = "0" + mins;
    return hr + ":" + mins + ampm;
  };
  this.fromCSV = function(csv)
  {
    var arr;
    if( typeof csv == 'string' ) arr = csv.split(',');
    else arr = csv.slice();

    if( csv == "" ) return [];

    for( var i=0; i<arr.length; i++ ) {
      let o = arr[i];
      if( typeof o != 'string' ) {
        console.log("fromCSV unexpected object", arr, i, typeof o, o);
        continue;
      }
      arr[i] = o.replaceAll('\\,', ',');
    }

    return arr;
  };

  this.toCSV = function(arr)
  {
    let result = "";
    for( var o=0; o<arr.length; o++ ) {
      if( typeof arr[o] != 'string' ) {
        console.log("toCSV unexpected object", arr, o, typeof arr[o], arr[o]);
        continue;
      }
      if( result != "" ) result = result + "," + arr[o].replaceAll(',', '\\,');
      else result = arr[o].replaceAll(',', '\\,');
    }
    return result;
  };
  this.cc = {
    a: 'a'.charCodeAt(0), z: 'z'.charCodeAt(0),
    A: 'A'.charCodeAt(0), Z: 'Z'.charCodeAt(0),
    zero: '0'.charCodeAt(0), nine: '9'.charCodeAt(0)
  };
  this.vp = ".,!@#$%^&*_+-=\\|'\"";
  this.letterType = function( c )
  {
    let n = c.charCodeAt(0);
    if( ( n >= this.cc.a && n <= this.cc.z ) || ( n >= this.cc.A && n <= this.cc.Z ) )
      return 0;
    if( n >= this.cc.zero && n <= this.cc.nine )
      return 1;
    if( c == ' ' || c == '\n' || c == '\r' || c == '\t' )
      return 2;
    if( this.vp.indexOf(c) >= 0 ) return 3;
    return 4;
  }

// Socket controls
  this.clients = {};
  this.registerClient = function(pagekey, userid) {
    if( pagekey in this.clients ) return;
    this.clients[pagekey] = userid;
  };
  this.closeClient = function(pagekey) {
    delete this.clients[pagekey];
  };
  this.broadcast = function(msg) {
    var i, ids=[];
    for( i in this.clients ) {
      ids.push(i);
    }
    for( i=0; i<ids.length; ++i ) {
      this.messageUser2( ids[i], msg );
    }
  };
  this.messageUser2 = function(userid, message) {
    if( !(userid in this.clients) ) return;
    let client = this.app.locateUser(userid, true);
    if( client !== false ) {
      client.send(message,null,false);
    } else {
      delete this.clients[userid];
    }
  };
  this.messageUser = function(userid, message) {
    var i, found=false;
    for( i in this.clients ) {
      if( i == userid || this.clients[i] == userid ) {
        this.messageUser2(i, message);
        found=true;
      }
    }
    if( !found ) {
      console.log("User not found " + userid + ", ", this.clients);
    }
  };


// Internal tools
  this.connectAI = function(userid, key, usingxai, xkey) {
    if( userid in this.aikey && this.aikey[userid] == key ) {
      this.usingxai[userid] = usingxai;
      this.xkey[userid] = xkey;
      return;
    }

/*    let configuration = new Configuration({
      apiKey: key
    });
    let openai = new OpenAIApi(configuration); */
    console.log("Use key '" + key + "'");
    this.aikey[userid] = key;
    this.usingxai[userid] = usingxai;
    this.xkey[userid] = xkey;
    this.aicon[userid] = { apiKey: key, xKey: xkey };
  };
  
  this.makePrompt = function(prompt)
  {
    if( 'phrases' in prompt && typeof prompt.phrases == 'string' ) {
      prompt._phrases = prompt.phrases;
      prompt.phrases = this.fromCSV(prompt.phrases);
    }
    return prompt;
  }
  this.loadPrompt = function(pid, user)
  {
    let prompt = this.PolyPrompts.find({ '_id': pid }, function(err, vals) {
      if( err ) {
        console.log("Error: ", err);
        return null;
      }
      let o = {}, obj = vals[0].toObject();
      for( var i in obj ) {
        if( i == 'phrases' ) {
          o['_' + i] = obj[i];
          o[i] = this.fromCSV(obj[i]);
        } else {
          o[i] = obj[i];
        }
      }
      return o;
    }.bind(this));
  };

  this.savePrompt = function(prompt)
  {
    let op = {};
    for( var i in prompt ) {
      if( i == 'phrases' ) {
        op[i]=this.toCSV(prompt.phrases);
      } else if( i == '_phrases' ) {
        continue;
      } else {
        op[i]=prompt[i];
      }
    }
    this.PolyPrompts.updateOne({_id: prompt._id}, op, function(err, result) {
      // done
      if ( err ) {
        console.log("Error: ", err);
      }
    }.bind(this));
  };


  this.makeConvo = function(convo)
  {
    if( 'chatlog' in convo && typeof convo.chatlog == 'string' ) {
      convo._chatlog = convo.chatlog;
      convo.chatlog = this.fromCSV(convo._chatlog);
    }
    return convo;
  }
  this.loadConvo = async function(pid)
  {
    let vals = await this.objs.Conversations.find({ '_id': pid });
    let o = {};
    let obj = vals[0].toObject();
    for( var i in obj ) {
      if( typeof obj[i] == 'undefined' ) continue; // ignore empty fields
      if( i == 'chatlog' ) {
        o['_' + i] = obj[i];
        o[i] = this.fromCSV(obj[i]);
      } else {
        o[i] = obj[i];
      }
    }
    return o;
  };

  this.saveConvo = async function(convo)
  {
    let obj = {};
    for( var i in convo ) {
      if( typeof convo[i] == 'undefined' ) continue; // ignore empty fields
      if( i == 'chatlog' ) {
        obj[i]=this.toCSV(convo.chatlog);
      } else if( i == '_chatlog' ) {
        continue;
      } else {
        obj[i]=convo[i];
      }
    }
    let result = await this.objs.Conversations.updateOne({_id: convo._id}, obj, function(err, result) {
      if( err ) {
        console.log("Error: ", err);
      }
    }.bind(this));
  };



// API
  this.getMemoriesJSON = async function(actorid, userid, prompt, carryon, cb) {
    this.objs.History.find({actor: actorid}).sort({'time':-1}).limit(5).exec(function(err,docs) {
      if( err ) {
        console.log("Error: ", err);
        cb(err, null);
        return;
      }
      var i, mems = "";
      for( i=docs.length-1; i>=0; i-- ) {
        if( mems != "" ) mems += "\n";
        mems += this.parseDate(docs[i].time) + ": " + docs[i].action;
      }
      if( mems != "" ) mems += "\n";
      //console.log(docs.length + " memories for " + actorid + ": " + mems);
      prompt.memories = mems;

      this.objs.Story.find({actor: actorid}).sort({'time':-1}).limit(3).exec(function(err,story) {
        var i, newstr="";

        for( i=story.length-1; i>=0; i-- ) {
          newstr += this.parseDate(story[i].time) + ": " + story[i].action + "\n";
        }

        prompt.history = newstr;
  
        carryon(actorid, userid, prompt, cb);
      }.bind(this));
    }.bind(this) );
  };

  this.getRanking = function(rankings, ident)
  {
    for( var i=0; i<rankings.length; i++ )
      if( rankings[0] == ident )
        return rankings[1];
    return 0.0;
  }

  this.getRankingsFromText = function(actorid, data)
  {
    var i;
    let results = [], number = "", ident = false, fixed = false;
    let details = { actorid };

    for( i=0; i<data.length; i++ ) {
      let l = this.letterType(data[i]);
      switch( l ) {
      case 0: // alpha
        if( number != "" ) {
          if( ident !== false ) {
            results.push([ident,number]);
            ident=false;
          }
          number = "";
        }
        ident = "";
        continue;
      case 1: // digit
        if( fixed ) {
          number = "";
          fixed = false;
        }
        number += data[i];
        continue;
      case 2:
        if( number != "" ) {
          if( ident !== false ) {
            results.push([ident,number]);
            ident=false;
          }
        }
        fixed = true;
        continue;
      case 3:
        if( fixed ) {
          number = "";
          fixed = false;
        }
        if( data[i] == '.' || data[i] == '-' ) {
          number += data[i];
        } else {
          number = "";
        }
        continue;
      case 4:
        if( data[i] == ':' ) {
          ident = number;
        }
        continue;
      }
    }
    if( ident !== false && number != "" ) {
      results.push([ident,number]);
    }
    details.rankings = results;

    this.objs.History.find({actor: details.actorid}).sort({'time':-1}).limit(5).exec(function(details,err,docs) {
      var i;
      details.rankno = 1;

      for( i=docs.length-1; i>=0; i-- ) {
        let rankings = story[i].rankings.split(",");
        let choice = this.getRanking(details.rankings, details.rankno);
        rankings.push( choice );
        obj = history[i].toObject();
        obj.rankings = rankings.join(",");
        story[i].rankings = rankings.join(",");
        details.rankno++;
      }
      let updateHistory = function(history, cb) {
        this.objs.History.updateOne({_id:history._id}, {rankings:history.rankings}, function(err,doc){
          if( err ) {
            cb(err);
          } else {
            cb(null);
          }
        }.bind(this));
      }
      async.each( stories, updateHistory.bind(this), function(details, err) {
        if( err ) {
          console.log("Error",err);

        }
        this.objs.Story.find({actor: details.actorid}).sort({'time':-1}).limit(8).exec(function(details,err,story) {
          var i, obj;
          let stories = [];
          for( i=story.length-1; i>=0; i-- ) {
            let rankings = story[i].rankings.split(",");
            let choice = this.getRanking(details.rankings, details.rankno);
            rankings.push( choice );
            obj = story[i].toObject();
            obj.rankings = rankings.join(",");
            stories.push( obj );
            details.rankno++;
          }
          let updateStory = function(story, cb) {
            this.objs.Story.updateOne({_id:story._id}, {rankings:story.rankings}, function(err,doc){
              if( err ) {
                console.log("Error",err);
                cb(err);
              } else {
                cb(null);
              }
            }.bind(this));
          }
          async.each( stories, updateStory.bind(this), function(err) {
            console.log("Finished updating story");
          }.bind(this));
        }.bind(this, details));
      }.bind(this, details));
    }.bind(this, details));
  }

  this.getMemories_Continue = async function(rankdata, actorid, userid, prompt, carryon, cb) {
    let details = { rankdata, actorid, userid, prompt, carryon, cb };
    this.objs.History.find({actor: details.actorid}).sort({'time':-1}).limit(5).exec(function(details,err,docs) {
      if( err ) {
        console.log("Error: ", err);
        details.cb(err, null);
        return;
      }
      var mempos = details.prompt.indexOf('$memories');
      if( mempos < 0 )  {
        details.cb("No memories in prompt", null);
        return;
      }
      var i, mems = "";
      var rankno = 1;
      for( i=docs.length-1; i>=0; i-- ) {

        let rankings = docs[i].rankings.split(",");
        let ranksum = rankings.reduce( (a,b) => { a + b }, 0 );
        let avgrank = ranksum/rankings.length;

        let prob = Math.random();
        if( prob < avgrank ) {

          if( mems != "" ) mems += "\n";
          mems += this.parseDate(docs[i].time) + ": " + this.people[docs[i].actor].name + ": ";
          if( prob*1.50 < avgrank ) {
            mems += docs[i].action;
          } else if( prob*1.25 < avgrank ) {
            mems += this.lastSentence(docs[i].action, 3);
          } else {
            mems += this.lastSentence(docs[i].action, 2);
          }
          mems += "\n";

        }
        rankno++;

      }
      if( mems != "" ) mems += "\n";
      //console.log(docs.length + " memories for " + actorid + ": " + mems);
      details.prompt = details.prompt.substring(0,mempos) + mems + details.prompt.substring(mempos+9);
      details.rankno = rankno;

      this.objs.Story.find({actor: details.actorid}).sort({'time':-1}).limit(8).exec(function(details,err,story) {
        let outpos = details.prompt.indexOf("$background");
        var i, newstr="";

        for( i=story.length-1; i>=0; i-- ) {

          let rankings = docs[i].rankings.split(",");
          let ranksum = rankings.reduce( (a,b) => { a + b }, 0 );
          let avgrank = ranksum/rankings.length;

          let prob = Math.random();
          if( prob < avgrank ) {

            newstr += this.parseDate(story[i].time) + ": " + this.people[story[i].actor].name + ": ";
            if( prob*1.50 < avgrank ) {
              newstr += story[i].action + "\n";
            } else if( prob*1.25 < avgrank ) {
              newstr += this.lastSentence(story[i].action, 3) + "\n";
            } else {
              newstr += this.lastSentence(story[i].action, 2) + "\n";
            }

          }
          details.rankno++;
        }
        if( outpos >= 0 ) {
          details.prompt = details.prompt.substring(0,outpos) + newstr + details.prompt.substring(outpos+11);
        }
  
        details.carryon(details.actorid, details.userid, details.prompt, details.cb);
      }.bind(this, details));
    }.bind(this, details));
  };


  this.getMemories = async function(actorid, userid, prompt, carryon, cb) {
    var details = { actorid, userid, prompt, carryon, cb };
    var mempos = prompt.indexOf('$memories');
    if( mempos < 0 )  {
      cb("No memories in prompt", null);
      return;
    }

    this.objs.History.find({actor: actorid}).sort({'time':-1}).limit(5).exec(function(details, err, docs) {
      if( err ) {
        console.log("Error: ", err);
        cb(err, null);
        return;
      }
      var i, ranker = [], objs = [];
      for( i=docs.length-1; i>=0; i-- ) {
        ranker.push( this.parseDate(docs[i].time) + ": " + this.people[docs[i].actor].name + ": " + docs[i].action );
        objs.push( { _id: docs[i]._id, number: i } );
      }
      details.history = objs;

      this.objs.Story.find({actor: actorid}).sort({'time':-1}).limit(8).exec(function(details, ranker, err, story) {
        var i, objs;

        for( i=story.length-1; i>=0; i-- ) {
          ranker.push( this.parseDate(story[i].time) + ": " + this.people[story[i].actor].name + ": " + story[i].action );
          objs.push( { _id: story[i]._id, number: i } );
        }
        details.story = objs;

        //getMemories2(ranker, actorid, userid, prompt, carryon, cb);
        this.getImportanceQuery( prompt, ranker, async function(details, data) {
          console.log("Importance data: " + data);
          await this.getRankingsFromText(details.actorid, data, function(details, rankings) {
            this.getMemories_Continue( rankings, details.actorid, details.userid, details.prompt, details.carryon, details.cb );
          }.bind(this, details) );
        }.bind(this, details) );
      }.bind(this, details, ranker) );
    }.bind(this, details) );
  };


  this.buildConvoPrompt = function(convo)
  {
    let prompt = this.buildPrompt(this.persons[convo.actorname], false, false), len = convo.chatlog.length;
    let maxlen=15*2;
    var i= len>=maxlen?(len-maxlen)/2:0;
    let chatlog = convo.chatlog;
    for( var i=0; i<chatlog; i+=2 ) {
      prompt += "<msg_start from=" + chatlog[i] + ">\n" + chatlog[i+1] + "<msg_end>\n";
    }
    return prompt;
  }

  this.promptConvo = async function(convo, userid, secure=false, cb=null) {
    let dtn = new Date();
    let actorid = this.persons[convo.actorname];
    let person = this.people[actorid];
    console.log("Convo",convo,actorid);
    if( !person || typeof person == 'undefined' ) { 
      if( cb != null )
        cb("No such person " + convo.actorname + ": " + actorid, null);
      return false;
    }
    if( person.active ) {
      if( secure || person.active_until < dtn ) {
        person.active = false;
        console.log("Reactivate " + person.name);
      } else {
        if( cb != null )
          cb("Person not active", null);
        return false;
      }
    }
    let prompt = this.buildConvoPrompt(convo);
    this.getMemories(actorid, userid, prompt, this.getCompletionText.bind(this), cb);
    return true;
  };

 
  this.compilePrompt = function(prompt, userid, cb) {
    var i, keys = new Set();
    var w = "";
    for( i=0; i<prompt.length; i++ ) {
      if( this.app.util.isAlpha(prompt[i]) ) {
        w += prompt[i];
      } else if( !isNaN(prompt[i]) ) {
        w += prompt[i];
      } else {
        keys.add(w);
        w="";
      }
    }
    var k = Array.from(keys);
    Async.each( k, function(key, cbin) {
      this.objs.KeyMem.find({owner: userid, name: key}, function(err,docs) {
        var i;
        i=0;
        if( i>=docs.length ) {
          cbin(null, null);
          return;
        }
        prompt = key + ": " + docs[i].story + "\n" + prompt;
        cbin(null, null);
      }.bind(this) );
    }.bind(this), function() {
      cb(prompt);
    } );
  };

  this.buildPromptJSON = function(actorid) {
    let prompt = {};
    let person = this.people[actorid];
    let dtn = new Date();

    prompt["name"] = person.name;
    prompt["time"] = this.parseDate(dtn);
    prompt["location"] = person.location;
    prompt["status"] = person.status;
    prompt["origin"] = person.originstory;
    prompt["memories"] = [];
    prompt["history"] = [];

    return prompt;
  }

  this.buildPrompt = function(actorid, includeStory=false, includeInstructions=true) {
    let prompt = "";
    if( !(actorid in this.people) ) {
      console.log("buildPrompt: Actorid not found " + actorid);
      throw "No actorid found";
    }
    let person = this.people[actorid];


    prompt += "---Name: " + person.name + "\n";
    if( includeInstructions )
      prompt += this.instructions() + "\n";
    prompt += "---Location: " + person.location + "\n";
    prompt += "---Status: " + person.status + "\n";
    prompt += "---Memory: $memories\n";
    if( includeStory )
      prompt += "---Story: $background\n"
    return prompt;
  };

  this.instructions = function()
  {
    return "---Output Format:\nAct: something you do.\nMem: any longterm memories.\nLocation: your location.\nStatus: your status.\nNotes: any notes you write down.\n";
  };

  this.instructionsSummary = function()
  {
    return "---Output Format:\nSum: a few words to describe the abstract topic\n";
  };


  this.promptActor = function(actorid, userid, sec, cb=null) {
    let dtn = new Date();
    var person = this.people[actorid];
    if( !person || typeof person == 'undefined' ) { 
      cb("No such person", null);
      return false;
    }
    if( !sec && person.owner != userid ) {
      cb("No access", null);
      return false;
    }
    let prompt = this.buildPrompt(actorid, true, false);
    // include a program to compute new activities
    prompt += "--When: It is " + this.parseDate(dtn) + ".\n";
    prompt += "You are " + person.name + ".\n";
    prompt += this.instructions() + "\n";
    prompt += "What will you do?\n";

    this.getMemories(actorid, userid, prompt, this.getCompletion.bind(this), cb);

    return true;
  };


  // all requests must pass through getSystemResponse

  this.getSystemResponseQuery = async function(actorid, userid, query, cb=null) {
    let dtn = new Date();

    let prompt = this.buildPrompt(actorid, true, false);
    prompt += "--When: It is " + this.parseDate(dtn) + ".\n";
    prompt += "Always change Act.\n";
    prompt += this.instructions() + "\n";
    prompt += query + "\n";

    console.log("Getting response...");
    this.getMemories(actorid, userid, prompt, this.getCompletion.bind(this), cb);
  };

  this.getImportanceQuery = async function(userid, maintext, includetexts, cb=null) {
    let prompt = "System: We need to make an important computational ranking of these critical information points. Please rank these numbered texts according to how important they are as related to this main text:\n" + maintext + "\n\n";
    prompt += "Information points:\n";
    for( var i=0; i<includetexts.length; i++ ) {
      prompt += (i+1) + ": " + includetexts[i] + "\n";
    }
    prompt += "Use the output format <information reference number>:<ranking 0.0-1.0>\\n\nFor example,\n1:0.5\n2:0.3\n3:0.9987653\n\nRankings will be normalized. Repeated information should have lower ranking.\n1:";

    console.log("Getting response for \n" + prompt);
    this.getCompletionRaw(userid, prompt, cb);
  };

  this.getChoices = function(actorid, sec, userid, choicecount, cb) {
    var person = this.people[actorid];
    if( !person || typeof person == 'undefined' ) { 
      cb("No such person", null);
      return false;
    }
    if( !sec && person.owner != userid ) {
      cb("No access", null);
      return false;
    }
    let choicemsg = "---Query:\nWhat are some of your available options right now? List three options in the following format:\n";
    choicemsg += "1: Option one\n2: Option two\n3: Option three\n---Response:\n";
    this.getSystemResponseSpecific( actorid, userid, choicemsg, this.getCompletionChoices.bind(this), cb )
  }

  this.getSummaryFrom = function(actorid, sec, userid, text, cb) {
    var person = this.people[actorid];
    if( !person || typeof person == 'undefined' ) { 
      cb("No such person", null);
      return false;
    }
    if( !sec && person.owner != userid ) {
      cb("No access", null);
      return false;
    }

    this.getSystemResponseSummarize( actorid, userid, "Summarize the following text:\n`" + text + "`\n", cb );
  }
  this.getSystemResponseSummarize = async function(actorid, userid, query, cb=null) {
    let prompt = this.buildPrompt(actorid, true, false);
    let dtn = new Date();
    prompt += "--When: It is " + this.parseDate(dtn) + ".\n";
    prompt += "---Request: " + query + "\n---Summary: ";
    console.log("Getting response...");
    this.getMemories(actorid, userid, prompt, this.getCompletionText.bind(this), cb);
  };

  this.getSystemResponseSpecific = async function(actorid, userid, choicemsg, cb=null) {
    let prompt = this.buildPrompt(actorid, true, false);
    let dtn = new Date();
    prompt += "--When: It is " + this.parseDate(dtn) + ".\n";
    prompt += choicemsg;
    console.log("Getting response...");
    this.getMemories(actorid, userid, prompt, this.getCompletion.bind(this), cb);
  };

  this.getSystemResponsePrompt = async function(actorid, userid, choicemsg, cb=null) {
    let prompt = this.buildPrompt(actorid, true, true);
    let dtn = new Date();
    prompt += "--When: It is " + this.parseDate(dtn) + ".\n";
    prompt += choicemsg;
    console.log("Getting response...");
    this.getMemories(actorid, userid, prompt, this.getCompletion.bind(this), cb);
  };

  this.getSystemResponse = async function(actorid, userid, cb=null) {
    let prompt = this.buildPrompt(actorid, true, true);
    let dtn = new Date();
    prompt += "--When: It is " + this.parseDate(dtn) + ".\n";
    prompt += "Always change Act.\n";
    prompt += "What happens next, what do they find out, or what is the reaction to them?\n";

    console.log("Getting response...");
    this.getMemories(actorid, userid, prompt, this.getCompletion.bind(this), cb);
  };

  this.getMoreDetail = async function(actorid, userid, cb=null) {
    let prompt = this.buildPrompt(actorid, true, true);
    let dtn = new Date();

    prompt += "--When: It is " + this.parseDate(dtn) + ".\n";
    prompt += "Always change Act.\n";
    prompt += "What is happening in detail?\n";

    console.log("Getting response...");
    this.getMemories(actorid, userid, prompt, this.getCompletion.bind(this), cb);
  };




  this.firstSentence = function(para, scount=1)
  {
    var sent = "";
    let endpunct = '?!.', ecount=0;
    var i;
    para.replaceAll('...', '&&&');
    for( i=0; i<para.length; i++ ) {
      if( endpunct.indexOf(para[i]) >= 0 ) {
        ecount++;
        if( ecount >= scount ) break;
      }
    }
    para.replaceAll('&&&', '...');
    sent = para.substring(0,i+1);
    return sent;
  };

  this.lastSentence = function(para, scount=1)
  {
    var sent = "";
    let endpunct = '?!.', ecount=0;
    var i;
    para.replaceAll('...', '&&&');
    for( i=para.length-1; i>=0; i-- ) {
      if( endpunct.indexOf(para[i]) >= 0 ) {
        ecount++;
        if( ecount >= scount ) break;
      }
    }
    para.replaceAll('&&&', '...');
    sent = para.substring(i+1);
    return sent;
  };

  this.processCompletion = function(actorid, userid, ctext, saveMemories=false, saveStory=true)
  {
    let dtn = new Date();
    var pos, last=-1;
    let myaction = "", mylocation = "", mystatus = "", mymemories = "";
    let mynotes = "";

    let totaltime = 240;
    ctext = ctext.trim();
    //console.log("Raw: ", ctext);

    while( (pos=ctext.indexOf("Memory for " + this.people[actorid].name + ":")) >= 0 ) {
      ctext = ctext.substring(0,pos) + ctext.substring(pos+12+this.people[actorid].name.length);
    }

    while( (pos = ctext.indexOf("Act:",last+1)) >= 0 ) {
      let end = this.nextField(ctext, pos+4);
      console.log("act pos: " + pos + ", end: " + end);
      //let end = ctext.indexOf("\n",pos+1);
      if( end < 0 ) { end = ctext.length-1; }
      let action = this.clearText( ctext.substring(pos+4,end) );
      ctext = ctext.substring(0,pos) + ctext.substring(end+1);
      last = pos;
      console.log("Act: " + action);
      myaction += action + "\n";
    }
    last = -1;

    while( (pos = ctext.indexOf("Action:",last+1)) >= 0 ) {
      let end = this.nextField(ctext, pos+7);
      console.log("act pos: " + pos + ", end: " + end);
      //let end = ctext.indexOf("\n",pos+1);
      if( end < 0 ) { end = ctext.length-1; }
      let action = this.clearText( ctext.substring(pos+7,end) );
      ctext = ctext.substring(0,pos) + ctext.substring(end+1);
      last = pos;
      console.log("Act: " + action);
      myaction += action + "\n";
    }
    last = -1;

    if( myaction == "" ) {
      while( (pos = ctext.indexOf("Summary:",last+1)) >= 0 ) {
        let end = this.nextField(ctext, pos+8);
        console.log("sum pos: " + pos + ", end: " + end);
        //let end = ctext.indexOf("\n",pos+1);
        if( end < 0 ) { end = ctext.length-1; }
        let action = this.clearText( ctext.substring(pos+8,end) );
        ctext = ctext.substring(0,pos) + ctext.substring(end+1);
        last = pos;
        console.log("Sum: " + action);
        myaction += action + "\n";
      }
      last = -1;
    }

    if( saveStory ) {
      this.objs.Story.create({actor: actorid, action: myaction, time: dtn}, function(err, res) {
        if( err ) console.log("Error: ", err);
        console.log("Create story",res);
      }.bind(this));
    }

    while( (pos = ctext.indexOf("Move:",last+1)) >= 0 ) {
      let end = this.nextField(ctext, pos+5);
      console.log("move pos: " + pos + ", end: " + end);
      //let end = ctext.indexOf("\n",pos+1);
      if( end < 0 ) { end = ctext.length-1; }
      let action = this.clearText( ctext.substring(pos+5,end) );
      ctext = ctext.substring(0,pos) + ctext.substring(end+1);
      last = pos;
      console.log("Move: " + action);
      mylocation = action;
    }
    last = -1;

    while( (pos = ctext.indexOf("Location:",last+1)) >= 0 ) {
      let end = this.nextField(ctext, pos+9);
      console.log("loc pos: " + pos + ", end: " + end);
      //let end = ctext.indexOf("\n",pos+1);
      if( end < 0 ) { end = ctext.length-1; }
      let action = this.clearText( ctext.substring(pos+9,end) );
      ctext = ctext.substring(0,pos) + ctext.substring(end+1);
      last = pos;
      console.log("Loc: " + action);
      mylocation = action;
    }
    last = -1;

    while( (pos = ctext.indexOf("Status:",last+1)) >= 0 ) {
      let end = this.nextField(ctext, pos+7);
      console.log("status pos: " + pos + ", end: " + end);
      //let end = ctext.indexOf("\n",pos+1);
      if( end < 0 ) { end = ctext.length-1; }
      let action = this.clearText( ctext.substring(pos+7,end) );
      ctext = ctext.substring(0,pos) + ctext.substring(end+1);
      last = pos;
      console.log("Status: " + action);
      mystatus = action;
    }
    last = -1;

    while( (pos = ctext.indexOf("Notes:",last+1)) >= 0 ) {
      let end = this.nextField(ctext, pos+6);
      console.log("notes pos: " + pos + ", end: " + end);
      //let end = ctext.indexOf("\n",pos+1);
      if( end < 0 ) { end = ctext.length-1; }
      let action = this.clearText( ctext.substring(pos+6,end) );
      ctext = ctext.substring(0,pos) + ctext.substring(end+1);
      last = pos;
      console.log("Notes: " + action);
      last = -1;
      this.objs.Records.create({actor: actorid, action, time: dtn}, function(err) {
        if( err ) console.log("Error: ", err);
      });
      mynotes = action;
    }

    while( (pos = ctext.indexOf('Mem:',last+1)) >= 0 ) {
      let end = this.nextField(ctext, pos+4);
      console.log("mem pos: " + pos + ", end: " + end);
      //let end = ctext.indexOf("\n",pos+1);
      if( end < 0 ) { end = ctext.length-1; }
      let memory = this.clearText( ctext.substring(pos+4,end) );
      ctext = ctext.substring(0,pos) + ctext.substring(end+1);
      last = pos;
      console.log("Mem: " + memory);
      if( saveMemories && memory.trim() != "" ) {
        this.objs.History.create({actor: actorid, action: memory, time: dtn}, function(err) {
          if( err ) console.log("Error: ", err);
        });
      }
      if( mymemories != "" ) mymemories += "\n";
      mymemories += memory;
    }

    while( (pos = ctext.indexOf('Memory:',last+1)) >= 0 ) {
      let end = this.nextField(ctext, pos+7);
      console.log("mem pos: " + pos + ", end: " + end);
      //let end = ctext.indexOf("\n",pos+1);
      if( end < 0 ) { end = ctext.length-1; }
      let memory = this.clearText( ctext.substring(pos+7,end) );
      ctext = ctext.substring(0,pos) + ctext.substring(end+1);
      last = pos;
      console.log("Mem: " + memory);
      if( saveMemories && memory.trim() != "" ) {
        this.objs.History.create({actor: actorid, action: memory, time: dtn}, function(err) {
          if( err ) console.log("Error: ", err);
        });
      }
      if( mymemories != "" ) mymemories += "\n";
      mymemories += memory;
    }


    while( (pos = ctext.indexOf('Memories:',last+1)) >= 0 ) {
      let end = this.nextField(ctext, pos+9);
      console.log("mem pos: " + pos + ", end: " + end);
      //let end = ctext.indexOf("\n",pos+1);
      if( end < 0 ) { end = ctext.length-1; }
      let memory = this.clearText( ctext.substring(pos+9,end) );
      ctext = ctext.substring(0,pos) + ctext.substring(end+1);
      last = pos;
      console.log("Mem: " + memory);
      if( saveMemories && memory.trim() != "" ) {
        this.objs.History.create({actor: actorid, action: memory, time: dtn}, function(err) {
          if( err ) console.log("Error: ", err);
        });
      }
      if( mymemories != "" ) mymemories += "\n";
      mymemories += memory;
    }


    this.objs.Personas.updateOne( { _id: actorid }, { activity: myaction, status: mystatus, location: mylocation, active: true, active_until: new Date(dtn.getTime() + totaltime*60000) }, function(err) {
      if( err ) {
        console.log("Error: ", err);
      } else {
        console.log("Updated active_until");
      }
      this.people[actorid].active = true;
      this.people[actorid].active_until = new Date(dtn.getTime() + totaltime*60000);
      this.people[actorid].status = mystatus;
      this.people[actorid].location = mylocation;

      var msg = { 'code': 'update' };
      msg.actor = actorid;
      msg.activity = myaction;
      msg.status = mystatus;
      msg.location = mylocation;
      msg.active = true;
      msg.active_until = new Date(dtn.getTime() + totaltime*60000);
      msg.notes = mynotes;
      if( mymemories.trim() != "" )
        msg.addmem = mymemories;

      if( this.people[actorid].private ) {
        console.log("Private message to " + userid);
        this.messageUser(userid, msg);
      } else {
        console.log("Broadcasting message");
        this.broadcast(msg);
      }
    }.bind(this));

    console.log("remaining: " + ctext);

    myaction += "\n" + ctext;
    return {action: myaction, summary: myaction, location: mylocation, status: mystatus, memories: mymemories, time: totaltime, notes: mynotes};
  }

  this.tryParseJson = function(str)
  {
    let obj = {};
    var i;
    let state=-1;
    let varname="";
    let value="";

    if( str[0] != '{' ) {
      return obj;
    }

    for( i=0; i<str.length; i++ ) {
      switch( state ) {
        case -1:
          if( str[i] == '"' ) {
            state = 0;
            continue;
          }
          varname="";
          break;
        case 0:
          if( str[i] == '\\' ) {
            i++;
          } else if( str[i] == '"' ) {
            state = 1;
            continue;
          }
          varname += str[i];
          break;
        case 1:
          value="";
          if( str[i] == ':' ) {
            state = 2;
            continue;
          }
          break;
        case 2:
          if( str[i] == '"' ) {
            state = 3;
          } else {
            state = 4;
            value = str[i];
          }
          break;
        case 3:
          if( str[i] == '\\' ) {
            i++;
          } else if( str[i] == '"' ) {
            state = 5;
            continue;
          }
          value += str[i];
          break;
        case 4:
          if( str[i] == ',' ) {
            state = -1;
            obj[varname] = parseInt( value );
            varname=value="";
            continue;
          } else if( str[i] == '}' ) {
            obj[varname] = value;
            varname=value="";
            return obj;
          }
          value += str[i];
          break;
        case 5:
          if( str[i] == ',' ) {
            state = -1;
            obj[varname] = value;
            varname=value="";
            continue;
          } else if( str[i] == '}' ) {
            obj[varname] = value;
            varname=value="";
            return obj;
          }
          break;
      }
    }
    if( varname != "" && value != "" && !(varname in obj) )
      obj[varname] = value;
    return obj;
  };

// For handling JSON responses, unused.
  this.processCompletionJSON = function(actorid, userid, ctext, saveMemories=false, saveStory=true)
  {
    console.log("Raw: ", ctext);
    var obj;
    try {
      if( ctext[0] == '{' ) {
        obj = JSON.parse(ctext);
      }  else {
        return this.processCompletion(actorid, userid, ctext, saveMemories, saveStory);
      }
    } catch( e ) {
      console.log(e);
      obj = this.tryParseJson(ctext);
      if( Object.keys(obj).length == 0 ) {
        console.log("Failed to parse JSON");
        return this.processCompletion(actorid, userid, ctext, saveMemories, saveStory);
      } else {
        console.log("TPJ result: ", obj);
      }
    }
    var i;
    for( i in obj ) {
      if( typeof obj[i] != 'string' ) {
        console.log("Skipping non-string: " + i);
        continue;
      }
      obj[i] = this.clearText( obj[i] );
    }
    obj.memories = obj.memory;
    if( 'say' in obj && obj.say != "" ) {
      obj.action = "Said: \"" + obj.say + "\"\n " + obj.action;
      delete obj['say'];
    }
    obj.time = 240;
    return obj;
  }


  this.clearText = function(text)
  {
    text = text.trim();
    let st = text.toLowerCase();
    if( st == "n/a" || st == "none" || st == "nothing" ) return "";
    if( st.indexOf("memory for ") == 0 ) {
      text = text.substr(12);
      st = st.substr(12);
    }
    var pos, last=-1;
    while( (pos=st.indexOf(":",last)) >= 0 ) {
      var read = st.substr(pos+1, 2);
      last=pos+1;
      if( !isNaN(read) ) {
        text = text.substr(0,pos) + text.substr(pos+3);
        st = st.substr(0,pos) + st.substr(pos+3);
        read = st.substr(pos, 2);
        if( read == "am" || read == "pm" ) {
          text = text.substr(0,pos) + text.substr(pos+2);
          st = st.substr(0,pos) + st.substr(pos+2);
        }
      }
      read = st.substr(pos-3, 2);
      if( !isNaN(read) ) {
        text = text.substr(0,pos-3) + text.substr(pos-1);
        st = st.substr(0,pos-3) + st.substr(pos-1);
        last -= 2;
      }
    }

    return text;
  }

  this.isTimeAt = function(str, i)
  {
    var j;

    for( j=i-1; j<i+1; j++ ) {
      if( str[j] == ':' ) break;
    }
    if( str[j] != ':' ) return false;
    var pre = str.substr(j-2, 2);
    var post = str.substr(j+1, 2);
    if( !isNaN(pre) || !isNaN(post) ) return true;
    return false;
  }

  this.nextField = function(text, pos)
  {
    var i;
    var lastdot = -1;
    for( i=pos; i<text.length; i++ ) {
      //console.log("nf: " + text[i] + " (" + i + ")");
      if( text[i] == "." ) lastdot = i;
      else if( text[i] == ":" ) {
        if( this.isTimeAt(text, i) ) continue;
        if( lastdot == -1 ) {
          for( ; i>=pos; i-- ) {
            if( text[i] == " " ) return i;
          }
        }
        return lastdot;
      }
      else if( text[i] == "\n" ) return i;
    }
    return text.length;
  }


  this.complete = async function(prompt, key, usingxai, xkey, cb) {
    let dtn = new Date();
    var completion, ctext;

    console.log("complete");

    try {
      console.log("Prompt:\n" + prompt + "\n");

      var response;
      if( usingxai ) {
        response = await fetch("https://api.x.ai/v1/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${xkey}`,
            "HTTP-Referer": `https://spiritshare.org/observable.html`,
            "X-Title": `Spiritshare`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            "prompt": prompt,
            'temperature': 1.15,
            'max_tokens': Math.floor(400+prompt.length/4),
            'frequency_penalty': 0.75,
            'presence_penalty': 0
          })
        });
      } else {
        response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${key}`,
            "HTTP-Referer": `https://spiritshare.org/openroutes.html`,
            "X-Title": `Spiritshare`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            "model": this.aimodel,
            "prompt": prompt,
            'temperature': 1.35,
            'max_tokens': parseInt(400+prompt.length/4),
            'frequency_penalty': 0.75,
            'presence_penalty': 0
          })
        });
      }
      ctext = await response.text();
      console.log("Response: ", ctext);
    } catch( e ) {
      console.log("Error: ", e);
      if( cb !== null )
        cb(e, null);
      return;
    }
    let result = JSON.parse(ctext);
    if( result.error ) {
      console.log("Error: ", result.error);
      cb(result.error, null);
      return;
    }
    if( typeof cb != null )
      cb(null, result.choices[0].text);
  }
  this.getCompletionRaw = async function(userid, prompt, cb=null) {
    let dtn = new Date();
    var completion, ctext;

    console.log("getSystemResponseFinal " + userid);

    let ai = this.app.openai;
    let usingxai = true;
    var xkey;
    if( userid in this.aicon ) {
      ai = this.aicon[userid];
      usingxai = this.usingxai[userid];
      xkey = this.xkey[userid];
      console.log("User AI", ai);
    } else {
      console.log("System AI (" + userid + "): " +
        Object.keys(this.aicon).length);
    }

    await this.complete(prompt, ai.apiKey, usingxai, xkey, function(cb, err, result) {
      if( cb != null ) {
        if( err ) {
          cb(err,null);
        } else {
          cb(null,data);
        }
      }
    }.bind(this, cb));
  };
  this.getCompletion = async function(actorid, userid, prompt, cb=null) {
    let dtn = new Date();
    var completion, ctext;

    console.log("getSystemResponseFinal " + userid);

    let ai = this.app.openai;
    let usingxai = true;
    var xkey;
    if( userid in this.aicon ) {
      ai = this.aicon[userid];
      usingxai = this.usingxai[userid];
      xkey = this.xkey[userid];
      console.log("User AI", ai);
    } else {
      console.log("System AI (" + userid + "): " +
        Object.keys(this.aicon).length);
    }

    await this.complete(prompt, ai.apiKey, usingxai, xkey, function(actorid, userid, cb, err, result) {
      if( err ) {
        if( cb != null ) cb(err,null);
        return;
      }
      let data = this.processCompletion(actorid, userid, result, true, true);
      console.log("Processed: ", data, "\n");

      if( cb != null ) cb(null, data);

    }.bind(this, actorid, userid, cb));
  };

  this.getCompletionText = async function(actorid, userid, prompt, cb) {
    var completion;
    let dtn = new Date();
    
    let ai = this.app.openai;
    let usingxai = true;
    if( userid in this.aicon ) {
      ai = this.aicon[userid];
      usingxai = this.usingxai[userid];
      xkey = this.xkey[userid];
      console.log("User AI", ai);
    } else {
      console.log("System AI (" + userid + "): " +
        Object.keys(this.aicon).length);
    }
    await this.complete(prompt, ai.apiKey, usingxai, function(actorid, userid, cb, err, result) {
      if( cb !== null ) {
        if( err ) cb(err,null);
        else cb(null, result);
      }
      console.log("Response: ", result, "\n");
    }.bind(this, actorid, userid, cb));
  };

};
