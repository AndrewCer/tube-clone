var express = require('express');
var router = express.Router();
var validator = require("../lib/validation.js").validation;
var database = require('../lib/database.js');
var db = require('monk')(process.env.MONGO_URI);
var users = db.get('users');
var videos = db.get('videos');
var comments = db.get('comments');
var bcrypt = require('bcrypt');
var cookieSession = require('cookie-session');

String.prototype.capitalize = function(){
    return this.toLowerCase().replace( /\b\w/g, function (m) {
        return m.toUpperCase();
    });
};

router.get('/', function(req, res, next) {
  var userCookie = req.session.user;
  database.topFive(userCookie).then(function (returnObj) {
    if (req.session.user) {
      userCookie = userCookie.capitalize();
      return res.render('index', { title: 'Tube Clone', user: userCookie, userId: returnObj.userInfo._id, userImg: returnObj.userInfo.profileImg, topVideos: returnObj.topVids});
    }
    else {
      return res.render('index', { title: 'Tube Clone', topVideos: returnObj.topVids});
    }
  });
});

router.get('/style', function (req, res) {
  res.render('style');
});

router.get('/tube', function (req, res) {
  var userCookie = req.session.user;
  database.videoUser(userCookie).then(function (returnObj) {
    returnObj.videos.reverse();
    if (userCookie) {
      userCookie = userCookie.capitalize();
      return res.render('tube-show', {allVideos: returnObj.videos, user: userCookie, userId: returnObj.userInfo._id, userImg: returnObj.userInfo.profileImg});
    }
    else {
      return res.render('tube-show', {allVideos: returnObj.videos, user: userCookie});
    }
  });
});

router.get('/tube/video/:vidId', function (req, res) {
  var userCookie = req.session.user;
  database.video(req.params.vidId, userCookie).then(function (returnObj) {
    if (!userCookie) {
      return res.render('video', {user: userCookie, video: returnObj.video, userInfo: returnObj.userInfo, comments: returnObj.comments, userImg: returnObj.userInfo.profileImg})
    }
    else {
          if (returnObj.dislikeTest === true) {
            return res.render('video', {user: userCookie, video: returnObj.video, userInfo: returnObj.userInfo, comments: returnObj.comments, disliked: true, userId: returnObj.userInfo._id, userImg: returnObj.userInfo.profileImg})
          }
          if (returnObj.likeTest === true) {
            return res.render('video', {user: userCookie, video: returnObj.video, userInfo: returnObj.userInfo, comments: returnObj.comments, liked: true, userId: returnObj.userInfo._id, userImg: returnObj.userInfo.profileImg})
          }
          if (returnObj.likeTest === null && returnObj.dislikeTest === null) {
            return res.render('video', {user: userCookie, video: returnObj.video, userInfo: returnObj.userInfo, comments: returnObj.comments, userId: returnObj.userInfo._id, userImg: returnObj.userInfo.profileImg})
          }
    }
  });
});

router.get('/tube/video/edit/:vidId', function (req, res) {
  if (!req.session.user || req.session.user != req.session.user) {
    res.render('404', {error: 'You do not have access to this page'})
  }
  else {
    var userCookie = req.session.user;
    videos.findOne({_id: req.params.vidId}).then(function (video) {
      users.findOne({userName: userCookie}).then(function (user) {
        res.render('video-edit', {user: userCookie, video: video, userImg: user.profileImg})
      })
    });
  }
});

router.post('/tube/video/edit/:vidId', function (req, res) {
  var formData = req.body
  videos.update({_id: req.params.vidId}, {name: formData.name, url: formData.url,
    description: formData.description, userId: formData.userId})
    .then(function () {
    res.redirect('/tube/video/' + req.params.vidId)
  });
});

router.get('/tube/user/:id', function (req, res) {
  users.findOne({_id: req.params.id}).then(function (user) {
    if (!req.session.user || req.session.user != user.userName) {
      res.render('404', {error: 'You do not have access to this page'})
    }
    else {
      var userCookie = req.session.user;
      userCookie = userCookie.capitalize();
      //refactor to not contain for loop...perhaps using $in
      videos.find({}).then(function (videos) {
        var userVideos = []
        for (var i = 0; i < videos.length; i++) {
          if (videos[i].userId == req.params.id) {
            userVideos.push(videos[i])
          }
        }
        userVideos.reverse();
        res.render('user-page', {user: userCookie, userId: req.params.id, userVideos: userVideos, userImg: user.profileImg})
      });
    }
  });
});

router.get('/tube/sign-up', function (req, res) {
  res.render('sign-up');
});

router.post('/tube/sign-up', function (req, res) {
  var formData = req.body;
  var hash = bcrypt.hashSync(formData.password, 8);
  var userData = {userName : formData.userName.toLowerCase(), age : formData.age, password : hash}
  var validationArray = validator(formData.userName, formData.password, formData.passwordCheck);
  if (validationArray.length > 0) {
    res.render('sign-up', {errors: validationArray, formData: formData});
  }
  users.find({userName: formData.userName}).then(function (user) {
    if (user.length === 0) {
      return users.insert(userData).then(function (user) {
        req.session.user = formData.userName
        return res.redirect('/tube/user/' + user._id);
      });
    }
    else {
      return res.render('sign-up', {errors: ['That User Name already exists'], formData: formData});
    }
  });
});

router.post('/tube/login', function (req, res) {
  var loginData = req.body
  users.findOne({userName: loginData.userName.toLowerCase()})
    .then(function (user) {
      if (user === null) {
        return res.render('index', {nameError: 'Incorrect Username'})
      }
      var cryptCheck = bcrypt.compareSync(loginData.password, user.password)
      if (cryptCheck) {
        req.session.user = loginData.userName
        res.redirect('/tube/user/' + user._id);
      }
      else {
        return res.render('index', {passowrdError: 'Incorrect password'})
      }
    });
});

router.get('/tube/logout', function (req, res) {
  req.session = null
  res.redirect('/');
});

router.get('/tube/new-video/:id', function (req, res) {
  var userCookie = req.session.user;
  if (userCookie) {
    users.findOne({userName: userCookie}).then(function (user) {
      userCookie = userCookie.capitalize();
      res.render('new-video', {user: userCookie, userId: req.params.id, userImg: user.profileImg});
    });
  }
  else {
    res.redirect('/tube/sign-up')
  }
});

router.post('/tube/new-video/:id', function (req, res) {
  var formData = req.body
  users.findOne({_id: req.params.id}).then(function (user) {
    formData.userId = user._id;
    var urlId = formData.url;
    urlId = urlId.split('=')[1];
    formData.url = urlId;
    videos.insert(formData).then(function (videos) {
      res.redirect('/tube')
    });
  })
});

router.post('/tube/vid-comment', function (req, res) {
  var commentData = JSON.parse(req.body.userComment);
  comments.insert(commentData);
});

router.get('/tube/delete/:id', function (req, res) {
  videos.remove({_id: req.params.id}).then(function () {
    res.redirect('/tube');
  });
});

router.get('/tube/like/:vidId/:user', function (req, res) {
  videos.update({_id: req.params.vidId}, { $addToSet: { like: { $each: [ req.params.user.toLowerCase()] } } })
  .then(function () {
    return users.update({userName: req.params.user.toLowerCase()}, { $addToSet: { like: { $each: [ req.params.vidId] } } })
  });
});

router.get('/tube/dislike/:vidId/:user', function (req, res) {
  videos.update({_id: req.params.vidId}, { $addToSet: { dislike: { $each: [ req.params.user.toLowerCase()] } } })
  .then(function () {
    return users.update({userName: req.params.user.toLowerCase()}, { $addToSet: { dislike: { $each: [ req.params.vidId] } } })
  });
});

router.post('/tube/update-pic/:userId', function (req, res) {
  users.update({_id: req.params.userId}, {$set: {profileImg: req.body.url}})
  res.json('thanks!')
});

module.exports = router;
