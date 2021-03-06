var models = require('./../../app/models')
  , redis = require('redis')
  , async = require('async')
  , configLocal = require('./../../conf/envLocal.js')
  , fs = require("fs")
  , ejs = require("ejs")
  , mailer = require('./email-identification-mailer.js');

var htmlTemplate

fs.readFile('app/scripts/views/mailer/index.ejs', 'utf8', function (err, template) {
  if (err) {
    return //console.log(err);
  }
  htmlTemplate = template
});

var conf = configLocal.getAppConfig();

var postSerializer = {
  select: ['id', 'body', 'createdBy', 'attachments', 'comments', 'createdAt', 'updatedAt', 'likes', 'groups'],
  createdBy: { select: ['id', 'username'] },
  comments: { select: ['id', 'body', 'createdBy'],
              createdBy: { select: ['id', 'username', 'info'],
                info: { select: ['screenName'] } }},
  likes: { select: ['id', 'username', 'info'],
            info: { select: ['screenName'] }},
  groups: { select: ['id', 'username'] }
}

var userSerializer = { select: ['id', 'username', 'type', 'info'],
                        info: { select: ['screenName', 'email', 'receiveEmails'] }}

exports.listen = function() {

  var sub = redis.createClient();

  sub.subscribe('newPost', 'newComment', 'newLike')

  sub.on('message', function(channel, msg) {
    switch(channel) {

      case 'newPost':
        var data = JSON.parse(msg);
        if (htmlTemplate === undefined) return
        models.Post.findById(data.postId, function(err, post) {
          if (!post) return

          models.Timeline.findById(data.timelineId, {}, function(err, timeline) {
            if (!timeline) return
            if (timeline.userId === undefined) return
            if (timeline.name !== 'River of news') return

            models.User.findById(timeline.userId, function(err, user) {
              if (!user) return
              if (user.type === 'group') return

              user.toJSON(userSerializer, function(err, jsonUser) {
                if (jsonUser.info === null) return
                if (jsonUser.info.receiveEmails.toString() !== 'all') return

                html = ejs.render(htmlTemplate, {
                  username: jsonUser.info.screenName,
                  post: post.body,
                  likes: [],
                  comments: []
                })

                var messageToSend = {
                  from: conf.sendFromName + ' <' + conf.sendFromEmail + '>',
                  to: jsonUser.info.screenName + ' <' + jsonUser.info.email + '>',
                  subject: 'New post added to our site',
                  headers: {
                    'X-Laziness-level': 1000
                  },
                  html: html
                };
                mailer.sendMailToUser(conf, messageToSend)
              })
            })
          })
        })
        break

      case 'newComment':
        var data = JSON.parse(msg);
        if (data.inRiverOfNews !== 0) return
        if (htmlTemplate === undefined) return
        if (data.timelineId === undefined) return

        models.Comment.findById(data.commentId, function(err, comment) {
          if (!comment) return
          models.Post.findById(comment.postId, function(err, post) {
            if (!post) return

            post.toJSON(postSerializer, function(err, jsonPost) {

              models.Timeline.findById(data.timelineId, {}, function(err, timeline) {
                if (!timeline) return
                if (timeline.userId === undefined) return
                if (timeline.name !== 'River of news') return

                models.User.findById(timeline.userId, function(err, user) {
                  if (!user) return
                  if (user.id === post.userId) return
                  if (user.type === 'group') return

                  user.toJSON(userSerializer, function(err, jsonUser) {
                    if (jsonUser.info === null) return
                    if (jsonUser.info.receiveEmails.toString() !== 'all') return

                    html = ejs.render(htmlTemplate, {
                      username: jsonUser.info.screenName,
                      post: jsonPost.body,
                      likes: jsonPost.likes,
                      comments: jsonPost.comments
                    })

                    var messageToSend = {
                      from: conf.sendFromName + ' <' + conf.sendFromEmail + '>',
                      to: jsonUser.info.screenName + ' <' + jsonUser.info.email + '>',
                      subject: 'Post has commented by user',
                      headers: {
                        'X-Laziness-level': 1000
                      },
                      html: html
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
        if (data.inRiverOfNews !== 0) return
        if (htmlTemplate === undefined) return
        if (data.timelineId === undefined) return

        models.Post.findById(data.postId, function(err, post) {
          if (!post) return

          post.toJSON(postSerializer, function(err, jsonPost) {

            models.Timeline.findById(data.timelineId, {}, function(err, timeline) {
              if (!timeline) return
              if (timeline.userId === undefined) return
              if (timeline.name !== 'River of news') return

              models.User.findById(timeline.userId, function(err, user) {
                if (!user) return
                if (user.id === post.userId) return
                if (user.type === 'group') return

                user.toJSON(userSerializer, function(err, jsonUser) {
                  if (jsonUser.info === null) return
                  if (jsonUser.info.receiveEmails.toString() !== 'all') return

                  html = ejs.render(htmlTemplate, {
                      meassage: 'Post has liked by user',
                      username: jsonUser.info.screenName,
                      post: jsonPost.body,
                      likes: jsonPost.likes,
                      comments: jsonPost.comments
                  })

                  var messageToSend = {
                    from: conf.sendFromName + ' <' + conf.sendFromEmail + '>',
                    to: jsonUser.info.screenName + ' <' + jsonUser.info.email + '>',
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