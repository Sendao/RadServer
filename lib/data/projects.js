module.exports = function ProjectsData() {
    this.sendMail = function( to, ccs, subj, msg, cb )
    {
        app.util.connectMailer();
        app.util.sendMessage(to,ccs,subj,msg,cb);
    };

    this.getProject = function(projectref) {
        var xd = this.base.projects;

        var project = xd.get(projectref);
        if( project === false )
            console.log("Project " + projectref + " not found.");
        
        return project;
    };
    this.findProjects = function(name) {
        var xd = this.base.projects;

        var projects = xd.search('name', name);
        if( projects === false )
            console.log("Project '" + name + "' not found.");
        
        return projects;
    };
    
    this.postProject = function(params) {
        var prj, xd = this.base.projects;
        
        if( (prj = xd.fetch( xd.find('name', params.name) )) !== false ) {
            xd.edit( prj, params );
        } else {
            prj = xd.create( params );
            console.log("New project", prj);
            xd.save( prj );
        }
        this.ctrl.changeProp("project." + prj.id, prj);
        
        return prj;
    };

    this.removeHours = function(params) {
        var prj, xd = this.base.projects;
        
        prj = this.findProjects(params.project);
        if( !prj ) {
            console.log(this.base.projects.fileindex);
            return false;
        }
        prj = prj[0];
        
        xd = this.base.Table( 'Hours', prj.name + '/hours', prj );
        xd.deleteRecordsById([params.id]);
        this.ctrl.changeProp("project." + prj.id  + ".hours-", params.id);
        return true;
    };
    this.postHours = function(params) {
        var prj, xd = this.base.projects;
        
        prj = this.findProjects(params.project);
        if( !prj ) {
            console.log(this.base.projects.fileindex);
            return false;
        }
        prj = prj[0];
        
        var hour, xd = this.base.Table( 'Hours', prj.name + '/hours', prj );
        hour = xd.create(params);
        xd.save( hour );
        this.ctrl.changeProp("project." + prj.id + ".hours+", hour);
        
        console.log("Posted hours: ", hour);
        
        return hour;
    };

    this.removeFeats = function(params) {
        var prj, xd = this.base.projects;
        
        prj = this.findProjects(params.project);
        if( !prj ) {
            console.log(this.base.projects.fileindex);
            return false;
        }
        prj = prj[0];
        
        xd = this.base.Table( 'Features', prj.name + '/features', prj );
        xd.deleteRecordsById([params.id]);
        this.ctrl.changeProp("project." + prj.id  + ".features-", params.id);
        return true;
    };
    this.postFeats = function(params) {
        var prj, xd = this.base.projects;
        
        prj = this.findProjects(params.project);
        if( !prj ) {
            console.log(this.base.projects.fileindex);
            return false;
        }
        prj = prj[0];

        var feat, xd = this.base.Table( 'Features', prj.name + '/features', prj );
        if( xd == null ) xd = new this.base.Features(prj);
        feat = xd.create(params);
        xd.save( feat );
        this.ctrl.changeProp("project." + prj.id + ".features+", feat);
        console.log("Posted feats: ", feat);
        
        return feat;
    };
    
};
