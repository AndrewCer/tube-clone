var db = require('monk')(process.env.MONGO_URI);
var users = db.get('users');
var videos = db.get('videos');
var comments = db.get('comments');
var bcrypt = require('bcrypt');

var getVideos = function () {
  return videos.find();
}
var getVideo = function (videoId) {
  return videos.findOne({_id: videoId});
}
var getUserVideos = function (userId, videos) {
      var userVids = [];
      for (var i = 0; i < videos.length; i++) {
        if (videos[i].userId == userId) {
          userVids.push(videos[i])
        }
      }
      return userVids
}
var updateVideo = function (videoId, formData, video) {
  return videos.update({_id: videoId}, {name: formData.name, url: formData.url,
  description: formData.description, views: video.views, likes: video.likes,
  dislikes: video.dislikes, userId: formData.userId, like: video.like});
}
var insertUserData = function (user, userData) {
    var returnObj = {};
    if (user === null) {
      return users.insert(userData).then(function (user) {
        returnObj.userInfo = user;
        return returnObj
      });
    }
    else {
      return users.find()
        .then(function (user) {
          return null;
        })
    }
}
var getUsers = function () {
  return users.find();
}
var getUser = function (userName) {
  return users.findOne({userName: userName});
}
var getUserFromId = function (userId) {
  return users.findOne({_id: userId});
}
var getComments = function (videoId) {
  return comments.find({videoId: videoId});
}
var getTopFive =  function (vids) {
  var sortedVideos = null;
  var topFive = [];
  sortedVideos = vids.sort(function(a, b){return b.views-a.views});
  for (var i = 0; i < 4; i++) {
    topFive.push(sortedVideos[i]);
  }
  return topFive
}
var changeViewCount =  function (video, videoId) {
  var viewCount = Number(video.views) + 1;
  videos.update({_id: videoId}, {$set: {views: viewCount}});
}
var likeAndDislikeCheck = function (loggedUser, video) {
  var likeAccum = null;
  var dislikeAccum = null;
  var checkedArray = [];
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
  checkedArray.push(likeAccum);
  checkedArray.push(dislikeAccum);
  return checkedArray
}

module.exports = {
  topFive: function (userName) {
    return getVideos()
      .then(function (vids) {
        return getTopFive(vids);
      })
      .then(function (topFive) {
        return getUser(userName)
          .then(function (user) {
            var returnObj = {};
            returnObj.topVids = topFive;
            returnObj.userInfo = user;
            return returnObj;
          });
      });
    },
  videoUser: function (userName) {
    return getVideos()
      .then(function (vids) {
        return getUser(userName)
          .then(function (user) {
            var returnObj = {};
            returnObj.videos = vids;
            returnObj.userInfo = user;
            return returnObj;
          })
      })
  },
  video: function (videoId, userName) {
    return getVideo(videoId)
    .then(function (video) {
      changeViewCount(video, videoId);
      return getUserFromId(video.userId)
      .then(function (vidPoster) {
        return getComments(videoId)
        .then(function (comments) {
          if (userName != undefined) {
            return getUser(userName.toLowerCase())
            .then(function (loggedUser) {
              var checkedArray = likeAndDislikeCheck(loggedUser, video);
              var returnObj = {};
              returnObj.video = video
              returnObj.userInfo = loggedUser;
              returnObj.vidPoster = vidPoster;
              returnObj.comments = comments
              returnObj.comments.reverse();
              returnObj.likeTest = checkedArray[0];
              returnObj.dislikeTest = checkedArray[1];
              return returnObj
            })
          }
          else {
            var returnObj = {};
            returnObj.video = video
            returnObj.userInfo = vidPoster;
            returnObj.comments = comments
            returnObj.comments.reverse();
            return returnObj
          }
        })
      })
    })
  },
  videoEdit: function (videoId, userName, formData) {
    if (userName === null) {
      return getVideo(videoId)
        .then(function (video) {
          return updateVideo(videoId, formData, video)
        });
    }
    else {
      return getVideo(videoId)
        .then(function (video) {
          return getUser(userName)
            .then(function (user) {
              var returnObj = {};
              returnObj.video = video;
              returnObj.userInfo = user
              return returnObj;
            })
        })
    }
  },
  userVideos: function (userId, userName) {
    if (userName === undefined) {
      var returnObj = false;
      return returnObj;
    }
    else {
      return getUserFromId(userId)
        .then(function (user) {
          return getVideos()
            .then(function (videos) {
              var userVids = getUserVideos(userId, videos);
              var returnObj = {};
              returnObj.userInfo = user;
              returnObj.userVids = userVids;
              return returnObj
            })
        })
    }
  },
  signUp: function (inputUserName, userData) {
    return getUser(inputUserName)
      .then(function (user) {
        return insertUserData(user, userData)
          .then(function (returnObj) {
            return returnObj;
          })
      })
  },
  userFind: function (userName) {
    return getUser(userName)
      .then(function (user) {
        var returnObj = {};
        returnObj.userInfo = user;
        return returnObj;
      });
  },
  insertVideo: function (userId, formData) {
    if (formData === undefined) {
      return getUserFromId(userId)
        .then(function (user) {
          var returnObj = {};
          returnObj.userInfo = user;
          return returnObj;
        })
    }
    else {
      return videos.insert(formData)
    }
  },
  likeAndDislike: function (vidId, user, like, dislike) {
    if (like === undefined) {
      return videos.update({_id: vidId}, { $addToSet: { dislike: { $each: [ user.toLowerCase()] } } })
      .then(function () {
        return users.update({userName: user.toLowerCase()},
        { $addToSet: { dislike: { $each: [ vidId] } } });
      });
    }
    if (dislike === undefined) {
      return videos.update({_id: vidId}, { $addToSet: { like: { $each: [ user.toLowerCase()] } } })
      .then(function () {
        return users.update({userName: user.toLowerCase()},
        { $addToSet: { like: { $each: [ vidId] } } });
      })
    }
  },
  addComment: function (commentData) {
    return comments.insert(commentData);
  },
  deleteVid: function (vidId) {
    return videos.remove({_id: vidId});
  },
  updateProfilePic: function (userId, imgUrl) {
    return users.update({_id: userId}, {$set: {profileImg: imgUrl}});
  }
}
