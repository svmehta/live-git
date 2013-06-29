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

  }


});



var getMergeUpdates = function (workingCopy, clientGitData) {
  var updates = {$addToSet : {commitIds : []}};
  var localHashes = workingCopy.
  //$addToSet: { <field>: { $each: [ <value1>, <value2> ... ] }
  
  clientGitData.commits.forEach (function (commit) {
    if (commit.)
  });
}