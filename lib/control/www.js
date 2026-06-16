export function WWWControl() {

  this.routes = function(router) {
    //this.base.autoRoutes(router, '/card/', '.js');

//    router.post('/card/parse').bind( this.updParser.bind(this) );
//    router.get( '/card/c' ).bind( this.retrieveCache.bind(this) );
  };

  this.updSearch = function(req, res, params)
  {
    var sess = this.app.requireAdmin(req,res, params);
    if( !sess ) return;

    
  };
};
