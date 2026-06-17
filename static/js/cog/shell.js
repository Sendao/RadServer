var dbg_shell;

class Shell
{
	constructor(mainframe)
	{
		this.mainframe = mainframe;
		this.editor = new TextEditor(mainframe, "#shell", false, false);
		let ln = new Linter(this.editor, this.mainframe);
		ln.processed = true;
		ln.retokenizelines(1,2);
		ln.mode = 'shell';
		ln.default_type = 'sh';
		this.linter = ln;

		dbg_shell = this;

		this.code = randStr(8);
		this.typed_keys = [];
		this.typing_timer = -1;
		this.startup();
	}
	startup()
	{
		if( socket_registered === true ) {
			this.mainframe.registerShell(this.code, this);
			sendSocket({c:'sh',z:this.code});
			this.editor.ptrlock = this.ptrlock.bind(this);
			this.editor.typecb = this.typecb.bind(this);
		} else {
			setTimeout( this.startup.bind(this), 300 );
		}
	}

	recv(data)
	{
		console.log("Shell received: ", data);
		var lines = data.split("\n");
		var i;

		for( i=0; i<lines.length; i++ ) {
			this.editor.append(lines[i]);
			if( i+1<lines.length )
				this.editor.append("\n");
		}
	}

	ptrlock()
	{
		// focus on the end of the editor.
		
		var sect = this.editor.text.lastChild, el;
		while( sect && !sect.classList.contains("section") ) sect = sect.previousSibling;
		if( !sect ) {
			return;
		} else {
			el = sect.lastChild.firstChild;
			var range = document.createRange();
			var sel = window.getSelection();
			range.setStart(el, el.textContent.length);
			sel.removeAllRanges();
			sel.addRange(range);
		}
	}

	typecb(key, ev)
	{
		switch( key ) {
			case 'ArrowLeft':
				this.typed_keys.push( String.fromCharCode(224) + String.fromCharCode(75) );
				break;
			case 'ArrowRight':
				this.typed_keys.push( String.fromCharCode(224) + String.fromCharCode(77) );
				break;
			case 'ArrowUp':
				this.typed_keys.push( String.fromCharCode(224) + String.fromCharCode(72) );
				break;
			case 'ArrowDown':
				this.typed_keys.push( String.fromCharCode(224) + String.fromCharCode(80) );
				break;
			case 'Tab':
				this.typed_keys.push( String.fromCharCode(9) );
				break;
			case 'Home':
				this.typed_keys.push( String.fromCharCode(224) + String.fromCharCode(71) );
				break;
			case 'End':
				this.typed_keys.push( String.fromCharCode(224) + String.fromCharCode(79) );
				break;
			case 'Delete':
				this.typed_keys.push( String.fromCharCode(224) + String.fromCharCode(83) );
				break;
			case 'Backspace':
				if( this.typed_keys.length > 0 ) {
					this.typed_keys.pop();
				} else {
					this.typed_keys.push( String.fromCharCode(8) );
				}
				break;
			case 'Enter':
				this.typed_keys.push("\n");
				break;
			default:
				if( key.length > 1 ) return false;
				this.typed_keys.push(key);
				break;
		}
		if( this.typing_timer != -1 ) {
			clearTimeout(this.typing_timer);
		}
		this.typing_timer = setTimeout( this.sendTyped.bind(this), 100 );
		return false;
	}

	sendTyped()
	{
		var keys = this.typed_keys.join("");
		this.typed_keys = [];
		this.typing_timer = -1;
		sendSocket({c:'c',z:this.code,s:keys});
	}
}