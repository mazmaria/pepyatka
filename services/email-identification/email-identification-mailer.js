var nodemailer = require('nodemailer');

exports.sendMailToUser = function(conf, message){
  // Create a SMTP transport object
  var transport = nodemailer.createTransport("SMTP", {
          //service: 'Gmail', // use well known service.
                              // If you are using @gmail.com address, then you don't
                              // even have to define the service name
          auth: {
              user: conf.serviceEmail,
              pass: conf.servicePass
          }
      });

  console.log('SMTP Configured');
  console.log('Sending Mail');

  transport.sendMail(message, function(error){
      if(error){
          console.log('Error occured');
          console.log(error.message);
          return;
      }
      console.log('Message sent successfully!');

      // if you don't want to use this transport object anymore, uncomment following line
      //transport.close(); // close the connection pool
  });
}