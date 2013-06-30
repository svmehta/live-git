// Main template
Template.main.showRepository = function() {
  return (window.location.pathname.length > 15);
}


Template.main.repository = function() {
  var repoId = window.location.pathname.substr(1);

  var repo = Repositories.findOne({_id: repoId});
  if (repo) {
    if (!repo.name) {
      var matches = /\/([^\/]+?)(?:.git)?$/.exec(repo.url);
      repo.name = matches[1];
    }

    return repo;
  } else {
    return { name: "Error: invalid repository ID" };
  }
};


Template.main.users = function() {
  var repoId = window.location.pathname.substr(1);

  var copies = WorkingCopies.find(
    { repositoryId: repoId },
    { sort:  { timestamp: -1 }}
  ).fetch();


  var userArray = [];

  copies.forEach(function(copy) {
    copy.commits = Commits.find(
      { _id: { $in: copy.commitIds } },
      { sort:  { timestamp: -1 }}
    ).fetch();

    var user = Users.findOne({ _id: copy.userId })
    if (!user) { console.log("Couldn't load user with ID", copy.userId, "from working copy", copy._id); }

    userArray.sort (function (a, b) {
      console.log ("a", a)
      console.log ("b", b)
      if (a.commits.length && b.commits.length) {
        return b.commits[0].timestamp - a.commits[0].timestamp;
      } else if (a.commits.length) {
        return -1;
      } else {
        return 1;
      }
    })

    userArray.push({
      "user": user,
      "workingCopy": copy,
      "gravatarHash": CryptoJS.MD5(user.email.trim().toLowerCase()).toString()
    });
  });

  console.log(userArray);
  return userArray;
};


var processCommitData = function(commit, workingCopy) {
  // var commit = Commits.findOne({ _id: commitId });
  commit.timeago = moment.unix(commit.timestamp).fromNow();
  commit.branchName = workingCopy.branchName;
  commit.branchStyle = workingCopy.fileStats.numBehind > 0 ? "behind" : "";
  commit.iconType = "save";
  commit.fileList = commit.files.join(", ");
  // console.log(commit);
  return commit;
};


Template.user.uncommittedFiles = function() {
  if (!this.workingCopy) { console.log("No working copy to inspect!"); }

  var wc_timeago = moment(this.workingCopy.timestamp).fromNow();
  var result = {
    files: [],
    branchStyle: this.workingCopy.fileStats.numBehind > 0 ? "behind" : "",
    branchName: this.workingCopy.branchName,
    iconType: "write"
  };

  if (this.workingCopy.gitDiff.length) {
    this.workingCopy.gitDiff.forEach(function(file) {
      file.timeago = moment(file.lastModified).fromNow();  // Last modified
      result.files.push(file);
    });
    result.firstFile = result.files.shift();
    return result;

  } else if (this.workingCopy.untrackedFiles.length) {
    this.workingCopy.untrackedFiles.forEach(function(f) {
      result.files.push({
        file: f.filename,
        timeago: moment(f.lastModified).fromNow()
      });
    });
    result.firstFile = result.files.shift();
    return result;

  } else {
    return false;
  }
};


Template.user.topItem = function() {
  if (!this.workingCopy) { console.log("No working copy to inspect!"); }

  if (this.workingCopy.gitDiff.length || this.workingCopy.untrackedFiles.length) {
    return false;

  } else if(this.workingCopy.commits.length) {
    return processCommitData(this.workingCopy.commits[0], this.workingCopy);

  } else {
    return false;
  }
};


Template.user.olderItems = function() {
  if (!this.workingCopy) { console.log("No working copy to inspect!"); }

  var first_historic_commit = 1;

  if (this.workingCopy.gitDiff.length || this.workingCopy.untrackedFiles.length) {
    first_historic_commit = 0;
  }

  var commits = [];

    // This doesn't work in the case of untrackedFiles, since we don't keep old coomit history
  for (var i = first_historic_commit; i < first_historic_commit + 3; i ++) {
    if (this.workingCopy.commits[i]) {
      var commit = processCommitData(this.workingCopy.commits[i], this.workingCopy);
      commits.push(commit);
    }
  }

  return commits;
};


Template.branchChart.hasCommitsAhead = function() {
  if (!this.workingCopy) { console.log("No working copy to inspect!"); }

  return (this.workingCopy.fileStats.numAhead > 0);
};

Template.branchChart.commitsAhead = function() {
  var html = "";
  for (var i = 0; i < this.workingCopy.fileStats.numAhead; i ++) {
    html += "<div class=\"circle bottom-row\"></div>";
  }
  return html;
};

Template.branchChart.commitsBehind = function() {
  var html = "";
  for (var i = 0; i < this.workingCopy.fileStats.numBehind; i ++) {
    html += "<div class=\"circle top-row";
    if (i == this.workingCopy.fileStats.numBehind - 1) { html += " last"; }
    html += "\"></div>";
  }
  return html;
};


