var express = require('express');
var router = express.Router();
var validator = require("../lib/validation.js").validation;

router.get('/', function(req, res, next) {
  res.render('index', { title: 'Tube Clone' });
});

router.get('/tube/sign-up', function (req, res) {
  res.render('sign-up');
});

router.post('/tube/sign-up', function (req, res) {
  var formData = req.body;
  var validationArray = validator(formData.userName, formData.password, formData.passwordCheck);
  if (validationArray.length > 0) {
    res.render('sign-up', {errors: validationArray});
  }
  else {
    res.redirect('/');
  }
});

module.exports = router;
