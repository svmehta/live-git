Meteor.Router.add({

  '/bootstrap' : function () {
    console.log ('bootstrap')
    var body = this.request.body;

    // create the user if it doesn't exist
    var userId = Users.findOne ({name : body.name, email : body.email});

    if (!userId) {
      userId = Users.insert ({name : body.name, email: body.email});
    }

    var compId = apiHelpers.createComputer (userId);
    return [200, JSON.stringify ({computerId : compId})];
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

    return WorkingCopies.findOne(query);
  },

  '/update' : function() {
    var body = this.request.body;
    var clientGitData = body.gitData;

    if (!clientGitData) {
      return [400, 'must provide gitData'];
    }

    var user = apiHelpers.getUserForComputer (body.computerId);

    var query = {
      computerId : body.computerId,
      branchName : body.branchName,
      clientDir : body.clientDir,
      userId : user._id
    };

    var workingCopy = WorkingCopies.findOne(query);

    if (!workingCopy) {
      var workingCopyId = WorkingCopies.insert(query);
      var updates = apiHelpers.insertNewCommits (workingCopyId, clientGitData);
      WorkingCopies.update({_id : workingCopyId}, updates);
      return [200, 'new working copy created'];
    } else {
      var updates = apiHelpers.insertNewCommits (workingCopy._id, clientGitData);
      WorkingCopies.update({_id : workingCopy._id}, updates);
      return [200, 'new working copy created'];
    }
  }

});


var apiHelpers = {

  createComputer : function (userId) {
    return Computers.insert ({userId : userId});
  },

  getUserForComputer : function (computerId) {
    return Users.findOne ({computerId : computerId});
  },
  
  insertNewCommits : function (workingCopyId, clientGitData) {
    var newCommits = [];
    var updates = {
      $addToSet : {commitIds : {$each : newCommits}}
    };

    var commits = Commits.find ({workingCopyId : workingCopyId}).fetch();

    if (commits.length) {      
      var hashes = _.filter (commits, function (commit) { return commit.clientHash});
      
      clientGitData.commits.forEach (function (commit) {
        if (hashes.indexOf (commit.clientHash) !== -1) {
          var commitId = Commits.insert (commit);
          newCommits.push (commitId);
        } else {
          //TODO: do we need to sync these to make sure stuff hasn't changed?
        }
      });
    }

    return updates;
  }
}