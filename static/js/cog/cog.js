const evResizer = new Event('resizer');

class MultiPaneTextEditor
{
	constructor(mp) {
		this.editors = [];
		this.buildPanes();
		this.vfs = new VFSList(this);

		mp.appendChild(this.panes);

		let allitems = localStorage.getItem("allfiles");
		if (allitems) {
			let items = allitems.split("\n");
			for (let i = 0; i < items.length; i++) {
				let item = items[i];
				if( item == "" ) continue;
				let contents = localStorage.getItem(item);
				this.editFile(item, contents);
			}
		}
	}

	getElement() {
		return this.panes;
	}

	get( filename ) {
		var i;
		for( i=0; i<this.editors.length; i++ ) {
			if( this.editors[i].filename == filename ) {
				return this.editors[i];
			}
		}
		return null;
	}

	editFile(filename, contents, reopen=false) {
		var i;
		for( i=0; i<this.editors.length; i++ ) {
			if( this.editors[i].filename == filename ) {
				this.editors[i].setText(contents);
				this.editors[i].clickHandle();
				return;
			}
		}
		let ed = new TextEditor(this, filename, this.width - 362, this.height - 41, reopen);
		this.editors.push(ed);
		ed.setText(contents);
		let ln = new Linter(ed, this);
		ln.readfile( filename, contents );
	}

	clickAddPane() {
		console.log("clickAddPane");
	}

	add( header, contents ) {
		let handle = document.createElement('button');
		handle.style.float = 'left';
		let txt = document.createTextNode(header);
		handle.appendChild(txt);
		let div = document.createElement('button');
		div.style.float = 'left';
		div.innerHTML = "x";
		div.style.paddingLeft = div.style.paddingRight = div.style.marginLeft = '0px';
		div.style.marginRight = "10px";
		div.addEventListener("click", this.clickHandleClose.bind(this, header));
		handle.addEventListener('click', this.clickHandle.bind(this, header));

		this.header.appendChild(handle);
		this.header.appendChild(div);

		this.frame.appendChild(contents);
	}

	pickTab( header ) {
		var i;
		for( i=0; i<this.editors.length; i++ ) {
			if( this.editors[i].filename == header ) {
				if( this.currentWindow ) {
					this.currentWindow.style.display = 'none';
				}
				this.currentWindow = this.editors[i].editor;
				this.editors[i].editor.style.display = 'block';
				break;
			}
		}
	}

	closeTab( header ) {
		var i;
		for( i=0; i<this.editors.length; i++ ) {
			if( this.editors[i].filename == header ) {
				this.editors[i].close();
				this.editors.splice(i, 1);
				break;
			}
		}
	}

	clickHandleClose(header) {
		var i;
		for( i=0; i<this.editors.length; i++ ) {
			if( this.editors[i].filename == header ) {
				this.editors[i].close();
				this.editors.splice(i, 1);
				//pick last tab
				if( this.editors.length > 0 ) {
					this.pickTab(this.editors[this.editors.length-1].filename);
				}
				break;
			}
		}
	}
	clickHandle(header) {
		this.pickTab(header);
	}

	buildPanes() {
		var width = window.innerWidth - 16;
		var height = window.innerHeight - 50;

		this.width = width;
		this.height = height;

		var mainpane = document.createElement('div');
		this.panes = mainpane;

		mainpane.style.position = 'absolute';
		mainpane.style.left = '0px';
		mainpane.style.top = '0px';
		mainpane.style.width = width + "px";
		mainpane.style.height = height + "px";

		var cont = document.createElement('div');
		this.header = cont;
		cont.style.position = 'absolute';
		cont.style.left = '181px';
		cont.style.top = '0px';
		cont.style.width = (width-362) + "px";
		cont.style.height = '40px';
		cont.style.backgroundColor = '#444444';
		cont.style.borderBottom = '1px solid black';
		cont.style.cursor = 'move';

		mainpane.appendChild(cont);

		var frame = document.createElement("div");
		this.frame = frame;
		frame.style.position = 'absolute';
		frame.style.left = '181px';
		frame.style.top = '41px';
		frame.style.width = (width-362) + "px";
		frame.style.height = height + "px";
		mainpane.appendChild(frame);

		var left = document.createElement('div');
		this.left = left;
		left.style.position = 'absolute';
		left.style.left = '0px';
		left.style.top = '0px';
		left.style.width = '180px';
		left.style.height = height + 'px';
		mainpane.appendChild(left);

		var right = document.createElement('div');
		this.right = right;
		right.style.position = 'absolute';
		right.style.right = '0px';
		right.style.top = '41px';
		right.style.width = '180px';
		right.style.height = height + 'px';
		mainpane.appendChild(right);

		//! insert loose frame to cont
		var newpane = document.createElement('button');
		newpane.addEventListener('click', this.clickAddPane.bind(this));
		newpane.innerHTML = '+';
		cont.appendChild(newpane);
	}
}


function drawObject(obj)
{
	var i;
	var buf = "";
	for( i in obj ) {
		buf += i + ": " + obj[i] + ",";
	}
	return buf;
}