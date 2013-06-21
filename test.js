console.log('Starting Test');
var system = require('system');

if(system.args.length !== 2) {
  console.log("Expecting: phantomjs {test.js} {base_url}");
  phantom.exit(1);
}

var page = require('webpage').create();

var actions = [];

var test = function(desc, fn) {
  actions.push({test: fn, desc: desc});
};

var run = function() {
  var allPassed = true;
  var done = function() {
    if(allPassed) {
      console.log("ALL PASSED");
    } else {
      console.log("TEST FAILED");
    }
    phantom.exit();
  };

  var performNextAction = function() {
    if(actions.length === 0) {
      done();
    } else {
      var action = actions[0];
      actions = actions.splice(1);
      if(action.test) {
        console.log("TEST: " + action.desc);
        page.evaluate(action.test);
        page.render('pepyatka_' + Date.now() + ".png");
        setTimeout(function() {
          performNextAction()
        }, 3000)
      }
    }
  };
  performNextAction();
};

page.runTests = function() {

  test("navigate to registration form", function() {
    Ember.run.begin()
    //Ember.run(function() {
      jQuery('.signin-toolbar > a[href="/signup"]').focus().click()
      //console.log(document.querySelectorAll('html')[0].outerHTML);
   //})
  });

  test("fill signup form and submit it", function() {
   // Ember.run(function() {
      jQuery('#username').val('user_' + Date.now().toString());
      jQuery('#password').val('123456');
      jQuery('button').focus().click()
    //})
  });

  test("navigate to settings form", function(){
    //Ember.run(function() {
      jQuery('a[href="/settings"]').focus().click()
    //})
    //Ember.run.sync();
  });

  test("fill settings form", function(){
    //Ember.run(function() {
      jQuery('#screenName').val('UserScreenName');
      jQuery('#email').val('pepyatka@gmail.com');
      jQuery('#receiveEmails [value="no"]').attr("selected", "selected");
      jQuery('button').focus().click()
    //})
  });

  test("submit form", function(){
    //Ember.run(function() {
      jQuery('button').focus().click()
    //})
    Ember.run.end()
  });

  run();
};

page.onConsoleMessage = function(msg) {
  console.log(msg);
};

page.open(system.args[1], function (status) {
  console.log("Opened " + system.args[1]);
  page.runTests();
});