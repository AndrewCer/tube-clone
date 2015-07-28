var db = require('monk')(process.env.MONGO_URI);
var users = db.get('users');
var videos = db.get('videos');
var comments = db.get('comments');

module.exports = {
  dbCalls: function (formData) {
  return users.findOne({userName: formData.userName});
  },
  dbInsert: function (formData) {
    return users.insert(formData)
  }
}

// module.exports = dbCalls
