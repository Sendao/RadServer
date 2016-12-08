module.exports = function ProjectsDB(myapp) {
    var cc = this;
    this.app = myapp;
    var db = myapp.db;
    db.control.call(this, 'projects');
    
    this.Projects = function() {
        this.name = 'projects';
        this.primary = "name";
        this.indice = { "name": {} };
        this.nosave = [ 'hours' ];
        this.loadall = true;
        this.defaults = { 'name': '', 'title': '', 'description': '' };
        
        this.postLoad = function(record)
        {
            if( cc.app.util.typeOf(record) == 'array' ) {
                var rec;
                for( var i=0; i< record.length; i++ ) {
                    rec = record[i];
                    rec.Hours = cc.Table('Hours', 'hours/' + rec.name, rec);
                    rec.Feats = cc.Table('Features', 'features/' + rec.name, rec);
                    rec.descr = rec.dt + ": " + rec.summary;
                }
            } else {
                record.Hours = cc.Table('Hours', 'hours/' + record.name, record);
                record.Feats = cc.Table('Features', 'features/' + record.name, record);
                record.descr = record.dt + ": " + record.summary;
            }
        };
        
        db.convey.call(this, 'projects');
    };
    
    this.Features = function(prj) {
    	this.name = prj.name + "/features";
    	this.primary = 'id';
    	this.indice = { 'id': {}, 'name': {} };
    	this.defaults = { 'id': 0, 'name': '', 'tags': '',
    			'project': prj.name,
    			'summary': '',
    			'notes': '',
    			'start': 0,
    			'end': 0,
    			'dur': 0,
    			'value': 100
    		};
    	db.convey.call(this, 'projects');
    }
    
    this.Hours = function(prj) {
        this.name = prj.name + "/hours";
        this.primary = 'id';
        this.indice = { 'id': {} };
        this.defaults = { 'id': 0,
        		'project': prj.name,
        		'summary': '',
        		'notes': '',
        		'tags': '',
        		'start': 0,
        		'end': 0, 'dur': 0, 'rate': 50 };
        db.convey.call(this, 'projects');
    };
    
    this.projects = new this.Projects();
};
