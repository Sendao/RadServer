var dbg_console;

class Console
{
	constructor(mainframe)
	{
		this.mainframe = mainframe;

		dbg_console = this;

		this.code = randStr(8);
		this.build();
		this.startup();
	}

	build()
	{
		var div = document.createElement("div");

		this.tab = this.mainframe.add( this.filename, div );

		templateParams( { 'code': this.code } );
		blitzTemplate(div, "console");


		setTimeout(this.finishbuild.bind(this), 300);
		this.main = div;
		return div;
	}
	finishbuild()
	{
		registerKeyUp(this.keyhit.bind(this));
	}
	startup()
	{
		if( socket_registered === true ) {
			this.mainframe.registerConsole(this.code, this);
			sendSocket({c:'co',z:this.code});
		} else {
			setTimeout( this.startup.bind(this), 300 );
		}
	}

	recv(data)
	{
		console.log("Console received: ", data);
		var e = gE("result" + this.code);
		e.innerText += data + "\n";
	}

	keyhit(keycode,event)
	{
		if( event.target != document.forms[this.code].msg ) {
			return 0;
		}
		if( event.key == "ArrowUp" ) {
			event.preventDefault();

		} else if( event.key == "ArrowDown" ) {
			event.preventDefault();

		} else if( event.key == "ArrowLeft" || event.key == "ArrowRight" || event.key == "End" ) {
			event.preventDefault();

		} else if( event.key == 'Enter' ) {
			event.preventDefault();
			this.sendTyped();
		}

		return -1;
	}

	sendTyped()
	{
		var keys = document.forms[this.code].msg.value;
		if( keys == "" ) return;
		this.send(keys);
		document.forms[this.code].msg.value="";
	}

	send(msg)
	{
		if( msg == "" ) this.sendTyped();
		else sendSocket({c:'co',z:this.code,s:msg});
	}
}