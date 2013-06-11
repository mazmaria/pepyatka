var models = require('./../app/models')
  , db = require('../db').connect()
  , async = require('async')

var startDefineScreenNames = function() {

  var userSerializer = {
    select: ['id', 'username', 'type', 'info'],
      info: {
        select: ['screenName', 'email', 'receiveEmails']
      }
  }

  db.keys('user:*', function(err, usersIdKeys) {
    async.forEach(usersIdKeys,
      function(usersIdKey, callback) {
        var userId;
        usersIdKey = usersIdKey.replace(/user:/, '');
        if (!/:(\w)+/.test(usersIdKey)) {
          userId = usersIdKey;
          models.User.findById(userId, function(err, user) {
            if (user) {
              user.toJSON(userSerializer, function(err, json) {
                if (json.info === null) {
                  var params = {
                    screenName: user.username,
                    email: null,
                    receiveEmails: null
                  }
                  user.update(params, function(err, user) {
                    if (err) return
                  })
                } else if (json.info.screenName === null || json.info.screenName === undefined) {
                  var params = {
                    screenName: user.username,
                    email: (json.info.email !== undefined) ? json.info.email : null,
                    receiveEmails: (json.info.receiveEmails !== undefined) ? json.info.receiveEmails : null
                  }
                  user.update(params, function(err, user) {
                    if (err) return
                  })
                } else {
                  callback(null)
                }
              })
            } else {
              callback(null)
            }
          })
        } else {
          callback(null)
        }
      },
      function(err) {
        if(err) console.log(err)
        else console.log('Renaming was completed');
      })
  })
}

exports.defineScreenNames = function() {
  startDefineScreenNames();
}