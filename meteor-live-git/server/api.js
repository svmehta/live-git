Meteor.Router.add({

  '/bootstrap' : function () {
    var body = this.request.body;

    // create the user if it doesn't exist
    var userId = Users.findOne ({name : body.name, email : body.email});

    if (!userId) {
      Users.insert ({name : body.name, email: body.email}, function (err, userId) {
        if (err) {
          return (err);
        } else {
          return [200, {userId : userId}];
        }
      });      
    } else {
      return [200, {userId : userId}];      
    }
  },
  
  /*
   * let client know last commit in db for a given branch
   */
  '/status': function() {
    var body = this.request.body;
    var user = apiHelpers.getUserForComputer (body.computerId);

    var query = {
      computerId : body.computerId,
      branchName : body.branchName,
      clientDir : body.clientDir,
      userId : user._id
    };

    WorkingCopies.findOne(query,
      function(err, result){ 
      if(!err){
        //TODO
        return result;
      } else{
        return(err);
      }
    });
  },

  '/update' : function() {
    var body = this.request.body;
    var clientGitData = body.gitData;
    var user = apiHelpers.getUserForComputer (body.computerId);

    var query = {
      computerId : body.computerId,
      branchName : body.branchName,
      clientDir : body.clientDir,
      userId : user._id
    };

    var workingCopy = WorkingCopies.findOne(query);

    if (!workingCopy) {
      WorkingCopy.insert(query, 
        function (err, workingCopyId) {
          if (err) {
            return [500, 'could not create new workingCopy'];
          } else {
            // log the commits
            var updates = apiHelpers.insertNewCommits (workingCopyId, clientGitData);
            apiHelpers.updateWorkingCopy (updates, workingCopyId, function (err) {
              if (err) {
                return [500, 'could not update workingCopy'];
              } else {
                return [200, 'new working copy created'];
              }
            });
          }
        });
    } else {
      var updates = apiHelpers.insertNewCommits (workingCopy._id, clientGitData);
      apiHelpers.updateWorkingCopy (updates, workingCopyId, function (err) {
        if (err) {
          return [500, 'could not update workingCopy'];
        } else {
          return [200, 'new working copy created'];
        }
      });
    }
  }

});


var apiHelpers = {

  getUserForComputer : function (computerId) {
    return Users.findOne ({computerId : computerId});
  },
  
  updateWorkingCopy : function (updates, workingCopyId) {
    WorkingCopies.update({_id : workingCopy._id}, updates, function (err) {
      if (err) {
        callback(err);
      } else {
        callback();
      }
    });
  },

  insertNewCommits : function (workingCopyId, clientGitData) {
    var newCommits = [];
    var updates = {
      $addToSet : {commitIds : {$each : newCommits}}
    };

    var commits = Commits.find ({workingCopyId : workingCopyId});
    var hashes = _.filter (function (commit) { return commit.clientHash});
    
    clientGitData.commits.forEach (function (commit) {
      if (hashes.indexOf (commit.clientHash) !== -1) {
        var commitId = Commits.insert (commit);
        newCommits.push (commitId);
      } else {
        //TODO: do we need to sync these to make sure stuff hasn't changed?
      }
    });

    return updates;
  }

}