var express = require('express');
var router = express.Router();
var validator = require("../lib/validation.js");
var database = require('../lib/database.js');
var bcrypt = require('bcrypt');
var cookieSession = require('cookie-session');


function isAuthenticated(req, res, next) {
  if (!req.session.user || req.session.user != req.session.user) {
    res.render('404', {error: 'You do not have access to this page'});
  }
  else {
    return next();
  }
}

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

// router.get('/style', function (req, res) {
//   res.render('style');
// });

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

router.get('/tube/video/edit/:vidId', isAuthenticated, function (req, res) {
  var userCookie = req.session.user;
  database.videoEdit(req.params.vidId, userCookie).then(function (returnObj) {
    res.render('video-edit', {user: userCookie, video: returnObj.video, userImg: returnObj.userInfo.profileImg})
  })
});

router.post('/tube/video/edit/:vidId', function (req, res) {
  var formData = req.body
  database.videoEdit(req.params.vidId, null, formData).then(function () {
    res.redirect('/tube/video/' + req.params.vidId)
  });
});

router.get('/tube/user/:id', isAuthenticated, function (req, res) {
  var userCookie = req.session.user;
  database.userVideos(req.params.id, userCookie).then(function (returnObj) {
      userCookie = userCookie.capitalize();
      returnObj.userVids.reverse();
      return res.render('user-page', {user: userCookie, userId: req.params.id, userVideos: returnObj.userVids, userImg: returnObj.userInfo.profileImg});
  });
});

router.get('/tube/sign-up', function (req, res) {
  res.render('sign-up');
});

router.post('/tube/sign-up', function (req, res) {
  var formData = req.body;
  var hash = bcrypt.hashSync(formData.password, 8);
  var userData = {userName : formData.userName.toLowerCase(), age : formData.age, password : hash}
  var validationArray = validator.validation(formData.userName, formData.password, formData.passwordCheck);
  if (validationArray.length > 0) {
    res.render('sign-up', {errors: validationArray, formData: formData});
  }
  database.signUp(formData.userName.toLowerCase(), userData).then(function (returnObj) {
    if (returnObj === null){
      console.log('hey hey');
      return res.render('sign-up', {errors: ['That User Name already exists'], formData: formData});
    }
    if (returnObj.userInfo) {
      req.session.user = formData.userName.toLowerCase();
      return res.redirect('/tube/user/' + returnObj.userInfo._id);
    }
  });
});

router.post('/tube/login', function (req, res) {
  var loginData = req.body
  var userCookie = req.session.user;
  database.userFind(loginData.userName.toLowerCase())
    .then(function (user) {
      if (user.userInfo === null) {
        database.topFive(userCookie).then(function (returnObj) {
            return res.render('index', { nameError: 'Incorrect Username', title: 'Tube Clone', topVideos: returnObj.topVids});
        });
      }
      var cryptCheck = bcrypt.compareSync(loginData.password, user.userInfo.password)
      if (cryptCheck) {
        req.session.user = loginData.userName
        res.redirect('/tube/user/' + user.userInfo._id);
      }
      else {
        database.topFive(userCookie).then(function (returnObj) {
            return res.render('index', {passwordError: 'Incorrect password', nameError: 'Incorrect Username', title: 'Tube Clone', topVideos: returnObj.topVids});
        });
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
    database.userFind(userCookie).then(function (returnObj) {
      userCookie = userCookie.capitalize();
      res.render('new-video', {user: userCookie, userId: req.params.id, userImg: returnObj.userInfo.profileImg});
    });
  }
  else {
    res.redirect('/tube/sign-up')
  }
});

router.post('/tube/new-video/:id', function (req, res) {
  var formData = req.body;
  var userCookie = req.session.user;
  var validationCheck = validator.newVideo(formData);
  if (validationCheck.nameError || validationCheck.urlError ) {
    database.userFind(userCookie)
    .then(function (returnObj) {
      res.render('new-video', {user: userCookie, userId: req.params.id, userImg: returnObj.userInfo.profileImg, inputError: validationCheck, formData: formData});
    });
  }
  else {
    database.insertVideo(req.params.id, undefined)
    .then(function (returnObj) {
      formData.userId = returnObj.userInfo._id;
      var urlId = formData.url;
      urlId = urlId.split('=')[1];
      formData.url = urlId;
      return database.insertVideo(undefined, formData)
      .then(function () {
        res.redirect('/tube')
      });
    });
  }
});

router.post('/tube/vid-comment', function (req, res) {
  var commentData = JSON.parse(req.body.userComment);
  database.addComment(commentData)
  .then(function () {
    return res.writeHead(200, { "Content-Type": "text/html" });
  });
});

router.get('/tube/delete/:id', function (req, res) {
  database.deleteVid(req.params.id)
  .then(function () {
    res.redirect('/tube');
  });
});

router.get('/tube/like/:vidId/:user', function (req, res) {
  database.likeAndDislike(req.params.vidId, req.params.user, true, undefined)
    .then(function () {
      return res.writeHead(200, { "Content-Type": "text/html" });
    });
});

router.get('/tube/dislike/:vidId/:user', function (req, res) {
  database.likeAndDislike(req.params.vidId, req.params.user, undefined, true)
    .then(function () {
      return res.writeHead(200, { "Content-Type": "text/html" });
    });
});

router.post('/tube/update-pic/:userId', function (req, res) {
  database.updateProfilePic(req.params.userId, req.body.url)
  .then(function () {
    //does this qualify as closing the connection?
    res.writeHead(200, { "Content-Type": "text/html" });
    //or do i need to end it like this
    // res.end("Ending this shiz");
  });
});

module.exports = router;
