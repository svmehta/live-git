

// Template.WorkingCopies.show = function () {
//   console.log ('show')
//   return JSON.stringify(WorkingCopies.find({}));
// };

Template.main.repository = { name: "My Awesome Repo" }

Template.main.users = [
  {
    name: "img/hourann.jpg", email: "hourannb@dview.net"
  }
];

Template.user.gravatar = function() {
  return this.name;
}

