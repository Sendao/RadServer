/*const aa = 'a'.charCodeAt(0), z = 'z'.charCodeAt(0), A = 'A'.charCodeAt(0), Z = 'Z'.charCodeAt(0);
let isAlpha = function(c) {
	let cc = c.charCodeAt(0);
	return (cc >= aa && cc <= z) || (cc >= A && cc <= Z);
}*/
let isNumeric = function(c) {
	var i;
	for( i=0; i<c.length; i++ ) {
		if( c[i] == ' ' || c[i] == '\t' || c[i] == '\n' || isNaN(c[i]) ) return false;
	}
	return true;
}
/*
let isWhite = function(c) {
	var i;
	for( i=0; i<c.length; i++ ){
		if( c[i] != ' ' && c[i] != '\t' && c[i] != '\r' && c[i] != '\n' ) return false;
	}
	return true;
}
*/
function sanitize(txt)
{
    return txt.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function getRealWidth(el)
{
	var r = el.getBoundingClientRect();
	return r.width;
}

function getSelNode(node, offset)
{
	let el = node;
	if( !el ) {
		return false;
	}
	if( el.nodeName == "DIV" && !el.classList.contains("section") ) {
		el = el.childNodes[ offset ];
		offset = 0;
	}
	if( el.nodeName == "DIV" && el.classList.contains("section") ) {
		el = el.childNodes[ offset ];
		offset = 0;
	}
	if( el.className == "endoffile" ) {
		el = el.previousSibling.firstChild;
		offset = el.textContent.length;
	}
	if( el.nodeName == "PRE" ) {
		el = el.childNodes[0];
		offset = 0;
	}
	if( el.nodeName == "#text" ) {
		return [el,offset];
	}
	return false;
}

function getSelectionLines(sel) {
    var el, off, rv;
    rv = getSelNode(sel.anchorNode, sel.anchorOffset);
    if( rv === false ) return [];
    [el,off] = rv;

    el = el.parentNode;

    var endel, endoff;
    var erv;
    erv = getSelNode(sel.focusNode, sel.focusOffset);
    if( erv === false ) return [];
    [endel,endoff] = erv;

    endel = endel.parentNode;
    
    let data = [];
    // bad hack
    for( var testel = endel; testel; testel = testel.nextSibling ) {
        if( testel == el ) {
            [el,endel] = [endel,el];
            break;
        }
		if( !testel.nextSibling && testel.parentNode.previousSibling && testel.parentNode.previousSibling.nodeName == "DIV" && testel.parentNode.previousSibling.classList.contains("section")  ) {
			testel = testel.parentNode.previousSibling.lastChild;
			if( testel == el ) {
				[el,endel] = [endel,el];
				break;
			}
		}
    }

    while( el ) {
        if( el.className == 'clr' ) {
            data.push( 0 );
        }
        data.push( el.childNodes[0] );
        if( el == endel ) break;

		if( !el.nextSibling && el.parentNode.previousSibling && el.parentNode.previousSibling.nodeName == "DIV" && el.parentNode.previousSibling.classList.contains("section") ) {
			el = el.parentNode.previousSibling.lastChild;
		} else {
			el = el.nextSibling;
		}
    }
    console.log(data);

    return data;
}

function insertAfter(newNode, referenceNode) {
    if( referenceNode.nextSibling )
        referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
    else
        referenceNode.parentNode.appendChild(newNode);
}

function lineNumber(el, off)
{
	let rv = getSelNode(el, off); // reduce to a common node type
	if( rv === false ) return 1;

	el = rv[0].parentNode;

	var sectline = parseInt(el.parentNode.getAttribute('lo') || 0);
	var x = el.parentNode.firstChild;
	while( x  ) {
		if( x.classList.contains("clr") ) {
			sectline++;
		}
		if( x == el ) break;
		x = x.nextSibling;
	}
	return sectline;

}
function sectionLineNumber(el, off)
{
	let count = 1;

	let rv = getSelNode(el, off); // reduce to a common node type
	if( rv === false ) return 0;

	el = rv[0].parentNode;
	while( el ) {
		if( el.classList.contains("clr") ) {
			count++;
		}
		el = el.previousSibling;
	}
	return count-1;
}

function stringWidth(str)
{
	var buf = document.createElement("div");
	var txt = document.createTextNode(str);
	buf.appendChild(txt);
	buf.style.visibility = 'hidden';
	buf.style.position = 'absolute';
	buf.style.top = '0px';
	buf.style.left = '0px';
	document.body.appendChild(buf);
	var r = buf.getBoundingClientRect();
	document.body.removeChild(buf);
	return r.width;
}

function lineWidth(el, off)
{
	let count = 0, r;

	let rv = getSelNode(el, off);
	if( rv === false ) return 0;
	[el,off] = rv;
	if( el.parentNode.getAttribute('fake') == 1 ) {
		return 0;
	}
	if( off == 0 || el.textContent.length == 0 ) {
		off = 0;
	} else {
		if( el.parentNode.classList.contains("last") ) {
			off = stringWidth( el.textContent ) / (el.textContent.length / off );
		} else {
			r = el.parentNode.getBoundingClientRect();
			off = Math.ceil( r.width ) / (el.textContent.length / off);
		}
	}
	if( el.parentNode.classList.contains("clr") ) return off;
	count = off;
	el = el.parentNode;
	while( el ) {
		el = el.previousSibling;
		if( !el ) break;
		r = el.getBoundingClientRect();
		if( !el.classList.contains("last") )
			count += Math.ceil( r.width );
		if( el.classList.contains("clr") ) break;
	}
	return count;
}
function lineOffset(el, off)
{
	let count = 0;

	let rv = getSelNode(el, off);
	if( rv === false ) return 0;
	[el,off] = rv;
	
	if( el.parentNode.getAttribute('fake') == 1 ) {
		return 0;
	}

	if( el.parentNode.classList.contains("clr") ) return off;

	count = off;
	el = el.parentNode;
	while( el ) {
		el = el.previousSibling;
		if( !el ) break;
		count += el.firstChild.textContent.length;
		if( el.classList.contains("clr") ) break;
	}

	//console.log("lo: ", start, off, count);
	return count;
}
var dbg_edit;

class TextEditor
{
	constructor(parent, filename, reopen=false, sensitive=true) {
		dbg_edit = this;
		this.parent = parent;
		this.width = "";
		this.height = "";
		this.cBefore = "";
		this.cIn = "";
		this.cAfter = "";
		this.changed = false;
		this.savetimer = -1;
		this.anchorLine = 0;
		this.anchorOffset = 0;
		this.text_lines = null;
		this.section_boundary = 50;
		this.sectiontimer = -1;
		this.postmark = this.premark = null;
		this.changed_lines = new Set();
		this.change_timer = -1;
		this.record_changes = true;
		this.lineheight = 19.0;
		this.hiliters = new Set();
		this.hilite_timer = -1;
		this.lineends = [];
		this.history = [];
		this.histptr = 0;
		this.eolindicator = null;
		this.sensitive = sensitive;
		this.ptrlock = false;
		this.typecb = false;
		this.focused = false;
		this.focusTimer = -1;

		if( typeof filename == 'undefined' ) {
			this.filename = 'untitled';
			let i = 1;
			while( localStorage.getItem(this.filename) != null ) {
				this.filename = 'untitled' + i;
				i++;
			}
		} else {
			this.filename = filename;
		}
		this.buildEditor();

		this.mode = false;
		if( reopen ) {
			this.setText( localStorage.getItem(this.filename) );
		} else {
			this.setText("\n");
		}

		// focus on the editor
		this.parent.pickTab(this.filename);

		this.longsavetimer = setInterval(this.localSave.bind(this), 60000);
	}

	close() {
		let af = localStorage.getItem('allfiles');
		af = af.split("\n");
		let i = af.indexOf(this.filename);
		if( i >= 0 ) {
			af.splice(i,1);
			localStorage.setItem('allfiles', af.join("\n"));
		}
		localStorage.removeItem( this.filename );
		if( this.savetimer != -1 )
			clearTimeout( this.savetimer );
		clearInterval( this.longsavetimer );
	}

	sense_size() {
		if( !this.sensitive ) return;

		var oldheight = this.height;
		var oldwidth = this.width;
		
		oldheight = 600-36;
		oldwidth = 600-36;

		this.height = Math.max( 300, (this.text_lines.length+1) * this.lineheight );
		
		var i, el, mw = 400;

		for( i=0; i<50 && i<this.text_lines.length; i++ ) {
			el = this.getLineElement(i+1);
			while( el && el.nextSibling && !el.nextSibling.classList.contains("clr") ) {
				el = el.nextSibling;
			}
			if( el ) {
				mw = Math.max(mw, lineWidth(el.firstChild, el.firstChild.textContent.length));
			}
		}

		this.width = mw + 36;

		console.log("Sensed internal size: " + this.width + "x" + this.height + " (was " + oldwidth + "x" + oldheight + ")");
		//if( this.height > 1000 ) this.height = 1000;
		//if( this.width > 1000 ) this.width = 1000;
		this.set_size();

		/*
		var window_w = this.width > (600-36) ? oldwidth : this.width;
		var window_h = this.height > (600-36) ? oldheight : this.height;
		this.tab.drag.resize(window_w+36, window_h+36);
		*/
	}

	resizer() {
		let r = this.editor.parentNode.getBoundingClientRect();
		//this.width = r.width - 36;
		//this.height = r.height - 36;
		//this.set_size();
	}

	set_size() {
		this.editor.style.minWidth = this.width + 'px';
		if( this.height != "" )
			this.editor.style.minHeight = this.height + 'px';

		let linesrect = this.lines.getBoundingClientRect();
		let bodyrect = this.editor.getBoundingClientRect();
		let offset = (linesrect.right - bodyrect.left + 5);
		this.text.style.top = '0px';
		this.text.style.left = offset + 'px';
		this.text.style.minWidth = (this.width - offset) + 'px';
		//this.text.style.maxWidth = this.text.style.width = this.width - offset + 'px';
		//this.lines.style.maxHeight = this.text.clientHeight + "px";

		if( this.eof ) {
			this.eof.style.width = (this.width - 60) + 'px';
			this.calcEOF();
		}

		this.adjustVisibleEnds();

		if( this.sensitive )
			this.tab.drag.resize(this.width+36, this.height+36);
	}

	buildEditor() {
		let editor = document.createElement('div');
		editor.className = 'texteditor';
		editor.setAttribute('spellcheck', 'false');
		editor.style.whiteSpace = 'nowrap';
		editor.style.position = 'absolute';
		editor.style.left = '0px';
		editor.style.top = '0px';
		if( this.width != "" ) {
			editor.style.minWidth = this.width + 'px';
			editor.style.minHeight = this.height + 'px';
		}
		editor.style.cursor = 'text';

		this.tab = this.parent.add( this.filename, editor );


		this.editor = editor;
	
		let lines = document.createElement('div');
		this.lines = lines;

		lines.id = 'linecounter';
		lines.style.width = '30px';
		//lines.style.minHeight = lines.style.maxHeight = "100%";
		//lines.style.overflow = 'hidden';
		//lines.style.overflowY = 'hidden';
		lines.style.color = '#808080';
		lines.style.fontFamily = 'monospace';
		lines.style.fontSize = '12pt';
		//lines.style.scrollbarWidth = 'none';
		//lines.style.display = 'inline-block';
		lines.style.position = 'absolute';
		lines.style.left = '0px';
		lines.className = "ps";
		editor.appendChild(lines);
	
		let text = document.createElement('div');
		this.text = text;

		text.style.position = 'absolute';
		text.style.left = '30px';
		
		//text.style.overflowY = 'scroll';

		text.contentEditable = true;

		//text.style.maxHeight = text.style.minHeight = this.height + 'px';
		//text.style.maxHeight = text.style.minHeight = "100%";
		text.style.margin = text.style.padding = '0px';
		text.style.fontFamily = 'monospace';
		if( this.width != "" ) {
			text.style.minWidth = (this.width - 30) + 'px';
		}
		//text.style.overflowX = 'auto';
		text.style.fontSize = '12pt';
		this.tab.drag.main.firstChild.addEventListener('scroll', this.onScroll.bind(this), false );

		lines.style.left = '0px';
		lines.style.top = '0px';

		let eof = document.createElement('pre');
		//eof.innerHTML = ' ';
		eof.className = 'endoffile';
		//eof.style.height = this.height + 'px';
		if( this.width != "" ) {
			eof.style.width = (this.width - 60) + "px";
		}
		this.eof = eof;
		text.appendChild(eof);
		editor.appendChild(text);
		text.addEventListener('mousedown', function(ev){
			ev.stopPropagation();
		});

		let linesrect = lines.getBoundingClientRect();
		let bodyrect = editor.getBoundingClientRect();
		let offset = (linesrect.right - bodyrect.left + 5);
		text.style.top = '0px';
		text.style.left = offset + 'px';
		if( this.width != "" ) {
			text.style.minWidth = this.width - offset + 'px';
			//text.style.minWidth = (this.wiedth - offset) + "px";
		}
		//lines.style.maxHeight = text.clientHeight + "px";

		text.addEventListener('selectionchange', this.selchange.bind(this));
		text.addEventListener('keydown', this.keydn.bind(this), false);	
		text.addEventListener('keyup', this.keyup.bind(this), false);
		text.addEventListener('paste', this.paste.bind(this), false);
		text.addEventListener('copy', this.copy.bind(this), false);
		text.addEventListener('focus', this.focus.bind(this), false);
		text.addEventListener('blur', this.blur.bind(this), false);

		editor.addEventListener('resizer', this.resizer.bind(this));

		this.scanEditor();
	}

	blur(ev) {
		this.focused = false;
		if( this.focusTimer != -1 ) {
			clearTimeout(this.focusTimer);
			this.focusTimer = -1;
		}
	}
	focus(ev) {
		this.focused = true;
		if( this.focusTimer == -1 && this.ptrlock !== false ) {
			this.focusTimer = setTimeout(this.focusTime.bind(this), 100);
		}
	}
	focusTime() {
		var sel = window.getSelection();
		if( !sel.isCollapsed ) return;
		
		var ex = getSelNode(sel.focusNode, sel.focusOffset);

		if( !ex ) return;

		var fl, fo;

		fl = lineNumber(ex[0], ex[1]);
		fo = lineOffset(ex[0], ex[1]);
		
		this.focusTimer = setTimeout(this.focusTime.bind(this), 100);

		if( this.focusLine != fl || this.focusOffset != fo ) {
			this.focusLine = fl;
			this.focusOffset = fo;
			this.ptrlock(fl, fo, this);
		}
	}

	//! When deleting or adding a section, call this method
	//! todo: make this faster by only updating the affected sections
	updateSections() {
		var el = this.text.firstChild;

		if( el.className == "premark" ) el = el.nextSibling;
		if( el.className == "endoffile" ) return;

		var offset=0;
		do {
			el.setAttribute('lo', offset);
			offset+=parseInt(el.getAttribute('lc'));
			el = el.nextSibling;
		} while ( el && el.className == "section" );
	}

	
	onScroll(ev) {
		if( this.scrolltimer != -1 ) clearTimeout(this.scrolltimer);

		this.scrolltimer = setTimeout( this.onScrolled.bind(this, ev), 12 );
	}

	onScrolled(ev) {
		this.scrolltimer = -1;
		var premark_size = this.premark ? parseInt(this.premark.style.minHeight) : 0;
		let evtarget = this.parent.get( this.filename );
		if( 'drag' in evtarget ) {
			evtarget = evtarget.drag.main.firstChild;
		} else {
			alert("Cog is broken");
			return;
		}
		let bufferTop = Math.floor( (ev.target.scrollTop - this.section_boundary/10)/this.section_boundary ) * this.section_boundary;
		//console.log("Scrolled to " + bufferTop + "(" + ev.target.scrollTop + ")");

		var l, r, m;
		var pre_l;
		l = 0;
		if( this.text.firstChild.className == "premark" ) l=1;
		r = this.text.childNodes.length; // first find the right section
		while( r>=1 && this.text.childNodes[r-1].className == "endoffile" || this.text.childNodes[r-1].className == "postmark" ) r--;
		while( l < r ) {
			m = l + Math.floor((r-l)/2);
			if( !this.text.childNodes[m].firstChild || this.text.childNodes[m].className == "endoffile" || this.text.childNodes[m].className == "postmark" ) {
				r = m;
				continue;
			}
			if( (parseInt(this.text.childNodes[m].getAttribute('lo')) + parseInt(this.text.childNodes[m].getAttribute('lc')))*this.lineheight < bufferTop ) {
				l = m + 1;
			} else {
				r = m;
			}
		}
		let firstel = this.text.childNodes[l];
		pre_l = l;
		var el;

		var x, count=0;
		for( x = this.text.firstChild ? this.text.firstChild.nextSibling : null; x && x != firstel; x = x.nextSibling ) {
			if( !x ) break;
			if( x.style.display != 'none' ) {
				x.style.display = 'none';
				//console.log("Hide section " + (count+1));
			}
			count += parseInt(x.getAttribute('lc'));
		}
		premark_size = count;
		if( this.premark ) this.premark.style.minHeight = (premark_size*this.lineheight) + "px";
		
		if( firstel.style.display == 'none' ) {
			console.log("Revis");
			firstel.style.display = 'block';
			postmark_size -= parseInt( firstel.getAttribute('lc') );
		}

		l = 0;
		r = firstel.childNodes.length; // then the right line
		while( l < r ) {
			m = l + Math.floor((r-l)/2);
			if( firstel.childNodes[m].offsetTop + firstel.childNodes[m].offsetHeight < bufferTop ) {
				l = m + 1;
			} else {
				r = m;
			}
		}
		if( l == firstel.childNodes.length ) {
			l--;
		}
		firstel = firstel.childNodes[l];

		if( this.text.childNodes[pre_l].className == "premark" ) pre_l++;
		l = pre_l;
		r = this.text.childNodes.length;
		while( r>=1 && this.text.childNodes[r-1].className == "endoffile" || this.text.childNodes[r-1].className == "postmark" ) r--;

		let scrollBottom = ev.target.scrollTop + ev.target.clientHeight;
		let bufferBottom = Math.ceil( (scrollBottom + this.section_boundary/10)/this.section_boundary ) * this.section_boundary;
		//console.log("Scroll max vis: " + bufferBottom + " (" + scrollBottom + ")");

		while( l < r ) {
			m = l + Math.floor((r-l)/2);
			if( this.text.childNodes[m].className == "premark" ) {
				l = m + 1;
				continue;
			}
			if( !this.text.childNodes[m].hasAttribute('lo') ) {
				r = m;
				continue;
			}
			if( this.text.childNodes[m].getAttribute('lo')*this.lineheight > bufferBottom ) {
				r = m;
			} else {
				l = m + 1;
			}
		}
		let lastel = this.text.childNodes[l];
		var postmark_size = this.postmark ? (parseInt(this.postmark.style.minHeight)/this.lineheight) : 0;
		while( lastel && lastel.className == "endoffile" || lastel.className == "postmark" ) lastel = lastel.previousSibling;
		if( l == this.text.childNodes.length || lastel == firstel.parentNode ) {
			//console.log("Couldn't find section " + l + " at " + bufferBottom);
			lastel = null;
		}

		if( lastel ) {
			for( el=lastel; el; el = el.nextSibling ) {
				if( el.className == "section" && el.style.display != 'none' ) {
					el.style.display = 'none';
					postmark_size += parseInt( el.getAttribute('lc') );
					if( this.postmark ) this.postmark.style.minHeight = (postmark_size*this.lineheight) + "px";
				}
			}
			l = 0;
			r = lastel.childNodes.length; // last line
			while( l < r ) {
				m = l + Math.floor((r-l)/2);
				if( lastel.childNodes[m].offsetTop > bufferBottom ) {
					r = m;
				} else {
					l = m + 1;
				}
			}
			if( l == lastel.childNodes.length ) {
				lastel = lastel.nextSibling;
				if( lastel && lastel.className == "section" ) {
					lastel = lastel.firstChild;
				} else {
					lastel = null;
				}
				//console.log("Couldn't find part2 line " + l + " at " + bufferBottom);
			} else {
				lastel = lastel.childNodes[l];
			}
		}

		//console.log("First: ", firstel, " last: ", lastel);

		el = firstel;
		var pre;
		var lineno = lineNumber(firstel, 0);
		var startline = lineno-1;
		var lastline = Math.max( lineNumber(lastel, 0), startline + 1.2*( ev.target.clientHeight / this.lineheight ) );
		var nextel, nextsect;
		var lastelparent = lastel ? lastel.parentNode : null;
		var updated = false;
		var lastsection = this.text.lastChild;

		//console.log("Scrolled to lines " + lineno + "-" + lastline);

		while( lastsection && lastsection.className == "postmark" || lastsection.className == "endoffile" ) lastsection = lastsection.previousSibling;

		let found=false, early;
		if( lastsection && lastsection.className == "section" ) {
			let sectline = parseInt(lastsection.getAttribute('lo')) + parseInt(lastsection.getAttribute('lc'));

			if( sectline < startline ) {
				let linecount = parseInt(lastsection.getAttribute('lc'));
				while( linecount < this.section_boundary && sectline < startline ) {
					linecount++;
					
					let line = document.createElement('pre');
					line.className = 'clr';
					line.setAttribute('p', 1);
					line.appendChild( document.createTextNode(' ') );
					lastsection.appendChild(line);
					sectline++;
					postmark_size--;
				}
			}

			while( sectline < startline ) { // we end early!
				// create empty sections

				nextsect = document.createElement('DIV');
				nextsect.className = 'section';
				nextsect.setAttribute('lo', sectline);
				insertAfter( nextsect, lastsection );
				lastsection = nextsect;
				early = false;
				for( count=0; count<this.section_boundary; count++ ) {
					let line = document.createElement('pre');
					line.className = 'clr';
					line.setAttribute('p', 1);
					line.appendChild( document.createTextNode(' ') );
					nextsect.appendChild(line);
					if( sectline+count+1 > startline ) {
						nextsect.setAttribute('lc', count+1);
						sectline += count+1;
						postmark_size -= count+1;
						early = true;
						break;
					}
				}
				if( !early ) {
					nextsect.setAttribute('lc', this.section_boundary);
					sectline += this.section_boundary;
					postmark_size -= this.section_boundary;
				} else break;
				lastsection = nextsect;
			}
		}
		
		
		if( !found ) {
			el = this.getLineElement(lineno);
		}
		var hasnewline=false, hasnextsib=false;
		while( el /*&& el != lastel*/ ) {
			if( !this.hasNext(el) ) {
				if( postmark_size > 0 && lineno<=lastline+1 ) {

					let sectline = sectionLineNumber(el, 0);
					if( sectline+1 > this.section_boundary ) {
						var lastsect = el.parentNode;
						nextsect = document.createElement('DIV');
						nextsect.className = 'section';
						var linecounter = parseInt(lastsect.getAttribute('lc')) + parseInt(lastsect.getAttribute('lo'));
						nextsect.setAttribute('lo', linecounter);
						nextsect.setAttribute('lc', 1);
						updated = true;
						insertAfter(nextsect, lastsect);
					} else {
						nextsect = el.parentNode;
						nextsect.setAttribute('lc', parseInt(nextsect.getAttribute('lc'))+1);
					}
	
					postmark_size--;
					pre = document.createElement("pre");
					pre.className = "clr";
					pre.setAttribute('p', 1);
					nextel = document.createTextNode(" ");
					pre.appendChild(nextel);
					nextsect.appendChild(pre);
					nextel = pre;
				} else {
					//console.log("no room left");
					nextel = el.nextSibling;
				}
			} else {
				nextel = this.nextSib(el);
			}
			hasnewline = el.classList.contains("clr");
			hasnextsib = el.nextSibling ? true : false;
			if( el.getAttribute('p') == 1 || el.getAttribute('fake') == 1 ) {
				el.removeAttribute('p');
				el.removeAttribute('fake');
				//this.drawAt(el, this.text_lines[lineno-1]);
				//console.log("Draw tokens at ", lineno);
				let endnum = lineno;
				for( endnum = lineno; endnum < this.linter.lineptrs.length && !this.linter.lineptrs[endnum]; endnum++ );
				if( this.linter.lineptrs[lineno-1] != null && this.linter.lineptrs[lineno-1].t != "empty" )
					this.drawTokensAt(el, this.linter.lineptrs[lineno-1], endnum<this.linter.lineptrs.length ? this.linter.lineptrs[endnum] : null );
				else {
					el.setAttribute('fake', 1);
					this.lineends.push( el.firstChild );
				}
			//} else {
				//console.log("Already drawn line " + lineno);
			}
			if( hasnewline ) lineno++;
			if( !hasnextsib && nextel && nextel.parentNode != lastelparent ) {
				if( nextel.parentNode.style.display == 'none' ) {
					nextel.parentNode.style.display = 'block';
					postmark_size -= parseInt(nextel.parentNode.getAttribute('lc'));
				}
			}
			el = nextel;
			if( !nextel ) {
				//console.log("Early escape line " + lineno);
			}
			if( lineno > lastline ) break;
		}
		//console.log("Scrollby: finish line " + lineno, ev);
		if( updated ) this.updateSections();

		if( this.postmark ) this.postmark.style.minHeight = (postmark_size*this.lineheight) + "px";
		this.lines.style.left = ev.target.scrollLeft + "px";
		this.adjustEnds();
		this.calcEOF();
	}

	adjustEnds() {
		var i, wid, maxwid=200;

		for( i=0; i<this.lineends.length; i++ ) {
			if( !this.lineends[i].parentNode ) continue;
			this.lineends[i].parentNode.style.width = '';
			wid = lineWidth(this.lineends[i], this.lineends[i].textContent.length);
			/*
			if( wid+30 > parseInt(this.text.style.width) ) {
				this.lineends[i].parentNode.parentNode.style.width = (wid+60) + "px";
			}
			*/
			if( wid > maxwid ) maxwid = wid;
			this.lineends[i].parentNode.style.width = (getRealWidth(this.text) - (60 + lineWidth(this.lineends[i], 0))) + "px";
		}
		this.lineends = [];

		if( this.width == "" || maxwid > this.width ) {
			this.width = maxwid+60;
			this.height = this.line_height * (this.text_lines.length+1);
			this.set_size();
		}
		return;
	}

	adjustVisibleEnds() {
		var el, ch, wid;

		let textWidth = getRealWidth(this.text);

		for( el = this.text.firstChild; el; el = el.nextSibling ) {
			// el is a section

			if( el.className != "section" ) continue;
			if( el.style.display == 'none' ) continue;

			for( ch = el.firstChild; ch; ch = ch.nextSibling ) {
				// ch is a <pre> element
				if( ch.classList.contains("last") || ch.getAttribute('fake') == 1 ) {
					wid = lineWidth( ch.firstChild, ch.firstChild.textContent.length );
					ch.style.width = (textWidth - (70 + wid)) + "px";
				}
			}
		}
	}

	getOffsetElement(lineno, offset) {
		var el = this.getLineElement(lineno);
		var off = 0, firstloop=true;
		while( el ) {
			if( el.className == "clr" && !firstloop ) {
				return [null,-2];
			} else if( firstloop ) {
				firstloop = false;
			}
			off += el.firstChild.textContent.length;
			if( off >= offset ) {
				off -= el.firstChild.textContent.length;
				offset -= off;
				break;
			}
			el = this.nextSib(el);
		}
		return [el?el.firstChild:null,el?offset:-1];
	}

	getLineElement(lineno) {
		var el = this.text.firstChild;
		var l = 1;
		while( el ) {
			while( el && el.className != "section" ) {
				el = el.nextSibling;
			}
			if( !el ) return null;
			l += parseInt(el.getAttribute('lc'));
			if( l >= lineno ) {
				break;
			}
			el = el.nextSibling;
		}
		if( !el ) return null;
		l -= parseInt(el.getAttribute('lc'));
		if( l >= lineno ) return el.firstChild;
		else if( el.firstChild.classList.contains("clr") ) el = el.firstChild.nextSibling;
		else el = el.firstChild;

		for( ; el; el = el.nextSibling ) {
			if( el.classList.contains("clr") ) {
				l++;
				if( l >= lineno ) break;
			}
		}
		//console.log("GLE " + lineno + " = ", el);
		return el;
	}

	drawAt(el, line) {
		var txt = document.createTextNode(line);
		el.innerHTML = "";
		el.appendChild(txt);
		if( line == "" ) {
			txt.textContent = " ";
			el.setAttribute("fake", 1);
		}
	}


	gotoLine( lineno ) {
		this.scrollTarget = this.lineheight * (lineno-1);
		var holder = this.parent.get(this.filename).drag.main.firstChild;
		if( this.scrollTarget > holder.scrollHeight - holder.clientHeight ) this.scrollTarget = holder.scrollHeight - holder.clientHeight;
		this.scrollCount = 0;
		this.animToLine();
	}

	animToLine() {
		if( this.scrollTarget == -1 ) return;
		var holder = this.parent.get(this.filename).drag.main.firstChild;
		if( holder.scrollTop == this.scrollTarget ) {
			this.scrollTarget = -1;
			return;
		}
		if( Math.abs(this.scrollTarget - holder.scrollTop) < 5 ) {
			holder.scrollTop = this.scrollTarget;
			this.scrollTarget = -1;
			return;
		}
		this.scrollCount++;
		if( this.scrollCount > 30 ) {
			holder.scrollTop = this.scrollTarget;
			this.scrollTarget = -1;
			return;
		}
		holder.scrollTop += (this.scrollTarget - holder.scrollTop) / 10;
		requestAnimationFrame(this.animToLine.bind(this));
	}

	drawTokensAt(el, token, next_token) {
		var pre, prev, txt, mode = '';
		let modes = {
			'js': 'js',
			'word': 'html',
			'op': 'html',
			'jsop': 'js',
			'jskey': 'js',
			'txt': 'txt'
		}
		let types = {
			'op': 'op',
			'jsop': 'op',
			'jsc': 'comment',
			'longc': 'longcomment',
			'htmlc': 'htmlcomment',
			'l1': 'literal',
			'l2': 'literal',
			'l3': 'literal',
			'l4': 'regex',
			'word': 'word',
			'js': 'word',
			'jsnum': 'number',
			'jskey': 'keyword',
			'txt': 'word'
		};

		el.innerHTML = '';

		pre = el.nextSibling;
		while( pre && !pre.classList.contains('clr') ) {
			pre.parentNode.removeChild(pre);
			pre = el.nextSibling;
		}

		if( token == next_token || !token || token.t == "empty" ) {	
			txt = document.createTextNode(" ");
			el.appendChild(txt);
			el.setAttribute("fake", 1);
			this.lineends.push( txt );
			return;
		}

		pre = el;
		el.removeAttribute('p');
		prev = null;
		while( token && token != next_token ) {
			if( token.t == 'empty' || token.s == "" || token.e === 1 ) {
				token = token.next;
				continue;
			}
			if( prev ) {
				pre = document.createElement("pre");
				insertAfter(pre, prev);
			} else {
				pre.removeAttribute('fake');
			}
			txt = document.createTextNode(token.s);
			if( token.bold === 1 ) {
				pre.style.fontWeight = "bold";
			}
			if( token.italic === 1 ) {
				pre.style.fontStyle = "italic";
			}
			if( token.underline === 1 ) {
				pre.style.textDecoration = "underline";
			}
			if( token.strike === 1 ) {
				pre.style.textDecoration = "line-through";
			}
			if( 'fg' in token ) {
				pre.style.color = token.fg;
			}
			if( 'bg' in token ) {
				pre.style.backgroundColor = token.bg;
			}
			if( token.blink === 1 ) {
				pre.style.animation = "blink 1s infinite";
			}

			if( token.t in modes ) {
				pre.setAttribute('m', mode=modes[token.t]);
			} else if( mode != "" ) {
				pre.setAttribute('m', mode);
			}
			pre.setAttribute('s', types[token.t]);
			pre.appendChild(txt);
			this.hiliteWord(txt);
			prev = pre;
			token = token.next;
		}
		this.lineends.push( txt );
	}

	scanEditor() {
		// get the editor's dimensions
		var holder = this.parent.get(this.filename).drag.main.firstChild;
		var lineboundary = this.section_boundary * this.lineheight;
		let bufferTop = Math.floor( (holder.scrollTop - lineboundary)/lineboundary ) * lineboundary;
		let bufferBottom = Math.ceil( (holder.scrollTop + holder.clientHeight + lineboundary)/lineboundary ) * lineboundary;
		return [bufferTop, bufferBottom];
	}

	getText() {
		return this.text_lines.join("\n");
	}

	localSave() {
		if( !this.changed ) return;
		if( this.savetimer != -1 ) {
			clearTimeout( this.savetimer );
			this.savetimer = -1;
		}
		this.changed = false;
		console.log("localSave()");
		localStorage.setItem(this.filename, this.getText());

		let allitems = localStorage.getItem('allfiles');
		if( allitems == null ) allitems = "";
		if( allitems.indexOf(this.filename + "\n") == -1 ) {
			allitems += this.filename + "\n";
			localStorage.setItem('allfiles', allitems);
		}
	}
	
	setText(text)
	{
		localStorage.setItem(this.filename, text);

		this.record_changes = false;

		var lines = text.split("\n");
		console.log(this.filename + ": " + lines.length + " lines");

		var el=null, off=0;
		clearNode(this.text);
		el = document.createElement("pre");
		el.className = "premark";
		el.style.minHeight = "0em";
		this.premark = el;
		this.text.appendChild(el);
		this.eof = null;
		this.postmark = null;
		this.text_lines = null;
		if( this.linter ) {
			this.linter.processed = false;
		}
		for( var i=0; i<lines.length; i++ ) {
			this.appendAt(lines[i], el?el.firstChild:null, 0);
			if( lines[i] == "" && i == lines.length-1 ) break;

			el = this.text.lastChild;
			while( el.className == "endoffile" || el.className == "postmark" ) {
				el = el.previousSibling;
			}
			el = el.lastChild;
			off = el.firstChild.textContent.length;
			this.appendAt("\n", el.firstChild, off);

			el = this.text.lastChild;
			while( el.className == "endoffile" || el.className == "postmark" ) {
				el = el.previousSibling;
			}
			el = el.lastChild;
			off = el.firstChild.textContent.length;
		}
		let eof = document.createElement('pre');
		eof.className = 'endoffile';
		if( this.width ) {
			eof.style.width = (this.width - 60)+ "px";
		}
		this.eof = eof;
		this.text.appendChild(eof);
		this.changed = false;

		this.countLines();
		this.onScroll({target:this.parent.get(this.filename).drag.main.firstChild});

		if( this.linter ) {
			this.linter.readfile( this.filename, text );
		}

		this.record_changes = true;

		this.sense_size();
	}

	calcEOF() {
		if( !this.eof ) return;

		let lastkid = this.text.lastChild;
		if( lastkid && lastkid.nodeName == "DIV" && lastkid.classList.contains("section") ) {
			lastkid = lastkid.lastChild;
		} else {
			if( lastkid && lastkid.className == 'endoffile' ) {
				lastkid = lastkid.previousSibling.lastChild;
			}
		}
		//let lastheight = 0;
		if( lastkid ) {
			//lastheight = lastkid.offsetHeight + lastkid.offsetTop;
		}
		this.eof.style.height = /*(this.text.clientHeight - lastheight) + */"0px";
	}

	saveTimer() {
		if( this.savetimer != -1 ) {
			clearTimeout(this.savetimer);
			this.savetimer = -1;
		}
		this.savetimer = setTimeout(this.localSave.bind(this), 1500);
		this.changed = true;
	}

	appendLines(text, el, off) {
		var lines, over, offset, lineno=null;
		lines = text.split("\n");
		over = "";
		if( !el && this.text.firstChild && this.text.firstChild.nextSibling && this.text.firstChild.nextSibling.firstChild ) {
			offset = this.anchorOffset;
			lineno = this.anchorLine;
			if( text == "\n" )
				this.anchorLine++;
			//console.log("Append to " + lineno + ": " + (text=="\n" ? "newline" : text)+ " at " + offset);
		} else if( el ) {
			this.anchorOffset = offset = lineOffset(el, off);
			this.anchorLine = lineno = lineNumber(el, off, this.lines) - 1;
			//console.log("Add to " + lineno + ": " + (text=="\n" ? "newline" : text) + " at " + offset);
		} else {
			this.anchorLine = lineno = 0;
			this.anchorOffset = offset = 0;
		}

		if( this.text_lines === null ) {
			this.text_lines = text.split("\n");
			return;
		}

		var firstmodded = Infinity, lastmodded = -Infinity;

		if( lineno >= this.text_lines.length ) {
			this.text_lines.push(lines[0]);
			if( this.linter ) {
				this.linter.insertLine(lineno);
				firstmodded = Math.min(firstmodded, lineno);
				lastmodded = Math.max(lastmodded, lineno+1);
			}
		} else {
			if( this.linter ) {
				firstmodded = Math.min(firstmodded, lineno);
				lastmodded = Math.max(lastmodded, lineno);
			}
			over = this.text_lines[lineno].substring(offset);
			if( lines.length == 1 ) {
				this.text_lines[lineno] = this.text_lines[lineno].substring(0, offset) + lines[0] + over;
				over = "";
			} else {
				this.text_lines[lineno] = this.text_lines[lineno].substring(0, offset) + lines[0];
				if( lineno+1 >= this.text_lines.length )
					this.text_lines.push(over);
				else {
					this.text_lines.splice(lineno+1, 0, over);
				}
					
				if( this.linter ) {
					this.linter.insertLine(lineno+1);
					firstmodded = Math.min(firstmodded, lineno+1);
					lastmodded = Math.max(lastmodded, lineno+2);
				}
			}
		}
		
		/*if( this.linter ) {
			this.linter.retokenizelines(firstmodded, lastmodded+1);
		}*/
	}

	sectionReorganize() {

		/*
		var sect = this.text.firstChild;
		var el, count, newsect, i, elnext;

		while( sect ) {

			// ! count lines in section
			count=1;
			for( el = sect.firstChild; el; el = el.nextSibling ) {
				if( el && el.classList.contains("clr") ) {
					count++;
				}
			}

			if( count > 2 * this.section_boundary ) {
				// create new section
				newsect = document.createElement('DIV');
				newsect.className = 'section';
				// move the lines to the second section
				i = 1;
				for( el = sect.firstChild; el; el = elnext ) {
					elnext = el.nextSibling;
					if( el.classList.contains("clr") ) {
						if( i == this.section_boundary ) break;
						i++;
					}
				}
				for( ; el; el = elnext ) {
					elnext = el.nextSibling;
					el.parentNode.removeChild(el);
					newsect.appendChild(el);
				}
				insertAfter(newsect, sect);
			} else if( count > this.section_boundary ) {
				newsect = sect.nextSibling;
				if( !newsect ) {
					newsect = document.createElement('DIV');
					newsect.className = 'section';
					insertAfter(newsect, sect);
				}
				i = 1;
				for( el = sect.firstChild; el; el = elnext ) {
					elnext = el.nextSibling;
					if( el.classList.contains("clr") ) {
						if( i == this.section_boundary ) break;
						i++;
					}
				}
				for( ; el; el = elnext ) {
					elnext = el.nextSibling;
					el.parentNode.removeChild(el);
					newsect.appendChild(el);
				}
			}

			sect = sect.nextSibling;
		}
		*/
	}

	append( text ) {
		var sect = this.text.lastChild, el;
		while( sect && !sect.classList.contains("section") ) sect = sect.previousSibling;
		if( !sect ) {
			this.appendAt(text, null, 0);
		} else {
			el = sect.lastChild.firstChild;
			this.appendAt(text, el, el.textContent.length);
		}
	}

	appendAt(text, el, off) {
		var buf = "", pre, txt, range, sel = window.getSelection(), delel;
		text = text.replace(/\r/g, "");
		text = text.replace(/\t/g, "  ");

		this.saveTimer();
		let ydim = this.scanEditor();
		let elpos = el?el.parentNode.getBoundingClientRect():null;
		let psuedoel = false;
		if( el && ( elpos.bottom < ydim[0] || elpos.top > ydim[1] ) ) {
			psuedoel = true;
			if( text == "\n" ) {
				this.addLine();
				if( this.postmark == null || this.postmark.parentNode == null ) {
					console.log("Create postmark");
					this.postmark = document.createElement('pre');
					this.postmark.className = 'postmark';
					this.postmark.innerHTML = " ";
					this.postmark.style.minHeight = this.lineheight + "px";
					if( this.text.lastChild.className == "endoffile" ) {
						this.text.insertBefore(this.postmark, this.text.lastChild);
					} else {
						this.text.appendChild(this.postmark);
					}
				} else {
					this.postmark.style.minHeight = (parseInt(this.postmark.style.minHeight)+this.lineheight) + "px";
				}
				this.appendLines(text, null, 0);
				//this.anchorLine++;
				this.anchorOffset=0;
			} else {
				this.appendLines(text, null, 0);
				this.anchorOffset += text.length;
			}
			return;
		}

		if( this.sectiontimer != -1 ) 
			clearTimeout(this.sectiontimer);
		this.sectiontimer = setTimeout( this.sectionReorganize.bind(this), 3000 );

		let sect = el?el.parentNode.parentNode:null;

		if( text == "\n" ) {
			this.addLine();
			delel = false;
			if( el ) {
				if( el.parentNode.getAttribute('fake') == 1 ) {
					buf = "";
				} else {
					buf = el.textContent.substring(off);
					if( off == 0 ) delel = el.parentNode;
					else el.textContent = el.textContent.substring(0, off);
					this.changedLine(el, off);
				}
			} else {
				buf = "";
			}
			pre = document.createElement("pre");
			pre.className = 'clr';
			if( buf == "" ) {
				buf = " ";
				pre.setAttribute('fake', 1);
			}
			txt = document.createTextNode(buf);
			pre.setAttribute('p', 1);
			pre.appendChild(txt);

			if( sect ) {
				let sectline = sectionLineNumber(el, off);
				if( sectline >= this.section_boundary ) {
					var nextsect;

					if( !sect.nextSibling || sect.nextSibling.className == "endoffile" || sect.nextSibling.className == "postmark" ) {
						nextsect = document.createElement('DIV');
						nextsect.className = 'section';
						nextsect.setAttribute('lo', parseInt(sect.getAttribute('lo'))+this.section_boundary);
						nextsect.setAttribute('lc', 1);
						insertAfter(nextsect, sect);
					} else {
						nextsect = sect.nextSibling;
						nextsect.setAttribute('lc', parseInt(nextsect.getAttribute('lc'))+1);
					}

					while( el.parentNode.nextSibling ) {
						let v = el.parentNode.nextSibling;
						console.log("Shift " + v.nodeName + " " + v.className);
						el.parentNode.parentNode.removeChild(v);
						if( nextsect.firstChild )
							nextsect.insertBefore(v, nextsect.firstChild);
						else
							nextsect.appendChild(v);
					}

					if( nextsect.firstChild )
						nextsect.insertBefore(pre, nextsect.firstChild);
					else
						nextsect.appendChild(pre);
					
					el = pre.firstChild;
				} else {
					el.parentNode.parentNode.setAttribute('lc', parseInt(el.parentNode.parentNode.getAttribute('lc'))+1);
					insertAfter( pre, el.parentNode );
					el = pre.firstChild;
				}
			} else {
				if( el ) {
					el.parentNode.parentNode.setAttribute('lc', parseInt(el.parentNode.parentNode.getAttribute('lc'))+1);
					insertAfter( pre, el.parentNode );
					el = pre.firstChild;
				} else {
					sect = document.createElement("DIV");
					sect.className = "section";
					sect.setAttribute('lo', 0);
					sect.appendChild(pre);
					sect.setAttribute('lc', 1);
					this.text.appendChild(sect);
					sect.setAttribute('lo', 0);
					el = pre.firstChild;
				}
			}
			this.changedLine(el, -1);
			if( delel ) {
				console.log("Delete " + delel.nodeName + " " + delel.className);
				delel.parentNode.removeChild(delel);
				delel=false;
			}

			if( this.mode === false )
				this.mode = this.senseMode();

			this.appendLines(text, el, off);

			if( !psuedoel ) {
				range = document.createRange();
				var lineno = lineNumber(el)+1;
				el = this.getLineElement(lineno+1);
				if( el && range.setStart(el, 0) ) {
					sel.removeAllRanges();
					sel.addRange(range);
				}
			}

			this.calcEOF();
			return;
		}

		if( el ) {
			if( el.parentNode.hasAttribute('fake') ) {
				if( off > 0 ) off = 0;
				el.parentNode.removeAttribute('fake');
				if( psuedoel ) {
					el.parentNode.setAttribute('p', 1);
				} else {
					el.textContent = text;
				}
			} else {
				if( psuedoel ) {
					el.textContent = " ";
					el.parentNode.setAttribute('p', 1);
				} else {
					// remove classes except clr and last:
					if( el.parentNode.classList.contains("clr") ) {
						if( el.parentNode.classList.contains("last") ) {
							el.parentNode.className = "clr last";
						} else {
							el.parentNode.className = "clr";
						}
					} else if( el.parentNode.classList.contains("last") ) {
						el.parentNode.className = "last";
					}
					el.textContent = el.textContent.substring(0, off) + text + el.textContent.substring(off);
				}
			}			
			this.changedLine(el, off + text.length);
			range = document.createRange();
			range.setStart(el, off + text.length);
		} else {
			var span = document.createElement("DIV");
			span.className = 'section';
			span.setAttribute('lo', 0);
			span.setAttribute('lc', 1);
			off = 0;
			el = document.createElement("pre");
			el.className = 'clr';
			el.setAttribute('p', 1);

			txt = document.createTextNode(text);
			el.appendChild(txt);
			span.appendChild(el);
			var lastel = this.text.lastChild;
			if( lastel ) {
				while( lastel && lastel.nodeName == "DIV" && lastel.classList.contains("section") ) lastel = lastel.previousSibling;
				if( lastel && lastel.classList.contains("section") ) {
					var lo = parseInt(lastel.getAttribute('lo'));
					span.setAttribute('lo', lo + parseInt(lastel.getAttribute('lc')));
				}
			}
			this.text.appendChild(span);
			el = txt;
			this.changedLine(el, text.length);
			range = document.createRange();
			range.setStart(el, text.length);
		}
		if( el.textContent == "" )
			el.textContent = " ";
		if( !psuedoel && el.textContent == " " ) {
			el.textContent = ' ';
			el.parentNode.setAttribute('fake', 1);
			off = 0;
		} else if( !psuedoel && el.parentNode.getAttribute('fake') && el.textContent != " " ) {
			el.parentNode.removeAttribute('fake');
		}

		if( this.mode === false )
			this.mode = this.senseMode();

		sel.removeAllRanges();
		sel.addRange(range);

		this.appendLines(text, el, off);
		this.anchorOffset += text.length;
	}

	extractLine(lineno) {
		if( this.text.childNodes.length == 0 ) return null;
		var el, text = "";

		if( !this.text.firstChild || !this.text.firstChild.nextSibling ) return null;

		for( el = this.text.firstChild.nextSibling.firstChild; el; el = el.nextSibling ) {
			if( el.classList.contains("clr") ) {
				if( lineno == 0 ) break;
				lineno--;
			}
		}
		if( !el ) return null;
		text += el.firstChild.textContent;
		for( el = el.nextSibling; el; el = el.nextSibling ) {
			if( el.classList.contains("clr") ) break;
			text += el.firstChild.textContent;
		}
		return text;
	}

	senseMode() {
		var i, j, line, openFound=false;

		for( i=0; i<this.text.childNodes.length; i++ ) {
			line = this.extractLine(i);
			if( line === null ) return false;
			if( line == "" || line == " " ) continue;
			console.log("Extracted: '" + line + "'");
			for( j=0; j<line.length; j++ ) {
				if( line[j] == '<' ) {
					openFound=true;
				} else if( line[j] == '>' && openFound ) {
					return 'html';
				}
			}
			openFound=false;
			if( line.indexOf("function") != -1 || line.indexOf("var") != -1 || line.indexOf("const") != -1 || line.indexOf("let") != -1 || line.indexOf("import") != -1 || line.indexOf("require") != -1 ) {
				return "js";
			}
			for( j=0; j<line.length; j++ ) {
				if( line[j] == '{' || line[j] == '[' ) {
					return "js";
				} else if( line[j] == '>' && openFound ) {
					return 'js';
				}
			}
			if( this.filename.indexOf(".js") >= 0 || this.filename.indexOf(".ts") >= 0 || this.filename.indexOf(".json") >= 0 ) {
				return "js";
			}
			if( this.filename.indexOf(".html") >= 0 || this.filename.indexOf(".tpl") >= 0 ) {
				return "html";
			}
			return 'txt';
		}
		return false;
	}

	invalidateLongComment( el ) {
		var start = el;
		while( el && el.getAttribute('s') == 'longcomment' ) {
			el.removeAttribute('s');
			el = this.nextSib(el);
		}
		this.hilite( start.firstChild, 0, true );
	}

	hasNext( el ) {
		if( !el ) return false;
		return ( el.nextSibling || ( el.parentNode.nextSibling && el.parentNode.nextSibling.nodeName == "DIV" && el.parentNode.nextSibling.classList.contains("section") && el.parentNode.nextSibling.className != "postmark" && el.parentNode.nextSibling.className != "endoffile" && el.parentNode.nextSibling.className != "premark" &&  el.parentNode.nextSibling.firstChild ) );
	}
	hasPrev( el ) {
		if( !el ) return false;
		return ( el.previousSibling || ( el.parentNode.previousSibling && el.parentNode.previousSibling.nodeName == "DIV" && el.parentNode.previousSibling.classList.contains("section") && el.parentNode.previousSibling.className != "postmark" && el.parentNode.previousSibling.className != "endoffile" && el.parentNode.previousSibling.className != "premark" && el.parentNode.previousSibling.lastChild ) );
	}

	nextSib( el ) {
		if( !el ) return null;
		if( !el.nextSibling && el.parentNode.nextSibling && el.parentNode.nextSibling.nodeName == "DIV" && el.parentNode.nextSibling.classList.contains("section") && el.parentNode.nextSibling.className != "postmark" && el.parentNode.nextSibling.className != "endoffile" && el.parentNode.nextSibling.className != "premark"  ) {
			return el.parentNode.nextSibling.firstChild;
		}
		return el.nextSibling;
	}
	prevSib( el ) {
		if( !el ) return null;
		if( !el.previousSibling && el.parentNode.previousSibling && el.parentNode.previousSibling.nodeName == "DIV" && el.parentNode.previousSibling.classList.contains("section") && el.parentNode.previousSibling.className != "postmark" && el.parentNode.previousSibling.className != "endoffile" && el.parentNode.previousSibling.className != "premark" ) {
			return el.parentNode.previousSibling.lastChild;
		}
		return el.previousSibling;
	}

	validateLongComment( el ) {
		var start = el;
		while( el && el.getAttribute('s') == 'longcomment' ) {
			if( !this.hasPrev(el) ) {
				this.invalidateLongComment( el );
				return false;
			}
			el = this.prevSib(el);
		}
		el = this.nextSib(el);
		if( el.firstChild.textContent == "/" && this.hasNext(el) && this.nextSib(el).firstChild.textContent == "*" ) {
			return true;
		}
		this.invalidateLongComment( el );
		return false;
	}

	hiliteWord( el ) {
		var prev = this.prevSib(el.parentNode);

		let state = el.parentNode.getAttribute('s');
		if( el.parentNode.classList.contains("clr") ) {
			if( el.parentNode.classList.contains("last") ) {
				el.parentNode.className = "clr last";
			} else {
				el.parentNode.className = "clr";
			}
		} else if( el.parentNode.classList.contains("last") ) {
			el.parentNode.className = "last";
		} else {
			el.parentNode.className = "";
		}
		let next = this.nextSib(el.parentNode);
		
		if( !next || next.classList.contains("clr") ) {
			//el.parentNode.style.width = (getRealWidth(this.text) - (60 + lineWidth(el, 0))) + "px";
			el.parentNode.classList.add('last');
		} else if( el.parentNode.style.width ) {
			el.parentNode.style.removeProperty('width');
		}
		if( prev && prev.classList.contains('last') ) {
			if( !el.parentNode.classList.contains('clr') ) {
				prev.classList.remove('last');
				prev.style.removeProperty('width');
			}
		}
		
		switch( state ) {
			case 'markup':
				el.parentNode.classList.add('markup');
				break;
			case 'literal1': case 'literal2': case 'literal3': case 'literal':
				el.parentNode.classList.add('literal');
				break;
			case 'regex':
				el.parentNode.classList.add("regexp");
				break;
			case 'tag':
				el.parentNode.classList.add('tag');
				break;
			case 'property':
				el.parentNode.classList.add('property');
				break;
			case 'value':
				el.parentNode.classList.add('value');
				break;
			case 'html':
				el.parentNode.classList.add('html');
				break;
			case 'comment': case 'longcomment':
				el.parentNode.classList.add('comment');
				break;
			case 'number':
				el.parentNode.classList.add('number');
				break;
			case 'keyword':
				el.parentNode.classList.add('keyword');
				break;
			case 'op':
				el.parentNode.classList.add('op');
				break;
			case 'txt':
				el.parentNode.classList.add('txt');
				break;
			default:
				el.parentNode.classList.add('word');
				break;
		}
	}

	selchange() {
		var sel = window.getSelection();

		console.log("selchange");

		var rv, erv;
		rv = getSelNode(sel.anchorNode, sel.anchorOffset);
		erv = getSelNode(sel.focusNode, sel.focusOffset);

		if( !rv || !erv ) return;

		// store anchor line and offset.
		/*
		this.anchorLine = lineNumber(rv[0], rv[1], this.lines);
		this.anchorOffset = lineOffset(rv[0], rv[1]);
		*/

		var el, found = false, reverse;

		for( el=rv[0].parentNode; el; el = this.nextSib(el) ) {
			if( el.childNodes[0] == erv[0] ) {
				found = true;
				break;
			}
		}

		if( !found ) { // reverse direction
			reverse=true;
			[rv,erv] = [erv,rv];		
		} else {
			reverse=false;
		}

		if( erv[0].className == "endoffile" ) {
			erv[1] = 0;
		}

		if( rv[0].className == "endoffile" ) {
			rv[1] = 0;
		}

		if( rv[0].parentNode.getAttribute('fake') == 1 && rv[1] > 0 ) {
			rv[1] = 0;
		}
		if( erv[0].parentNode.getAttribute('fake') == 1 && erv[1] > 0 ) {
			erv[1] = 0;
		}
		if( reverse ) {
			sel.setBaseAndExtent( rv[0], rv[1], erv[0], erv[1] );
		} else {
			sel.setBaseAndExtent( erv[0], erv[1], rv[0], rv[1] );
		}
	}

	copy(e) {
		var sel = window.getSelection();
		var rv = getSelNode(sel.anchorNode, sel.anchorOffset);
		var erv = getSelNode(sel.focusNode, sel.focusOffset);
		if(  !erv || !rv ) return;

		var focusLine, focusOffset;
		focusLine = lineNumber(erv[0], erv[1]);
		focusOffset = lineOffset(erv[0], erv[1]);
		var anchorLine, anchorOffset;
		anchorLine = lineNumber(rv[0], rv[1]);
		anchorOffset = lineOffset(rv[0], rv[1]);

		var firstLine, firstOffset, lastLine, lastOffset;
		if( focusLine < anchorLine || ( focusLine == anchorLine && focusOffset < anchorOffset ) ) {
			firstLine = focusLine;
			firstOffset = focusOffset;
			lastLine = anchorLine;
			lastOffset = anchorOffset;
		} else {
			firstLine = anchorLine;
			firstOffset = anchorOffset;
			lastLine = focusLine;
			lastOffset = focusOffset;
		}

		var selected_text = "";
		var lineno;

		for( lineno = firstLine; lineno <= lastLine; lineno++ ) {
			if( lineno == firstLine ) {
				if( lineno == lastLine ) {
					selected_text += this.text_lines[lineno-1].substring(firstOffset, lastOffset);
					break;
				} else {
					selected_text += this.text_lines[lineno-1].substring(firstOffset) + "\n";
				}
			} else if( lineno == lastLine ) {
				selected_text += this.text_lines[lineno-1].substring(0, lastOffset);
				break;
			} else {
				selected_text += this.text_lines[lineno-1] + "\n";
			}
		}

		e.clipboardData.setData('text/plain', selected_text);
		e.preventDefault();
	}

	paste(e) {
		e.preventDefault();
		let text = e.clipboardData.getData("text/plain");
		let sel = window.getSelection();
		if( !sel.isCollapsed ) {
			sel.deleteFromDocument();
		}

		let lines = text.split("\n");
		var i;

		var rv, el, off;

		var lineno = lineNumber(sel.focusNode);
		var offset = lineOffset(sel.focusNode, sel.focusOffset);

		this.recordAction("add", text, lineno, offset);

		for( i=0; i<lines.length; i++ ) {
			text = lines[i].replace(/\r/g, '');
			rv = getSelNode(sel.focusNode, sel.focusOffset);
			if( !rv ) break;
			[el,off] = rv;
			this.appendAt(lines[i], el, off);
			if( i+1 != lines.length ) {
				rv = getSelNode(sel.focusNode, sel.focusOffset);
				if( !rv ) break;
				[el,off] = rv;
				this.appendAt("\n", el, off);
			}
		}
		this.countLines();
		return;
	}

	deleteSelection() {
		var sel = window.getSelection();
		var rv = getSelNode(sel.anchorNode, sel.anchorOffset);
		var erv = getSelNode(sel.focusNode, sel.focusOffset);
		if(  !erv || !rv ) return;

		var focusLine, focusOffset;
		focusLine = lineNumber(erv[0], erv[1]);
		focusOffset = lineOffset(erv[0], erv[1]);
		var anchorLine, anchorOffset;
		anchorLine = lineNumber(rv[0], rv[1]);
		anchorOffset = lineOffset(rv[0], rv[1]);

		sel.collapseToEnd();

		var firstLine, firstOffset, lastLine, lastOffset;
		if( focusLine < anchorLine || ( focusLine == anchorLine && focusOffset < anchorOffset ) ) {
			firstLine = focusLine;
			firstOffset = focusOffset;
			lastLine = anchorLine;
			lastOffset = anchorOffset;
		} else {
			firstLine = anchorLine;
			firstOffset = anchorOffset;
			lastLine = focusLine;
			lastOffset = focusOffset;
		}

		console.log("Delete lines " + firstLine + "," + firstOffset + "-" + lastLine + "," + lastOffset);

		var selected_text = "";

		for( lineno = firstLine; lineno <= lastLine; lineno++ ) {
			if( lineno == firstLine ) {
				if( lineno == lastLine ) {
					selected_text += this.text_lines[lineno-1].substring(firstOffset, lastOffset);
					break;
				} else {
					selected_text += this.text_lines[lineno-1].substring(firstOffset) + "\n";
				}
			} else if( lineno == lastLine ) {
				selected_text += this.text_lines[lineno-1].substring(0, lastOffset);
				break;
			} else {
				selected_text += this.text_lines[lineno-1] + "\n";
			}
		}

		this.recordAction("del", selected_text, firstLine, firstOffset);

		var lineno, el, off, endel, next;

		for( lineno = firstLine; lineno <= lastLine; lineno++ ) {
			if( lineno == firstLine ) {
				if( lineno == lastLine ) {
					this.text_lines[lineno-1] = this.text_lines[lineno-1].substring(0, firstOffset) + this.text_lines[lineno-1].substring(lastOffset);
				} else {
					this.text_lines[lineno-1] = this.text_lines[lineno-1].substring(0, firstOffset);
				}
				if( this.linter ) this.linter.blankLine(lineno);

			} else if( lineno == lastLine ) {
				this.text_lines[lineno-2] += this.text_lines[lineno-1].substring(lastOffset);
				console.log("Append text: " + this.text_lines[lineno-1].substring(lastOffset));

				if( this.linter ) this.linter.removeLine(lineno-1);
				this.removeLine(lineno);
				lineno--;
				lastLine--;
			} else {
				if( this.linter ) this.linter.removeLine(lineno-1);
				this.removeLine(lineno);
				lineno--;
				lastLine--;
			}
		}
		if( this.linter ) this.linter.retokenizelines(firstLine, firstLine+1);
		else this.redrawLines(firstLine, firstLine+1);

		var range = document.createRange();
		[el,off] = this.getOffsetElement(firstLine, firstOffset);
		if( !el ) {
			console.log("Cannot determine end of selection");
			return;
		}
		range.setStart(el, off);
		var sel = window.getSelection();
		sel.removeAllRanges();
		sel.addRange(range);
	}

	recordAction(act, arg, lineno, lineoff) {
		var action = {
			lineno: lineno,
			lineoff: lineoff,
			cmd: act,
			arg: arg
		};
		if( this.history.length > this.histptr )
			this.history.length = this.histptr;
		this.history.push(action);
		this.histptr++;
	}

	undo(actno) {
		var action = this.history[actno];
		var i, el, off, lineno, offlen;

		console.log("undo("+actno+"): ", action);

		if( action.cmd == 'del' ) {
			var text = action.arg;
			var lines = text.split('\n');
			offlen = action.lineoff;
			off = action.lineoff;
			lineno = action.lineno;

			for( i=0; i<lines.length; i++, lineno++ ) {
				[el,off] = this.getOffsetElement(lineno, offlen);
				if( lines[i].length != 0 ) {
					this.appendAt( lines[i], el, off );
					[el,off] = this.getOffsetElement(lineno, offlen+lines[i].length);
				}

				if( i != lines.length-1 ) {
					this.appendAt( '\n', el, off );
				}
				offlen = 0;
			}

			if( this.linter ) {
				this.linter.retokenizelines(action.lineno, action.lineno+lines.length);
			} else {
				this.redrawLines( action.lineno, action.lineno+lines.length );
			}
			
		} else if( action.cmd == "add" ) {
			var len = action.arg.length;
			lineno = action.lineno-1;
			offlen = action.lineoff;

			console.log("Delete " + len + " chars at " + lineno + "," + offlen);

			while( len > 0 ) {
				if( this.text_lines[lineno].length >= offlen+len ) {
					this.text_lines[lineno] = this.text_lines[lineno].substring(0, offlen) + this.text_lines[lineno].substring(offlen+len);
					if( this.linter ) this.linter.blankLine(lineno+1);
					offlen=0;
					len=0;
					break;
				} else {
					if( len > this.text_lines[lineno].length ) {
						len -= this.text_lines[lineno].length+1;
						this.removeLine(lineno+1);
						if( this.linter ) this.linter.removeLine(lineno);
						lineno--;
					} else {
						this.text_lines[lineno] = this.text_lines[lineno].substring(len);
						if( this.linter ) this.linter.blankLine(lineno+1);
						len = 0;
					}
				}
				lineno++;
			}
			if( this.linter ) {
				this.linter.retokenizelines(action.lineno, lineno+1);
			} else {
				this.redrawLines( action.lineno, lineno+1 );
			}
			var range = document.createRange();
			[el,off] = this.getOffsetElement(action.lineno, action.lineoff);
			if( !el ) {
				console.log("Cannot determine end of selection");
				return;
			}
			range.setStart(el, off);
			var sel = window.getSelection();
			sel.removeAllRanges();
			sel.addRange(range);
		}
	}
	redo(actno) {
		var action = this.history[actno];
		var el, off, lineno, offlen;
		console.log("redo("+actno+"):", action);

		if( action.cmd == 'del' ) {
			var len = action.arg.length;
			offlen = action.lineoff;
			lineno = action.lineno - 1;

			while( len > 0 ) {
				if( this.text_lines[lineno].length >= offlen+len ) {
					this.text_lines[lineno] = this.text_lines[lineno].substring(0, offlen) + this.text_lines[lineno].substring(offlen+len);
					if( this.linter ) this.linter.blankLine(lineno+1);
					offlen=0;
					len=0;
					break;
				} else {
					if( len >= this.text_lines[lineno].length ) {
						len -= this.text_lines[lineno].length+1;
						this.removeLine(lineno+1);
						if( this.linter ) this.linter.removeLine(lineno);
						lineno--;
					} else {
						this.text_lines[lineno] = this.text_lines[lineno].substring(len);
						if( this.linter ) this.linter.blankLine(lineno+1);
						len = 0;
					}
				}
				lineno++;
			}
			if( this.linter ) {
				this.linter.retokenizelines(action.lineno, lineno+1);
			} else {
				this.redrawLines( action.lineno, lineno+1 );
			}
			var range = document.createRange();
			[el,off] = this.getOffsetElement(action.lineno, action.lineoff);
			if( !el ) {
				console.log("Cannot determine end of selection");
				return;
			}
			range.setStart(el, off);
			var sel = window.getSelection();
			sel.removeAllRanges();
			sel.addRange(range);
		} else if( action.cmd == "add" ) {
			var text = action.arg;
			var lines = text.split('\n');
			var i;
			lineno = action.lineno;

			for( i=0; i<lines.length; i++, lineno++ ) {
				[el,off] = this.getOffsetElement(lineno, action.lineoff);
				if( lines[i].length > 0 ) {
					this.appendAt( lines[i], el, off );
					[el,off] = this.getOffsetElement(lineno, action.lineoff + lines[i].length );
				}
				if( i != lines.length-1 ) {
					this.appendAt( "\n", el, off );
				}
			}
			if( this.linter ) {
				this.linter.retokenizelines(action.lineno, action.lineno+lines.length);
			} else {
				this.redrawLines( action.lineno, action.lineno+lines.length );
			}
		}
	}
	rewind() {
		this.histptr--;
		this.undo( this.histptr );
	}
	replay() {
		console.log("replay("+this.histptr+")");
		if( this.histptr < this.history.length ) {
			this.redo( this.histptr );
			this.histptr++;
		}
	}

	keydn(e) {
		var sel, el, off, buf, range, x, y;
		var reverse, single, rv, next;
		var lineno, lineoff;

		if( e.altKey ) return;

		if( this.typecb !== false ) {
			if( !this.typecb(e.key,e) ) return;
		}

		switch( e.key ) {
			case 'Tab':
				this.saveTimer();
				sel = window.getSelection();
				if( e.shiftKey ) {
					e.preventDefault();
					this.deindentText();
					return;
				}
				if( sel.isCollapsed ) {
					let rv = getSelNode(sel.focusNode, sel.focusOffset);
					if( rv === false ) return;
					[el,off] = rv;
					if( off == 0 && el.parentNode.className == 'clr' ) {
						e.preventDefault();
						this.indentText();
					} else {
						if( el.parentNode.getAttribute('fake') == 1 ) {
							off = 0;
							el.textContent = "\t";
							el.parentNode.removeAttribute('fake');
						} else {
							el.textContent = el.textContent.substring(0,off) + "\t" + el.textContent.substring(off);
						}

						range = document.createRange();
						range.setStart(el, off+1);
						sel.removeAllRanges();
						sel.addRange(range);
					}
				} else {
					e.preventDefault();
					this.indentText();
				}

				return;
			case 'Home':
				sel = window.getSelection();
				e.preventDefault();
				reverse = false; single = true;
				if( e.shiftKey ) {
					single = false;
				}
				this.charHome(sel, reverse, single);
				break;
			case 'End':
				console.log("(end)");
				sel = window.getSelection();
				e.preventDefault();
				reverse = false; single = true;
				if( e.shiftKey ) {
					single = false;
				}
				this.charEnd(sel, reverse, single);
				break;
			case 'ArrowDown': case 'ArrowRight': case 'ArrowLeft': case 'ArrowUp':
				x=0;
				y=0;
				switch( e.key ) {
					case 'ArrowDown': y=1; break;
					case 'ArrowUp': y=-1; break;
					case 'ArrowRight': x=1; break;
					case 'ArrowLeft': x=-1; break;
				}
				sel = window.getSelection();
				e.preventDefault();
				reverse = false; single = true;
				if( e.shiftKey ) {
					single = false;
					reverse = true;
				}
				if( x == 1 ) {
					this.charRight(sel, reverse, single);
				} else if( x == -1 ) {
					this.charLeft(sel, reverse, single);
				} else if( y == 1 ) {
					this.charDown(sel, reverse, single);
				} else if( y == -1 ) {
					this.charUp(sel, reverse, single);
				}

				break;
			default:
				if( e.key.length > 1 ) {
					console.log("Ignore " + e.key);
					break;
				}
				e.preventDefault();
				sel = window.getSelection();


				if( e.key == 'z' && e.ctrlKey ) {
					this.rewind();
					return;
				} else if( ( e.key == 'y' ) && e.ctrlKey ) {
					this.replay();
					return;
				}
				if( e.ctrlKey ) {
					return;
				}
				if( !sel.isCollapsed ) {
					this.deleteSelection();
					this.countLines();
				}
				rv = getSelNode(sel.focusNode, sel.focusOffset);
				if( !rv ) break;
				[el,off] = rv;

				lineno = lineNumber(el, off);
				lineoff = lineOffset(el, off);
				this.appendAt( e.key, el, off );
				this.recordAction( 'add', e.key, lineno, lineoff );
				return;
			case 'Delete':
				this.saveTimer();
				e.preventDefault();
				sel = window.getSelection();
				if( !sel.isCollapsed ) {
					this.deleteSelection();
					this.countLines();
					return;
				}
				rv = getSelNode(sel.focusNode, sel.focusOffset);
				if( !rv ) break;
				[el,off] = rv;
				lineno = lineNumber(el, off) - 1;
				lineoff = lineOffset(el, off);
				this.recordAction( 'del', this.text_lines[lineno][lineoff], lineno+1, lineoff );
				if( lineno == this.text_lines.length ) return;
				if( lineoff == this.text_lines[lineno].length ) {
					this.text_lines[lineno] = this.text_lines[lineno] + this.text_lines[lineno+1];
					this.removeLine(lineno+2);
					console.log("Delete at end of line");
					if( this.linter ) {
						this.linter.removeLine(lineno+2);
						this.linter.retokenizelines(lineno+1, lineno+2);
					} else {
						this.redrawLines(lineno+1, lineno+2);
					}
					[el,off] = this.getOffsetElement(lineno+1, lineoff);
					range = document.createRange();
					range.setStart(el, off);
					sel.removeAllRanges();
					sel.addRange(range);
					return;
				}
				this.text_lines[lineno] = this.text_lines[lineno].substring(0,lineoff) + this.text_lines[lineno].substring(lineoff+1);
				if( this.linter ) {
					this.linter.blankLine(lineno+1);
					this.linter.retokenizelines(lineno+1, lineno+1);
				} else {
					this.redrawLines( lineno+1, lineno+1 );
				}
				[el,off] = this.getOffsetElement(lineno+1, lineoff);
				range = document.createRange();
				range.setStart(el, off);
				sel.removeAllRanges();
				sel.addRange(range);
				break;
			case 'Backspace':
				this.saveTimer();
				e.preventDefault();
				sel = window.getSelection();
				if( !sel.isCollapsed ) {
					this.deleteSelection();
					this.countLines();
					return;
				}
				if( !sel.isCollapsed ) {
					this.deleteSelection();
					this.countLines();
					return;
				}
				rv = getSelNode(sel.focusNode, sel.focusOffset);
				if( !rv ) break;
				[el,off] = rv;
				lineno = lineNumber(el, off) - 1;
				lineoff = lineOffset(el, off) - 1;
				if( lineoff == -1 ) {
					lineno --;
					lineoff = this.text_lines[lineno].length;
				}
				this.recordAction( 'del', this.text_lines[lineno][lineoff], lineno+1, lineoff );
				if( lineno == this.text_lines.length ) return;
				if( lineoff == this.text_lines[lineno].length ) {
					this.text_lines[lineno] = this.text_lines[lineno] + this.text_lines[lineno+1];
					this.removeLine(lineno+2);
					console.log("Delete at end of line");
					if( this.linter ) {
						this.linter.removeLine(lineno+1);
						this.linter.retokenizelines(lineno+1, lineno+2);
					} else {
						this.redrawLines(lineno+1, lineno+2);
					}
					[el,off] = this.getOffsetElement(lineno+1, lineoff);
					range = document.createRange();
					range.setStart(el, off);
					sel.removeAllRanges();
					sel.addRange(range);
					return;
				}
				this.text_lines[lineno] = this.text_lines[lineno].substring(0,lineoff) + this.text_lines[lineno].substring(lineoff+1);
				if( this.linter ) {
					this.linter.blankLine(lineno+1);
					this.linter.retokenizelines(lineno+1, lineno+1);
				} else {
					this.redrawLines( lineno+1, lineno+1 );
				}
				[el,off] = this.getOffsetElement(lineno+1, lineoff);
				range = document.createRange();
				range.setStart(el, off);
				sel.removeAllRanges();
				sel.addRange(range);
				break;
			case 'Enter':
				e.preventDefault();
				sel = window.getSelection();
				if( !sel.isCollapsed ) {
					this.deleteSelection();
					this.countLines();
				}
				rv = getSelNode(sel.focusNode, sel.focusOffset);
				if( !rv ) return;
				[el,off] = rv;

				lineno = lineNumber(el, off);
				lineoff = lineOffset(el, off);
				this.appendAt("\n", el, off);
				this.recordAction( 'add', "\n", lineno, lineoff );
				setTimeout( this.charRight.bind(this,sel,false,true), 0 );
				//this.charRight(sel, false, true);
				break;
		}
	}

	changedLine(el, off) {
		if( !this.record_changes ) return;

		let lineno = lineNumber(el, 0);
		var realoff;
		if( off == -1 )
			realoff = -1;
		else
			realoff = lineOffset(el, off);
		this.changed_lines.add(lineno + "," + realoff);

		if( this.change_timer != -1 ) {
			clearTimeout(this.change_timer);
		}
		this.change_timer = setTimeout( this.updateLines.bind(this), 0 );
	}

	redrawLines(startLine, endLine) {
		var lineno;

		for( lineno=startLine-1; lineno<endLine; lineno++ ) {
			var el = this.getLineElement(lineno+1);
			if( !el ) continue;
			if( this.linter.lineptrs[lineno] != null && ( this.linter.lineptrs[lineno].t != "empty" ) ) {
				var endnum = lineno+1;
				this.drawTokensAt(el, this.linter.lineptrs[lineno], endnum<this.linter.lineptrs.length ? this.linter.lineptrs[endnum] : null );
			} else {
				el.innerHTML = " ";
				el.setAttribute('fake', 1);
				this.lineends.push( el.firstChild );
				var next = this.nextSib(el);
				while( next && !next.classList.contains("clr") ) {
					el = next;
					next = this.nextSib(el);
					if( !el || el.classList.contains("clr") ) break;
					el.parentNode.removeChild(el);
				}
			}
		}
	}

	updateLines() {
		var i, lines = this.changed_lines.entries();

		this.change_timer = -1;
		if( !this.linter ) {
			this.changed_lines.clear();
			return;
		}
		var lastel=null, lastoff;

		for( i of lines ) {
			var lineno, off;
			[lineno,off] = i[0].split(",");
			lineno = parseInt(lineno)-1;
			off = parseInt(off);
			
			let endnum = lineno+1;
			for( endnum = lineno; endnum < this.linter.lineptrs.length && !this.linter.lineptrs[endnum]; endnum++ );
			this.linter.retokenizelines(lineno, endnum);
			var el = this.getLineElement(lineno+1);
			if( this.linter.lineptrs[lineno] != null && this.linter.lineptrs[lineno].t != "empty" ) {
				//this.drawTokensAt(el, this.linter.lineptrs[lineno], endnum<this.linter.lineptrs.length ? this.linter.lineptrs[endnum] : null );
				if( off != -1 ) {
					[lastel,lastoff] = [lineno+1,off];// this.getOffsetElement(lineno+1, off);
				}
			} else {
				el.innerHTML = " ";
				el.setAttribute('fake', 1);
				if( off != -1 ) {
					[lastel,lastoff] = [lineno+1,off];//this.getOffsetElement(lineno+1, off);
				}
				this.lineends.push( el.firstChild );
			}

		}
		if( lastel != null ) {
			[lastel,lastoff] = this.getOffsetElement(lastel, lastoff);
			if( lastel ) {
				var range = document.createRange();
				range.setStart(lastel, lastoff);
				var sel = window.getSelection();
				sel.removeAllRanges();
				sel.addRange(range);
			}
		}
		this.changed_lines.clear();
		this.adjustEnds();
		return;
	}

	keyup(ev) {
		if (ev.key == 'Tab') {
			ev.preventDefault();
		}
		this.countLines();
	}

	countLines()
	{
		console.log("countLines");
		let lines = this.text_lines.length+1;
		let count = 1;
		let buf = "";
		while( lines >= count ) {
			if( count%this.section_boundary == 1 ) {
				if( buf == "" )
					buf = "<DIV class=section lo=0>";
				else
					buf += "</DIV><DIV class=section lo=" + count + ">";
			}
			buf = buf + "<pre class=cl style='width: 100%'>" + count + "</pre>";
			count++;
		}
		this.lines.innerHTML = buf;
	}
	getLineSection(lineno)
	{
		var el = this.line.firstChild;
		if( !el ) return null;
		while( el ) {
			if( el.getAttribute('lo') + this.section_boundary > lineno ) {
				return el;
			}
		}
		return null;
	}

	removeLine(lineno, lineoff)
	{
		if( this.lines.lastChild ) {
			while( !this.lines.lastChild.lastChild ) {
				this.lines.removeChild(this.lines.lastChild);
			}
			this.lines.lastChild.removeChild(this.lines.lastChild.lastChild);
		}

		if( lineno == 0 || lineno-1 >= this.text_lines.length ) return;

		this.text_lines.splice(lineno-1, 1);

		var el, endel;
		el = this.getLineElement(lineno);
		endel = this.getLineElement(lineno+1);

		while( el && el != endel ) {
			var next = el.nextSibling;
			el.parentNode.removeChild(el);
			el = next;
		}
	}

	addLine()
	{
		let lastsect = this.lines.lastChild;
		if( !lastsect ) {
			this.countLines();
			return;
		}
		let count = lastsect.getAttribute('lo') + lastsect.childElementCount;
		if( lastsect.childElementCount == this.section_boundary ) {
			lastsect = document.createElement('DIV');
			lastsect.className = 'section';
			lastsect.setAttribute('lo', count);
			this.lines.appendChild(lastsect);
		}
		let pre = document.createElement('pre');
		pre.className = 'cl';
		pre.style.width = '100%';
		let txt = document.createTextNode(count);
		pre.appendChild(txt);
		lastsect.appendChild(pre);
	}

	charHome(sel, moveAnchor=false, moveSingle=true)
	{
		var currentchar = lineOffset(moveAnchor?sel.anchorNode:sel.focusNode, moveAnchor?sel.anchorOffset:sel.focusOffset);
		let previouschar = currentchar;
		var thischar;
		
		do {
			if( !this.charLeft(sel, moveAnchor, moveSingle) ) return;
			thischar = lineOffset(moveAnchor?sel.anchorNode:sel.focusNode, moveAnchor?sel.anchorOffset:sel.focusOffset);
			if( thischar >= previouschar ) {
				this.charRight(sel, moveAnchor, moveSingle);
				break;
			}
			if( thischar == 0 ) break;
			previouschar = thischar;
		} while( true );
	}

	charEnd(sel, moveAnchor=false, moveSingle=true)
	{
		var currentchar = lineOffset(moveAnchor?sel.anchorNode:sel.focusNode, moveAnchor?sel.anchorOffset:sel.focusOffset);
		let previouschar = currentchar;
		var thischar;

		do {
			if( !this.charRight(sel, moveAnchor, moveSingle) ) return;
			thischar = lineOffset(moveAnchor?sel.anchorNode:sel.focusNode, moveAnchor?sel.anchorOffset:sel.focusOffset);
			if( thischar <= previouschar ) break;
			previouschar = thischar;
		} while( true );

		this.charLeft(sel, moveAnchor, moveSingle);
	}
	
	charRight(sel, moveAnchor=false, moveSingle=true)
	{
		var el, off;
		var rv = getSelNode(moveAnchor?sel.anchorNode:sel.focusNode, moveAnchor?sel.anchorOffset:sel.focusOffset);
		if( !rv ) return false;
		[el,off] = rv;

		if( off == el.textContent.length ) {
			if( !this.hasNext(el.parentNode) ) return false;
			if( el.parentNode == this.text.lastChild ) return false;
			el = this.nextSib(el.parentNode);
			if( el ) el = el.firstChild;
			if( el.parentNode.hasAttribute('fake') )
				off = 0;
			else
				off = 1;
		} else if( el.parentNode.hasAttribute('fake') ) {
			if( !this.hasNext(el.parentNode ) ) return false
			el = this.nextSib(el.parentNode);
			if( el ) el = el.firstChild;
			off = 0;
		} else {
			off++;
		}

		if( moveSingle ) {
			sel.setBaseAndExtent(el, off, el, off);
		} else if( moveAnchor ) {
			sel.setBaseAndExtent(el, off, sel.focusNode, sel.focusOffset);
		} else {
			sel.setBaseAndExtent(sel.anchorNode, sel.anchorOffset, el, off);
		}

		return true;
	}
	charLeft(sel, moveAnchor=false, moveSingle=true)
	{
		var el, off;
		var rv = getSelNode(moveAnchor?sel.anchorNode:sel.focusNode, moveAnchor?sel.anchorOffset:sel.focusOffset);
		if( !rv ) return false;
		[el,off] = rv;
		var iscl;

		if( off == 0 ) {
			if( !this.hasPrev(el.parentNode) ) return false;
			iscl = ( el.parentNode.classList.contains('clr') );
			el = this.prevSib(el.parentNode);
			if( el ) el = el.firstChild;
			off = el.textContent.length + (iscl ? 0 : -1);
		} else {
			off--;
		}
		if( el.parentNode.hasAttribute('fake') ) {
			off = 0;
		}

		if( moveSingle ) {
			sel.setBaseAndExtent(el, off, el, off);
		} else if( moveAnchor ) {
			sel.setBaseAndExtent(el, off, sel.focusNode, sel.focusOffset);
		} else {
			sel.setBaseAndExtent(sel.anchorNode, sel.anchorOffset, el, off);
		}
	
		return true;
	}
	
	charDown(sel, moveAnchor=false, moveSingle=true)
	{

		var currentchar = lineOffset(moveAnchor?sel.anchorNode:sel.focusNode, moveAnchor?sel.anchorOffset:sel.focusOffset);
		let previouschar = currentchar;
		var thischar, el, off;

		if( moveAnchor ) {
			[el,off] = getSelNode(sel.anchorNode, sel.anchorOffset);
		} else {
			[el,off] = getSelNode(sel.focusNode, sel.focusOffset);
		}

		if( this.eolindicator != null && ( el.parentNode.getAttribute('fake') == 1 || el.textContent.length == off ) && ( !this.hasNext(el.parentNode) || this.nextSib(el.parentNode).classList.contains('clr') ) ) {
			// we are at end of line
			// use previous EOL indicator
			currentchar = this.eolindicator;
		} else {
			this.eolindicator = currentchar;
		}
		

		do {
			if( !this.charRight(sel, moveAnchor, moveSingle) ) break;
			thischar = lineOffset(moveAnchor?sel.anchorNode:sel.focusNode, moveAnchor?sel.anchorOffset:sel.focusOffset);
			if( thischar <= previouschar ) break;
			previouschar = thischar;
		} while( true );
		if( currentchar == 0 ) {
			if( thischar == 0 ) return;
		}
		previouschar = thischar;
		do {
			if( !this.charRight(sel, moveAnchor, moveSingle) ) break;
			thischar = lineOffset(moveAnchor?sel.anchorNode:sel.focusNode, moveAnchor?sel.anchorOffset:sel.focusOffset);
			if( thischar <= previouschar ) { 
				this.charLeft(sel, moveAnchor, moveSingle);
				break;
			}
			previouschar = thischar;
		} while( thischar != currentchar );
	}
	charUp(sel, moveAnchor=false, moveSingle=true)
	{
		var currentchar = lineOffset(moveAnchor?sel.anchorNode:sel.focusNode, moveAnchor?sel.anchorOffset:sel.focusOffset);
		let previouschar = currentchar;
		var thischar, el, off;

		if( moveAnchor ) {
			[el,off] = getSelNode(sel.anchorNode, sel.anchorOffset);
		} else {
			[el,off] = getSelNode(sel.focusNode, sel.focusOffset);
		}

		if( this.eolindicator != null && ( el.parentNode.getAttribute('fake') == 1 || el.textContent.length == off ) && ( !this.hasNext(el.parentNode) || this.nextSib(el.parentNode).classList.contains('clr') ) ) {
			// we are at end of line
			// use previous EOL indicator
			currentchar = this.eolindicator;
		} else {
			this.eolindicator = currentchar;
		}
		
		do {
			if( !this.charLeft(sel, moveAnchor, moveSingle) ) return;
			thischar = lineOffset(moveAnchor?sel.anchorNode:sel.focusNode, moveAnchor?sel.anchorOffset:sel.focusOffset);
			if( thischar >= previouschar || thischar == 0 ) break;
			previouschar = thischar;
		} while( true );

		console.log("currentchar: " + currentchar + " thischar: " + thischar);
		console.log(sel.focusNode, sel.focusOffset);
		if( thischar == 0 ) {
			if( currentchar == 0 ) return;
			if( !this.charLeft(sel, moveAnchor, moveSingle) ) return;
			thischar = lineOffset(moveAnchor?sel.anchorNode:sel.focusNode, moveAnchor?sel.anchorOffset:sel.focusOffset);
		}
		previouschar = thischar;
		do {
			if( !this.charLeft(sel, moveAnchor, moveSingle) ) return;
			console.log("two", sel.focusNode, sel.focusOffset);
			thischar = lineOffset(moveAnchor?sel.anchorNode:sel.focusNode, moveAnchor?sel.anchorOffset:sel.focusOffset);
			if( thischar >= previouschar ) { 
				this.charRight(sel, moveAnchor, moveSingle);
				return;
			}
			previouschar = thischar;
		} while( thischar > currentchar );

		console.log("2currentchar: " + currentchar + " thischar: " + thischar);
	}
	indentText()
	{
		let lines = getSelectionLines(window.getSelection());
		var i, beginning = true;

		for( i=0; i<lines.length; i++ ) {
			if( typeof lines[i] == 'undefined' ) continue;
			if( lines[i] === 0 ) {
				beginning=true;
				continue;
			}
			if( beginning ) {
				if( lines[i].parentNode.getAttribute('fake') == 1 ) {
					lines[i].parentNode.removeAttribute('fake');
					lines[i].textContent = "\t";
				} else {
					lines[i].textContent = "\t" + lines[i].textContent;
				}
				beginning=false;
			}
		}

		return;
	}

	deindentText()
	{
		let lines = getSelectionLines(window.getSelection());
		var i, beginning = true;

		for( i=0; i<lines.length; i++ ) {
			if( lines[i] === 0 ) {
				beginning=true;
				continue;
			}
			if( typeof lines[i] == 'undefined' ) continue;
			if( beginning ) {
				if( lines[i].textContent[0] == "\t" ) {
					lines[i].textContent = lines[i].textContent.substring(1);
				} else if( lines[i].textContent.length >= 4 && lines[i].textContent[0] == ' ' && lines[i].textContent[1] == ' ' && lines[i].textContent[2] == ' ' && lines[i].textContent[3] == ' ' ) {
					lines[i].textContent = lines[i].textContent.substring(4);
				}
				beginning=false;
			}
		}
		return;
	}

}
