const aCode = 'a'.charCodeAt(0);
const zCode = 'z'.charCodeAt(0);
const ACode = 'A'.charCodeAt(0);
const ZCode = 'Z'.charCodeAt(0);
const code0 = '0'.charCodeAt(0);
const code9 = '9'.charCodeAt(0);

export class Utils {
  constructor() {
  }

throwStack(msg) {
  if (msg === void 0) { msg = 'System'; }
  var e = new Error().stack;
  console.log(msg + "\n" + e.substr(6));
}
zeroPad(num, digits) {
  var str = "" + num;
  for (var i = str.length; i < digits; ++i) {
        str = "0" + str;
        
    }
    return str;
}
perfMark(str, closing=false) {
	if( !('perf' in this) ) this['perf']=[];
	if( closing )
		this.perf.push(Date.now()/1000,'0' + str);
	else
		this.perf.push(Date.now()/1000,str);
}
perfSummary() {
	var i, counts=new Map(), labels=[];

	for( i=0; i<this.perf.length; i+=2 ) {
		let pfx = this.perf[i+1];
		if( pfx[0] == '0' ) continue;
		counts.set( pfx, ( counts.has(pfx) ) ?
			( counts.get(pfx) + 1 ) :
			( 1 ) );
	}
	let buf = '';
	let en = counts.entries();
	for( var [pfx,num] of en ) {
		if( buf != '' ) buf += '\n';
		if( num == 1 )
		buf += pfx + (num!=1)?("x" + num):('');
	}
	console.log(buf);
	return buf;
}
perfReport() {
	var i, count=0, label=null;
	let jumps = new Map();
	let froms = new Map();
	let buf='';
	function perfShow(str){
		if( buf != '' ) buf += '\n';
		buf += ( count == 1 )?(label):(count + "x" + label);
		count = 1;
		label = str;
	}
	function addJump(jump, dist)
	{
		var v;
		if( jumps.has(jump) ) {
			v = jumps.get(jump);
			v[0]++;
			v[1] += dist;
		} else {
			v = [1,dist];
		}
		jumps.set(jump, v);
	}
	for( i=0; i<this.perf.length; i+=2 ) {
		if( this.perf[i+1][0] == '0' ) {
			let newlab = this.perf[i+1].substring(1);
			let hop = froms.get(newlab);
			if( !hop ) continue;
			let time = this.perf[i] - hop;
			
			addJump(newlab, this.perf[i] - hop);
		} else {
			froms.set(this.perf[i+1], this.perf[i]);
		}
	}
	let je = jumps.entries();
	for( var [jump,stats] of je ) {
		if( buf != '' ) buf += '\n';
		buf += jump + ": " + stats[0] + ", " + stats[1] + "n";
	}
	console.log(buf);
	return buf;
}

parseJSONTo(str, pool) {
  return this.parseJSON(str,pool);
}
parseJSON(str, pool=null) {
    let buf = null;
    let cc = ['[','{'];
    let ce = [']','}'];
    let cq = ['"', "'"];
    var ch, op, c;
    var i, found, objmode;
    let key = undefined;
    let quote = '"';

    let mode = 1;
    let root = null;
    let space = null;
    let trace = [];
    
    let modes = {
      nomode: 0,
      empty: 1,
      keys: 2,
      quoted: 4,
      arrays: 8,
      objects: 16
    };
    let buf_str = false;
    function bVal(buf,buf_str)
    {
    	if( !buf_str && !isNaN(buf) ) {
	    	return Number(buf);
	    }
      if( !buf_str && buf == 'null' ) {
        return null;
      }
      return buf;
    }

    i = 0;
 /*   if( tgtobj !== null && typeof tgtobj == 'object' ) {
      i = 1;
      mode += modes['objects'];
      root = tgtobj;
      buf = null;
      buf_str = false;
      mode = modes['objects']+modes['keys'];
      key = null;
    } else {
      i = 0;
    }*/

    for( ; i<str.length; i++ ) {
      c = str[i];
      if( c == '\\' ) {
        i++;
        c = str[i];
        if( buf == null ) buf = '';
        if( c == 't' ) buf += '\t';
        else if( c == 'n' ) buf += '\n';
        else buf += c;
        continue;
      }
      if( (mode&modes['quoted']) == modes['quoted'] ) {
     	  if( buf === null ) buf = '';
        if( c == quote ) {
          mode -= modes['quoted'];
          buf = this.unescape(buf);
		//console.log("read quote " + buf + "\nmode=" + mode);
          continue;
        }
        buf += c;
        continue;
      }
      op = cq.indexOf(c);
      if( op >= 0 ) {
        mode += modes['quoted'];
      	buf_str = true;
        quote = c;
        buf = null;
        continue;
      }
      // quotes are handled, unlock control characters:
      if( c == ' ' || c == '\r' || c == '\n' || c == '\t' )
        continue;
      
      if( c == ',' ) { // next key...
        if( (mode&modes['objects']) == modes['objects'] ) {
          if( key !== null && buf !== null ) {
	          buf = bVal(buf,buf_str);
	          space[key] = buf;
          }
          mode += modes['keys'];
        } else if( (mode&modes['arrays']) == modes['arrays'] ) {
          if( buf !== null ) {
	          buf = bVal(buf,buf_str);
      	    space.push(buf);
	        }
        }
        buf=null;
        key=null;
      	buf_str = false;
        continue;
      }
      
      if( (mode&modes['keys']) == modes['keys'] ) {
        if( c == ':' ) {
          if( buf !== null ) {
            key = bVal(buf,buf_str);
          }
          mode -= modes['keys'];
          buf = null;
	        buf_str = false;
        } else {
          if( buf === null ) buf = '';
          buf += c;
        }
        continue;
      } // keys taken care of.
      op = cc.indexOf(c);
      if( op === 0 ) { // '['
        if( (mode&modes['arrays']) == modes['arrays'] ) {
	//	console.log("[[]]");
          space.push([]);
          trace.push(space,mode,buf);
          space = space[space.length-1];
        } else if( (mode&modes['objects']) == modes['objects'] ) {
	//	console.log("{"+key+"}");
          space[key] = [];
          trace.push(space,mode,buf);
          space = space[key];
        } else { // no mode: root pointer
      	  root = space = [];
      	  trace.push(space,mode,buf);
      	}

        buf = null;
      	buf_str = false;
        mode = modes['arrays'];
        key = null;
        continue;
      } else if( op === 1 ) { // '{'
        if( (mode&modes['arrays']) == modes['arrays'] ) {
          var v;
          if( pool === null ) {
            v = {};
          } else {
            v = pool.get();
          }
          space.push(v);
          trace.push(space,mode,buf);
          space = space[space.length-1];
        } else if( (mode&modes['objects']) == modes['objects'] ) {
          if( pool === nuil ) {
            space[key] = {};
          } else {
            space[key] = pool.get();
          }
          trace.push(space,mode,buf);
          space = space[key];
      	} else {
          if( pool === null ) {
        	  root = {};
          } else {
            root = pool.get();
          }
      	  trace.push(root,mode,buf);
	        space = root;
        }
        buf = null;
      	buf_str = false;
        mode = modes['objects']+modes['keys'];
        key = null;
        continue;
      }
      if( c == ']' ) { // ']'
        if( (mode&modes['arrays']) == modes['arrays'] ) {
          if( buf !== null ) {
      	    buf = bVal(buf,buf_str);
            space.push(buf);
      	  }
      	  if( trace.length > 0 ) {
            buf = trace.pop();
            mode = trace.pop();
            space = trace.pop();
      	  } else {
      	    buf = null;
      	    mode -= modes['arrays'];
      	    space = root;
      	  }
      	  buf_str = false;
        } else {
          console.error("expected ] got }", buf, key, root, "mode=",mode);
          util.throwStack();
        }
        continue;
      }
      if( c == '}' ) {
        if( (mode&modes['objects']) == modes['objects'] ) {
          if( key !== null && buf !== null ) {
	          buf = bVal(buf, buf_str);
	          space[key] = buf;
      	  }
          key = null;
	        if( trace.length > 0 ) {
            buf = trace.pop();
            mode = trace.pop();
            space = trace.pop();
      	  } else {
	          buf = null;
	          mode -= modes['objects'];
      	    space = root;
	        }
	        buf_str = false;
        } else {
          console.error("expected ] got }", buf, key, root, "mode=",mode);
          util.throwStack();
        }
      	continue;
      }

      if( c != ' ' && c != '\t' && c != '\n' ) {
        if( buf === null ) buf = '';
        buf += c;
      }
    }
    if( buf != '' && buf !== null ) {
	    console.log("Trailing buffer in parse: ", buf.substr(0,64));
	    throw "problem";
	    return null;
    }
    return root;
}
safeJSON(str) { // remove special characters used for hacking
    var i, n;
    let rstr = "";
    if( typeof str != 'string' ) {
      console.log(typeof str, str);
      throw "not a string";
    }
    for (i = 0; i < str.length; ++i) {
        if ((n = str.charCodeAt(i)) >= 127) {
            rstr += "\\\\u" + this.zeroPad(n.toString(16), 4);
        }
        else {
            rstr += str[i];
        }
    }
    return rstr;
}
escape(str) { // add standard escapes
  return str.replaceAll("\\", "\\\\").replaceAll("\n", "\\n").replaceAll("\"", "\\\"");
}
unescape(str) { // remove standard escapes
  return str.replaceAll("\\\"", "\"").replaceAll("\\n", "\n").replaceAll("\\\\", "\\");
}
isAlphaN(ch)
{
  let chn = ch.charCodeAt(0);
  if( chn >= code0 && chn <= code9 ) return true;
  if( chn >= aCode && chn <= zCode ) return true;
  if( chn >= ACode && chn <= ZCode ) return true;
  return false;
}
alphaName(name)
{
  let testobj = {};
  let aname='', i;
  if( typeof name == 'undefined' ) this.throwStack("undefined in aname");
  for( i=0; i<name.length; i++ ) {
    aname += this.isAlphaN(name[i])
      ? name[i] : ' ';
  }
  let keywords = ['constructor','delete','new','this'];
  if( keywords.indexOf(aname) != -1 ) return "_" + aname;
  try {
    testobj[aname] = [];
  } catch(e){}
  return ( aname in testobj
		? aname : "_" + aname );
}
printJSON(obj, loose=false, depth=0, max_buffer_size=false) {
  if( obj === null || typeof obj == 'undefined' ) {
    this.throwStack("nullptr");
    throw "Null ptr in printJSON";
  }
    
  if( !('printer_trace' in this) || depth == 0 ) {
    this.printer_trace = [obj];
  } else if( depth == this.printer_trace.length ) {
    this.printer_trace.push(obj);
  } else {
    this.printer_trace[depth]=obj;
  }

  var i;
  for( i=0; i<depth; i++ ) {
    if( this.printer_trace[i] === obj ) {
      console.log("circular trace detected");
      return false;
    }
  }
  
  var v;
  let s = "";
  if( Array.isArray(obj) ) {
    for( i=0; i < obj.length; ++i ) {
      v = this.printJSON(obj[i], loose, depth+1);
      if( s != "" ) {
        s += ",";
        if( loose ) s += "\n";
      }
      /*
      if( v === false ) {
        this.throwStack("nullptr");
        throw "Null ptr in save";
        continue;
      }
      if( v === null ) {
        console.log("buf: " + s);
        return null;
      }
      */
      s += v;
      if( max_buffer_size !== false && s.length >= max_buffer_size ) {
        console.log("buffer overflow prevention");
        return s.substring(0,max_buffer_size);
      }
    }
    if( loose ) return "[\n" + s + "\n]";
    return "[" + s + "]";
  } else if( typeof obj == 'object' ) {
    for( var k in obj ) {
      if( typeof obj[k] == 'function' ) {
        return "'code'";
      }
    }
    for( var k in obj ) {
      v = this.printJSON(obj[k], loose, depth+1);
      /*
      if( v === false ) continue;
      if( v === null ) {
        console.log("key: " + k + " - v is null");
        return null;
      }
      */
      if (s != "") s += ",";
      if( typeof v == 'function' )
        v = "'code'";
      s += k + ":" + v;
	    if( max_buffer_size !== false && s.length >= max_buffer_size ) {
		    console.log("buffer overflow prevention");
		    return s.substring(0,1000);
	    }
    }
    if( loose ) return "{\n" + s + "\n}";
    return "{" + s + "}";
  } else if( typeof obj == 'string' ) {
    let safened = this.safeJSON(this.escape(obj));
    if( loose ) return "\n\"" + safened + "\"\n";
    return "\"" + safened + "\"";
  } else if( typeof obj == 'number' || typeof obj == 'boolean' ) {
    return String(obj);
  } else {
    var buf = null;
    try {
      if( typeof obj.toString == 'function' ) {
        throw "Please do not try to serialize that.";
        buf = obj.toString();
      } else {
        buf = String(obj);
      }
      console.log("Unknown object type " + typeof obj + ": ", obj, '\nset to ' + buf);
    } catch( e ) {
      console.log("Unknown object type " + typeof obj + ": ", obj, '\nset to null');
      buf = 'null';
    }
    return buf;
  }
}
cloneObject(obj) {
    var clone;
    var typ = this.typeOf(obj);
    var intermed;
    if (Buffer.isBuffer(obj)) {
        return Buffer.from(obj);
    }
    switch (typ) {
        case 'date':
            clone = new Date();
            clone.setTime(obj.getTime());
            break;
        case 'object':
            if (typeof obj.length != 'undefined') {
                // this is an array-object
                clone = [];
            }
            else {
                clone = {};
            }
            var ks = Object.keys(obj);
            for (var i = 0; i < ks.length; ++i) {
                clone[ks[i]] = this.cloneObject(obj[ks[i]]);
            }
            break;
        case 'array':
            clone = [];
            var ks = Object.keys(obj);
            for (var i = 0; i < obj.length; ++i) {
                ks.splice(i, 1);
                clone[i] = this.cloneObject(obj[i]);
            }
            for (i = 0; i < ks.length; ++i) {
                clone[ks[i]] = this.cloneObject(obj[ks[i]]);
            }
            break;        case '':
            clone = null;
            break;
    default:
	    clone = null;
	    break;
    }
    return clone;
}
typeOf(value) {
    var s = typeof value;
    if (s === 'object') {
        if (value) {
            if (value instanceof Date) {
                s = 'date';
            }
            else if (value instanceof Array) {
                s = 'array';
            }
        }
        else {
            s = 'null';
        }
    }
    return s;
}
realValue(ofAString) {
    if (ofAString == "true")
        return true;
    if (ofAString == "false")
        return false;
    if (ofAString.indexOf(".") != -1) {
        if (!isNaN(parseFloat(ofAString)))
            return parseFloat(ofAString);
    }
    else {
        if (!isNaN(parseInt(ofAString)))
            return parseInt(ofAString);
    }
    return ofAString;
}
extractFields(sources, params) {
    var i, parm, buildarray = false;
    var fields = {};
    var n;
    //console.log("extractFields", params);
    for (i in sources) {
        i = "" + i;
        buildarray = false;
        for (parm in params) {
            if (parm == i) {
                fields[i] = this.realValue(params[i]);
                break;
            }
            if (parm.indexOf(i) != -1 && parm.indexOf("[") != -1) {
                var sx = parseInt(parm.substr(i.length + 1));
                if (!isNaN(sx)) {
                    if (!buildarray)
                        buildarray = {};
                    buildarray[sx] = this.realValue(params[parm]);
                }
            }
        }
        if (buildarray) {
            if (this.typeOf(sources[i]) == 'array') {
                var ko = Object.keys(buildarray);
                fields[i] = [];
                for (n = 0; n < ko.length; n++) {
                    fields[i].push(buildarray[n]);
                }
            }
            else {
                fields[i] = {};
                for (n in buildarray) {
                    fields[i][n] = buildarray[n];
                }
            }
        }
    }
    return fields;
}
indexOf(array, idx) {
    var i, len = array.length;
    for (i = 0; i < len; ++i) {
        if (array[i] == idx)
            return i;
    }
    return false;
}
locationOf(array, idx, startptr) {
    var i, len = array.length;
    for (i = startptr; i < len; ++i) {
        if (array[i] == idx)
            return i;
    }
    return false;
}
/*
  rangeOf(start, count) {
    var fin = start+count;
      //var inc = fin > 0 ? 1 : -1;
      var srch=[];
      while( start != fin ) {
          srch.push(start);
          start += inc;
      }
      return srch;
  }; */
cloneValues(obj, values) {
    var i;
    for (i in values) {
        obj[i] = this.cloneObject(values[i]);
    }
}
fmtTime(dt) {
    var hr, min, ampm;
    hr = dt.getHours();
    min = dt.getMinutes();
    ampm = "am";
    if (min < 10)
        min = "0" + min;
    if (hr >= 12) {
        ampm = "pm";
        if (hr > 12)
            hr -= 12;
    }
    return (hr == 0 ? 12 : hr) + ":" + min + ampm;
}
fmtDay(dt) {
    if (dt == 0)
        return "Mon";
    if (dt == 1)
        return "Tue";
    if (dt == 2)
        return "Wed";
    if (dt == 3)
        return "Thu";
    if (dt == 4)
        return "Fri";
    if (dt == 5)
        return "Sat";
    if (dt == 6)
        return "Sun";
}
fmtMon(mn) {
    if (mn == 0)
        return "Jan";
    if (mn == 1)
        return "Feb";
    if (mn == 2)
        return "Mar";
    if (mn == 3)
        return "Apr";
    if (mn == 4)
        return "May";
    if (mn == 5)
        return "Jun";
    if (mn == 6)
        return "Jul";
    if (mn == 7)
        return "Aug";
    if (mn == 8)
        return "Sep";
    if (mn == 9)
        return "Oct";
    if (mn == 10)
        return "Nov";
    if (mn == 11)
        return "Dec";
}
numSuffix(n) {
    if (n >= 4 && n <= 20)
        return "th";
    if (n % 10 == 1)
        return "st";
    if (n % 10 == 2)
        return "nd";
    if (n % 10 == 3)
        return "rd";
    return "th";
}
dateFormat(idt) {
    var xdate = new Date();
    var xdt = xdate.getTime() / 1000;
    var tm = xdt - idt;
    if (tm < 30) {
        return Math.round(tm) + " seconds ago";
    }
    else if (tm < 60) {
        return "less than a minute ago";
    }
    else if (tm < 120) {
        return "about a minute ago";
    }
    else if (tm < 3600) {
        return Math.round(tm / 60) + " minutes ago";
    }
    else if (tm < 5 * 86400) {
        var pdate = new Date(idt * 1000);
        if (pdate.getDate() == xdate.getDate()) {
            return this.fmtTime(pdate);
        }
        else {
            return this.fmtDay(pdate.getDay()) + " " + this.fmtTime(pdate);
        }
    }
    else {
        var pdate = new Date(idt * 1000);
        return this.fmtMon(pdate.getMonth()) + " " + pdate.getDate() + this.numSuffix(pdate.getDate()) + ", " + this.fmtTime(pdate);
    }
    return "unknown";
}
getDate() {
    var dt = new Date();
    //dt.setHours( dt.getHours() - 8 );//( dt.getTime() - ( 1000 * 3600 * 8 ) );
    return dt;
}
getSeconds(fulldate) {
    var d = new Date();
    //d.setHours( d.getHours() - 8 );
    if (fulldate === false) {
        return d;
    }
    else {
        return Math.floor(d.getTime() / 1000);
    }
}
cloneValuesFrom(obj, keys, values) {
    var i;
    for (i in keys) {
        if (i in values)
            obj[i] = this.cloneObject(values[i]);
    }
}
cloneValuesOverFrom(obj, keys, values) {
    var i, j;
    var tp;
    for (i in keys) {
        if (i in values) {
            tp = this.typeOf(obj[i]);
            if (tp == 'object') {
                obj[i] = {};
                for (j in values[i]) {
                    obj[i][j] = this.cloneObject(values[i][j]);
                }
            }
            else if (tp == 'array') {
                obj[i] = [];
                for (j = 0; j < values[i].length; ++j) {
                    obj[i].push(this.cloneObject(values[i][j]));
                }
            }
            else {
                obj[i] = this.cloneObject(values[i]);
            }
        }
    }
}
detectScriptWorkers( value ) {
    // find 'script' in order between other letters
    let searchval = 'script';
    let found=0;
    for( let i=0; i<value.length; i++ ) {
        if( value[i].toLowerCase() == searchval[found] ) {
            found++;
            if( found == searchval.length ) return true;
        }
    }
    return false;
}
isMostlyAlpha(value) {
    if( typeof value != 'string' ) return false;
    let exceptions = 0;

    for( var i=0; i<value.length; i++ ) {
        let c = value[i];

        if( !this.isWord(c) && !this.isPunct(c) && !this.isSpace(c) ) exceptions++;
    }
    if( exceptions > value.length/18 ) return false;
    return true;
}
isAlpha(value) {
    var upperBoundUpper = "A".charCodeAt(0);
    var lowerBoundUpper = "Z".charCodeAt(0);
    var upperBoundLower = "a".charCodeAt(0);
    var lowerBoundLower = "z".charCodeAt(0);
    for (var i = 0; i < value.length; i++) {
        var char = value.charCodeAt(i);
        if ((char >= upperBoundUpper && char <= lowerBoundUpper) ||
            (char >= upperBoundLower && char <= lowerBoundLower))
            continue;
        return false;
    }
    return true;
}
isDigit(value) {
    var upperBound = "9".charCodeAt(0);
    var lowerBound = "0".charCodeAt(0);
    for (var i = 0; i < value.length; i++) {
        var char = value.charCodeAt(i);
        if (char <= upperBound && char >= lowerBound)
            continue;
        if (char == "." || (i == 0 && char == "-"))
            continue;
        return false;
    }
    return true;
}
isScriptPunct( value ) {
    return ( value == '(' || value == '[' || value == '!' || value == '=' || value == '=' || value == '/' || value == ']' || value == ')' )
}
isPunct(value) {
    var i, char;
    for (i = 0; i < value.length; ++i) {
        char = value[i];
        if( this.isScriptPunct(char) ) continue;

        switch( char ) {
            case '!': case '@': case '#': case '$': case '%': case '^': case '&': case '*': case '(': case ')': case '-': case '=': case '_': case '+': continue;
            default: return false;
        }
    }
    return true;
}
isSpace(value) {
    var i, char;
    for (i = 0; i < value.length; ++i) {
        char = value[i];
        if (char == "\n" || char == "\t" || char == " ")
            continue;
        return false;
    }
    return true;
}
isWord(value) {
    var ubs = ["A", "a", "9"], lbs = ["Z", "z", "0"];
    var safeChars0 = ["-"];
    var safeChars = ["_", ".", "-", "@"];
    var i, j, ch, found, char;
    for (i = 0; i < ubs.length; ++i) {
        ubs[i] = ubs[i].charCodeAt(0);
        lbs[i] = lbs[i].charCodeAt(0);
    }
    for (i = 0; i < value.length; i++) {
        char = value[i];
        ch = char.charCodeAt(0);
        found = false;
        for (j = 0; j < ubs.length; ++j) {
            if (ch <= ubs[j] && ch >= lbs[j]) {
                found = true;
                break;
            }
        }
        if (found)
            continue;
        if (safeChars.indexOf(char) != -1)
            continue;
        if (i == 0 && safeChars0.indexOf(char) != -1)
            continue;
        return false;
    }
    return true;
}
/*
FibreRing(cb, obj) {
  if (typeof obj != 'undefined')
    cb = cb.bind(obj);  return () { wait.launchFiber(cb) };
}
*/
/* randomInt: produce a number between a and b. */
randomInt(a, b) {
    return Math.floor(Math.random() * (b - a) + a);
}

/* randomStr: produce a len length string of letters between a and Z and 0 and 9. */
randomString(len) {
  return this.randomStr(len);
}

randomStr(len) {
    var w = '';
    var c;
    while (len > 0) {
        len--;
        c = this.randomInt(0, 61);
        if (c < 10) {
            w += c;
        }
 
        else if (c < 37) {
            w += String.fromCharCode(c + 87);
        }
        else {
            w += String.fromCharCode(c + 30);
        }
    }
    return w;
};
flowNumber(n) {
    var sh;
    if (n > 1024001024) {
        sh = (n / 1024001024);
        return parseInt(sh) + "G"; //..
    }
    else if (n > 1024000) {
        sh = (n / 1024000);
        return parseInt(sh) + "M";
    }
    else if (n > 1024) {
        sh = (n / 1024);
        return parseInt(sh) + "K";
    }
    return n + "B";
}
    /*connectMailer() {
      this.server = email.server.connect({
        user: this.app.gmail_user,
        password: this.app.gmail_password,
        host: this.app.gmail_host,
        tls: { ciphers: "SSLv3" }
      });
}
sendMessage(to, ccs, subj, msg, cb) {
    if (this.server == null) {
        this.connectMailer();
    }
    this.server.send({
        text: msg,
        from: this.app.gmail_fullname + '<' + this.app.gmail_user + '>',
        to: to,
        cc: ccs,
        subject: subj    },  (err, message) {
        console.log(err || message);
        cb(err, message);
    });
}
*/
safeHTML(input) {
  var aTags = ["a", "b", "i", "u"];
  var aMembers = ["href", "style"];
  var i, len = input.length;
  var ch, lastch = null;
  var output = "";
  var tag_start = null, tag_string = null, tag_output = null, tag_stage = null;
  var quote_start = null, quote_output = null, quote_char = null;
  var found_equals = null, invalid_tag = false, found_invalid = false;
  var at_breaker = false;
  for (i = 0; i < len; ++i) {
      ch = input[i];
      if (tag_start != null) {
          if (quote_start != null) {
              if (lastch == '\\') {
                  if (ch == '>') {
                      quote_output += '&gt;';
                  }
                  else {
                      quote_output += lastch + ch;
                  }
              }
              else if (ch == quote_char) {
                  quote_output += ch;
                  quote_start = quote_char = null;
              }
              else {
                  lastch = ch;
                  quote_output += ch;
              }
              continue;
          }
          if (this.isSpace(ch))
              at_breaker = true;
          else if (tag_stage == 1 && ch == '=')
              at_breaker = true;
          else if (ch == '>')
              at_breaker = true;
          else if (ch == '\'' || ch == '"') {
              at_breaker = true;
              ch = "";
          }
          else if (quote_output != null) {
              tag_output = quote_output;
              ch = "";
              at_breaker = true;
          }
          else {
              at_breaker = false;
          }
          if (at_breaker) {
              switch (tag_stage) {
                  case 0: // first word; tag name
                      tag_stage = 1;
                      if (tag_output[0] == "/" && aTags.indexOf(tag_output.slice(1)) == -1)
                          invalid_tag = true;
                      if (tag_output[0] != "/" && aTags.indexOf(tag_output) == -1)
                          invalid_tag = true;
                      tag_string = "<" + tag_output + ch;
                      break;
                  case 1: // attribute name
                      tag_stage = 2;
                      if (aMembers.indexOf(tag_output) == -1)
                          invalid_tag = true;
                      tag_string += tag_output + ch;
                      break;
                  case 2: // = sign or next attribute name
                      if (tag_output == "=") {
                          tag_stage = 3;
                      }
                      else {
                          tag_stage = 2;
                          if (aMembers.indexOf(tag_output) == -1) {
                              invalid_tag = true;
                          }
                      }
                      tag_string += tag_output + ch;
                      break;
                  case 3: // attribute value
                      tag_stage = 1;
                      tag_string += tag_output + ch;
                      break;
              }
              tag_output = "";
          }
          else {
              tag_output += ch;
          }
          tag_string += tag_output;
          if (lastch == "\\") {
              tag_output += ch;
              lastch = null;
          }
          else {
              switch (ch) {
                  default:
                      tag_output += ch;
                      lastch = ch;
                      break;
                  case '>':
                      output += tag_output + ch;
                      tag_start = tag_output = null;
                      break;
                   case '"':
                  case '\'':
                      quote_output = quote_char = ch;
                      quote_start = i;
                      lastch = null;
                      break;
              }
          }
          continue;
      }
      switch (ch) {
          case '<':
              tag_start = i + 1;
              invalid_tag = false;
              tag_output = "";
              tag_stage = 0;
              break;
          default:
              output += ch;
              lastch = ch;
              break;
      }
  }
  return output;
}

};
