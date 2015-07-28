var express = require('express');
var router = express.Router();
var validator = require("../lib/validation.js").validation;
var database = require('../lib/database.js').dbCalls;
var dbInsert = require('../lib/database.js').dbInsert;

router.get('/', function(req, res, next) {
  res.render('index', { title: 'Tube Clone' });
});

router.get('/tube/sign-up', function (req, res) {
  res.render('sign-up');
});

router.post('/tube/sign-up', function (req, res) {
  var formData = req.body;
  var userData = {userName : formData.userName, age : formData.age, password : formData.password}
  var validationArray = validator(formData.userName, formData.password, formData.passwordCheck);
  if (validationArray.length > 0) {
    res.render('sign-up', {errors: validationArray, formData: formData});
  }
  else {
    database(userData).then(function (obj) {
      if (obj.userName === userData.userName) {
        res.render('sign-up', {errors: ['That User Name already exists'], formData: formData});
      }
      else {
        dbInsert(userData).then(function () {
          res.redirect('/');
        })
      }
    });
  }
});

module.exports = router;
