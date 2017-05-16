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
    this.markyGen = function( name, wordcount )
    {
        var i, c, w, l, len;
        var s= "";
        var wx = this.base.words;
        var words = wx.fetchAll();
        var nexts, found;
        var mass, part;
        
        len = words.length;
        console.info(words);
        l = false;
        for( i = 0; i < wordcount; ++i ) {
            if( !l ) {
                l = this.app.util.randomNumber(0,len);
                s += ". ";
            }
            console.info(words[l]);
            nexts = words[l].nexts.split(',');
            mass = 0;
            for( c = 0; c < nexts.length; c+=2 ) {
                mass += nexts[c+1];
            }
            w = this.app.util.randomNumber(0,mass);
            
            found=true;
            c = w-2;
            while( c >= 0 ) {
                mass -= nexts[c+1];
                if( mass < 0 ) {
                    w = nexts[c];
                    found = true;
                    l = c;
                    break;
                }
                c -= 2;
            }
            if( s != "" )
                s += " ";
            if( !found ) {
                s += l;
            } else { 
                s += w;
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
