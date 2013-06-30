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
    var user = Users.findOne({ _id: copy.userId })
    if (!user) { console.log("Couldn't load user with ID", copy.userId, "from working copy", copy._id); }

    userArray.push({
      "user": user,
      "workingCopy": copy,
      "gravatarHash": CryptoJS.MD5(user.email.trim().toLowerCase()).toString()
    });
  });

  console.log(userArray);
  return userArray;
};

// Template.main.repository = { name: "My Awesome Repo" }
//
// Template.main.users = [
//   {
//     name: "img/hourann.jpg", email: "hourannb@dview.net"
//   }
// ];
//
// Template.user.gravatar = function() {
//   return this.name;
// }
