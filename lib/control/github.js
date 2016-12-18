var async = require('async');

module.exports = function MonitorControl() {
        
    this.routes = function( router ) {
        router.get('/github/projects.json').bind(this.getGithubProjects.bind(this));
        router.get('/github/branches.json').bind(this.getGithubBranches.bind(this));
        router.get('/github/targets.json').bind(this.getGithubTargets.bind(this));
        router.post('/github/projects.json').bind(this.putGithubProjects.bind(this));
        router.post('/github/branches.json').bind(this.putGithubBranches.bind(this));
        router.post('/github/targets.json').bind(this.putGithubTargets.bind(this));
        router.get('/github/clone.js').bind(this.doClone.bind(this));
        router.get('/github/checkout.js').bind(this.doCheckout.bind(this));
        router.get('/github/pull.js').bind(this.doPull.bind(this));
        router.get('/github/push.js').bind(this.doPush.bind(this));
        router.get('/github/commit.js').bind(this.doCommit.bind(this));
    };
    
    this.getGithubProjects = function(req,res,params) {
        var sess;
        if( !(sess=this.app.requireAuth(res,params)) ) return;
        
        var prjlist = this.data.getProjects(params);
        if( prjlist ) {
            res.send(200, {}, {'status':'ok', 'code': 'projects', 'data': prjlist});
        } else {
            res.send(200, {}, {'status':'404', 'code': 'projects' });
        }
    };
    
    this.getGithubBranches = function(req,res,params) {
        var sess;
        if( !(sess=this.app.requireAuth(res,params)) ) return;
        
        var prjlist = this.data.getBranches(params);
        if( prjlist ) {
            res.send(200, {}, {'status':'ok', 'code': 'branches', 'data': prjlist});
        } else {
            res.send(200, {}, {'status':'404', 'code': 'branches' });
        }
    };
    
    this.getGithubTargets = function(req,res,params) {
        var sess;
        if( !(sess=this.app.requireAuth(res,params)) ) return;
        
        var prjlist = this.data.getTargets(params);
        if( prjlist ) {
            res.send(200, {}, {'status':'ok', 'code': 'targets', 'data': prjlist});
        } else {
            res.send(200, {}, {'status':'404', 'code': 'targets' });
        }
    };
    
    this.putGithubProjects = function(req,res,params) {
        var sess;
        if( !(sess=this.app.requireAuth(res,params)) ) return;
        
        var prjlist = this.data.postProjects(params);
        if( prjlist ) {
            res.send(200, {}, {'status':'ok', 'code': 'projects', 'data': prjlist});
        } else {
            res.send(200, {}, {'status':'404', 'code': 'projects' });
        }
    };
    
    this.putGithubBranches = function(req,res,params) {
        res.send(200, {}, {'status':'unimplemented'});
    };
    
    this.putGithubTargets = function(req,res,params) {
        res.send(200, {}, {'status':'unimplemented'});
    };
    
    this.doClone = function(req,res,params) {
        res.send(200, {}, {'status':'unimplemented'});
    };
    
    this.doPush = function(req,res,params) {
        res.send(200, {}, {'status':'unimplemented'});
    };
    
    this.doPull = function(req,res,params) {
        res.send(200, {}, {'status':'unimplemented'});
    };
    
    this.doCommit = function(req,res,params) {
        res.send(200, {}, {'status':'unimplemented'});
    };
    
};
    
    