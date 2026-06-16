//var wait = await import('wait.for');
var dns = await import('dns');
const BSON = await import('bson');

export function Utils(app) {
    this.app = app;
    var cca = app;
    this.sock = null;

    this.modlocaL = function() {
      this.fmtTime = function(dt)
      {
        if( typeof dt == 'number' ) dt = new Date(dt);
        let hr = dt.getHours();
        let min = dt.getMinutes();
        let ampm = "am";

        if( min < 10 ) min = "0" + min;
        
        if( hr >= 12 ) { ampm = "pm"; hr -= 12; }
        else if( hr == 0 ) hr = 12;

        return hr + ":" + min + " " + ampm;
      }
      this.fmtDay = function(dt)
      {
        if( dt == 0 ) return "Mon";
        if( dt == 1 ) return "Tue";
        if( dt == 2 ) return "Wed";
        if( dt == 3 ) return "Thu";
        if( dt == 4 ) return "Fri";
        if( dt == 5 ) return "Sat";
        if( dt == 6 ) return "Sun";
      }
      this.fmtMon = function(mn)
      {
        if( mn == 0 ) return "Jan";
        if( mn == 1 ) return "Feb";
        if( mn == 2 ) return "Mar";
        if( mn == 3 ) return "Apr";
        if( mn == 4 ) return "May";
        if( mn == 5 ) return "Jun";
        if( mn == 6 ) return "Jul";
        if( mn == 7 ) return "Aug";
        if( mn == 8 ) return "Sep";
        if( mn == 9 ) return "Oct";
        if( mn == 10 ) return "Nov";
        if( mn == 11 ) return "Dec";
      }
      this.fmtMonth = function(mn)
      {
        if( mn == 0 ) return "January";
        if( mn == 1 ) return "February";
        if( mn == 2 ) return "March";
        if( mn == 3 ) return "April";
        if( mn == 4 ) return "May";
        if( mn == 5 ) return "June";
        if( mn == 4 ) return "May";
        if( mn == 5 ) return "June";
        if( mn == 6 ) return "July";
        if( mn == 7 ) return "August";
        if( mn == 8 ) return "September";
        if( mn == 9 ) return "October";
        if( mn == 10 ) return "November";
        if( mn == 11 ) return "December";
      }
      this.fmtDate = function(dt)
      {
        const day = dt.getDay();
        const month = dt.getMonth();
        return this.fmtDay(day) + " " + this.fmtMonth(month) + " " + dt.getDate();
      }
      this.fmtDt = function(dt)
      {
        const day = dt.getDay();
        const month = dt.getMonth();
        return this.fmtDay(day) + " " + this.fmtMon(month) + " " + dt.getDate();
      }
      this.numSuffix = function(n)
      {
          if( n >= 4 && n <= 20 ) return "th";
          if( n%10 == 1 ) return "st";
          if( n%10 == 2 ) return "nd";
          if( n%10 == 3 ) return "rd";
          return "th";
      }
      this.DateFormat = function(dt)
      {
        return this.dateFormat( dt.getTime() / 1000 );
      }
      this.dateFormat = function(idt)
      {
        let xdate = new Date();
        let xdt = xdate.getTime() / 1000;
        let tm = xdt - idt;
        if( tm < 30 ) {
            return Math.round(tm) + " seconds ago";
        } else if( tm < 60 ) {
            return "less than a minute ago";
        } else if( tm < 120 ) {
            return "about a minute ago";
        } else if( tm < 3600 ) {
            return Math.round(tm/60) + " minutes ago";
        } else if( tm < 5*86400 ) {
            let pdate = new Date( idt*1000 );
            if( pdate.getDate() == xdate.getDate() ) {
                return this.fmtTime(pdate);
            } else {
                return this.fmtDay(pdate.getDay()) + " " + this.fmtTime(pdate);
            }
        } else {
            let pdate = new Date( idt*1000 );
            return this.fmtMon( pdate.getMonth() ) + " " + pdate.getDate() + this.numSuffix(pdate.getDate()) + ", " + this.fmtTime(pdate);
        }
        return "unknown";
      }


          this.logWeb = function(s)
          {
            this.file.logto("~/tmp/radweb.txt", s);
          };

          this.splitBy = function(src, tokens)
          {
            var i,j,searchFrom;
            var firstFound,firstToken;
            var foundThis;
            var tokens=[];

            for( searchFrom=0; searchFrom< src.length; ) {
              firstFound=src.length;
              firstToken=false;
              for( j=0; j<tokens.length; ++j ) {
                if( (foundThis=src.indexOf(tokens[j],searchFrom)) != -1 ) {
                  if( foundThis < firstFound ) {
                    firstFound = foundThis;
                    firstToken = tokens[j];
                  }
                }
              }
              if( firstToken !== false ) {
                if( firstFound > searchFrom ) {
                  tokens.push(str.substr(searchFrom,firstFound-searchFrom));
                }
                tokens.push( firstToken );
                searchFrom = firstFound + firstToken.length;
              } else {
                tokens.push(str.substr(searchFrom,src.length-searchFrom));
                break;
              }
            }
            return tokens;
          };

          this.maxStr = function(src, len)
          {
            if( src == null ) return "";
            if( src.length > len ) {
              var tstr = src.substr(0,len);

              if( tstr[tstr.length-1] == '\\' ) {
                tstr[tstr.length-1] = '.';
              }
              return tstr;
            }
            return src;
          }

          this.safeHTML = function(src)
          {
            var i, res = "";
            if( src == null ) return "";

            for( i=0; i<src.length; ++i ) {
              if( src[i] == '\\' ) {
                res += src[i];
                i++;
                res += src[i];
                continue;
              }
              if( src[i] == '<' ) {
                res += "&lt;";
                continue;
              } else if( src[i] == '>' ) {
                res += "&gt;";
                continue;
              }
              res += src[i];
            }
            return res;
          };


    	    // Global users
    	    this.sendTo = function(key, msg)
    	    {
    	        var user = this.locateUser(key);
    	        user.send(msg);
    	    };

    	    this.confirmSocketMsg = function( ccc ) {
    	    	return this.wsssrv.msgConfirm(ccc);
    	    };

    	    this.locateUser = function(key, allow_failure=false)
    	    {
    	        var cliconn=false;
    	        if( this.wsssrv )
    	            cliconn = this.wsssrv.locateUser( key, allow_failure );
    	        if( !cliconn )
    	            cliconn = this.wssrv.locateUser( key, allow_failure );
    	        return cliconn;
    	    };

          this.reversedIps = {};
          this.consoleReverseIP = function(ipaddr)
          {
            this.reverseLookup(ipaddr, function(err, tgtip, domain) {
              if( err ) console.log("Cannot lookup " + ipaddr + "\n");
              else console.log( (tgtip==ipaddr ? "*" : "") + tgtip + ": " + domain + "\n" );
            });
          };
          this.reverseLookup = function(ip,handler) {

            if( ip in this.reversedIps ) {
              var i;

              console.log("ipaddr cached");

              for( i=0; i < this.reversedIps[ip].length; i+=2 ) {
                handler(null, this.reversedIps[ip][0], this.reversedIps[ip][1]);
              }
              return;
            }
          	dns.reverse(ip,function(err,domains){
          		if(err!=null)	{
                handler(err);
                return;
              }

              this.reversedIps[ip] = [];
          		domains.forEach(function(domain){
          			dns.lookup(domain,function(err, address, family){
                  this.reversedIps[ip].push( address, domain );
                  handler(null, address, domain);
          			}.bind(this));
          		}.bind(this));
          	}.bind(this));
          }

    	    this.respond = {
    	    		journey: cca.journey,
              app: cca,
              header: function( res, key, val, exp ) {
                if( typeof exp == 'undefined' ) exp = '';
                if( !res.headers ) res.headers = {};
                res.headers[key] = val;//[val,exp];
              },
              cookie: function( res, key, val, exp ) {
                if( typeof exp == 'undefined' ) exp = '';
                if( !res.mcset ) res.mcset = {};
                res.mcset[key] = val;
                var k = res.mcset;
                if( !res.headers ) res.headers = {};
                var cstr = Object.keys(k).map( (x) => { return x + "=" + k[x]; } ).join(",");
                var cstr2 = Object.keys(k).map( (x) => { return x + "=" + k[x]; } ).join(";");
                res.headers['Set-Cookie'] = "cookies=" + cstr + ";" + cstr2 + ";SameSite=strict";
              },
    	    		jsonOk: function(res, obj) {
                if( !res.headers ) res.headers = {};
	    	        res.send(200, res['headers'], this.app.util.safeJSON(JSON.stringify({"status":"ok", 'data':obj})) );
    	    		},
              bsonOk: function(res, obj) {
                if( !res.headers ) res.headers = {};
                if( !('Content-Type' in res.headers) ) res.headers['Content-Type'] = 'application/bson';
                console.log( Object.keys( BSON ) );
                //res.send(200, res['headers'], BSON.serialize({status:'ok',data:obj}));
              },
    	    		jsonError: function(res, code,message) {
                if( !res.headers ) res.headers = {};
	    	        res.send(code, res['headers'], {"status":"error", 'code':code, 'message':message} );
    	    		},
    	    		jsonStatus: function(res, status, message) {
                if( !res.headers ) res.headers = {};
	    	        res.send(200, res['headers'], {"status":status, 'message':message} );
    	    		},
    	    		jsonCodeStatus: function(res, code, status) {
                if( !res.headers ) res.headers = {};
	    	        res.send(code, res['headers'], {"status":status, 'code': code} );
    	    		},
              body: function(res, body='', runCode=200) {
                console.log("Headers", res['headers']);
                res.send(runCode, res['headers'], body);
              },
    	    		end: function(res) {
    	    			console.log("Please do not use response.end, it is not a thing.");
    	    		}
    	    };

    };

}
