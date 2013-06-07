var models = require('./../../app/models')
  , redis = require('redis')
  , configLocal = require('./../../conf/envLocal.js')
  , mailer = require('./email-identification-mailer.js');

var conf = configLocal.getAppConfig();

exports.listen = function() {
  var sub = redis.createClient();

  sub.subscribe('newPost')

  sub.on('message', function(channel, msg) {
    var data = JSON.parse(msg);
    models.Post.findById(data.postId, function(err, post) {
      models.Timeline.findById(data.timelineId, {}, function(err, timeline) {
        if (timeline.userId === undefined)
          return err
        models.User.findById(timeline.userId, function(err, user) {
          user.toJSON({select: ['id', 'username', 'type', 'info']}, function(err, json) {
            if (json.info === null)
              return err
            var messageToSend = {
              from: conf.sendFromName + ' <' + conf.sendFromEmail + '>',
              to: json.username + ' <' + json.info.email + '>',
              subject: 'New post added to our site',
              headers: {
                'X-Laziness-level': 1000
              },
              text: 'Hello ' + json.username + '!',
              html:'<p><b>Hello</b> ' + json.username + '</p>'+
                   '<p>New post added to our site:</p>' +
                   '<p>' + post.body + '</p>'
            };
            mailer.sendMailToUser(conf, messageToSend)
          })
        })
      })
    })
  })
}