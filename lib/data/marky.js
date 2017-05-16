var fs = require('fs');
var async = require('async');

module.exports = function MarkyData() {
    
    this.workcycle = function() {
        if( typeof this.workcounter == 'undefined' ) {
            this.workcounter=0;
        }
        this.workcounter = this.workcounter + 1  % 38000;
        if( this.workcounter < 0 ) {
            
        }
        // read open sessions.
        var xd = this.base.sessions;
        var sessions = xd.search('ready', 1);
        var i, s, c;
        
        for( i=0; i<sessions.length; ++i ) {
            c = this.app.wssrv.locateUser( sessions[i].key );
            if( c === false ) continue;
            s = markyGen( sessions[i].mark, sessions[i].rate );
            console.log("Generated", s);
            // send the data to the specific socket.
            c.sen( { 'code': 'ai.' + sessions[i].mark, 'msg': s } );
        }
    };
    
    // here for convenience:
    this.markyFind = function( wordlist, wordname )
    {
        var i;
        for( i=0; i<wordlist.length; i++ ) {
            if( wordlist[i].word == wordname )
                return i;
        }
        console.info("Word not found " + wordname);
        return false;
    }
    this.markyGen = function( name, wordcount )
    {
        var i, c, len;
        var s= "";
        var wx = this.base.words;
        var words = wx.search('name', name);
        var word;
        var nexts, found;
        var mass, part;
        
        var lastWord, wordNo;
        var lastWords = {};
        
        len = words.length;
        lastWord = false;
        for( i = 0; i < wordcount; ++i ) {
            if( !lastWord ) {
                lastWord = this.app.util.randomNumber(0,len-1);
            }
            word = words[lastWord].word;
//            console.info(words[lastWord].word);
            
            if( words[lastWord].nexts.length > 0 || Math.random() > 0.3 ) {
                lastWords[word]
                nexts = words[lastWord].nexts.split(',');
            }
            
            mass = 0;
            for( c = 0; c < nexts.length; c+=2 ) {
                mass += nexts[c+1];
            }
            wordNo = this.app.util.randomNumber(0,mass-1);
            
            found=false;
            c = nexts.length-2;
            while( c >= 0 ) {
                wordNo -= nexts[c+1];
                if( wordNo <= 0 ) {
                    word = nexts[c];
                    found = true;
                    lastWord = this.markyFind(words, word);
                    break;
                }
                c -= 2;
            }
            if( s != "" )
                s += " ";
            if( !found ) {
                lastWord = this.app.util.randomNumber(0,len-1);
            } else { 
                s += word;
            }
        }
        
        return s;
    };
    
    this.formatMarky = function( text )
    {
        // tokenize text.
        var i, len;
        var words = [];
        var fairsyms = ['_', '@', '%', '$', '-', '+', '=', "'"];
        var wordbuf="", c;
        len = text.length;
        for( i = 0; i < len; ++i ) {
            c = text[i];
            if( this.app.util.isAlpha(c) || this.app.util.isDigit(c) || c in fairsyms ) {
                wordbuf += c;
            } else {
                if( wordbuf.length > 0 ) {
                    words.push(wordbuf.toLowerCase());
                }
                wordbuf="";
            }
        }
        if( wordbuf.length > 0 ) {
            words.push(wordbuf.toLowerCase());
        }
        
        // count nexts.
        var nexts = {};
        len = words.length;
        var l = null;
        for( i = 0; i+1 < len; ++i ) {
            c = words[i];
            l = words[i+1];
            if( !(c in nexts) ) {
                nexts[c] = {};
            }
            if( !(l in nexts) ) {
            	nexts[l] = {};
            }
            if( !(l in nexts[c]) ) {
                nexts[c][l] = 0;
            }
            ++nexts[c][l];
        }
        
        return nexts;
    };

    this.postMarky = function( name, text )
    {
    	var nexts = this.formatMarky(text);

    	// create the markup listing.
        var xd = this.base.list;
        l = xd.create({'name': name});
        xd.save(l);
        
        xd = this.base.words;
        // store the nexts.
        var o, x;
        for( i in nexts ) {
            x = "";
            for( l in nexts[i] ) {
                if( x != "" ) x += ",";
                x += l + "," + nexts[i][l];
            }
            o = xd.create({'name': name, 'word': i, 'nexts':x});
            xd.save(o);
        }
        
        return true;
    };
};
