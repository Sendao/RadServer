var dbg_lint = null;

class Linter
{
	constructor(editor, mainframe)
	{
		this.editor = editor;
		this.mainframe = mainframe;
		this.processed = false;
		editor.linter = this;

		dbg_lint = this;

		this.lineptrs = [];
		this.tokens = [];
		this.mode = 'txt';
		this.default_type = 'txt';
		this.stack = null;
	}

	removeLine( lineno )
	{
		console.log("Splice lineptr " + lineno);
		this.lineptrs.splice(lineno, 1);
		// decrease all line numbers in stack post-lineno by 1:
		var Q = [this.stack];
		var s, i;

		while( Q.length ) {
			s = Q.shift();
			if( !s ) continue;
			if( s.line > lineno ) s.line--;
			for( i=0; i<s.s.length; i++ ) {
				if( s.s[i].line ) Q.push(s.s[i]);
			}
		}
	}

	insertLine( lineno )
	{
		if( !this.processed ) return;
		console.log("insertLine", lineno);

		var pre = this.lineptrs[lineno-1];
		if( lineno >= this.lineptrs.length ) {
			while( pre && pre.next ) pre = pre.next;
			if( pre ) pre.next = {s: "", t: 'empty', next: null};
			this.lineptrs.push(pre.next);
			return;
		}
		var post = this.lineptrs[lineno];
		while( pre && pre.next && pre.next != post ) pre = pre.next;
		if( pre ) {
			pre.next = {s: "", t: 'empty', next: post};
			this.lineptrs.splice(lineno, 0, pre.next);
		}

		// increase all line numbers in stack post-lineno by 1
		var Q = [this.stack];
		var s, i;

		while( Q.length ) {
			s = Q.shift();
			if( !s ) continue;
			if( s.line >= lineno ) s.line++;
			for( i=0; i<s.s.length; i++ ) {
				if( s.s[i].line ) Q.push(s.s[i]);
			}
		}
	}
	blankLine( lineno )
	{
		if( !this.processed ) return;
		console.log("blankLine", lineno);
		if( lineno >= this.lineptrs.length ) return;
		var pre = this.lineptrs[lineno-2];
		var post = this.lineptrs[lineno-1];
		while( pre && pre.next && pre.next != post ) pre = pre.next;
		if( pre ) {
			if( lineno < this.lineptrs.length ) {
				pre.next = {s: "", t: 'empty', next: this.lineptrs[lineno]};
			} else {
				pre.next = {s: "", t: "empty", next: null};
			}
			this.lineptrs.splice(lineno-1, 1, pre.next);
		}
	}

	retokenizelines( lineno, lineend )
	{
		if( !this.processed ) return;
		lineend++;
/*
		setTimeout(this._retokenizelines.bind(this, lineno, lineend), 0);
	}

	_retokenizelines( lineno, lineend )
	{*/
		var prevstate=false;
		var line=lineno-1;
		var prevtoken;
		lineend++;
		console.log("retokenizelines(" + lineno + ".." + lineend + ")");
		// find a valid start point
		for( ; line>=0; line-- ) {
			if( line < this.lineptrs.length && this.lineptrs[line].sptr ) {
				if( line < lineno )
					line++;
				break;
			}
		}
		console.log("rtl: start at " + line);
		if( line<1 ) line=1;

		for( ; line<=lineend; line++ ) {
			if( line < 2 ) {
				prevtoken = null;
			} else {
				prevtoken = this.lineptrs[line-2];
				while( !prevtoken && (line-2) >= 0 ) {
					line--;
					prevtoken = this.lineptrs[(line-2)];
				}
			}

			if( line-1 >= this.editor.text_lines.length ) break;
			var text = this.editor.text_lines[line-1];

			var el;
			for( el = prevtoken; el; el = el.next ) {
				if( !el.next || el.next == this.lineptrs[line-1] ) {
					break;
				}
			}
			if( el && el.ot ) prevstate = el.ot;
			else if( !prevstate ) prevstate = this.default_type;

			//this.lineptrs[line-1] = null;
			var tokens = this.tokenize( text, prevstate, line );
			console.log("Retokenize from " + line + ": " + prevstate + " '" + text + "'", tokens);
			if( el ) el.next = tokens;

			for( el = tokens; el && el.next; el = el.next ) {
				if( el && el == this.lineptrs[line] ) {
					line++;
				}
			}
			console.log("To " + line + ": ", el);
			//if( el ) el.next = this.lineptrs[line];

		}

		
		if( this.mode == 'js' ) {
			lineno = this.extractObjects( lineno, line );
			this.editor.redrawLines( lineno, line );
			
			var e = this.build();
			this.mainframe.right.innerHTML = "";
			this.mainframe.right.appendChild(e);
		} else if( this.mode == "shell" ) {
			this.extractShell( lineno, line );
			this.editor.redrawLines( lineno, line );
		} else {
			this.editor.redrawLines( lineno, line );
		}

	}

	build() {
		var div = document.createElement("div");

		div.style.height = "100%";
		div.style.maxHeight = "100%";
		div.style.maxWidth = "180px";
		div.style.overflowY = "auto";
		div.style.overflowX = "auto";
		div.style.fontSize = "12pt";

		// for each list, drawList
		var i, Q = [this.stack, div];
		var stack, pdiv, e;

		while( Q.length > 0 ) {
			stack = Q.shift();
			pdiv = Q.shift();

			if( stack == null ) continue;

			for( i=0; i<stack.s.length; i++ ) {
				if( stack.s[i].type == 'f' || stack.s[i].type == 'c' ) {
					e = this.drawStack( stack.s[i] );
					pdiv.appendChild(e);
					Q.push( stack.s[i], e.lastChild );
				} else {
					Q.push( stack.s[i], pdiv );
				}
			}
		}

		// clean up empty containers after all are built
		Q = [];
		for( i=0; i<div.childNodes.length; i++ ) {
			Q.push( div.childNodes[i] );
		}
		while( Q.length > 0 ) {
			e = Q.shift();
			if( e.lastChild.childNodes.length == 0 ) {
				e.removeChild( e.lastChild );
				e.firstChild.innerHTML = "&nbsp;";
			} else {
				for( i=0; i<e.lastChild.childNodes.length; i++ ) {
					Q.push( e.lastChild.childNodes[i] );
				}
			}
		}

		this.frame = div;
		return div;
	}

	drawStack( stack ) {
		var e = document.createElement("div");
		e.style.width = '100%';

		var expand = document.createElement("div");
		expand.style.float = 'left';
		expand.style.paddingRight = "5px";
		expand.style.clear = 'both';
		if( stack.s.length > 0 ) {
			expand.innerHTML = ">";
			expand.addEventListener("click", this.clickExpand.bind(this, stack, e));
		} else {
			expand.innerHTML = "&nbsp;";
		}
		e.appendChild(expand);

		var div2 = document.createElement("div");
		div2.style.float = 'left';
		var txt = document.createTextNode( stack.name );
		div2.addEventListener("click", this.clickStack.bind(this, stack));
		div2.appendChild(txt);
		e.appendChild(div2);

		var div3 = document.createElement("div");
		div3.style.clear = 'both';
		div3.style.display = 'none';
		e.appendChild(div3);
		
		return e;
	}
	clickExpand( stack, div, ev ) {
		if( div.firstChild.firstChild.textContent == ">" ) {
			div.lastChild.style.display = 'block';
			div.firstChild.innerHTML = "v";
		} else {
			div.lastChild.style.display = 'none';
			div.firstChild.innerHTML = ">";
		}
	}
	clickStack( stack ) {
		console.log("Clicked stack", stack);
		this.editor.gotoLine( stack.line );
	}

	readfile( filename, contents )
	{
		this.lineptrs = [];
		this.tokens = [];
		this.stack = { type: 'r', s: [], z: 'js', tp: 0 };

		let type = "txt";
		let mode = this.editor.senseMode();
		if( mode == "js" ) type = "js";
		if( mode == "html" ) type = "word";
		if( mode == "txt" ) type = "txt";
		if( mode == "shell" ) type = "sh";

		this.mode = mode;
		this.default_type = type;

		console.log("Linting " + filename + ": " + contents.split("\n").length + " lines, type " + type + ".");
		this.tokens = this.tokenize(contents, type);
		if( type == "js" ) {
			this.extractObjects( 1, this.lineptrs.length );
			var e = this.build();
			clearNode( this.mainframe.right );
			this.mainframe.right.appendChild(e);
		} else {
			clearNode( this.mainframe.right );
		}
		this.processed = true;
	}

	extractShell(startLine, endLine)
	{
		//! Color in the shell based on the escape codes found inside.
		var bgcolor, fgcolor;

		var lineno, token, etoken;
		var state, states;

		if( startLine > 1 ) {
			lineno = startLine - 2;
			token = this.lineptrs[lineno];
			while( token && token.next && token.next != this.lineptrs[lineno+1] ) token = token.next;
			while( lineno >= 0 ) {
				if( token && token.z ) break;
				lineno--;
				if( lineno < 0 ) break;
				token = this.lineptrs[lineno];
				while( token && token.next && token.next != this.lineptrs[lineno+1] ) token = token.next;
			}
			if( lineno < 0 ) {
				token = this.lineptrs[0];
				state = "0";
				token.z = state;
				startLine = 1;
			} else {
				//console.log("Valid element ", token, token.sptr);
				startLine = lineno+2;
			}
			//console.log("Retraced to line " + (startLine-1) + ": ", token);
		} else {
			token = this.lineptrs[0];

			state = "0";
			token.z = state;
		}

		states = state.split(";");

		for( lineno=startLine; lineno<=endLine; lineno++ ) {
			token = this.lineptrs[lineno];
			if( lineno+1 >= this.lineptrs.length ) etoken = null;
			else etoken = this.lineptrs[lineno+1];

			while( token && token.next && token != etoken ) {

				if( token.t == "code" ) {
					if( token.s == "0" ) {
						state = "0";
						states = ["0"];
					} else {
						state = state + ";" + token.s;
						states = states.concat( token.s.split(";") );
					}
					token.e = 1;
				} else {
					for( var i=0; i<states.length; i++ ) {
						switch( states[i] ) {
							case "01": token.bold = 1; break;
							case "04": token.underline = 1; break;
							case "05": token.blink = 1; break;
							case "07": token.reverse = 1; break;
							case "22": token.bold = 0; break;
							case "24": token.underline = 0; break;
							case "25": token.blink = 0; break;
							case "27": token.reverse = 0; break;
							case "30": token.fg = "black"; break;
							case "31": token.fg = "red"; break;
							case "32": token.fg = "green"; break;
							case "33": token.fg = "yellow"; break;
							case "34": token.fg = "blue"; break;
							case "35": token.fg = "magenta"; break;
							case "36": token.fg = "cyan"; break;
							case "37": token.fg = "white"; break;
							case "39": token.fg = "default"; break;
							case "40": token.bg = "black"; break;
							case "41": token.bg = "red"; break;
							case "42": token.bg = "green"; break;
							case "43": token.bg = "yellow"; break;
							case "44": token.bg = "blue"; break;
							case "45": token.bg = "magenta"; break;
							case "46": token.bg = "cyan"; break;
							case "47": token.bg = "white"; break;
							case "49": token.bg = "default"; break;
						}
					}
				}
				token.z = state;
				token = token.next;
			}
		}
	}

	extractObjects(startLine, endLine)
	{
		var token;
		var varname, lineno = startLine, tokeno = 0;
		var state='js', stackptr = this.stack;
		var iptr = 0, firstLoop=true, el, oldptr=null;
		let finished = true;
		var stack_completed = false, first_stack, first_kids;
		let depth = 0;
		endLine++;

		//console.log("Extract " + startLine + "-" + endLine);

		if( startLine > 1 ) {
			lineno = startLine - 2;
			token = this.lineptrs[lineno];
			while( token && token.next && token.next != this.lineptrs[lineno+1] ) token = token.next;
			while( lineno >= 0 ) {
				if( token && token.sptr ) break;
				lineno--;
				if( lineno < 0 ) break;
				token = this.lineptrs[lineno];
				while( token && token.next && token.next != this.lineptrs[lineno+1] ) token = token.next;
			}
			if( lineno < 0 ) {
				token = this.lineptrs[0];
				stackptr = this.stack;
				token.sptr = stackptr;
				token.ip = 0;
				token.z = state;
				token.d = 0;
				startLine = 1;
			} else {
				//console.log("Valid element ", token, token.sptr);
				startLine = lineno+2;
			}
			//console.log("Retraced to line " + (startLine-1) + ": ", token);
		} else {
			token = this.lineptrs[0];

			stackptr = this.stack;
			token.sptr = stackptr;
			token.ip = 0;
			token.z = state;
			token.d = 0;
		}
		lineno = startLine-1;

		if( token && startLine > 1 ) {
			stackptr = token.sptr;
			state = token.z;
			stackptr.tp = iptr = token.ip;
			depth = token.d;
			//console.log("Resume from ", state, iptr, token);
			if( iptr != stackptr.tp ) {
				finished = false;
			}

			//! set iptrs for parents
			var sptr = stackptr, parent, i;
			while( sptr ) {
				parent = sptr.p;
				if( !parent ) break;
				for( i=0; i<parent.s.length; i++ ) {
					if( parent.s[i] === sptr ) {
						parent.tp = i+1;
						break;
					}
				}
				sptr = parent;
			}
			while( lineno<this.lineptrs.length && ( token === this.lineptrs[lineno] || this.lineptrs[lineno].t == 'empty' ) ) {
				lineno++;
				tokeno = 0;
			}
			token = this.lineptrs[lineno];
			while( lineno+1 < this.lineptrs.length && ( !token || token.t == 'empty' ) ) {
				console.log("Empty start line " + lineno);
				lineno++;
				token = this.lineptrs[lineno];
			}
		} else {
			token = this.lineptrs[lineno];
		}

		first_stack = stackptr;
		first_kids = stackptr.s.map( (x) => (x.name + "_") ).join(",");
		console.log("Start at " + token  + "  " + first_stack);

		while( token ) {
			if( !firstLoop ) { // sorry.
				token = token.next;
				while( lineno+1 < this.lineptrs.length && ( !token || token.t == 'empty' ) ) {
					lineno++;
					token = this.lineptrs[lineno];
				}
				if( !token ) {	
					console.log("Escape on line " + lineno);
					break;
				}
				if( token.sptr ) {
					oldptr = token.sptr;
				}
				token.sptr = stackptr;
				token.ip = stackptr.tp;
				token.z = state;
				token.d = depth;
				tokeno++;
			} else {
				firstLoop=false;
				token.sptr = stackptr;
				token.ip = stackptr.tp;
				token.z = state;
				token.d = depth;
			}

			while( lineno+1<this.lineptrs.length && ( token === this.lineptrs[lineno+1] || this.lineptrs[lineno+1].t == 'empty' ) ) {
				lineno++;
				tokeno = 0;
				token.sptr = stackptr;
				token.ip = stackptr.tp;
				token.z = state;
				token.d = depth;
			}
			while( token && ( isWhite( token.s ) || token.t == "empty" ) ) {
				token = token.next;
				while( ( !token || token.t == 'empty' ) && lineno+1 < this.lineptrs.length ) {
					//console.log("Empty line " + lineno);
					lineno++;
					token = this.lineptrs[lineno];
				}
				if( !token ) break;
				if( token.sptr ) {
					oldptr = token.sptr;
				}
				tokeno++;
				token.sptr = stackptr;
				token.ip = stackptr.tp;
				token.z = state;
				token.d = depth;
				while( token && lineno+1<this.lineptrs.length && ( token == this.lineptrs[lineno+1] || this.lineptrs[lineno+1].t == 'empty' ) ) {
					lineno++;
					tokeno = 0;
				}
			}
			if( !token ) {
				console.log("End on line " + lineno);
				break;
			}

			let nextStep = function() {
				if( oldptr != null && token.s == "}" ) {
					if( stackptr.tp == stackptr.s.length ) {
						if( first_kids == stackptr.s.map( (x) => (x.name+"_") ).join(",") ) {
							//! verify parents, up to where we started from
							for( el = stackptr.p; el && el != first_stack.p; el = el.p ) {
								if( el.tp != el.s.length ) break;
							}
							if( !el || el == first_stack.p ) {
								console.log("Finish at line " + lineno, oldptr, stackptr, el, first_stack);
								return false;
							} else {
								console.log("Continue until stackptr ", el, " is satisfied. (" + el.tp + ", " + el.s.length + ")");
							}
						}
					}
				}
				if( lineno > endLine+40 ) {
					console.log("Finish early at line " + lineno);
					return false;
				}
				return true;
			}

			if( token.t == "jsc" || token.t == "longc" || token.t == "empty" || token.s == "" ) {
				token.z = state;
				token.d = depth;
				if( !nextStep() ) break;
				continue;
			}

			
			let pushStack = function(type, es, newstate, name) {
				if( iptr >= stackptr.s.length )
					stackptr.s.push(0);
				depth++;		
				stackptr.s[ iptr ] = { type: type, line: lineno+1, depth: depth, p: stackptr, es: es, s: [], ip: iptr, tp: 0 };
				if( typeof name != 'undefined' ) stackptr.s[iptr].name = name;
				iptr++;
				stackptr.tp = iptr;

				stackptr = stackptr.s[ iptr-1 ];
				//console.log("pushStack() line: " + lineno, stackptr, token);
				iptr = 0;
				state = newstate;
				finished = false;
				if( token ) {
					token.sptr = stackptr;
					token.ip = 0;
					token.d = depth;
					token.z = newstate;
					/*
					if( oldptr && oldptr.depth != stackptr.depth ) {
						console.log("Give up early: stack changes depth from " + oldptr.depth + " to " + stackptr.depth);
						token = null;
						return;
					}*/
				}
			}
			let popStack = function() {
				//console.log("pop(): " + lineno, stackptr, token);
				depth--;
				// truncate any previous remainder in the stack
				stackptr.s.length = stackptr.tp;
				// pop stack
				state = stackptr.es;
				stackptr = stackptr.p;
				if( !stackptr ) {
					console.log("Give up early on line " + lineno + ": Pop main stack.");
					token = null;
					return;
				}
				if( token ) {
					token.d = depth;
					token.sptr = stackptr;
					token.ip = stackptr.tp;
					token.z = state;
				}
				// retrieve position
				iptr = stackptr.tp;
			}
			if( token.s == "{" ) {
				switch( state ) {
					case 'js': default:
						pushStack( 'b', 'js', 'js' );
						break;
					case 'classopen':
						state = 'classjs';
						break;
					case 'classjsopen': case 'jsfuncopen':
						state = 'js';
						break;
				}
				if( !token ) break;
				token.z = state;
				token.d = depth;
				if( !nextStep() ) break;
				continue;
			} else if( token.s == "}" ) {
				popStack();
				if( !token ) break;
				token.z = state;
				token.d = depth;
				if( !nextStep() ) break;
				continue;
			}
			switch( state ) {
				case 'js':
					if( token.t == "jskey" ) {
						switch( token.s ) {
							case 'var': case 'let':
								state = 'jsvar';
								break;
							case 'function':
								state = 'jsfunc';
								break;
							case 'class':
								state = 'class';
								break;
						}
					}
					break;
				case 'class':
					pushStack( 'c', 'js', 'classopen', token.s );
					break;
				case 'classopen':
					break;
				case 'classjs':
					if( token.s == "this" ) {
						state = 'classjsskipdot';
					} else if( token.s == "static" || token.s == "const" ) {
						state = 'classjs';
					} else {
						varname = token.s;
						state = 'classjs2';
					}
					break;
				case 'classjsskipdot':
					if( token.s == "." ) {
						state = 'classjsskipdot2';
					}
					break;
				case 'classjsskipdot2':
					varname = token.s;
					state = 'classjs2';
					break;
				case 'classjs2':
					if( token.s == "(" ) {
						pushStack( 'f', 'classjs', 'classjsparms2', varname );
						//console.log(lineno + "," + tokeno + ": " + token.s + " found classjsparms1");
					} else if( token.s == "=" ) {
						state = 'classjsvarassign';
					} else if( token.s == "static" ) {}
					break;
				case 'classjsparms':
					if( token.s == "(" ) {
						state = 'classjsparms2';
						//console.log(lineno + "," + tokeno + ": " + token.s + " found classjsparms");
					}
					break;
				case 'classjsparms2':
					if( token.s == ")" ) {
						state = 'classjsopen';
						//console.log(lineno + "," + tokeno + ": " + token.s + " end classjsparms");
					}
					break;
				case 'classjsopen':
					//console.log(lineno + "," + tokeno + ": " + token.s + " classjsopen");
					break;
				case 'classjsvarassign':
					if( token.s == "function" ) {
						pushStack( 'f', 'classjs', 'js', varname );
					} else if( token.s == "," ) {
						state = 'classjs';
					}
					break;
				case 'jsfunc':
					if( token.s == "(" ) {
						state = 'js';
					} else {
						pushStack( 'f', 'js', 'jsparms', token.s );
					}
					break;
				case 'jsparms':
					if( token.s == "(" ) {
						state = 'jsparms2';
					}
					break;
				case 'jsparms2':
					if( token.s == ")" ) {
						state = 'jsfuncopen';
					}
					break;
				case 'jsfuncopen':
					break;
				case 'jsvar':
					varname = token.s;
					state = 'jsvarname';
					break;
				case 'jsvarname':
					if( token.s == "=" ) {
						state = 'jsvarassign';
					} else if( token.s == "," ) {
						state = 'jsvar';
					}
					break;
				case 'jsvarassign':
					if( token.s == "function" ) {
						pushStack( 'f', 'jsvar', 'js', varname );
					} else if( token.s == "," ) {
						state = 'jsvar';
					} else if( token.s == ";" ) {
						state = 'js';
					}
					break;
			}
			if( !token ) break;
			token.z = state;
			token.d = depth;
			if( !nextStep() ) break;
		}

		return startLine;
	}

	tokenize( text, state = 'word', lineno = 1 )
	{
		var first_token = null;
		var token = {s: ""}, pt = null, lvt = null;
		var i, lastopen = null;
		var el, found;
		let depth = 0;
		
		let jskeywords = [
			'function', 'return', 'while', 'for', 'if', 'while', 'do', 'else', 'break', 'continue', 'switch', 'case', 'default',
			'var', 'const', 'let', 'new', 'delete', 'typeof', 'in', 'instanceof', 'this',
			'true', 'false',
			'null', 'undefined',
			'class', 'extends', 'static', 'super',
			'import', 'export',
			'from', 'as', 'try', 'catch',
			'finally', 'throw', 'debugger',
			'with', 'yield',
			'await', 'async',
			'of' ];

		let temp = false;
		let isw = false;
		let startofline = true;
		let addToken = (type) => {
			if( first_token === null ) first_token = token;
			if( typeof token.s != 'undefined' && token.s != "" ) {
				if( type == "js" && isNumeric(token.s) ) type = 'jsnum';
				else if( type == "js" && jskeywords.indexOf(token.s) >= 0 ) type = 'jskey';
				token.ot = state;
				token.t = type;

				if( pt ) {
					pt.next = token;
				}
				
				if( startofline ) {
					if( this.lineptrs.length < lineno ) {
						this.lineptrs.push( token );
					} else {
						this.lineptrs[lineno-1] = token;
					}
				}
				startofline = false;
				temp = false;

				isw = isWhite(token.s);
				pt = token;
				if( !isw ) lvt = token;
				token = {s: ""};
			} else {
				if( pt ) pt.next = token;
				temp = true;
				var empty = { s: "", ot: state, t: 'empty', next: null };
				if( this.lineptrs.length < lineno ) {
					this.lineptrs.push( empty );
					if( pt ) pt.next = empty;
					if( first_token === null ) first_token = empty;
				} else if( startofline ) {
					this.lineptrs[lineno-1] = empty;
					if( pt ) pt.next = empty;
					if( first_token === null ) first_token = empty;
				}
				token.t = type;
			}
		}
		let nextLine = () => {
			if( pt && pt.next && pt.next.t == "empty" ) {
				pt = pt.next;
			}
			lineno++;
			startofline=true;
		}

		if( text === "" ) {
			addToken('empty');
			return first_token;
		}

		for( i=0; i<text.length; i++ ) {
			var c = text[i];
			if( c == '\r' ) {
				if( text[i+1] == '\n' ) continue;
			}

			switch( state ) {
				case 'sh':
					if( c != "\x1B" && ( isAlpha(c) || isNumeric(c) ) ) {
						token.s += c;
					} else if( c == "\n" || c == "\r" ) {
						addToken('txt');
						nextLine();
					} else if( c == "\x1B" ) {
						addToken('txt');
						state = 'shesc';
					} else {
						addToken("txt");
						token.s += c;
					}
					break;
				case 'shesc':
					if( c == "[" ) {
						state = 'shesc2';
					} else {
						token.s += c;
						state = 'sh';
					}
					break;
				case 'shesc2':
					if( c == "m" ) {
						addToken('code');
						state = 'sh';
					} else {
						token.s += c;
					}
					break;
				case 'txt':
					if( isAlpha(c) || isNumeric(c) ) {
						token.s += c;
					} else if( c == "\n" ) {
						addToken('txt');
						nextLine();
					} else {
						addToken('txt');
						token.s = c;
						addToken('txt');
					}
					break;
				case 'js':
					if( c == ' ' || c == '\t' || c == '\r' || c == '\n' ) {
						addToken('js');

						if( c == '\n' ) {
							nextLine();
						}
						if( c != '\r' && c != '\n' ) {
							token.s = c;
							addToken('js');
						}
					} else if( isAlpha(c) || isNumeric(c) ) {
						token.s += c;
					} else if( c == "/" ) {
						if( pt && pt.s == "/" ) {
							pt.ot = pt.t = "jsc";
							token.s += c;
							addToken("jsc");
							state = "jsc";
							break;
						}
						if( !lvt ) {
							addToken('js');
							token.s += c;
							addToken('jsop');
							break;
						}
						if( text[i+1] == '/' ) {
							addToken('js');
							token.s += c;
							addToken('jsop');
							break;
						}
						if( text[i+1] == '*' ) {
							addToken('js');
							token.s += c;
							token.t = token.ot = 'longc';
							state = 'longc';
							addToken('longc');
							break;
						}
						switch( lvt.t ) {
							case 'jsop':
								if( lvt.s == ")" || lvt.s == "}" || lvt.s == "]" || lvt.s == "/" || lvt.s == ">" || lvt.s == "<" ) {
									addToken('js');
									token.s += c;
									addToken('jsop');//divide = operator (or comment)
								} else {
									addToken('js');
									token.s += c;
									addToken('l4');//regex = string type
									state = 'l4';
									depth = 0;
								}
								break;
							default:
								addToken('js');
								token.s += c;
								addToken('jsop');//divide = operator
								break;
						}
					} else if( c == '"' || c == '`' || c == "'" ) {
						addToken('js');
						token.s = c;
						if( c == "'" ) {
							state = 'l1';
						} else if( c == '`' ) {
							state = 'l2';
						} else if( c == '"' ) {
							state = 'l3';
						}
						token.ot = token.t = state;
					} else {
						addToken('js');
						token.s = c;
						if( c == "*" && pt && pt.s == "/" ) {
							state = "longc";
							pt.ot = pt.t = "longc";
							addToken("longc");
							break;
						} else if( c == "<" ) {
							lastopen = token;
						} else if( lastopen && c == ">" && pt && pt.t == "js" && pt.s == "script" ) {
							if( lastopen.next.s == "/" ) {

								pt.ot = pt.t = state = "word";
								addToken("op");
								lastopen.ot = lastopen.t = lastopen.next.ot = lastopen.next.t = "op";
								lastopen = null;
								break;
							}
						}
						addToken('jsop');
					}
					break;
				case 'word':
					if( c == ' ' || c == '\t' || c == '\r' || c == '\n' ) {
						addToken('word');
						if( c == '\n' ) {
							nextLine();
						}
						if( c != '\r' && c != '\n' ) {
							token.s = c;
							addToken('word');
						}
						break;
					} else if( isAlpha(c) || isNumeric(c) ) {
						token.s += c;
					} else {
						addToken('word');
						if( c == '<' ) {
							lastopen = token;
						}
						token.s = c;
						if( c == '>' && lastopen ) {
							el = lastopen.next;
							lastopen=null;
							found = false;
							while( el ) {
								if( el.t == "word" && el.s.toLowerCase() == "script" ) {
									addToken("op");
									state = 'js';
									found = true;
									break;
								} else if( el.t == "op" && el.s == "/" ) break;
								el = el.next;
							}
							if( found ) break;
						}
						if( c == '-' && lastopen && pt && pt.s == "-" ) {
							el = lastopen.next;
							if( el.s == "!" && el.next == pt ) {
								state = pt.ot = pt.t = el.ot = el.t = lastopen.ot = lastopen.t = "htmlc";
								addToken("htmlc");
								break;
							}
						}
						addToken('op');
					}
					break;
				case 'jsc':
					if( c == "\n" ) {
						addToken('jsc');
						nextLine();
						state = 'js';
						break;
					}
					token.s += c;
					break;
				case 'htmlc':
					if( c == "\n" ) {
						addToken('htmlc');
						nextLine();
						state = 'htmlc';
					} else {
						token.s += c;
						if( i>2 && c == ">" && text[i-1] == "-" && text[i-2] == "-" ) {
							addToken("htmlc");
							state = 'word';
						}
					}
					break;
				case 'longc':
					if( c == "\n" ) {
						addToken("longc");
						nextLine();
						state = 'longc';
					} else {
						token.s += c;
						if( c == "/" && i>1 && text[i-1] == "*" ) {
							addToken("longc");
							state = 'js';
						}
					}
					break;
				case 'l1':
					if( c == "\n" ) {
						addToken("l1");
						nextLine();
						state = 'js';
					} else {
						token.t = 'l1';
						token.s += c;
						if( c == "'" ) {
							addToken("l1");
							state = 'js';
						}
					}
					break;
				case 'l2':
					if( c == "\n" ) {
						addToken("l2");
						nextLine();
						state = 'l2';
					} else {
						token.t = 'l2';
						token.s += c;
						if( c == "\\" ) {
							token.s += text[++i];
						} else if( c == "`" ) {
							addToken("l2");
							state = 'js';
						}
					}
					break;
				case 'l3':
					if( c == "\n" ) {
						addToken("l3");
						if( pt ) pt.ot = "js";
						nextLine();
						state = 'js';
					} else {
						token.t = 'l3';
						token.s += c;
						if( c == "\\" ) {
							token.s += text[++i];
						} else if( c == '"' ) {
							addToken("l3");
							state = 'js';
						}
					}
					break;
				case 'l4':
					if( c == "\n" ) {
						addToken("l4");
						nextLine();
						state = 'l4';
					} else {
						token.t = 'l4';
						token.s += c;
						if( depth > 0 ) {
							if( c == ']' || c == ')' ) {
								depth--;
							}
						} else {
							if( c == "\\" ) {
								token.s += text[++i];
							} else if( c == '/' ) {
								addToken("l4");
								state = 'js';
							}
						}
						if( c == '[' || c == '(' ) {
							depth++;
						}
					}
					break;
			}
		}

		if( token.s != "" ) {
			addToken(state);
		}
		if( pt && (pt.ot == "l3" || pt.ot == "l1") ) pt.ot = "js";

		return first_token;
	}
}