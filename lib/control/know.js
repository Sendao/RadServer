export function KnowControl() {

  this.routes = function(router) {
    //this.base.autoRoutes(router, '/card/', '.js');


    router.get('/know/node').bind(this.requestNode.bind(this));
    router.get('/know/param').bind(this.requestParam.bind(this));



  };

  this.initialized = false;

  this.startup = function() {
    if( this.initialized ) return;


    this.initialized = true;    
  };

  this.requestWord = async function(req, res, params, cb) {
    await sess = this.app.requireAdmin(req,res,params);
    if( !sess ) return;

    let word = params['w'];
    let obj = await this.app.words.getWord(word);

    this.app.response.jsonOk(obj);
  };

  this.requestNode = async function(req, res, params, cb) {
    await sess = this.app.requireAdmin(req,res,params);
    if( !sess ) return;

    let ids = params['id'];
    let nums = [];
    if( typeof ids == 'string' && ids.indexOf(",") != -1 ) {
      nums = ids.split(",").map( (x) => Number(x) );
    } else {
      nums = [ Number(ids) ];
    }

    let objs = [];
    for( var id of nums ) {
      let node = await this.app.wordlib.getNode(id);
      objs.push(node);
    }

    this.app.response.jsonOk(objs);
  };

  this.requestParam = function(req, res, params, cb) {
    await sess = this.app.requireAdmin(req,res,params);
    if( !sess ) return;

    let ids = params['id'];
    let nums = [];
    if( typeof ids == 'string' && ids.indexOf(",") != -1 ) {
      nums = ids.split(",").map( (x) => Number(x) );
    } else {
      nums = [ Number(ids) ];
    }

    let objs = [];
    for( var id of nums ) {
      let param = await this.app.wordlib.getParam(id);
      objs.push(param);
    }

    this.app.response.jsonOk(objs);
  };

  
};
