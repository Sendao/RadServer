
module.exports = function ClientsControl() {
  
    this.routes = function(router) {
        router.post('/ggrid.js').bind( this.googleGrid.bind(this) );
        router.get('/ggrid.json').bind( this.googleGridStart.bind(this) );
    };
    
    this.googleGridStart = function(req, res, params) {
        var sess = this.app.authSession(params);
        var xd = this.base.searchers;
        //! load searchers
        
        var xd = this.base.pages;
        //! load pages
        
        //! create session registry for data paths
    };
    
    this.googleGrid = function(req, res, params) {
        // update a value
        
    };
    
};
