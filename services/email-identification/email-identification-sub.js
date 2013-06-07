var models = require('./../../app/models')
  , redis = require('redis')
  , async = require('async')
  , configLocal = require('./../../conf/envLocal.js')
  , fs = require("fs")
  , mailer = require('./email-identification-mailer.js');

var htmlTemplate

fs.readFile('app/scripts/views/mailer/index.ejs', 'utf8', function (err, template) {
  if (err) {
    return console.log(err);
  }
  htmlTemplate = template
});

var conf = configLocal.getAppConfig();

var postSerializer = {
  select: ['id', 'body', 'createdBy', 'attachments', 'comments', 'createdAt', 'updatedAt', 'likes', 'groups'],
  createdBy: { select: ['id', 'username'] },
  comments: { select: ['id', 'body', 'createdBy'],
              createdBy: { select: ['id', 'username'] }},
  likes: { select: ['id', 'username']},
  groups: { select: ['id', 'username'] }
}

var userSerializer = {select: ['id', 'username', 'type', 'info']}

var commentSerializer = {select: ['id', 'body', 'postId', 'updatedAt', 'createdBy', 'createdAt']}

exports.listen = function() {

  var sub = redis.createClient();

  sub.subscribe('newPost', 'newComment', 'newLike')

  sub.on('message', function(channel, msg) {
    switch(channel) {

      case 'newPost':
        var data = JSON.parse(msg);
        //if (htmlTemplate === undefined) return
        models.Post.findById(data.postId, function(err, post) {
          if (!post) return

          models.Timeline.findById(data.timelineId, {}, function(err, timeline) {
            if (!timeline) return
            if (timeline.userId === undefined) return

            models.User.findById(timeline.userId, function(err, user) {
              if (!user) return

              user.toJSON(userSerializer, function(err, jsonUser) {
                if (jsonUser.info === null) return

                htmlTemplate = htmlTemplate.replace('{username}', jsonUser.username)
                htmlTemplate = htmlTemplate.replace('{post}', post.body)

                var messageToSend = {
                  from: conf.sendFromName + ' <' + conf.sendFromEmail + '>',
                  to: jsonUser.username + ' <' + jsonUser.info.email + '>',
                  subject: 'New post added to our site',
                  headers: {
                    'X-Laziness-level': 1000
                  },
                  html: htmlTemplate
                };
                mailer.sendMailToUser(conf, messageToSend)
              })
            })
          })
        })
        break

      case 'newComment':
        var data = JSON.parse(msg);
        //if (htmlTemplate === undefined) return
        models.Comment.findById(data.commentId, function(err, comment) {
          if (!comment) return
          models.Post.findById(data.postId, function(err, post) {
            if (!post) return

            post.toJSON(postSerializer, function(err, jsonPost) {

            var _likes = '<p>Liked this post: '
            async.forEach(jsonPost.likes, function(_like, callback) {
              _likes = _likes + _like.username + ', ';
            })
            _likes = _likes.substring(0, _likes.length - 2) + '</p>'

              var _comments = 'Comments: <ul>'
              async.forEach(jsonPost.comments, function(_comment, callback) {
                _comments = _comments + '<li>' + _comment.body + ' - ' + _comment.createdBy.username + '</li>';
              })
              _comments = _comments + '</ul>'
              var _post = '<p>' + post.body + '</p>' + _likes + _comments

              models.Timeline.findById(post.timelineId, {}, function(err, timeline) {
                if (!timeline) return
                if (timeline.userId === undefined) return

                models.User.findById(timeline.userId, function(err, user) {
                  if (!user) return

                  user.toJSON(userSerializer, function(err, jsonUser) {
                    if (jsonUser.info === null) return

                    htmlTemplate = htmlTemplate.replace('{username}', jsonUser.username)
                    htmlTemplate = htmlTemplate.replace('{post}', _post)

                    var messageToSend = {
                      from: conf.sendFromName + ' <' + conf.sendFromEmail + '>',
                      to: jsonUser.username + ' <' + jsonUser.info.email + '>',
                      subject: 'Post has commented by user',
                      headers: {
                        'X-Laziness-level': 1000
                      },
                      html: htmlTemplate
                    };
                    mailer.sendMailToUser(conf, messageToSend)
                  })
                })
              })
            })
          })
        })
        break

      case 'newLike':
        var data = JSON.parse(msg);
        models.Post.findById(data.postId, function(err, post) {
          if (!post) return

          post.toJSON(postSerializer, function(err, jsonPost) {

            var _likes = '<p>Liked this post: '
            async.forEach(jsonPost.likes, function(_like, callback) {
              _likes = _likes + _like.username + ', ';
            })
            _likes = _likes.substring(0, _likes.length - 2) + '</p>'

            var _comments = 'Comments: <ul>'
            async.forEach(jsonPost.comments, function(_comment, callback) {
              _comments = _comments + '<li>' + _comment.body + ' - ' + _comment.createdBy.username + '</li>';
            })
            _comments = _comments + '</ul>'
            var _post = '<p>' + post.body + '</p>' + _likes + _comments

            models.Timeline.findById(post.timelineId, {}, function(err, timeline) {
              if (!timeline) return
              if (timeline.userId === undefined) return

              models.User.findById(timeline.userId, function(err, user) {
                if (!user) return

                user.toJSON(userSerializer, function(err, jsonUser) {
                  if (jsonUser.info === null) return

                  htmlTemplate = htmlTemplate.replace('{username}', jsonUser.username)
                  htmlTemplate = htmlTemplate.replace('{post}', _post)

                  var messageToSend = {
                    from: conf.sendFromName + ' <' + conf.sendFromEmail + '>',
                    to: jsonUser.username + ' <' + jsonUser.info.email + '>',
                    subject: 'Post has liked by user',
                    headers: {
                      'X-Laziness-level': 1000
                    },
                    html: htmlTemplate
                  };
                  mailer.sendMailToUser(conf, messageToSend)
                })
              })
            })
          })
        })
        break
    }
  })
}