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
}
}
