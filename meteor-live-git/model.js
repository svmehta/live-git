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
 * WorkingCopy consists of:
 * userId - reference to the above
 * computerId - reference to the above
 * branchName - the branch
 * clientDirectory - path to the directory on user's machine
 * commitObjs
 *    - clientHash
 *    - pushedHash
 *    - commit message
 *    - diffId
 */
WorkingCopies = new Meteor.Collection("workingCopies");

/*
 * Diffs consists of:
 * content - the content of the diff
 */
Diffs = new Meteor.Collection ("diffs");