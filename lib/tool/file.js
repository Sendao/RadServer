"use strict";
/*
Safe file i/o layer.

Specifically this is needed because node has failsafe defaults instead of functional defaults for file i/o.

- write to positions
 - if the position doesn't exist, append spaces/blanks
- configurable blank (spaces, zeroes, null character)
- binary i/o using utf8 encoding
- splice file contents

*/
const fs = await import("fs");
const os = await import("os");

export function FileObject(app) {
  this.app = app;
  this.filenames = {};
  this.blank = ' ';

    this.realfn = function( fn ) {
      let userinfo = os.userInfo();
      return fn.replace("~", "/home/" + userinfo.username);
    }
    this.logto = async function (fn, str) {
      fn = this.realfn(fn);
        var h = await this.open(fn);
        await this.append(h, str + "\n");
        await this.close(h);
        console.log(str);
    };
    this.open = async function (fn) {
      fn = this.realfn(fn);
        var h = null;
        if (!await fs.existsSync(fn)) {
            h = await fs.openSync(fn, "w");
        }
        else {
            h = await fs.openSync(fn, "r+");
        }
        this.filenames[h] = fn;
        return h;
    };
    this.close = async function (handle) {
        await fs.closeSync(handle);
        delete this.filenames[handle];
    };
    this.size = async function (handle) {
        var st = await fs.statSync(this.filenames[handle]);
        return st['size'];
    };
    this.append = async function (handle, str, length) {
        if (length === void 0) { length = -1; }
        var position = await this.size(handle);
        await this.write(handle, position, str, length);
    };
    this.read = async function (handle) {
        var st = await fs.statSync(this.filenames[handle]);
        var sz = st['size'];
        var buf = Buffer.alloc(sz);
        await fs.readSync(handle, buf, 0, sz, 0);
        return buf;
    };
    this.write = async function (handle, position, str, length) {
        if (length === void 0) { length = -1; }
        if (length == -1)
            length = str.length;
        var sz = await this.size(handle), i;
        var bs = '';
        var tbuf;
        //fs.readSync(handle,tbuf,0,4,0);
        if (sz < position) {
            //console.log("Padding from " + sz + " to " + position);
            i = sz;
            while (i < position) {
                bs += this.blank;
                ++i;
            }
            //console.log("Message = '" + bs + "' = " + bs.length);
            tbuf = Buffer.from(bs);
            await fs.writeSync(handle, tbuf, 0, position - sz, sz);
            /*
            // file must be closed and reopened with newest node
            fs.closeSync( handle );
            console.log("Reopen " + this.filenames[handle]);
            h = fs.openSync( this.filenames[handle], "r+");
            */
        }
        var buf;
        if (typeof str == 'object' && Buffer.isBuffer(str)) {
            buf = str;
        }
        else {
            buf = Buffer.from(str);
        }
        //console.info(handle, buf.length, position, length);
        //console.log("Write buffer: " + str);
        await fs.writeSync(handle, buf, 0, length, position);
        //console.log("Write completed (" + this.filenames[handle] + ")");
    };
    this.splice = function (handle, position, length, newstr, strlength) {
        if (strlength === void 0) { strlength = -1; }
        if (strlength == -1)
            strlength = newstr.length;
        //! todo: write me.
    };
}
