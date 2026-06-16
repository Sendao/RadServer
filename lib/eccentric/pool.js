let pools = {};
var cc;
export function startup(app) {
  app.Pool = new Pool();
}

export function Pool() {
    cc = this;

    this.getPool = function(name) {
        return pools[name];
    };

    this.Pool = function(size, objname, builder, molder) {
        this.name = objname;
        this.pool = new Array(size);//.map( () => ( Types[objname].alloc() ) );
        this.alloced = size;
        this.used = 0;
        this.freed = [];
        this.maxfreed = 0;
        this.alloc = builder;
        this.mold = molder;

        this.release = function(ptr) {
            this.freed.push(ptr);
            if( this.freed.length > this.maxfreed ) this.maxfreed = this.freed.length;
        };

        this.releaseAll = function(arr) {
            this.freed.concat(arr);
            if( this.freed.length > this.maxfreed ) this.maxfreed = this.freed.length;
        };

        this.get = async function(params) {
            var v;
            if( this.freed.length > 0 ) {
              v = this.freed.shift();
              await this.mold(v, params);
              return v;
            }

            if( this.used >= this.alloced ) { // alloc more, then
                //console.log("Allocate more " + this.name + " (" + this.alloced + ")");
                this.pool = this.pool.concat( await new Array(this.alloced) );//.map( () => ( Types[this.name].alloc() ) ) );
                this.alloced *= 2;
            }
            v = this.pool[this.used] = await this.alloc(params);
            this.used++;
            return v;
        };

        this.report = function() {
            console.log(this.name + ": " + this.alloced + " allocated, " + this.used + " used, " + this.maxfreed + " max in recycling.");
        };
    };

    this.ArrayObj = function(size, numbers=Uint8Array) {
      this.inpool = 1200;
      this.name = 'ui' + size;
      this.count = size;
      this.numbers = numbers;
      
      this.alloc = function() {
        var buf = new this.numbers( size );
        buf.fill(null);
        return buf;
      };
      this.mold = function(n) {
        n.fill(null);
      };
      this.pool = pools[this.name] = new cc.Pool( this.inpool, this.name, this.alloc, this.mold);
    };

    this.ListObj = function(size=0) {
      this.inpool = 1200;
      this.name = 'lo' + size;
      this.members = size;

      this.alloc = function() {
        return [];
      }
      this.mold = function(v) {
        while( v.length > this.members ) v.shift();
        for( var i=0; i<v.length; i++ ) {
          v[i]=0;
        }
        while( v.length < this.members ) v.push(0);
      }
      this.pool = pools[name] = new cc.Pool( this.inpool, this.name, this.alloc, this.mold );
    };


    this.FunctionObj = function(name, newFunc, moldFunc) {
      this.name = name;
      this.inpool = 1200;
      this.alloc = newFunc;
      this.mold = moldFunc;
      this.pool = pools[name] = new cc.Pool( this.inpool, this.name, this.alloc, this.mold );
    };

    this.ClassObj = function(name, protoObj, args) {
      this.name = name;
      this.inpool = 1200;
      this.args = args;

      this.alloc = function() {
        if( typeof this.args == 'undefined' )
          return new protoObj();
        else
          return new protoObj(...this.args);
      };
      this.mold = function(v) {
        v.reset();
      };

      this.pool = pools[name] = new cc.Pool( this.inpool, this.name, this.alloc, this.mold );
    };

    this.ObjectObj = function(name) {
        this.name = name;
        this.inpool = 1200;
        
        this.alloc = function() {
          var i, obj = {};
          return obj;
        }

        this.mold = function(v) {
          for( var k in v ) {
            delete v[k];
          }
        }
        this.pool = pools[name] = new cc.Pool( this.inpool, name, this.alloc, this.mold );
    };

    this.TypedObj = function(name, fields=[]) {
        this.name = name;
        this.fields = fields;

        this.alloc = function(params) {
            var i, obj = {};
            if( typeof params == 'undefined' || Object.keys(params).length == 0 ) {
                for( i in this.fields ) {
                    obj[i] = 0;
                }
            } else {
                for( i in params ) {
                    obj[i] = params[i];
                }
            }
            return obj;
        };

        this.mold = function(v, params) {
            var i;
            if( Object.keys(params).length == 0 ) {
                for( i in this.fields ) {
                    v[i] = 0;
                }
            } else {
                for( i in params ) {
                    v[i] = params[i];
                }
            }
        };

        this.pool = pools[name] = new cc.Pool( 202, name, this.alloc, this.mold );
    };
}
