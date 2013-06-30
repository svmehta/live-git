Meteor.Router.add({

  '/bootstrap' : function () {
    console.log ('bootstrap');
    var body = this.request.body;

    // create the user if it doesn't exist
    var user = Users.findOne ({name : body.name, email : body.email});

    var userId;
    if (user) {
        userId = user._id;
    }
    else {
      userId = Users.insert ({name : body.name, email: body.email});
    }
    console.log(userId);

    var compId = apiHelpers.createComputer(userId);
    return [200, JSON.stringify ({computerId : compId, userId : userId})];
  },

  /*
   * let client know last commit in db for a given branch
   */
  '/status': function() {
    var body = this.request.body;
    var userId = apiHelpers.getUserForComputer (body.computerId);

    var query = {
      computerId : body.computerId,
      branchName : body.branchName,
      clientDir : body.clientDir,
      userId : userId
    };

    return WorkingCopies.findOne(query);
  },

  /*
   * update the state of the workingCopy
   */
  '/update' : function() {
    var body = this.request.body;
    var clientCommits = body.unpushedCommits;
    console.log(body)
    var userId = apiHelpers.getUserForComputer (body.computerId);

    if (!userId) {
      return [500, 'user doesnt exist for computerId'];
    }

    var query = {
      computerId : body.computerId,
      branchName : body.branchName,
      clientDir : body.clientDir,
      userId : userId
    };

    var workingCopy = WorkingCopies.findOne(query);

    if (!workingCopy) {
      query.commitIds = []; //init empty array
      var workingCopyId = WorkingCopies.insert(query);
      var updates = apiHelpers.insertNewCommits (workingCopyId, clientCommits);
      WorkingCopies.update({_id : workingCopyId}, updates);
      return [200, 'new working copy created'];
    } else {
      var updates = apiHelpers.insertNewCommits (workingCopy._id, clientCommits);
      WorkingCopies.update({_id : workingCopy._id}, updates);
      return [200, 'updated existing working copy'];
    }
  }

});


var apiHelpers = {

  createComputer : function (userId) {
    return Computers.insert ({userId : userId});
  },

  getUserForComputer : function (computerId) {
    return Computers.findOne ({_id : computerId}).userId;
  },

  insertNewCommits : function (workingCopyId, clientCommits) {
    var newCommits = [];
    var updates = {
      $addToSet : {commitIds : {$each : newCommits}}
    };

    var commits = Commits.find ({workingCopyId : workingCopyId}).fetch();
    var hashes = _.map (commits, function (commit) { return commit.clientHash});

    if (clientCommits) {
      clientCommits.forEach (function (commit) {
        if (hashes.indexOf (commit.clientHash) === -1) {
          commit.workingCopyId = workingCopyId;
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
