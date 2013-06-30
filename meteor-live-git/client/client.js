// Main template
var getRepository = function() {
  return Repositories.findOne();
};

var getUsers = function() {
  var users = Users.find();   // TODO filter for current repository

  var usersWithWorkingCopy = _.map(users, function(user) {
    var workingCopy = WorkingCopies.findOne({ userId: user._id, },
      { sort:  { timestamp: -1 }});
    console.log(workingCopy)
    return {
      "user": user,
      "workingCopy": workingCopy
    };
  });

  return usersWithWorkingCopy;
};


Template.main.repository = getRepository();

Template.main.users = getUsers();



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
