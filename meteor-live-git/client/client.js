// Main template
Template.main.repository = function() {
    console.log(Repositories.findOne());  // TODO remove
    return Repositories.findOne(); 
}

Template.main.users = function() {
    var users = Users.find();   // TODO filter for current repository

    var usersWithWorkingCopy = _.map(users, function(user) {
        var workingCopy = WorkingCopies.findOne({ userId: user._id, }, 
            { sort:  { timestamp: -1}}); 
        console.log(workingCopies)
        return {
            "user": user,
            "workingCopy": workingCopy
        };
    });

    return usersWithWorkingCopy;
}



