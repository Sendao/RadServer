let semaNet = {
	data: [],
	tracer: {},
	keys: [],
	fmsize: 0,
	count: 0,
	changed: false,
	scores: null,
	dims: { }, // dims[name]=dimension number
	dimsizes: [ ], // max size of each dimension
	dimfacts: [ ], // factor to multiply by to get within appropriate size
	dimlen: null,
	dimcfg: [],

	configure: function(dimrats) {
		this.dimcfg = dimrats.slice(); // yep it's what's for breakfast, I'm updating your configuration just in case.
	},

	setup: function(words, params) {

		for( var f in params ) {
			if( !(f in this.dims) ) {
				this.dims[f] = this.dimsizes.length;
			}
			var mn=Infinity, mx=-Infinity;
			for( var w in words ) {
				let v = words[w][f];

				mn = Math.min(mn,v);
				mx = Math.max(mx,v);
			}
			this.dimsizes.push( [ mn, mx ] );
		}

		let count = Object.keys(words).length;
		this.fmsize = Math.sqrt(count);
		this.dimlen = this.dimsizes.length;

		for( var f in this.dims ) {
			this.dimfacts[f] = Math.ceil( (this.dimsizes[f][1]-this.dimsizes[f][0])/this.fmsize );
		}

		this.scores = words;
		let key = 0;
		var pos;

		for( var w in words ) {
			pos = new Array(this.dimlen).fill(0);
			for( var f in params ) {
				let n = this.dims[f];
				pos[ n ] = this.coord(n, words[w][f]);
			}
			for( var i=0; i<this.dimlen; i++ ) {
				pos.push(this.coord(i, v));
			}
			this.move(w,pos);
		}
	},

	coord: function(dimn, val) {
		return Math.min( this.dimsizes[dimn]-1, Math.abs(parseInt(val*this.dimfacts[dimn])) );
	},

	move: function(word,pos){
		let ptr = this.data;
		for( var i=0; i<pos.length; i++ ) {
			while( pos[i] >= ptr.length ) ptr.push([]);
			ptr = ptr[pos[i]];
		}
		ptr.push(word);
		this.tracer[word] = pos.slice();
	},

	search: function(word, distratio) {
		if( this.data === null ) {
			return [0,new THREE.Vector3()];
		}
		var pos = this.tracer[word];
		var dist = [], fmx = [];

		for( var i=0; i<pos.length; i++ ) {
			dist.push( distratio * this.dimsizes[i] * this.dimcfg[i] );
		}


		//inside_envelope *= inside_envelope;
		//outside_envelope *= outside_envelope;
		//target_space *= target_space;

		
		var x0,y0,z0,x1,y1,z1;
		let lim = this.coord(outside_envelope*0.501);
		x0 = fmx - lim; y0 = fmy - lim; z0 = fmz - lim;
		x1 = fmx + lim; y1 = fmy + lim; z1 = fmz + lim;
		if( x0 < 0 ) x0 = 0;
		if( y0 < 0 ) y0 = 0;
		if( z0 < 0 ) z0 = 0;
		if( x1 > this.fmsize-1 ) x1 = this.fmsize-1;
		if( y1 > this.fmsize-1 ) y1 = this.fmsize-1;
		if( z1 > this.fmsize-1 ) z1 = this.fmsize-1;

		let match_count=0;
		for( var X = x0; X<=x1; X++ ) {
			for( var Y = y0; Y<=y1; Y++ ) {
				for( var Z = z0; Z<=z1; Z++ ) {
					let lst = this.data[X][Y][Z];
					for( var i=0; i<lst.length; i++ ) {
						let w2 = lst[i].word;
						if( w2 == word ) continue;
						if( !(w2 in nodes) ) {
							console.log("Missing word: " + w2);
							continue;
						}
						let node = nodes[w2];
						let w2x = node[0]+node[9], w2y = node[1]+node[10], w2z = node[2]+node[11];
						var v2 = new THREE.Vector3( w2x, w2y, w2z );
						let d = dist(word,w2);
						var x2;

						if( d >= outside_envelope || d <= 0 ) continue; // positive x2 = move word towards w2
						if( w2 in graph[word].connections ) {
							x2 = d - target_space;
						} else {
							x2 = outside_envelope - d;
						}


						let v = v2.sub(v1);
						v.normalize();

						result.x += v.x*x2;
						result.y += v.y*x2;
						result.z += v.z*x2;
						match_count++;
						if( match_count > max_matches ) break;
					}
					if( match_count > max_matches ) break;
				}
				if( match_count > max_matches ) break;
			}
			if( match_count > max_matches ) break;
		}
		return [match_count,result];
	},
  update: function(){
    if( this.data === null ) {
      this.data=new Array(this.fmsize).fill(null);
      for( var i=0; i<this.fmsize; i++ ) {
        this.data[i] = new Array(this.fmsize).fill(null);
        for( var j=0; j<this.fmsize; j++ ) {
          this.data[i][j] = new Array(this.fmsize).fill(null);
          for( var k=0; k<this.fmsize; k++ ) {
            this.data[i][j][k] = [];
          }
        }
      }
      this.changed=true;
    }

    let disp=new Array(this.fmsize).fill(null);
    for( i=0; i<this.fmsize; i++ ) {
      disp[i] = new Array(this.fmsize).fill(null);
      for( j=0; j<this.fmsize; j++ ) {
        disp[i][j] = new Array(this.fmsize).fill(null);
        for( k=0; k<this.fmsize; k++ ) {
          disp[i][j][k] = 0;
        }
      }
    }
    if( this.heat !== null ) {
      var i,j,k,I,J,K;

      for( i=0; i<this.fmsize; i++ ) {
        for( j=0; j<this.fmsize; j++ ) {
          for( k=0; k<this.fmsize; k++ ) {
            disp[i][j][k] = (1-heat_loss) * this.heat[i][j][k];
            for( I=-1; I<2; I++ ) {
              if( I+i < 0 || I+i >= this.fmsize ) continue;
              for( J=-1; J<2; J++ ) {
                if( ( I != 0 ) && ( J != 0 ) ) continue;
                if( J+j < 0 || J+j >= this.fmsize ) continue;
                for( K=-1; K<2; K++ ) {
                  if( ( ( I != 0 ) || ( J != 0 ) ) && ( K != 0 ) ) continue;
                  if( K+k < 0 || K+k >= this.fmsize ) continue;
                  disp[i][j][k] += heat_diffuse * this.heat[i+I][j+J][k+K];
                }
              }
            }
          }
        }
      }
    }
    this.heat=disp;
    if( this.changed ) {
      this.changed = false;
      this.calculateSize();
    }
    for( var word in nodes ) {
      this.move( word );
    }
  },
  remove: function(word,olx=null,oly=null,olz=null){
    let node = nodes[word];
    if( olx === null ) {
      olx = origin[word][0];
      oly = origin[word][1];
      olz = origin[word][2];
    }
    var lst = this.data[olx][oly][olz];
    var item = false;
    for( var i=0; i<lst.length; i++ ) {
      if( lst[i].word == word ) {
        item = lst[i];
        lst.splice(i,1);
        break;
      }
    }

/*
    if( item !== false && this.heat !== null ) {
      graph[word].heat += heat_spread * this.heat[olx][oly][olz];
      this.heat[olx][oly][olz] *= (1-this.heat_spread);
    }*/

    return item;
  }
};
