/*


*/

const evResizer = new Event('resizer');
const evClosing = new Event('closing');

class CTab {
	
	constructor(text="", contents=null) {
		this.contents = contents;
		this.handleText = text;
	}

}
class CArea {
	
	constructor() {
		this.tabs = [];
		this.header = null;
		this.body = null;
		this.currentTab = null;
	}

	add( title, contents ) {
		var tab = new CTab( title, contents );
		this.addTab( tab );
	}

	addTab( tab ) {
		tab.handle = this.buildHandle(tab);

		if( this.header != null )
			this.header.appendChild(tab.handle);
		if( this.body != null )
			this.body.appendChild(tab.contents);

		this.tabs.push(tab);
		if( this.currentTab === null ) {
			this.currentTab = tab;
			tab.contents.style.display = 'block';
			tab.handle.style.backgroundColor = '#222222';
		}
	}	

	buildHandle( tab ) {
		var handle = document.createElement('div');
		let title = document.createElement('div');
		let text = document.createTextNode(tab.handleText);
		title.appendChild(text);
		title.style.float = 'left';
		handle.appendChild(title);
		title.addEventListener("click", this.clickHandle.bind(this, tab));

		let div = document.createElement('button');
		div.style.float = 'left';
		div.innerHTML = "x";
		div.style.paddingLeft = div.style.paddingRight = div.style.marginLeft = '0px';
		div.style.marginRight = "10px";
		div.addEventListener("click", this.clickHandleClose.bind(this, tab));
		handle.appendChild(div);

		return handle;
	}

	clickHandle(tab) {
		this.select( tab );
	}
	clickHandleClose(tab) {
		this.closeTab( tab );
	}

	get( title ) {
		for( var i = 0; i < this.tabs.length; i++ ) {
			if( this.tabs[i].handleText == title ) {
				return this.tabs[i];
			}
		}
		return null;
	}

	close( title ) {
		var tab = this.get(title);
		if( !tab ) return;
		
		tab.contents.dispatchEvent(evClosing);
		this.header.removeChild( tab.handle );
		this.body.removeChild( tab.contents );
	}
	closeTab( tab ) {
		if( !tab ) return;

		tab.contents.dispatchEvent(evClosing);
		this.header.removeChild( tab.handle );
		this.body.removeChild( tab.contents );
	}

	select( tab ) {
		if( this.currentTab ) {
			this.currentTab.contents.style.display = 'none';
			this.currentTab.handle.style.backgroundColor = '#444444';
		}
		tab.contents.style.display = 'block';
		tab.handle.style.backgroundColor = '#222222';
		this.currentTab = tab;
	}
	
	build(wid, hgt) {
		var area = document.createElement('div');
		area.style.backgroundColor = '#444444';
		area.style.borderBottom = '1px solid black';
		area.style.overflowX = 'auto';
		area.style.overflowY = 'auto';
		area.style.width = wid;
		area.style.height = hgt;
		area.appendChild(this.buildHeader());
		area.style.margin = area.style.padding = '0px';

		if( this.currentTab !== null ) {
			this.currentTab.contents.style.display = 'block';
			area.appendChild(this.currentTab.contents);
		}

		this.body = area;
		return area;
	}

	buildHeader() {
		var header = document.createElement('div');
		header.style.width = '100%';
		header.style.height = '32px';
		header.style.backgroundColor = '#444444';
		header.style.borderBottom = '1px solid black';
		header.style.cursor = 'move';
		
		for( var i=0; i<this.tabs.length; i++ ) {
			header.appendChild( this.tabs[i].handle );
		}

		this.header = header;
		return header;
	}

	showHeader( show=true ) {
		this.header.style.display = show ? 'block' : 'none';
	}
}

class CDraggable {
	constructor(parent, div) {
		this.parent = parent;
		this.contents = div;
		this.width = 60;
		this.height = 60;
		this.build();
	}

	sense_size()
	{
		if( this.contents.clientWidth > 100 ) {
			this.width = this.contents.clientWidth+36;
			this.height = this.contents.clientHeight+36;
			if( this.height > 600 ) this.height = 600;
			if( this.width > 600 ) this.width = 600;
			console.log("Set dims to " + this.width + " x " + this.height);
		} else {
			console.log("Sense_size: no clientWidth " + this.contents.clientWidth + "x" + this.contents.clientHeight);
			this.width = 500;
			this.height = 300;
		}

		this.main.style.maxWidth = this.main.style.minWidth = this.main.style.width = this.width + "px";
		this.main.style.maxHeight = this.main.style.minHeight = this.main.style.height = this.height + "px";

		let el = this.main.firstChild;
		el.style.maxWidth = el.style.minWidth = el.style.width = (this.width-36) + "px";
		el.style.maxHeight = el.style.minHeight = el.style.height = (this.height-36) + "px";

		if( this.drag1 )
			this.drag1.style.height = (this.height - 36) + "px";
	}
	build()
	{
		var e = document.createElement('div');
		e.style.position = 'absolute';
		e.style.border = '1px solid gray';
		e.style.backgroundColor = '#111111';
		e.style.overflow = 'hidden';
		e.className = "br";

		var f = document.createElement('div');
		f.style.position = 'absolute';
		f.style.left = '18px';
		f.style.top = '18px';
		f.style.overflowX = f.style.overflowY = 'auto';
		//f.style.width = f.style.height = '100%';

		if( this.contents.getAttribute('noselect') == 'true' ) {
			e.classList.add("ps");
			f.classList.add("ps");
		}

		f.appendChild( this.contents );
		e.appendChild(f);

		this.main = e;
		e.style.maxWidth = e.style.minWidth = e.style.width = this.width + "px";
		e.style.maxHeight = e.style.minHeight = e.style.height = this.height + "px";

		var drag1 = document.createElement('div');
		drag1.style.position = 'absolute';
		drag1.style.right = '0px';
		drag1.style.top = '18px';
		drag1.style.width = '18px';
		drag1.style.height = (this.height - 36) + "px";
		drag1.style.backgroundColor = '#111111';
		drag1.style.cursor = 'move';
		this.drag1 = drag1;
		e.appendChild(drag1);

		var drag2 = document.createElement('div');
		drag2.style.position = 'absolute';
		drag2.style.left = '0px';
		drag2.style.bottom = '0px';
		drag2.style.width = '100%';
		drag2.style.height = '18px';
		drag2.style.backgroundColor = '#111111';
		drag2.style.cursor = 'move';
		this.drag2 = drag2;
		e.appendChild(drag2);

		var drag3 = document.createElement('div');
		drag3.style.position = 'absolute';
		drag3.style.left = '0px';
		drag3.style.top = '0px';
		drag3.style.width = '100%';//this.width - 18 + "px";
		drag3.style.height = '18px';
		drag3.style.backgroundColor = '#111111';
		drag3.style.cursor = 'move';
		this.drag3 = drag3;
		e.appendChild(drag3);

		var drag4 = document.createElement('div');
		drag4.style.position = 'absolute';
		drag4.style.left = '0px';
		drag4.style.top = '0px';
		drag4.style.height = '100%';
		drag4.style.width = '18px';
		drag4.style.backgroundColor = '#111111';
		drag4.style.cursor = 'move';
		this.drag4 = drag4;
		e.appendChild(drag4);

		var close = document.createElement('div');
		close.style.position = 'absolute';
		close.style.right = '3px';
		close.style.top = '3px';
		close.style.width = '18px';
		close.style.height = '18px';
		close.style.cursor = 'pointer';
		close.style.textAlign = 'center';
		close.style.lineHeight = '18px';
		close.style.color = 'white';
		close.style.fontFamily = 'Arial';
		close.style.fontSize = '12px';
		close.style.fontWeight = 'bold';
		close.innerHTML = 'X';
		this.closer = close;
		e.appendChild(close);
		close.addEventListener('mousedown', function(e) { e.stopPropagation(); });
		close.addEventListener('click', this.close.bind(this), true);

		var resize = document.createElement('div');
		resize.style.position = 'absolute';
		resize.style.right = '0px';
		resize.style.bottom = '0px';
		resize.style.width = '16px';
		resize.style.height = '16px';
		resize.style.backgroundColor = 'gray';
		resize.style.cursor = 'se-resize';
		resize.innerHTML = "&nbsp;";
		this.resizer = resize;
		e.appendChild(resize);
		//e.style.padding = "18px";
		
		resize.addEventListener("mousedown", this.mouseDownResize.bind(this));
		drag1.addEventListener("mousedown", this.mouseDown.bind(this));
		drag2.addEventListener("mousedown", this.mouseDown.bind(this));
		drag3.addEventListener("mousedown", this.mouseDown.bind(this));
		drag4.addEventListener("mousedown", this.mouseDown.bind(this));

		e.addEventListener("mousedown", function(ev) { ev.stopPropagation(); });

		//e.addEventListener("mousedown", this.mouseDown.bind(this));

		this.main = e;
	}

	close() {
		console.log("Drag.close");
		this.parent.closeDrag( this );
	}

	totop() {
		this.main.style.zIndex = ++this.parent.zindex;
	}

	resize(w, h) {
		//console.log("draggable::resize " + w + ", " + h);
		this.width = w;
		this.height = h;
		this.main.style.maxWidth = this.main.style.minWidth = this.main.style.width = this.width + "px";
		this.main.style.maxHeight = this.main.style.minHeight = this.main.style.height = this.height + "px";

		this.drag1.style.height = (this.height - 36) + "px";

		let el = this.main.firstChild;
		el.style.maxWidth = el.style.minWidth = el.style.width = (this.width-36) + "px";
		el.style.maxHeight = el.style.minHeight = el.style.height = (this.height-36) + "px";

		if( this.drag1 )
			this.drag1.style.height = (this.height - 36) + "px";
		this.contents.dispatchEvent(evResizer);

	}

	mouseDownResize(e) {
		e.preventDefault();
		e.stopPropagation();
		this.totop();
		this.parent.resizing = this;
		this.parent.dragtm = null;
		var r = this.main.getBoundingClientRect();
		this.offsetX = e.clientX - r.right;
		this.offsetY = e.clientY - r.bottom;
		this.main.style.border = '1px solid red';
		var i;
		for( i in mainframe.editors ) {
			if( mainframe.editors[i].editor == this.contents ) {
				mainframe.editors[i].sensitive = false;
				break;
			}
		}
		
		var overlay = document.createElement("div");
		overlay.style.width = overlay.style.height = '100%';
		overlay.style.position = 'absolute';
		overlay.style.left = overlay.style.top = '0px';
		overlay.id = 'overlay';
		overlay.innerHTML = "&nbsp;";
		overlay.style.zIndex = "10000";
		document.documentElement.appendChild(overlay);

		overlay.addEventListener('mousemove', this.parent.mouseMove.bind(this.parent));
		overlay.addEventListener('mouseup', this.parent.mouseUp.bind(this.parent));
		overlay.addEventListener('mouseout', this.parent.mouseOut.bind(this.parent));
	}

	mouseDown(e) {
		e.preventDefault();
		e.stopPropagation();
		this.totop();
		this.parent.dragging = this;
		this.parent.dragtm = null;
		var r = this.main.getBoundingClientRect();
		this.offsetX = e.clientX - r.left;
		this.offsetY = e.clientY - r.top;
		this.main.style.border = '1px solid blue';

		var overlay = document.createElement("div");
		overlay.style.width = overlay.style.height = '100%';
		overlay.style.position = 'absolute';
		overlay.style.left = overlay.style.top = '0px';
		overlay.id = 'overlay';
		overlay.innerHTML = "&nbsp;";
		overlay.style.zIndex = "10000";
		document.documentElement.appendChild(overlay);

		overlay.addEventListener('mousemove', this.parent.mouseMove.bind(this.parent));
		overlay.addEventListener('mouseup', this.parent.mouseUp.bind(this.parent));
		overlay.addEventListener('mouseout', this.parent.mouseOut.bind(this.parent));
	}

}
class CDragArea {
	
	constructor(mainframe) {
		this.mainframe = mainframe;
		this.tabs = [];
		this.drags = [];
		this.header = null;
		this.body = null;
		this.currentTab = null;
		this.dragging = false;
		this.dragtm = null;
		this.zindex = 0;
		// to make it faster: precalculate with a 2d map
		// and 'this.namedtabs = {};'
		

		this.builditems = [];
		this.buildplace = 0;
	}
	serialize()
	{
		var i, tab, drag;
		var buf = "";

		for( i=0; i<this.tabs.length; i++ ) {
			buf += this.drags[i].main.offsetLeft + "," + this.drags[i].main.offsetTop + "\n" + this.drags[i].main.clientWidth + "," + this.drags[i].main.clientHeight + "\n" + this.tabs[i].handleText + "\n";
		}

		return buf;
	}

	localSave() {
		var buf = this.serialize();
		localStorage.setItem("maindrag", buf);
	}

	setParams(params) {
		this.params = params;
	}

	render(buf)
	{
		this.builditems = buf.split("\n");
		this.renderOne();
	}

	renderOne() {
		var x,y,w,h;

		if( this.buildplace+2 >= this.builditems.length ) {
			this.builditems = [];
			return;
		}

		[x,y] = this.builditems[this.buildplace].split(",");
		[w,h] = this.builditems[this.buildplace+1].split(",");
		x = parseInt(x); y = parseInt(y);
		w = parseInt(w); h = parseInt(h);
		this.setParams({x:x,y:y,w:w,h:h});
		this.mainframe.openLink(this.builditems[this.buildplace+2]);
		this.buildplace += 3;
	}

	add( title, contents ) {
		var drag = new CDraggable( this, contents );
		var tab = new CTab( title, drag.main );
		this.buildHandle(tab);

		return this.addTab( tab, drag );
	}

	closeAll() {
		while( this.tabs.length > 0 ) {
			this.close( this.tabs[0].title );
		}
	}

	close( title ) {
		var i, tab;
		for( i=0; i<this.tabs.length; i++ ) {
			if( title == this.tabs[i].title ) {
				tab = this.tabs[i];
				break;
			}
		}
		if( !tab ) return;
		tab.contents.dispatchEvent(evClosing);

		if( this.header )
			this.header.removeChild( tab.handle );
		
		this.body.removeChild( tab.contents );

		this.tabs.splice(i,1);
		this.drags.splice(i,1);

		this.localSave();
	}
	closeDrag( drag ) {
		var tab, i;
		for( i=0; i<this.tabs.length; i++ ) {
			if( drag === this.drags[i] ) {
				tab = this.tabs[i];
				break;
			}
		}
		if( !tab ) return;
		tab.contents.dispatchEvent(evClosing);

		if( this.header )
			this.header.removeChild( tab.handle );
		
		this.body.removeChild( tab.contents );

		this.tabs.splice(i,1);
		this.drags.splice(i,1);

		this.localSave();
	}

	shift( x, y, exclude ) {
		var i, xpos, ypos;


		for( i=0; i<this.tabs.length; i++ ) {
			if( this.drags[i] == exclude ) {
				continue;
			}
			xpos = parseFloat( this.drags[i].main.style.left ) + x;
			if( isNaN(xpos) ) xpos=x;
			ypos = parseFloat( this.drags[i].main.style.top ) + y;
			if( isNaN(ypos) ) ypos=y;
			this.drags[i].main.style.left = xpos + 'px';
			this.drags[i].main.style.top = ypos + 'px';
			this.drags[i].main.style.border = '1px solid green';
		}
	}

	has( title ) {
		for( var i=0; i<this.tabs.length; i++ ) {
			if( title == this.tabs[i].handleText ) {
				return true;
			}
		}
		return false;
	}

	get( title ) {
		for( var i = 0; i < this.tabs.length; i++ ) {
			if( this.tabs[i].handleText == title ) {
				return this.tabs[i];
			}
		}
		return null;
	}

	addTab( tab, drag ) {
		var continueBuilding=false;

		tab.drag = drag;

		this.tabs.push(tab);
		this.drags.push(drag);

		if( this.header ) {
			this.header.appendChild( tab.handle );
			this.header.lastChild.style.float = 'left';
		}
		this.body.appendChild( tab.contents );

		if( this.params != null ) {
			drag.main.style.left = this.params.x + "px";
			drag.main.style.top = this.params.y + "px";
			tab.x = this.params.x;
			tab.y = this.params.y;
			drag.resize( this.params.w, this.params.h );

			this.params = null;
			continueBuilding = true;
		} else {
			drag.sense_size();
		}

		if( drag.main.firstChild.clientWidth > 0 ) {
			if( !('x' in tab) ) {
				tab.x = (this.body.clientWidth-(drag.main.firstChild.clientWidth))/2;
				tab.y = (this.body.clientHeight-(drag.main.firstChild.clientHeight))/2;
				if( isNaN(tab.y) ) tab.y = 0;
			}
			//drag.resize( tab.contents.clientWidth+40, tab.contents.clientHeight+40 );
		} else {
			if( !('x' in tab) ) {
				tab.x = tab.y = 0;
			}
		}

		drag.totop();

		if( continueBuilding ) {
			setTimeout( this.renderOne.bind(this), Infinity );
		} else {
			this.localSave();
		}

		return tab;
	}

	addbg( div ) {
		this.body.appendChild( div );
	}

	buildHandle( tab ) {
		var handle = document.createElement('div');
		let text = document.createTextNode(tab.handleText);
		handle.appendChild(text);
		handle.addEventListener("click", this.selectTab.bind(this, tab));
		tab.handle = handle;
		return handle;
	}

	build() {
		var area = document.createElement('div');
		area.style.width = '100%';
		area.style.height = '100%';
		area.style.backgroundColor = '#000000';
		area.style.borderBottom = '1px solid black';
		area.style.overflowX = area.style.overflowY = 'auto';
		area.style.margin = area.style.padding = '0px';

		area.addEventListener('scroll', this.scroll.bind(this) );
		area.addEventListener('mousedown', this.mouseDown.bind(this) );

		area.appendChild(this.buildHeader());

		if( this.currentTab !== null ) {
			this.currentTab.contents.style.display = 'block';
			area.appendChild(this.currentTab.contents);
		}

		this.body = area;

		return area;
	}

	scroll(e) {
		var top = e.target.scrollTop, left = e.target.scrollLeft;
		canvas.style.left = left + "px";
		canvas.style.top = top + "px";
		drawCanvas(left, top, e.target.clientWidth, e.target.clientHeight);
	}

	mouseDown(e) {
		if( e.clientX > this.body.clientWidth-30 ) return;
		if( e.clientY > this.body.clientHeight-30 ) return;
		this.startX = e.clientX;
		this.startY = e.clientY;
		this.drawing = true;


		var overlay = document.createElement("div");
		overlay.style.width = overlay.style.height = '100%';
		overlay.style.position = 'absolute';
		overlay.style.left = overlay.style.top = '0px';
		overlay.id = 'overlay';
		overlay.innerHTML = "&nbsp;";
		overlay.style.zIndex = "10000";
		document.documentElement.appendChild(overlay);

		overlay.addEventListener('mousemove', this.mouseMove.bind(this));
		overlay.addEventListener('mouseup', this.mouseUp.bind(this));
		overlay.addEventListener('mouseout', this.mouseOut.bind(this));
	}

	mouseMove(e) {
		e.preventDefault();
		e.stopPropagation();
		this.mouseX = e.clientX;
		this.mouseY = e.clientY;
		if( this.dragtm === null ) {
			this.mouseDrag();
		}
	}

	mouseDrag() {
		var r,x,y,l,t;
		var newendx, newendy;
		var tm = new Date();
		var dist;
		if( this.dragtm == null ) {
			dist = 1.0;
		} else {
			dist = (tm - this.dragtm)/50;
		}

		if( this.dragging ) {
			r = this.dragging.main.getBoundingClientRect();
			x = (this.mouseX - r.left) - this.dragging.offsetX;
			y = (this.mouseY - r.top) - this.dragging.offsetY;
			newendx = this.dragging.main.offsetLeft + x + r.width;
			newendy = this.dragging.main.offsetTop + y + r.height;

			l = parseFloat(this.dragging.main.style.left) + x;
			if( isNaN(l) ) l = x;
			t = parseFloat(this.dragging.main.style.top) + y;
			if( isNaN(t) ) t = y;

			//console.log("Draggedto " + l + ", " + t);
			this.dragging.main.style.left = l + 'px';
			this.dragging.main.style.top = t + 'px';

			//if( newendx > this.body.scrollLeft+this.body.clientWidth || newendy > this.body.scrollTop+this.body.clientHeight ) {
				//this.dragging.resizer.scrollIntoView({behavior:'smooth',block:'center',inline:'center'});
			//}

			this.dragtm = tm;
			setTimeout( this.mouseDrag.bind(this), 50 );
		} else if( this.resizing ) {
			r = this.resizing.main.getBoundingClientRect();
			x = (this.mouseX - r.left) + this.resizing.offsetX;
			y = (this.mouseY - r.top) + this.resizing.offsetY;

			this.resizing.resize( x, y );
			newendx = this.resizing.main.offsetLeft + x;
			newendy = this.resizing.main.offsetTop + y;
			
			if( this.resizing.main.offsetLeft < this.body.scrollLeft || this.resizing.main.offsetTop < this.body.scrollTop || newendx > this.body.scrollLeft+this.body.clientWidth || newendy > this.body.scrollTop+this.body.clientHeight ) {
				this.resizing.resizer.scrollIntoView({behavior:'smooth',block:'center',inline:'center'});
			}

			this.dragtm = tm;
			setTimeout( this.mouseDrag.bind(this), 50 );
		} else if( this.drawing ) { // drawing or moving canvas
			switch( this.tool ) {
				case 'Hand':
					// move canvas with our movement
					x = this.mouseX - this.startX;
					y = this.mouseY - this.startY;
					this.startX = this.mouseX;
					this.startY = this.mouseY;

					this.shift( x, y, null );
					break;
				case 'Line':
					l = this.body.scrollLeft;
					t = this.body.scrollTop;
					x = l + this.body.clientWidth;
					y = t + this.body.clientHeight;
					r = this.body.getBoundingClientRect();
					if( this.drawing !== true && this.drawing !== false ) {
						this.drawing.add( l + this.mouseX - r.left, t + this.mouseY - r.top );
					} else {
						this.drawing = buildCanvasItem('Line');
						this.drawing.add( l + this.startX - r.left, t + this.startY - r.top );
						this.drawing.add( l + this.mouseX - r.left, t + this.mouseY - r.top );
					}
					drawCanvas(l, t, x, y);
					break;
			}
		}
	}
	mouseOut() {
		return;
	}
	mouseUp(e) {
		this.mouseMove(e); // one last time.

		var overlay = gE("overlay");
		overlay.parentNode.removeChild(overlay);

		this.dragtm = null;

		if( this.dragging ) {
			//this.dragging.main.scrollIntoView();
			this.dragging.main.style.border = '1px solid gray';
			this.dragging = false;
			this.localSave();
		} else if( this.resizing ) {
			//this.dragging.main.scrollIntoView();
			this.resizing.main.style.border = '1px solid gray';
			this.resizing = false;
			this.localSave();
		} else {
			if( this.drawing ) {
				this.drawing = false;
				this.localSave();
			}
		}
	}

	buildHeader() {
		if( this.header != null ) return;

		var header = document.createElement('div');
		header.style.position = 'absolute';
		header.style.bottom = '20px';
		header.style.left = '0%';
		header.style.width = '100%';
		header.style.backgroundColor = '#222222';
		
		for( var i=0; i<this.tabs.length; i++ ) {
			header.appendChild( this.tabs[i].handle );
			header.lastChild.style.float = 'left';
		}

		this.header = header;
		return header;
	}

	selectTab( tab ) {
		if( this.currentTab ) {
			this.currentTab.handle.style.backgroundColor = '#222222';
		}
		tab.handle.style.backgroundColor = '#444444';
		this.currentTab = tab;
		//! Scroll into view.

	}

	showHeader( show=true ) {
		this.header.style.display = show ? 'block' : 'none';
	}
}


class CWindow {

	constructor() {
		this.areas = {};
		this.pendingItems = [];
		this.setup = {
			'left1': { 'width': '15%', 'maxHeight': '80%', 'left': '0', 'top': '10%', 'overflow': 'auto' },
			'left2': { 'width': '15%', 'height': '80%', 'left': '15%', 'top': '10%', 'overflow': 'hidden' },
			'right': { 'width': '15%', 'height': '80%', 'right': '0', 'top': '10%', 'overflow': 'hidden' },
			'top': { 'width': '80%', 'height': '8%', 'left': '10%', 'top': '0', 'overflow': 'hidden' },
			'bottom': { 'width': '80%', 'height': '25px', 'left': '10%', 'top': ['100%','-25'], 'overflow': 'hidden' },
			'main': { 'width': '70%', 'height': ['100%','-26'], 'left': '15%', 'top': '0', 'overflow': 'auto' }
		};
		this.doc = null;
	}

	addArea( region, carea ) {
		if( region in this.areas ) {
			console.log("ERROR: region already exists");
			return;
		}
		this.areas[region] = carea;
		carea.parent = this;
		if( carea.body == null && this.doc != null ) {
			carea.build(this.setup[region].width, this.setup[region].height);
			this.doc.appendChild(carea.body);
		}
	}

	addTab( region, title, content ) {
		this.areas[region].addTab(title, content);
	}

	build() {
		var win = document.createElement('div');
		win.style.position = 'absolute';
		win.style.width = '100%';
		win.style.height = '100%';
		win.style.overflow = 'hidden';
		win.style.padding = win.style.margin = win.style.border = '0';

		var cfg, i, sum, maxof;

		for( var region in this.areas ) {
			var area = this.areas[region];
			if( area.body == null ) {
				var div = area.build(this.setup[region].width, this.setup[region].height);
				div.style.position = 'absolute';
				for( var x in this.setup[region] ) {
					cfg = this.setup[region][x];
					if( typeof cfg == 'object' ) {
						sum = 0;
						if( x.indexOf("eight") >= 0 || x == "top" ) {
							maxof = window.innerHeight;
						} else if( x.indexOf("idth") >= 0 || x == "left" ) {
							maxof = window.innerWidth;
						} else {
							maxof = 100;
						}
						for( i=0; i<cfg.length; i++ ) {
							if( cfg[i].endsWith("%") ) {
								sum += (parseFloat(cfg[i])/100)*maxof;
							} else {
								sum += parseFloat(cfg[i]);
							}
						}
						div.style[x] = sum + "px";
					} else {
						div.style[x] = this.setup[region][x];
					}
				}
				win.appendChild(div);
			}
		}

		this.doc = win;
		window.addEventListener('resize', this.resize.bind(this));
		return win;
	}

	resize()
	{
		var cfg, i, sum, maxof;

		for( var region in this.areas ) {
			var area = this.areas[region];
			if( area.body ) {
				for( var x in this.setup[region] ) {
					cfg = this.setup[region][x];
					if( typeof cfg == 'object' ) {
						sum = 0;
						if( x.indexOf("eight") >= 0 || x == "top" ) {
							maxof = window.innerHeight;
						} else if( x.indexOf("idth") >= 0 || x == "left" ) {
							maxof = window.innerWidth;
						} else {
							maxof = 100;
						}
						for( i=0; i<cfg.length; i++ ) {
							if( cfg[i].endsWith("%") ) {
								sum += (parseFloat(cfg[i])/100)*maxof;
							} else {
								sum += parseFloat(cfg[i]);
							}
						}
						area.body.style[x] = sum + "px";
					} else {
						area.body.style[x] = this.setup[region][x];
					}
				}
			}
		}
	}

}

class LinkWrapper {

	constructor( link ) {
		this.link = link;
		this.el = this.build();
	}

	build()
	{
		var link = document.createElement('iframe');
		link.src = this.link;

		link.addEventListener('resizer', function() {
			link.style.width = (parseInt(link.parentNode.style.width)-36) + "px";
			link.style.height = (parseInt(link.parentNode.style.height)-36) + "px";
		});
		return link;
	}

}
class ImageWrapper {

	constructor( link ) {
		this.link = link;
		this.el = this.build();
	}

	build()
	{
		var img = document.createElement('img');
		img.setAttribute('noselect', true);
		img.src = this.link;
		img.className = 'ps';
		img.style.cursor = 'move';
		img.addEventListener('mousedown', function(ev) {
			console.log("Draging img");
			ev.preventDefault();
			ev.stopPropagation();
			img.dragging = true;
			img.dragX = ev.clientX;
			img.dragY = ev.clientY;
			img.dragLeft = parseInt(img.parentNode.scrollLeft);
			img.dragTop = parseInt(img.parentNode.scrollTop);
			var overlay = document.createElement("div");
			overlay.style.width = overlay.style.height = '100%';
			overlay.style.position = 'absolute';
			overlay.style.left = overlay.style.top = '0px';
			overlay.id = 'overlay';
			overlay.innerHTML = "&nbsp;";
			overlay.style.zIndex = "10000";
			document.documentElement.appendChild(overlay);
	
			overlay.addEventListener('mousemove', function(ev) {
				var dx = ev.clientX - img.dragX;
				var dy = ev.clientY - img.dragY;
				img.parentNode.scrollLeft = (img.dragLeft - dx);
				img.parentNode.scrollTop = (img.dragTop - dy);
			});
			overlay.addEventListener('mouseup', function(ev) {
				img.dragging = false;
				document.documentElement.removeChild(overlay);
			});
		});
		img.addEventListener('resizer', function() {
			//img.style.width = (parseInt(img.parentNode.style.width)-36) + "px";
			//img.style.height = (parseInt(img.parentNode.style.height)-36) + "px";
		});
		return img;
	}

}

class YoutubeWrapper {

	constructor( link ) {
		this.link = link;
		this.el = this.build();
	}

	build()
	{
		var vid = document.createElement('iframe');
		vid.title = "Youtube Video";
		vid.frameborder = 0;
		var p = this.link.indexOf("&");
		if( p >= 0 ) {
			this.link = this.link.substr(0, p);
		}
		vid.src = this.link.replace('watch?v=', 'embed/');
		vid.classList.add('ps');
		vid.setAttribute('allow', "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share");
		vid.setAttribute('allowfullscreen', true);
		vid.addEventListener('resizer', function() {
			vid.style.width = (parseInt(vid.parentNode.style.width)-36) + "px";
			vid.style.height = (parseInt(vid.parentNode.style.height)-36) + "px";
		});
		return vid;
	}

}


class Mainframe {

	constructor() {
		this.login_displayed = false;
		this.logout_displayed = false;

		this.mainwin = new CWindow();
		this.mainwin.addArea( 'left1', new CArea() );
		this.mainwin.addArea( 'bottom', new CArea() );
		this.mainwin.addArea( 'right', new CArea() );
		this.mainwin.addArea( 'main', new CDragArea(this) );
	
		this.editors = {};
		this.tool = "Hand";
		this.vfs = new VFSList(this);
		
		this.shells = {};
		this.consoles = {};
	}

	build()
	{
		this.buildPanes();
		this.mainwin.areas['main'].tool = "Hand";
		this.vfs.getLists();

		var buf;
		if( (buf=localStorage.getItem("maindrag")) !== null ) {
			this.mainwin.areas['main'].render( buf );
		}
	}

	buildPanes() {
		this.left = document.createElement("div");
		this.left.style.overflow = 'auto';
		this.right = document.createElement("div");
		this.leftTab = new CTab('Files', this.left);
		this.rightTab = new CTab('Outline', this.right);
		this.mainwin.areas['left1'].addTab(this.leftTab);	
		this.mainwin.areas['right'].addTab(this.rightTab);
		this.mainwin.areas['bottom'].showHeader(false);
		this.mainwin.areas['main'].showHeader(false);

		canvas.addEventListener('mousedown', this.mainwin.areas['main'].mouseDown.bind(this.mainwin.areas['main']));
		canvas.width = this.mainwin.areas['main'].body.clientWidth-24;
		canvas.height = this.mainwin.areas['main'].body.clientHeight-24;
		canvas.style.width = canvas.width + "px";
		canvas.style.height = canvas.height + "px";
		this.mainwin.areas['main'].addbg( canvas );
	}

	add( header, contents ) {
		return this.mainwin.areas['main'].add(header, contents);
	}

	get( filename ) {
		return this.mainwin.areas['main'].get(filename);
	}

	pickTab( filename ) {
		this.mainwin.areas['main'].selectTab( this.mainwin.areas['main'].get(filename) );
	}

	openLink( path ) {
		if( path.endsWith('png') || path.endsWith('jpg') || path.endsWith('gif') || path.endsWith('jpeg') ) {
			let img = new ImageWrapper(path);
			this.add( path, img.el );
		} else if( path.indexOf('youtube') >= 0 ) {
			let vid = new YoutubeWrapper(path);
			this.add( path, vid.el );
		} else if( path.startsWith('http') ) {
			let link = new LinkWrapper(path);
			this.add( path, link.el );
		} else if( path == "Database" ) {
			return;
		} else if( path.startsWith('Module') ) {
			return;
		} else if( path == "Login" ) {
			this.clickLogin();
		} else if( path == "Logout" ) {
			this.clickLogout();
		} else if( path[0] == "#" ) {
			if( path == "#shell" ) {
				new Shell(this);
			} else if( path == "#con" || path == "#console" ) {
				new Console(this);
			} else if( path == "#data" || path == "#db" ) {
				var db = new Database(this);
				this.add( "Database", db.build() );
			} else if( path == "#close" ) {
				this.mainwin.areas['main'].closeAll();
			} else {
				alert("Unknown command " + path);
			}
		} else {
			this.vfs.getFile( path );
		}
	}

	editFile(filename, contents) {
		var i;
		for( i=0; i<this.editors.length; i++ ) {
			if( this.editors[i].filename == filename ) {
				this.editors[i].setText(contents);
				this.editors[i].tab.drag.totop();
				return;
			}
		}
		let sense = true;
		if( this.mainwin.areas['main'].builditems.length > 0 ) {
			sense = false;
		}
		let ed = new TextEditor(this, filename, false, sense);
		this.editors[filename] = ed;
		ed.setText(contents);
		let ln = new Linter(ed, this);
		ln.readfile( filename, contents );

		if( sense )
			this.mainwin.areas['main'].tabs[ this.mainwin.areas['main'].tabs.length-1 ].drag.sense_size();
	}

	pickTool( tool ) {
		this.tool = tool;
		if( this.ctool ) {
			this.ctool.innerHTML = "[" + tool + "]";
		}
		this.mainwin.areas['main'].tool = tool;
	}

	registerShell( code, shell ) {
		this.shells[code] = shell;
	}
	
	sendtoShell( code, msg ) {
		this.shells[code].recv(msg);
	}

	registerConsole( code, console ) {
		this.consoles[code] = console;
	}
	
	sendtoConsole( code, msg ) {
		this.consoles[code].recv(msg);
	}
	
	sendfromConsole( code, msg ) {
		this.consoles[code].send(msg);
	}

	
	buildStatusbar()
	{
		var bar = document.createElement("div");
		bar.style.position = 'absolute';
		bar.style.top = "0px";
		bar.style.left = '0px';
		bar.style.width = '100%';

		bar.style.height = '25px';

		var ctool = document.createElement('div');
		ctool.style.position = 'absolute';
		ctool.style.top = '0px';
		ctool.style.left = '0px';
		ctool.innerHTML = "[" + this.tool + "]";
		this.ctool = ctool;
		bar.appendChild(ctool);

		var upl = document.createElement("button");
		upl.innerHTML = "+";
		upl.addEventListener("click", this.showTools.bind(this));
		upl.style.position = 'absolute';
		upl.style.top = '0px';
		bar.appendChild(upl);

		var frm = document.createElement("form");
		frm.style.position = 'absolute';
		frm.style.left = '0px';
		frm.style.top = '0px';

		var inp = document.createElement("input");
		inp.type = 'text';
		inp.name = 'path';
		inp.style.position = 'absolute';

		inp.addEventListener("keydown", function(e) {
			if( e.key == 'Enter' ) {
				e.preventDefault();
				var val = inp.value;
				if( val == "" ) return;
				inp.value = "";
				this.openLink(val);
			}
		}.bind(this));


		frm.appendChild(inp);
		var btn = document.createElement("button");
		var go = btn;
		btn.innerHTML = "Go";
		btn.style.position = 'absolute';
		frm.appendChild(btn);
		bar.appendChild(frm);

		function resizeInp() {
			if( window.innerWidth < 400 ) {
				inp.style.width = '200px';
				inp.style.left = '0px';
			} else {
				inp.style.width = (window.innerWidth/2)-8 + "px";
				inp.style.left = (window.innerWidth - parseInt(inp.style.width) - this.mainwin.areas['bottom'].body.offsetLeft)/2 + "px";
			}
			upl.style.left = (parseInt(inp.style.left) - 30) + "px";
			go.style.left = (parseInt(inp.style.left) + parseInt(inp.style.width) + 8 + 5) + "px";
		}
		resizeInp.bind(this)();
		window.addEventListener("resize", resizeInp.bind(this));

		frm.addEventListener("submit", function(e) {
			e.preventDefault();
			var val = inp.value;
			if( val == "" ) return;
			inp.value = "";
			this.openLink(val);
		}.bind(this));

		btn = document.createElement("button");
		btn.style.position = 'absolute';
		btn.style.right = '0px';
		btn.style.top = '0px';
		btn.style.width = '52px';
		var user = radVar("sess.user");
		if( user == null ) {
			btn.innerHTML = "Login";
			btn.addEventListener("click", this.clickLogin.bind(this));
			bar.appendChild(btn);
		} else {
			btn.innerHTML = "Logout";
			btn.addEventListener("click", this.clickLogout.bind(this));
			bar.appendChild(btn);
		}
		this.loginbtn = btn;

		this.mainwin.areas['bottom'].add("Status", bar);

		this.statusbar = bar;
		return bar;
	}
	switchLogin() {
		var user = radVar("sess.user");
		var btn = this.loginbtn;
		if( user == null ) {
			btn.innerHTML = "Login";
			btn.removeEventListener("click", this.clickLogout.bind(this));
			btn.addEventListener("click", this.clickLogin.bind(this));
		} else {
			btn.innerHTML = "Logout";
			btn.removeEventListener("click", this.clickLogin.bind(this));
			btn.addEventListener("click", this.clickLogout.bind(this));
		}
	}
	clickLogin()
	{
		var e, tab;
		if( !this.mainwin.areas['main'].has("Login") ) {
			e = document.createElement("div");
			tab = this.mainwin.areas['main'].add("Login", e);
			this.login_displayed = true;
		} else {
			tab = this.mainwin.areas['main'].get("Login");
			e = tab.contents;
		}
		blitzTemplate(e, "signin");
	}
	clickLogout()
	{
		var e, tab;
		if( !this.mainwin.areas['main'].has("Logout") ) {
			e = document.createElement("div");
			tab = this.mainwin.areas['main'].add("Logout", e);
		} else {
			tab = this.mainwin.areas['main'].get("Logout");
			e = tab.contents;
		}
		blitzTemplate(e, "logout");
	}
	
	showUploads()
	{
		var e = this.mainwin.areas['main'].get("Uploads");
		if( e ) {
			e.drag.totop();
			return;
		}
		var el = document.createElement("div");
		blitzTemplate(el, "upload");
		var tab = this.mainwin.areas['main'].add("Uploads", el);
	}
	showTools()
	{
		var e = this.mainwin.areas['right'].get("Tools");
		if( e ) {
			e.drag.totop();
			return;
		}
		var el = document.createElement("div");
		blitzTemplate(el, "tools");
		var tab = this.mainwin.areas['right'].add("Tools", el);
	}
	
}