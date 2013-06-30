Meteor.Router.add({
  '/install' : function () {
    return [301, { Location: "https://raw.github.com/svmehta/live-git/master/install.sh" }, ''];
  },

  '/bootstrap' : function () {
    var body = this.request.body;
    console.log (body)
    var remoteUrl = body.remoteUrl;
    if (!remoteUrl) {
      return [400, 'must provide remoteUrl'];
    }

    var repository = Repositories.findOne ({url : remoteUrl});
    var repositoryId;

    if (repository) {
      repositoryId = repository._id;
    } else {
      repositoryId = Repositories.insert ({url : remoteUrl});
    }

    // create the user if it doesn't exist
    var user = Users.findOne ({name : body.name, email : body.email});

    var userId;
    if (user) {
        userId = user._id;
    }
    else {
      userId = Users.insert ({name : body.name, email: body.email});
    }

    var compId = apiHelpers.createComputer(userId);
    return [200, JSON.stringify ({computerId : compId, userId : userId, repositoryId : repositoryId})];
  },

  /*
   * let client know last commit in db for a given branch
   */
  '/status': function() {
    //TODO
  },

  /*
   * update the state of the workingCopy
   */
  '/update' : function() {
    var body = this.request.body;
    var unpushedCommits = body.unpushedCommits;

    if (!body.computerId) {
      return [400, 'computerId not defined'];
    } else if (!body.remoteUrl) {
      return [400, 'remoteUrl not defined'];
    }

    var userId = apiHelpers.getUserForComputer (body.computerId);
    var repositoryId = apiHelpers.getRepoIdForUrl (body.remoteUrl);

    if (!userId) {
      return [400, 'user doesnt exist for computerId'];
    }

    if (!repositoryId) {
      repositoryId = Repositories.insert ({url : body.remoteUrl});
    }

    //test
    var query = {
      computerId : body.computerId,
      branchName : body.branchName,
      clientDir : body.clientDir,
      repositoryId : repositoryId,
      userId : userId
    };

    var workingCopy = WorkingCopies.findOne(query);
    var workingCopyId;
    if (!workingCopy) {
      query.commitIds = []; //init empty array
      query.untrackedFiles = body.untrackedFiles;
      query.fileStats = apiHelpers.getFileStats (body);
      query.timestamp = Date.now();
      query.gitDiff = body.gitDiff;
      workingCopyId = WorkingCopies.insert(query);
    } else {
      workingCopyId = workingCopy._id;
      var update = {
        $set : {
          untrackedFiles : body.untrackedFiles,
          fileStats : apiHelpers.getFileStats (body),
          timestamp : Date.now(),
          gitDiff : body.gitDiff
        }
      };
      WorkingCopies.update({_id : workingCopyId}, update);
    }

    var updates = apiHelpers.syncCommits (workingCopyId, unpushedCommits);

    if (updates.removesLen > 0) {
      WorkingCopies.update({_id : workingCopyId}, updates.remove);
    }

    if (updates.addsLen > 0) {
      WorkingCopies.update({_id : workingCopyId}, updates.add);
    }

    return [200, JSON.stringify ({repositoryId : repositoryId})];
  }

});


var apiHelpers = {

  createComputer : function (userId) {
    return Computers.insert ({userId : userId});
  },

  getUserForComputer : function (computerId) {
    var computer = Computers.findOne ({_id : computerId});
    if (computer) {
      return computer.userId;
    } else {
      return null;
    }
  },

  getRepoIdForUrl : function (remoteUrl) {
    var repo = Repositories.findOne ({url : remoteUrl});
    if (repo) {
      return repo._id;
    } else {
      return null;
    }
  },

  syncCommits : function (workingCopyId, clientCommits) {
    console.log (clientCommits);
    var commitsToAdd = [];
    var commitsToRemove = [];

    var updates = {
      'add' : { $addToSet : {commitIds : {$each : commitsToAdd}} },
      'remove' : { $pullAll :  {commitIds: commitsToRemove} }
    };

    var dbCommits = Commits.find ({workingCopyId : workingCopyId, invalid : {$ne : true}}).fetch();
    var dbHashes = _.map (dbCommits, function (commit) { return commit.clientHash});
    var clientHashes = _.map (clientCommits, function (commit) { return commit.clientHash});

    if (clientCommits) {

      clientCommits.forEach (function (commit) {
        // the commit exists on the client but not on the server
        if (dbHashes.indexOf (commit.clientHash) === -1) {
          commit.workingCopyId = workingCopyId;
          var commitId = Commits.insert (commit);
          commitsToAdd.push (commitId);
        }
      });

      var pos = 0;
      dbHashes.forEach (function (hash) {
        // the commit exists on the server but not on the client
        if (clientHashes.indexOf (hash) === -1) {
          commitsToRemove.push (dbCommits[pos]._id);
        }
        pos+=1;
      });

    } else {
      console.log ('no client commits, removing everything');
      commitsToRemove = _.map (dbCommits, function (commit) { return commit._id});
    }

    if (commitsToRemove.length) {
      Commits.remove ({_id : {$in : commitsToRemove}}, {$set : {invalid : true}}, {multi : true});
    }

    updates.addsLen = commitsToAdd.length;
    updates.removesLen = commitsToRemove.length;

    return updates;
  },

  getFileStats : function (body) {
    return {
      numBehind : body.numBehind,
      numConflicts : body.numConflicts,
      numStaged : body.numStaged,
      numChanged : body.numChanged,
      numAhead : body.numAhead,
      numUntracked : body.numUntracked
    }
  }

}
