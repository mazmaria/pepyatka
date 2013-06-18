var request = require('supertest')
  , assert = require('assert')
  , agent = require('superagent')
  , async = require('async')

var redis = require('../../db')
  , db = redis.connect()

var server = require('../../server')
  , models = require('../../app/models')

describe('Users API', function() {
  var userAgent;

  before(function(done) {
    var userAgentCreated = false;
    var user2AgentCreated = false;

    var invokeCallback = function() {
      if (userAgentCreated && user2AgentCreated) done()
    }

    var newUser = new models.User({
      username: 'username',
      password: 'password',
      type: 'user'
    })
    newUser.create(function(err, user) {
      userAgent = agent.agent();
      userAgent
        .post('localhost:' + server.get('port') + '/v1/session')
        .send({ username: 'username', password: 'password' })
        .end(function(err, res) {
          userAgentCreated = true
          invokeCallback()
        });
    })

    var newUser2 = new models.User({
      username: 'username2',
      password: 'password',
      type: 'user'
    })
    newUser2.create(function(err, user) {
      user2Agent = agent.agent();
      user2Agent
        .post('localhost:' + server.get('port') + '/v1/session')
        .send({ username: 'username2', password: 'password' })
        .end(function(err, res) {
          user2AgentCreated = true
          invokeCallback()
        });
    })
})

  it('GET /v1/users/:username/subscriptions should return subscritions of user', function(done) {
    models.User.findAnon(function(err, anonymous) {
      models.User.findByUsername('username', function(err, user) {
        anonymous.getPostsTimeline({start: 0}, function(err, timeline) {
          userAgent
            .post('localhost:' + server.get('port') + '/v1/timeline/' + timeline.id + '/subscribe')
            .end(function(err, res) {
              request(server)
                .get('/v1/users/' + user.username + '/subscriptions')
                .end(function(err, res) {
                  assert(res.body.length > 0)
                  done()
                })
            })
        })
      })
    })
  })

  it('GET /v1/users/:username/subscribers should return subscribers of user', function(done) {
    models.User.findAnon(function(err, anonymous) {
      anonymous.getPostsTimeline({start: 0}, function(err, timeline) {
        userAgent
          .post('localhost:' + server.get('port') + '/v1/timeline/' + timeline.id + '/subscribe')
          .end(function(err, res) {
            request(server)
              .get('/v1/users/anonymous/subscribers')
              .end(function(err, res) {
                assert(res.body.subscribers.length > 0)
                done()
              })
          })
      })
    })
  })

  it('DELETE /v1/users/:username/subscribers/:userId should unsubscribe :userId from :username', function(done) {
    models.User.findByUsername('username2', function(err, user2) {
      user2.getPostsTimeline({start: 0}, function(err, timeline) {
        models.User.findByUsername('username', function(err, user) {
          userAgent
            .post('localhost:' + server.get('port') + '/v1/timeline/' + timeline.id + '/subscribe')
            .end(function(err, res) {
              user2Agent
                .post('localhost:' + server.get('port') + '/v1/users/username2/subscribers/' + user.id)
                .send({'_method': 'delete'})
                .end(function(err, res) {
                   request(server)
                    .get('/v1/users/username2/subscribers')
                    .end(function(err, res) {
                      var userId = user.id
                      var subscribersFindAll = res.body.subscribers
                      var findSubscriber = subscribersFindAll.reduce(function (findNumber, subscriberItem){
                        if (subscriberItem.id === userId) findNumber++
                        return findNumber
                      }, 0);
                      assert.equal(findSubscriber, 0)
                      done()
                    })
                })
            })
        })
      })
    })
  })

  it('POST /v1/users/:username/subscribers/:userId/admin should add admin rights for :userId to administrate:username', function(done) {
    models.User.findByUsername('username', function(err, user) {
      models.User.findByUsername('username2', function(err, user2) {
        var randomNumber = Math.floor(Math.random() * (9999-1000)+1000);
        var newGroup = new models.Group({
          username: 'Group' + randomNumber,
          type: 'group'
        })
        newGroup.create(user2.id, function(err, group) {
          models.Group.findById(group.id, function(err, group) {
            group.getPostsTimeline({start: 0}, function(err, timeline) {
              userAgent
                .post('localhost:' + server.get('port') + '/v1/timeline/' + timeline.id + '/subscribe')
                .end(function(err, res) {
                  user2Agent
                    .post('localhost:' + server.get('port') + '/v1/users/' + group.username + '/subscribers/' + user.id + '/admin')
                    .end(function(err, res) {
                      assert.equal(res.body.status, 'success')
                      done()
                    })
                })
            })
          })
        })
      })
    })
  })

  it('POST /v1/users/:username/subscribers/:userId/unadmin should remove admin rights for :userId to administrate:username', function(done) {
    models.User.findByUsername('username', function(err, user) {
      models.User.findByUsername('username2', function(err, user2) {
        var randomNumber = Math.floor(Math.random() * (9999-1000)+1000);
        var newGroup = new models.Group({
          username: 'Group' + randomNumber,
          type: 'group'
        })
        newGroup.create(user2.id, function(err, group) {
          models.Group.findById(group.id, function(err, group) {
            group.getPostsTimeline({start: 0}, function(err, timeline) {
              userAgent
                .post('localhost:' + server.get('port') + '/v1/timeline/' + timeline.id + '/subscribe')
                .end(function(err, res) {
                  user2Agent
                    .post('localhost:' + server.get('port') + '/v1/users/' + group.username + '/subscribers/' + user.id + '/admin')
                    .end(function(err, res) {
                      userAgent
                        .post('localhost:' + server.get('port') + '/v1/users/' + group.username + '/subscribers/' + user.id + '/unadmin')
                        .end(function(err, res) {
                          assert.equal(res.body.status, 'success')
                          done()
                        })
                    })
                })
            })
          })
        })
      })
    })
  })

  it('GET /v1/users/:username/feedinfo should return subscribers, subscriptions and information of user', function(done) {
    models.User.findByUsername('username', function(err, user) {
      request(server)
        .get('/v1/users/username/feedinfo')
        .expect(200)
        .end(function(err, res) {
          assert.equal(res.body.id, user.id)
          done()
        })
    })
  })

  it ('POST /v1/signup should create a new user', function(done) {
    request(server)
      .post('/v1/signup')
      .send({ username: 'username' + Math.floor(Math.random() * (9999-1000)+1000), password: 'password' })
      .expect(200)
      .end(function(err, res) {
        assert.equal(res.body.status, 'success')
        done()
      })
  })

  it('GET /v1/users/:userId should return user', function(done) {
    models.User.findByUsername('username', function(err, user) {
      request(server)
        .get('/v1/users/' + user.id)
        .expect(200)
        .end(function(err, res) {
          assert.equal(res.body.id, user.id)
          done()
        })
    })
  })

  it('GET /v1/users/user-not-exist/subscriptions should return 404', function(done) {
    request(server)
      .get('/v1/users/user-not-exist/subscriptions')
      .expect(404, done)
  })

  it('GET /v1/users/user-not-exist/subscribers should return 404', function(done) {
    request(server)
      .get('/v1/users/user-not-exist/subscribers')
      .expect(404, done)
  })

  it('GET /v1/users/user-not-exist should return 422', function(done) {
    request(server)
      .get('/v1/users/user-not-exist')
      .expect(404, done)
  })
})
