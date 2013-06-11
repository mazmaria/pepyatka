var express = require('express')
  , app = express()
  , environment = require('./../environment.js')
  , screenname = require('./../services/add-screennames.js');

environment.init(function(err, res) {
  screenname.defineScreenNames();
})