Meteor.Router.add({

  '/bootstrap' : function () {
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

    var compId = apiHelpers.createComputer(userId);
    return [200, JSON.stringify ({computerId : compId, userId : userId})];
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
    var clientCommits = body.unpushedCommits;

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
    var workingCopyId;

    if (!workingCopy) {
      query.commitIds = []; //init empty array
      query.untrackedFiles = body.untrackedFiles;
      query.fileStats = body.fileStats;
      query.timestamp = Date.now();
      workingCopyId = WorkingCopies.insert(query);
    } else {
      workingCopyId = workingCopy._id;
      var update = { 
        $set : {
          untrackedFiles : body.untrackedFiles,
          fileStats : body.fileStats,
          timestamp : Date.now()
        } 
      };
      WorkingCopies.update({_id : workingCopyId}, update);
    }

    var updates = apiHelpers.syncCommits (workingCopyId, clientCommits);

    if (updates.removesLen > 0) {
      WorkingCopies.update({_id : workingCopyId}, updates.remove);
    }

    if (updates.addsLen > 0) {
      WorkingCopies.update({_id : workingCopyId}, updates.add);
    }

    return 200;
  }

});


var apiHelpers = {

  createComputer : function (userId) {
    return Computers.insert ({userId : userId});
  },

  getUserForComputer : function (computerId) {
    return Computers.findOne ({_id : computerId}).userId;
  },

  syncCommits : function (workingCopyId, clientCommits) {
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
  }

}
