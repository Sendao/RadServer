module.exports = function GithubData() {
    this.getProjects = function(projectref) {
        var xd = this.base.projects;

        var project = xd.get(projectref);
        if( project === false )
            console.log("Project ", projectref, " not found.");
        
        return project;
    };
    this.findProjects = function(name) {
        var xd = this.base.projects;

        var projects = xd.search('name', name);
        if( projects === false )
            console.log("Project '" + name + "' not found.");
        
        return projects;
    };
    this.postProjects = function(params) {
        var prj, xd = this.base.projects;
        
        if( (prj = xd.fetch( xd.find('name', params.name) )) !== false ) {
            xd.edit( prj, params );
        } else {
            prj = xd.create( params );
            console.log("New project", prj);
            xd.save( prj );
        }
        
        return prj;
    };
    this.removeProjects = function(params) {
        var prj, xd = this.base.projects;
        
        prj = this.findProjects(params.project);
        if( !prj ) {
            console.log(this.base.projects.fileindex);
            return false;
        }
        prj = prj[0];
        var prjid = prj.id;
        xd.deleteRecordsById([prjid]);
        return true;
    };
    
    
    
    this.getBranches = function(branchref) {
        var xd = this.base.branches;

        var branch = xd.get(branchref);
        if( branch === false )
            console.log("Branch " + branchref + " not found.");
        
        return branch;
    };
    this.findBranches = function(name) {
        var xd = this.base.branches;

        var branches = xd.search('name', name);
        if( branches === false )
            console.log("Branch '" + name + "' not found.");
        
        return branches;
    };
    this.postBranches = function(params) {
        var prj, xd = this.base.branches;
        
        if( (prj = xd.fetch( xd.find('name', params.name) )) !== false ) {
            xd.edit( prj, params );
        } else {
            prj = xd.create( params );
            console.log("New branch", prj);
            xd.save( prj );
        }
        
        return prj;
    };
    this.removeBranches = function(params) {
        var prj, xd = this.base.branches;
        
        prj = this.findBranches(params.branch);
        if( !prj ) {
            console.log(this.base.branches.fileindex);
            return false;
        }
        prj = prj[0];
        var prjid = prj.id;
        xd.deleteRecordsById([prjid]);
        return true;
    };
    
    
    
    
    this.getTargets = function(targetref) {
        var xd = this.base.targets;

        var target = xd.get(targetref);
        if( target === false )
            console.log("Target " + targetref + " not found.");
        
        return target;
    };
    this.findTargets = function(name) {
        var xd = this.base.targets;

        var targets = xd.search('name', name);
        if( targets === false )
            console.log("Target '" + name + "' not found.");
        
        return targets;
    };
    this.postTargets = function(params) {
        var prj, xd = this.base.targets;
        
        if( (prj = xd.fetch( xd.find('name', params.name) )) !== false ) {
            xd.edit( prj, params );
        } else {
            prj = xd.create( params );
            console.log("New target", prj);
            xd.save( prj );
        }
        
        return prj;
    };
    this.removeTargets = function(params) {
        var prj, xd = this.base.targets;
        
        prj = this.findTargets(params.target);
        if( !prj ) {
            console.log(this.base.targets.fileindex);
            return false;
        }
        prj = prj[0];
        var prjid = prj.id;
        xd.deleteRecordsById([prjid]);
        
        return true;
    };
    
    
};
