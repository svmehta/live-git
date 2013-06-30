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
    //TODO
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
      var updates = apiHelpers.syncCommits (workingCopyId, clientCommits);
      WorkingCopies.update({_id : workingCopyId}, updates);
      return [200, 'new working copy created'];
    } else {
      var updates = apiHelpers.syncCommits (workingCopy._id, clientCommits);
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
    console.log ('computerId', computerId);
    console.log (Computers.findOne ({_id : computerId}));
    return Computers.findOne ({_id : computerId}).userId;
  },

  syncCommits : function (workingCopyId, clientCommits) {
    var commitsToAdd = [];
    var commitsToRemove = [];

    var updates = {
      $addToSet : {commitIds : {$each : commitsToAdd}},
      $pullAll : {commitIds: commitsToRemove}
    };

    var dbCommits = Commits.find ({workingCopyId : workingCopyId}).fetch();
    var hashes = _.map (dbCommits, function (commit) { return commit.clientHash});

    if (clientCommits) {

      clientCommits.forEach (function (commit) {
        // the commit exists on the client but not on the server
        if (hashes.indexOf (commit.clientHash) === -1) {
          commit.workingCopyId = workingCopyId;
          var commitId = Commits.insert (commit);
          commitsToAdd.push (commitId);
        }
      });

      var pos = 0;

      hashes.forEach (function (hash) {
        // the commit exists on the server but not on the client
        if (clientCommits.indexOf (hash) === -1) {
          commitsToRemove.push (dbCommits[pos]._id);
        }
        pos+=1;
      });

    } else {
      console.log ('no client commits, removing everything');
      commitsToRemove = _.map (dbCommits, function (commit) { return commit._id});
    }

    console.log ('commitsToRemove', commitsToRemove);
    if (commitsToRemove.length) {
      Commits.update ({_id : {$in : commitsToRemove}}, {$set : {invalid : true}}, {multi : true});
    }

    return updates;
  }

}
