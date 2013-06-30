/*
 * Computer consists of:
 * _id - assigned by server
 * userId - owner of the computer
 */
Computers = new Meteor.Collection("computers");

/*
 * User consists of:
 * name - user's name (git config user.name)
 * email - user's email (git config user.email)
 */
Users = new Meteor.Collection("users");

/*
 * Repository consists of:
 * url - array of git clone URLs
 * name
 * slug - accessible address of dashboard
 */
Repositories = new Meteor.Collection("repositories");

/*
 * WorkingCopy consists of:
 * timestamp - last update from the client
 * userId - reference to the above
 * computerId - reference to the above
 * repositoryId - reference to the above
 * branchName - the branch
 * clientDir - path to the directory on user's machine
 * commitIds - array of commits
 */
WorkingCopies = new Meteor.Collection("workingCopies");

/*
 * Commits consists of:
 * userId
 * workingCopyId
 * clientHash
 * message
 * diff
 * timestamp
 * files
 */
Commits = new Meteor.Collection("commits");