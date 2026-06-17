class VFSList {

	constructor(mainframe) {
		this.paths = {};
		this.files = {};
		this.lists = [];
		this.bookmarks = [];
		this.conts = {};
		this.expands = {};
		this.mainframe = mainframe;
	}

	getLists() {
		HtmlRequestGet("/vfs/lists.js", "", this.gotLists.bind(this));
	}

	gotLists(data) {
		var obj = JSON.parse(data);
		var data = obj.data;

		var i;

		for( i=0; i<data.pathmarks.length; i++ ) {
			var pathmark = data.pathmarks[i];
			this.lists.push( { path: pathmark.path, files: pathmark.files } );
		}

		var e = this.build();

		clearNode( this.mainframe.left );
		this.mainframe.left.appendChild(e);
		if( this.lists.length > 0 )
			this.clickExpand( this.lists[0].path );
	}

	build() {
		var div = document.createElement("div");

		//div.style.height = "100%";
		//div.style.maxHeight = "100%";
		div.style.maxWidth = "180px";
		div.style.overflow = "auto";
		div.style.fontSize = "12pt";

		// for each list, drawList
		var i;
		for( i=0; i<this.lists.length; i++ ) {
			var list = this.lists[i];
			this.paths[list.path] = list.files;
			var e = this.drawList(list.path, list.files);
			e.style.float = e.style.clear = 'left';
			div.appendChild(e);
		}

		var btn = document.createElement("button");
		btn.innerHTML = "+";
		btn.style.float = btn.style.clear = 'left';
		btn.addEventListener("click", this.clickAddList.bind(this));
		div.appendChild(btn);

		this.frame = div;
		return div;
	}

	clickAddList() {
		this.frame.removeChild( this.frame.lastChild );
		var te = document.createElement("input");
		this.textentry = te;
		te.type = "text";
		te.setAttribute('name', 'path');
		te.setAttribute('size', '20');
		te.addEventListener("keydown", this.addListKeypress.bind(this));
		this.frame.appendChild(te);
		te.focus();
	}

	addListKeypress(ev) {
		if( ev.key == "Enter") {
			ev.preventDefault();
			this.submitAddList();
		}
	}

	submitAddList() {
		HtmlRequest("/vfs/pathmark.js", buildArgString({path: this.textentry.value}), this.gotAddList.bind(this));
	}

	gotAddList() {
		this.getLists();
	}

	clickExpand( path ) {
		console.log("expand("+ path, this, ")");
		if( path[path.length-1] != '/' ) path += '/';
		if( !(path in this.paths) ) {
			HtmlRequestGet("/vfs/list.js", buildArgString({path: path}), this.gotDir.bind(this));
			return;
		}
		if( this.conts[path].style.display == 'none' ) {
			this.conts[path].style.display = 'block';
			this.expands[path].innerHTML = "V";
		} else {
			this.conts[path].style.display = 'none';
			this.expands[path].innerHTML = "&gt;";
		}
	}

	drawFilesToContainer( cont, path, files ) {
		var label, cl;
		var i, cont2;

		for( i=0; i<files.length; i++ ) {
			label = document.createElement("div");
			label.style.cursor = 'pointer';
			label.style.float = 'left';
			let txt = document.createTextNode(files[i].s);
			label.appendChild(txt);
			if( files[i].d ) {
				txt.textContent += "/";
				label.style.fontWeight = 'bold';
				var exp = document.createElement("div");
				exp.className = "cl";
				exp.innerHTML = "&gt;";
				exp.style.cursor = 'pointer';
				this.expands[ path + files[i].s + "/" ] = exp;
				exp.addEventListener("click", this.clickExpand.bind(this, path + files[i].s));
				cont.appendChild(exp);
				label.addEventListener("click", this.clickDir.bind(this, path + files[i].s));
			} else {
				label.addEventListener("click", this.clickFile.bind(this, path + files[i].s));
			}
			cont.appendChild(label);

			cl = document.createElement("div");
			cl.className = "cl";
			cont.appendChild(cl);

			if( files[i].d ) {
				cont2 = document.createElement("div");
				cont2.style.display = 'none';
				cont2.style.paddingLeft = '5px';
				cont2.style.float = 'left';
				cont.appendChild(cont2);
				this.conts[ path + files[i].s + "/" ] = cont2;

				cl = document.createElement("div");
				cl.className = "cl";
				cont.appendChild(cl);
			}
		}
	}

	drawList( path, files ) {
		if( typeof files == 'undefined' ) files = this.paths[path];
		if( typeof files == 'undefined' ) {
			console.log("Not found list " + path);
			return;
		}

		var div = document.createElement("div");

		var expand = document.createElement("div");
		expand.className = "cl";
		expand.innerHTML = "&gt;";
		expand.style.cursor = 'pointer';
		expand.style.float = 'left';
		this.expands[path] = expand;
		expand.addEventListener("click", this.clickExpand.bind(this, path));

		div.appendChild(expand);
		var label = document.createElement("div");
		label.style.float = 'left';
		label.innerHTML = path;
		div.appendChild(label);

		var cl = document.createElement("div");
		cl.className = "cl";
		div.appendChild(cl);

		let cont = document.createElement("div");
		cont.style.display = 'none';
		cont.style.paddingLeft = '5px';
		cont.style.float = 'left';

		div.appendChild(cont);
		this.conts[path] = cont;
		this.drawFilesToContainer(cont, path, files);

		return div;
	}

	clickDir( dir, ev ) {
		if( dir[dir.length-1] != '/' ) dir += '/';
		if( dir in this.paths ) {
			this.clickExpand(dir);
			return;
		}
		HtmlRequestGet("/vfs/list.js", buildArgString({path: dir}), this.gotDir.bind(this));
	}

	gotDir(data) {
		var obj = JSON.parse(data);
		var dobj = obj.data;

		console.log("gotDir(): ", dobj.path, dobj.files);
		
		this.paths[dobj.path] = dobj.files;
		this.drawFilesToContainer( this.conts[dobj.path], dobj.path, dobj.files);
		this.conts[dobj.path].style.display = 'block';
		this.expands[dobj.path].innerHTML = "V";
	}

	clickFile( path, ev ) {
		
		let formats = [ 'png', 'jpg', 'jpeg', 'gif', 'ico' ];
		var i;
		for( i=0; i<formats.length; i++ ) {
			if( path.indexOf("." + formats[i]) != -1 ) {
				this.mainframe.openLink("/vfs/get.js?path=" + path);
				return;
			}
		}
		
		if( path in this.files ) {
			this.mainframe.editFile(path, this.files[path]);
			return;
		}
		
		HtmlRequestGet("/vfs/get.js", buildArgString({path: path}), this.gotFile.bind(this));
	}

	getFile(path) {
		HtmlRequestGet("/vfs/get.js", buildArgString({path: path}), this.gotFile.bind(this));
	}

	gotFile(data, parm, req) {
		var url = req.mystoredurl;
		var types = [ 'png', 'gif', 'jpg', 'jpeg', 'bmp', 'ico' ];
		var i;
		for( i=0; i<types.length; i++ ) {
			if( url.indexOf("." + types[i]) != -1 ) {
				this.mainframe.editImage(url, data);
				return;
			}
		}
		var obj = JSON.parse(data);
		var dobj = obj.data;
		this.files[dobj.path] = dobj.contents;
		this.mainframe.editFile(dobj.path, dobj.contents);
	}
}