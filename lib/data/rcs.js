var fs = require('fs');
var async = require('async');
var usage = require('usage');

module.exports = function GitData() {
    
    this.requestRepoData = function( auth ) {
        var cc = this;
        var repos = [];
        this.tool.util.FibreRing( function() {
            auth.token = auth.token.trim();
            console.log("Token:", auth.token);
            this.tool.git.OauthToken( auth.token );
            var in_repos = this.tool.git.getRepos();
            var i;
            var db_branch, db_commit;
            var in_repo, in_branch, in_commit;
            for( i=0; i<in_repos.length; i++ ) {
                in_repo = in_repos[i];
                var repo = this.base.repos.create( in_repo );
                db_branch = new this.base.Branches( repo );
                for( j=0; j<in_repo.branches.length; j++ ) {
                    in_branch = in_repo.branches[j];
                    var branch = db_branch.create( in_branch );
                    db_commit = new this.base.Commits( repo, branch );
                    for( k=0; k<in_branch.commits.length; k++ ) {
                        in_commit = in_branch.commits[k];
                        var commit = db_commit.create( in_commit );
                        db_commit.save(commit);
                    }
                    db_branch.save(branch);
                }
                this.base.repos.save( repo );
                repos[ repo.id ] = repo;
            }
        }, this)();
        return repos;
    };
        
    this.oauthToken  = function(ident_cookie, token) {
        this.base.auth.loadRecords();
        
        //! save token
        
        this.base.auth.saveRecords();
    };
    
    
};

