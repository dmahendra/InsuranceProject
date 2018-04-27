var nodemailer = require("nodemailer");

module.exports = function(emailId, callback) {

    // create reusable transport method (opens pool of SMTP connections)
    var smtpTransport = nodemailer.createTransport("SMTP", {
        service: "Gmail",
        auth: {
            user: "kansasainsurance@gmail.com",
            pass: "T3amw0rk"
        }
    });

    // setup e-mail data with unicode symbols
    var mailOptions = {
        from: '"KansasA Insurance 👥" <kansasainsurance@gmail.com>', // sender address
        to: emailId, // list of receivers
        subject: "New User Registration - KansasA Insurance", // Subject line
        text: "", // plaintext body
        html: "<b>Hello User! ✔</b> <br /><p>Your account has been activated</p>" // html body
    }

    // send mail with defined transport object
    smtpTransport.sendMail(mailOptions, function(error, response) {
        if (error) {
            console.log(error);
        } else {
            console.log("Message sent: " + response.message);
        }
        callback(error, response);

        // if you don't want to use this transport object anymore, uncomment following line
        smtpTransport.close(); // shut down the connection pool, no more messages

    });

};
