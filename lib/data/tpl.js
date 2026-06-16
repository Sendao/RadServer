export function templating() {
  this.modlocaL = function(app)
  {

// splits ${} and *{} variables out into format:
// [ {0,raw_text}, {1,variable}, {0,raw_text}.... ]
  this.processTPL = function(src)
  {
    var objs = [];
    var i, mode=0, depth=0;
    var buf = '';

    for( i=0; i<src.length; ++i ) {
      //console.log("Process mode="+mode+" src["+i+"]=" + src[i] + " depth="+depth);
      if( mode > 0 ) {
        if( src[i] == '{' ) {
          depth++;
        } else if( src[i] == '}' ) {
          depth--;
          if( depth<0 ) {
            objs.push( { mode, code: buf } );
            mode=0;
            buf='';
            depth=0;
            continue;
          }
        }
      } else if( mode == 0 ) {
        if( src[i] == '$' ) {
          if( src[i+1] == '{' ) {
            if( buf != '' ) {
              objs.push( { mode, code: buf } );
            }
            mode = 1;
            buf = '';
            i++;
          } else {
            buf += '$';
          }
          continue;
        } else if( src[i] == '*' ) {
          if( src[i+1] == '{' ) {
            if( buf != '' ) {
              objs.push( { mode, code: buf } );
            }
            mode = 2;
            buf = '';
            i++;
          } else {
            buf += '*';
          }
          continue;
        }
      }
      buf += src[i];
    }

    if( buf != '' )
      objs.push( { mode, code: buf } );
    return objs;
  };

  this.processTPLVars = function(objs)
  {
    var inputs = [];
    var vars = [], v;
    var i;

    console.log("ProcessVars");
    for( i=0; i<objs.length; ++i ) {
      if( objs[i].mode == 2 )
        vars.push( objs[i].code );
    }

    console.log(vars);
    for( i=0; i<vars.length; ++i ) {
      v = vars[i].split(",");
      inputs.push( { name: v[0], stype: v[1], default: v.length>2?v[2]:'' } );
    }

    console.log(inputs);

    return inputs;
  };

    // <!-- modlocal -->
  };
};


