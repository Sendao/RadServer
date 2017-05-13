
module.exports = function GGridData() {
    
    this.quiet_loop = 0;
    this.searchReady = false;
    this.nextSearch = false;
    this.nextSearchTime = false;
    this.nextSearchN = false;
    
    this.workcycle = function() {
        var cc = this, i;
        var xd = this.base.searchers;
        var tmn = new Date().getTime()/1000;
        var si;
        
        if( xd.count() <= 0 ) {
            return false;
        }
        
        if( this.searchReady === false ) {
            var searchers = this.base.searchers.all();
            this.searchList = searchers;
            this.searchReady = true;
            console.log("Searchers = ", searchers);
        }
        if( typeof this.nextSearch == 'undefined' || this.nextSearch === false ) {
            var searchMin = tmn + 360000, searchN; //~5 days
            
            for( i=0; i<this.searchList.length; ++i ) {
                si = this.searchList[i];
                if( si.scanDt >= tmn && si.scanDt < searchMin ) {
                    searchN = i;
                    searchMin = si.scanDt; 
                }
            }
            this.nextSearchTime = searchMin;
            this.nextSearchN = searchN;
        }
        if( this.nextSearchTime < tmn ) return;
        si = this.searchList[this.nextSearchN];
        console.log("SI = ", si);
        /*
        this.request("https://www.google.com/webhp?ion=1&espv=2&ie=UTF-8#q=" + encodeURIComponent( si.terms ),
            function(err, response, body) {
                if( response != 200 ) {
                    console.log("Request response ", response,  " query: ", encodeURIComponent( si.terms ) );
                } else {
                    var jsobj = cc.cheerio.load(body);
                    var jstr = JSON.stringify(jsobj);
                    console.log("Request response well formed");
                    console.log(jstr);
                    si.results = jstr;
                    si.lastDt = tmn;
                    si.scanDt = tmn + 86400; // "tomorrow"
                    xd.save(si);
                    // si.scanDt = tmn + 60; // "in one minute"
                }
            } ); */
    };
    
    this.findSearchers = function(name) {
        var xd = this.base.searchers;

        var searchers = xd.search('name', name);
        if( searchers === false )
            console.log("Searcher '" + name + "' not found.");
        
        return searchers;
    };
    
    this.addSearcher = function(params)
    {
        var xd = this.base.searchers;
        var a = xd.create(params);
        xd.save(a);
        return a;
    };
    
    this.updSearcher = function(params)
    {
        var xd = this.base.searchers;
        var a = xd.search(params);
        var e = xd.edit(a, params);
        return e;
    };
    
    
};


