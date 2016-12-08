var fs = require('fs');
var async = require('async');

module.exports = function ChatData() {
	
	this.workcycle = function(){
		//! debug, possibly
	};
    
    this.getChat = function( )
    {
        this.base.chat.Posts.records;
    };
    
    this.postChat = function( name, fromip, message )
    {
    	var xd = this.base.chat.Posts;
    	var ch = xd.create();
    	ch.name = name;
    	ch.fromip = fromip;
    	ch.message = message;
    	ch.when = new Date().getTime();
    	xd.save( ch );
    	return ch;
    };
    
};
