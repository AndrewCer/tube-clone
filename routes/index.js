var express = require('express');
var router = express.Router();
var validator = require("../lib/validation.js").validation;
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
  if (req.session.user) {
    users.findOne({userName: userCookie}).then(function (user) {
      userCookie = userCookie.capitalize();
      return res.render('index', { title: 'Tube Clone', user: userCookie, userId: user._id});
    });

  }
  else {
    res.render('index', { title: 'Tube Clone'});
  }
});

router.get('/style', function (req, res) {
  res.render('style');
});

router.get('/tube', function (req, res) {
  var userCookie = req.session.user;
  videos.find({}).then(function (videos) {
    videos.reverse();
    if (userCookie) {
      users.findOne({userName: userCookie}).then(function (user) {
        userCookie = userCookie.capitalize();
        res.render('tube-show', {allVideos: videos, user: userCookie, userId: user._id});
      });
    }
    else {
      res.render('tube-show', {allVideos: videos, user: userCookie});
    }
  });
});

//show video w/ comments
router.get('/tube/video/:vidId', function (req, res) {
  var userCookie = req.session.user;
  videos.findOne({_id: req.params.vidId}).then(function (video) {
    var viewCount = Number(video.views) + 1;
    users.findOne({_id: video.userId}).then(function (user) {
      comments.find({videoId: req.params.vidId}).then(function (comments) {
        comments.reverse();
        videos.update({_id: req.params.vidId}, {$set: {views: viewCount}})
        .then(function () {
          if (!userCookie) {
            return res.render('video', {user: userCookie, video: video, userInfo: user, comments: comments})
          }
          else {
            users.findOne({userName: userCookie.toLowerCase()})
            .then(function (loggedUser) {
              var likeAccum = null;
              var dislikeAccum = null;
              if (loggedUser) {
                console.log(loggedUser);
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
              userCookie = userCookie.capitalize();
              if (dislikeAccum === true) {
                return res.render('video', {user: userCookie, video: video, userInfo: user, comments: comments, disliked: true, userId: loggedUser._id})
              }
              if (likeAccum === true) {
                return res.render('video', {user: userCookie, video: video, userInfo: user, comments: comments, liked: true, userId: loggedUser._id})
              }
              if (likeAccum === null && dislikeAccum === null) {
                return res.render('video', {user: userCookie, video: video, userInfo: user, comments: comments, userId: loggedUser._id})
              }
            });
          }
        });
      });
    });
  });
});

router.get('/tube/video/edit/:vidId', function (req, res) {
  if (!req.session.user || req.session.user != req.session.user) {
    res.render('404', {error: 'You do not have access to this page'})
  }
  else {
    var userCookie = req.session.user;
    videos.findOne({_id: req.params.vidId}).then(function (video) {
      res.render('video-edit', {user: userCookie, video: video})
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
        res.render('user-page', {user: userCookie, userId: req.params.id, userVideos: userVideos})
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
    userCookie = userCookie.capitalize();
    res.render('new-video', {user: userCookie, userId: req.params.id});
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

module.exports = router;
