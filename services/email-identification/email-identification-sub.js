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
      if (timeline.userId !== undefined) {
          models.User.findById(timeline.userId, function(err, user) {
            user.toJSON({select: ['id', 'username', 'type', 'info']}, function(err, json) {
              // Message object
              var messageToSend = {

                // sender info
                from: 'Pepyatka <pepyatka@gmail.com>',

                // Comma separated list of recipients
                to: json.username + ' <' + json.info.email + '>',

                // Subject of the message
                subject: 'New post added to our site',

                headers: {
                    'X-Laziness-level': 1000
                },

                // plaintext body
                text: 'Hello ' + json.username + '!',

                // HTML body
                html:'<p><b>Hello</b> ' + json.username + '</p>'+
                     '<p>New post added to our site:</p>' +
                     '<p>' + post.body + '</p>'

              };
              mailer.sendMailToUser(conf, messageToSend)
            })
          })
        }
      })
    })
  })
}