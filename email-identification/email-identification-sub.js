var models = require('./../app/models')
  , redis = require('redis');

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
                console.log(json)
              })
            })
          }
        })
      })
  })
}