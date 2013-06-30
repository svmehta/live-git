// Main template

Template.main.repository = function() {
  var repo = Repositories.findOne();
  if (repo && !repo.name) {
    var matches = /\/([^\/]+?)(?:.git)?$/.exec(repo.url);
    repo.name = matches[1];
  }

  return repo;
};


Template.main.users = function() {
  var users = Users.find().fetch();   // TODO filter for current repository

  var usersWithWorkingCopy = _.map(users, function(user) {
    var workingCopy = WorkingCopies.findOne({ userId: user._id, },
      { sort:  { timestamp: -1 }});
    return {
      "user": user,
      "workingCopy": workingCopy,
      "gravatarHash": CryptoJS.MD5(user.email.trim().toLowerCase()).toString()
    };
  });

  console.log(usersWithWorkingCopy);
  return usersWithWorkingCopy;
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
