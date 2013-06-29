

Template.WorkingCopies.show = function () {
  console.log ('show')
  return JSON.stringify(WorkingCopies.find({}));
};