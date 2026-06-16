export function VFSDB(myapp) {
	var app = myapp;
	var mongoose = app.mongoose;
  
	this.bookmarks = [
    'id', 'createdt', 'userid', 'parentid',
    'name', 'path', 'line'
  ];
  this.Bookmarks = app.db.table('bookmarks', this.bookmarks, [ 'createdt', 'userid', 'parentid', 'name' ] );

  this.pathmarks = [
    'id', 'createdt', 'userid', 'parentid',
    'name', 'path'
  ];
	this.Pathmarks = app.db.table('bookpaths', this.pathmarks, ['userid','parentid','createdt','name','path']);

};
  
