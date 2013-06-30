Meteor.Router.add({

  '/bootstrap' : function () {
    console.log ('bootstrap');
    var body = this.request.body;

    // create the user if it doesn't exist
    var user = Users.findOne ({name : body.name, email : body.email});

    if (user) {
        var userId = user._id;
    }
    else {
      userId = Users.insert ({name : body.name, email: body.email});
    }

    var compId = apiHelpers.createComputer(user);
    return [200, JSON.stringify ({computerId : compId, userId : user._id})];
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

    console.log ('body', body)
    console.log ('clientCommits', clientCommits)
    if (!clientCommits) {
      return [400, 'must provide commits'];
    }

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
      var workingCopyId = WorkingCopies.insert(query);
      var updates = apiHelpers.insertNewCommits (workingCopyId, clientCommits);
      WorkingCopies.update({_id : workingCopyId}, updates);
      return [200, 'new working copy created'];
    } else {
      var updates = apiHelpers.insertNewCommits (workingCopy._id, clientCommits);
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
    return Computers.findOne ({_id : computerId}).userId;
  },

  insertNewCommits : function (workingCopyId, clientCommits) {
    var newCommits = [];
    var updates = {
      $addToSet : {commitIds : {$each : newCommits}}
    };

    var commits = Commits.find ({workingCopyId : workingCopyId}).fetch();
    var hashes = _.map (commits, function (commit) { return commit.clientHash});
    console.log ('existing commits', commits);
    console.log ('existing hashes', hashes);

    clientCommits.forEach (function (commit) {
      if (hashes.indexOf (commit.clientHash) === -1) {
        commit.workingCopyId = workingCopyId;
        var commitId = Commits.insert (commit);
        newCommits.push (commitId);
      } else {
        //TODO: do we need to sync these to make sure stuff hasn't changed?
      }
    });

    return updates;
  }

}
