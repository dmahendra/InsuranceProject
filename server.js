// server.js

// set up ======================================================================
// get all the tools we need
var express = require('express');
var app = express();
var port = process.env.PORT || 8080;
var mongoose = require('mongoose');
var passport = require('passport');
var flash = require('connect-flash');
var path = require('path');
var opn = require('opn');
var fileUpload = require('express-fileupload');

var configDB = require('./config/database.js');

// configuration ===============================================================
mongoose.connect(configDB.url); // connect to our database

require('./config/passport')(passport); // pass passport for configuration

app.configure(function() {

    // set up our express application
    app.use(express.logger('dev')); // log every request to the console
    app.use(express.cookieParser()); // read cookies (needed for auth)
    //app.use(express.bodyParser()); // get information from html forms

    app.engine('html', require('ejs').renderFile);

    app.set('view engine', 'html'); // set up ejs for templating

    // required for passport
    app.use(express.session({ secret: 'myinsuranceproject' })); // session secret
    app.use(passport.initialize());
    app.use(passport.session()); // persistent login sessions
    app.use(fileUpload());
    app.use(flash()); // use connect-flash for flash messages stored in session
    app.use(express.static(path.join(__dirname, 'public')));
    app.use(express.static(path.join(__dirname, 'app', 'uploads')));


});

// routes ======================================================================
require('./app/routes.js')(app, passport); // load our routes and pass in our app and fully configured passport

// launch ======================================================================
app.listen(port, function() {
    //opn('http://localhost:8080', { app: 'iexplore' });
});
console.log('The magic happens on port ' + port);
