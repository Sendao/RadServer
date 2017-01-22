/*

tool/file.js
Safe file i/o layer.

Specifically this is needed because node has failsafe defaults instead of functional defaults for file i/o.

- write to positions
 - if the position doesn't exist, append spaces/blanks
- configurable blank (spaces, zeroes, null character)
- binary i/o using utf8 encoding
- splice file contents

*/

var fs = require('fs');

function FileObject(app) {
    
    this.filenames = {};
    this.blank = ' ';

    this.open = function( fn ) {
        var h = null;

        if( !fs.existsSync(fn) ) {
            h = fs.openSync(fn, "w");
        } else {
            h = fs.openSync(fn, "r+");
        }
        this.filenames[h] = fn;
        
        return h;
    };
    
    this.close = function( handle ) {
        fs.close(handle);
        delete this.filenames[handle];
    };
    
    this.size = function( handle ) {
        var st = fs.statSync( this.filenames[handle] );
        return st['size'];
    };
    
    this.write = function( handle, position, str, length=-1 )
    {
        if( length == -1 ) length = str.length;
        
        var sz = this.size(handle), i;
        var bs = '';

        var tbuf = new Buffer(10);
        //fs.readSync(handle,tbuf,0,4,0);
        
        if( sz < position ) {
            i = sz;
            while( i < position ) {
                bs += this.blank;
                ++i;
            }
            tbuf = new Buffer(bs);
            fs.writeSync( handle, tbuf, sz, position-sz, 0 );
        }
        var buf = new Buffer(bs);
        fs.writeSync( fd, buf, mobj[0]+adjStart, mobj[1] + adjEnd, 0 );
        fs.writeSync( handle, buf, position, length, 0 );        
    };
    
    this.splice = function( handle, position, length, newstr, strlength=-1 )
    {
        if( strlength == -1 ) strlength = newstr.length;
        
        //! todo: write me.
    };
};

module.exports = FileObject;
