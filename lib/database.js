var db = require('monk')(process.env.MONGO_URI);
var users = db.get('users');
var videos = db.get('videos');
var comments = db.get('comments');
var bcrypt = require('bcrypt');

module.exports = {
  topFive: function (userName) {
    var returnObj = {};
    var sortedVideos = null;
    var topFive = [];
    return videos.find().then(function (vids) {
      sortedVideos = vids.sort(function(a, b){return b.views-a.views});
      for (var i = 0; i < 4; i++) {
        topFive.push(sortedVideos[i]);
      }
      returnObj.topVids = topFive
      return users.findOne({userName: userName}).then(function (user) {
        returnObj.userInfo = user;
        return returnObj
      });
    });
  },
  videoUser: function (userName) {
    var returnObj = {};
    return videos.find().then(function (vids) {
      returnObj.videos = vids
      return users.findOne({userName: userName}).then(function (user) {
        returnObj.userInfo = user;
        return returnObj
      });
    });
  },

  // TODO: decompose and un-nest
  video: function (videoId, userName) {
    var returnObj = {};
    return videos.findOne({_id: videoId}).then(function (video) {
      returnObj.video = video
      var viewCount = Number(video.views) + 1;
      return users.findOne({_id: video.userId}).then(function (user) {
        returnObj.userInfo = user;
        return comments.find({videoId: videoId}).then(function (comments) {
          returnObj.comments = comments
          returnObj.comments.reverse();
          return videos.update({_id: videoId}, {$set: {views: viewCount}}).then(function () {
            if (!userName) {
              return returnObj;
            }
            else {
              return users.findOne({userName: userName.toLowerCase()})
              .then(function (loggedUser) {
                var likeAccum = null;
                var dislikeAccum = null;
                if (loggedUser) {
                  if (loggedUser.like) {
                    for (var i = 0; i < loggedUser.like.length; i++) {
                      if (loggedUser.like[i] == video._id) {
                        likeAccum = true;
                      }
                    }
                  }
                  if (loggedUser.dislike) {
                    for (var i = 0; i < loggedUser.dislike.length; i++) {
                      if (loggedUser.dislike[i] == video._id) {
                        dislikeAccum = true;
                      }
                    }
                  }
                }
                returnObj.likeTest = likeAccum;
                returnObj.dislikeTest = dislikeAccum;
                return users.findOne({userName: userName}).then(function (user) {
                  returnObj.userInfo = user;
                  return returnObj;
                });
              });
            }
          });
        });
      });
    });
  },
  videoEdit: function (videoId, userName, formData) {
    if (userName === null) {
      return videos.findOne({_id: videoId}).then(function (video) {
        return videos.update({_id: videoId}, {name: formData.name, url: formData.url,
          description: formData.description, views: video.views, likes: video.likes,
          dislikes: video.dislikes, userId: formData.userId, like: video.like})
      });
    }
    else {
      var returnObj = {};
      return videos.findOne({_id: videoId}).then(function (video) {
        returnObj.video = video;
        return users.findOne({userName: userName}).then(function (user) {
          returnObj.userInfo = user;
          return returnObj;
        });
      });
    }
  },
  userVideos: function (userId, userName) {
    var returnObj = {};
    if (userName === undefined) {
      returnObj = false;
      return returnObj;
    }
    else {
      return users.findOne({_id: userId}).then(function (user) {
        returnObj.userInfo = user;
        //refactor to not contain for loop...perhaps using $in
        return videos.find({}).then(function (videos) {
          var userVids = [];
          for (var i = 0; i < videos.length; i++) {
            if (videos[i].userId == userId) {
              userVids.push(videos[i])
            }
          }
          returnObj.userVids = userVids;
          return returnObj;
        });
      });
    }
  },
  signUp: function (inputUserName, userData) {
    var returnObj = {};
    return users.find({userName: inputUserName}).then(function (user) {
      if (user.length === 0) {
        return users.insert(userData).then(function (user) {
          returnObj.userInfo = user;
          return returnObj
        });
      }
      else {
        return returnObj;
      }
    });
  },
  userFind: function (userName) {
    var returnObj = {};
    return users.findOne({userName: userName}).then(function (user) {
      returnObj.userInfo = user;
      return returnObj;
    });
  }
}
