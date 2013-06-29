Meteor.Router.add({
  
  /*
   * let client know last commit in db for a given branch
   */
  '/status': function() {
    var body = this.request.body;

    var query = {
      computerId : body.computerId,
      branchName : body.branchName,
      clientDir : body.clientDir
    };

    WorkingCopies.findOne(query,
      function(err, result){ 
      if(!err){
        return result;
      } else{
        return(err);
      }
    });

  },

  '/update' : function() {
    var body = this.request.body;
    var clientGitData = body.gitData;

    var query = {
      computerId : body.computerId,
      branchName : body.branchName,
      clientDir : body.clientDir
    };

    var workingCopy = WorkingCopies.findOne(query);
    var updates = getMergeUpdates (workingCopy, clientGitData);

    WorkingCopies.update({_id : workingCopy._id}, updates, function (err) {
      if (err) {
        return (err);
      } else {
        
      }
    });

  }


});



var getMergeUpdates = function (workingCopy, clientGitData) {
  var newCommits = [];
  var updates = {
    $addToSet : {commitIds : {$each : newCommits}}
  };
  var commits = Commits.find ({});
  var hashes = _.filter (function (commit) { return commit.clientHash});
  
  clientGitData.commits.forEach (function (commit) {
    if (hashes.indexOf (commit.clientHash) !== -1) {
      // create a commit
      var commitId = Commits.inset (commit);
      newCommits.push (commitId);
    } else {
      //TODO: do we need to sync these to make sure stuff hasn't changed?
    }
  });

  return updates;
}