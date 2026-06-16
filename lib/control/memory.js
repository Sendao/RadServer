export function MemoryControl() {

  this.routes = function(router) {
    //this.base.autoRoutes(router, '/card/', '.js');
    router.post('/chat.js').bind( this.chatSend.bind(this));
    router.get('/words.js').bind( this.getWords.bind(this));
    router.get('/bufdist.js').bind( this.bufDist.bind(this));
    router.post('/def.js').bind( this.updDef.bind(this));

//    router.post('/card/parse').bind( this.updParser.bind(this) );
//    router.get( '/card/c' ).bind( this.retrieveCache.bind(this) );
  };

  this.updDef = function(req, res, params)
  {
    const word = params['w'];
    const pid = params['p'];
    const def = params['d'];
  };

  this.bufDist = function(req, res, params)
  {
    const buf1 = params['a'];
    const buf2 = params['b'];

    let dist = this.app.me.bufdist(buf1, buf2);
    this.app.response.jsonOk(res,{dist});
  }
  this.bufSave = function(req, res, params)
  {
    // 1. require login, sess and sess.user
    // 2. assign buffer to user and create table entry
    // 3. calculate and store text module
    // 4. calculate and store startup module for faster boot entry

    const buf = params['txt'];

    let tokens = this.app.me.toTokens(buf);
    let chainer = this.app.me.textModule(tokens);

    this.app.response.jsonOk(res,{tokens});
  }


  this.getWords = async function(req, res, params)
  {
    const strata = params['q'];
    const tokens = this.app.me.toTokens(strata);

    let objects = {};

    for( const token of tokens ) {
      const word = this.app.me.xdict[token];
      const o = { word, token, defs: [], ex: [] };
      objects[word] = o;

      let node = await this.app.kb.getWord( word );
      if( typeof node == 'undefined' ) {
        o.pos = 'u';
        continue;
      }

      let _defs = await node.getParams('def');
      for( var _def of _defs ) {
        let def = await this.app.wordlib.resolveNode( _def );
        o.defs.push(def);
      }

      let pos = await node.getParam('pos');
      o.pos = await this.app.wordlib.resolveNode(pos);

      let _exs = await node.getParams('ex');
      for( var _ex of _exs ) {
        let ex = await this.app.wordlib.resolveNode( _ex );
        o.exs.push(ex);
      }
    }

    this.app.response.jsonOk(res, {objects});
  }
};
