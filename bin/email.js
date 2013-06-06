var express = require('express')
  , app = express()
  , environment = require('./../environment.js')
  , emailIdentification = require('./../email-identification/email-identification-sub.js');

environment.init(function(err, res) {
  emailIdentification.listen();
})
