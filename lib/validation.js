module.exports = {
  validation: function (name, password, passwordCheck) {
    var illegals = /\W/;
    var errorArray = [];
    //create object to send back specific to the error ie obj.name = [error, error]
    //in order to place errors in specific locations on signup form!!!
    var errorObj = {};
    var spacesTest = name.split(' ');
    if (name.length < 5) {
      errorArray.push('Username is too short. Must be longer than 4 characters');
    }
    if (name.length > 15) {
      errorArray.push('Username is too long. Must be less than 15 characters');
    }
    if (illegals.test(name)) {
      errorArray.push('Username contains illegal characters. Can only use letters, numbers and underscores (no spaces)');
    }
    if (password.length < 6) {
      errorArray.push('Password is too short. Must be greater than 5 characters');
    }
    if (password != passwordCheck) {
      errorArray.push('Passwords do not match');
    }
    return errorArray;
  }
}
