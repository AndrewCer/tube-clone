var express = require('express');
var router = express.Router();
var validator = require("../lib/validation.js").validation;
// var database = require('../lib/database.js').dbCalls;
// var dbInsert = require('../lib/database.js').dbInsert;
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

router.get('/tube', function (req, res) {
  var userCookie = req.session.user;
  videos.find({}).then(function (videos) {
    res.render('tube-show', {allVideos:videos, user: userCookie});
  });
});

router.get('/tube/user/:id', function (req, res) {
  var userCookie = req.session.user;
  userCookie = userCookie.capitalize();
  res.render('user-page', {user: userCookie, userId: req.params.id})
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
      var cryptCheck = bcrypt.compareSync(loginData.password, user.password)
      if (user === null) {
        return res.render('index', {nameError: 'Incorrect Username'})
      }
      if (cryptCheck) {
        req.session.user = loginData.userName
        return res.redirect('/tube/user/' + user._id);
      }
      else {
        return res.render('index', {passowrdError: 'Incorrect password'})
      }
    });
});

router.post('/tube/logout', function (req, res) {
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
    videos.insert(formData).then(function (videos) {
      res.redirect('/tube')
    });
  })
});



module.exports = router;
