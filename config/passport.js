// config/passport.js

// load all the things we need
var LocalStrategy = require('passport-local').Strategy;

// load up the user model
var User = require('../app/models/user');

// expose this function to our app using module.exports
module.exports = function(passport) {

    // =========================================================================
    // passport session setup ==================================================
    // =========================================================================
    // required for persistent login sessions
    // passport needs ability to serialize and unserialize users out of session

    // used to serialize the user for the session
    passport.serializeUser(function(user, done) {
        done(null, user.id);
    });

    // used to deserialize the user
    passport.deserializeUser(function(id, done) {
        User.findById(id, function(err, user) {
            done(err, user);
        });
    });

    // =========================================================================
    // LOCAL SIGNUP ============================================================
    // =========================================================================
    // we are using named strategies since we have one for login and one for signup
    // by default, if there was no name, it would just be called 'local'

    passport.use('local-signup', new LocalStrategy({
            // by default, local strategy uses username and password, we will override with email
            usernameField: 'email',
            passwordField: 'password',
            passReqToCallback: true // allows us to pass back the entire request to the callback
        },
        function(req, email, password, done) {

            // find a user whose email is the same as the forms email
            // we are checking to see if the user trying to login already exists
            User.findOne({ 'local.email': email }, function(err, user) {
                // if there are any errors, return the error
                if (err)
                    return done(err);

                // check to see if theres already a user with that email
                if (user) {
                    console.log("User already exists");
                    return done(null, false, req.flash('signupMessage', 'That email is already taken.'));
                } else {

                    if (password.length < 6) {
                        return done(null, false, req.flash('signupMessage', 'Password must be minimum 6 charaters'));
                    } else if (password.length > 10) {
                        return done(null, false, req.flash('signupMessage', 'Password must be maximum 10 charaters'));
                    } else if (password.search(/\d/) == -1) {
                        return done(null, false, req.flash('signupMessage', 'Password must have one numeric charater.'));
                    } else if (password.search(/[a-zA-Z]/) == -1) {
                        return done(null, false, req.flash('signupMessage', 'Password must have one alphabet charater.'));
                    } else if (password.search(/[^a-zA-Z0-9\!\@\#\$\%\^\&\*\(\)\_\+]/) != -1) {
                        return done(null, false, req.flash('signupMessage', 'Bad Charaters are not Allowed'));
                    }

                    // if there is no user with that email
                    // create the user
                    var newUser = new User();

                    // set the user's local credentials
                    newUser.local.email = email;
                    //newUser.local.password = newUser.generateHash(password); // use the generateHash function in our user model
                    newUser.local.password = password; // use the generateHash function in our user model
                    newUser.local.name = req.body.name;
                    newUser.local.address = req.body.address;
                    newUser.local.gender = req.body.gender;
                    newUser.local.mobile = req.body.mobile;
                    newUser.local.role = req.body.role;
                    // save the user
                    //console.log("Req : ", req.body.name);
                    //console.log("Req : ", req.body.address);
                    newUser.save(function(err) {
                        if (err)
                            throw err;
                        return done(null, newUser);
                    });
                }

            });

        }));

    // =========================================================================
    // LOCAL LOGIN =============================================================
    // =========================================================================
    // we are using named strategies since we have one for login and one for signup
    // by default, if there was no name, it would just be called 'local'

    passport.use('local-login', new LocalStrategy({
            // by default, local strategy uses username and password, we will override with email
            usernameField: 'email',
            passwordField: 'password',
            passReqToCallback: true // allows us to pass back the entire request to the callback
        },
        function(req, email, password, done) { // callback with email and password from our form

            // find a user whose email is the same as the forms email
            // we are checking to see if the user trying to login already exists
            User.findOne({ 'local.email': email }, function(err, user) {
                // if there are any errors, return the error before anything else
                //console.log("user :", user);

                if (err)
                    return done(err);

                // if no user is found, return the message
                if (!user)
                    return done(null, false, req.flash('loginMessage', 'No user found.')); // req.flash is the way to set flashdata using connect-flash

                // if the user is found but the password is wrong
                //if (!user.validPassword(password))
                if (user.local.password != password)
                    return done(null, false, req.flash('loginMessage', 'Oops! Wrong password.')); // create the loginMessage and save it to session as flashdata

                // all is well, return successful user
                if (user.local.role != req.body.role)
                    return done(null, false, req.flash('loginMessage', 'Oops! Incorrect Role.')); // create the loginMessage and save it to session as flashdata                    

                console.log('Role : ', req.body.role);
                return done(null, user);
            });

        }));

    passport.use('local-update', new LocalStrategy({
            // by default, local strategy uses username and password, we will override with email
            usernameField: 'email',
            passwordField: 'password',
            passReqToCallback: true // allows us to pass back the entire request to the callback
        },
        function(req, email, password, done) {

            // find a user whose email is the same as the forms email
            // we are checking to see if the user trying to login already exists
            // User.findOne({ 'local.email': email }, function(err, user) {
            //     var newUser = new User();

            //     newUser.local.email = email;
            //     newUser.local.password = newUser.generateHash(password); // use the generateHash function in our user model
            //     //newUser.local.password = password; // use the generateHash function in our user model
            //     newUser.local.name = req.body.name;
            //     newUser.local.address = req.body.address;
            //     newUser.local.gender = req.body.gender;
            //     newUser.local.mobile = req.body.mobile;

            //     console.log("Update User details : ", newUser);

            //     // if there are any errors, return the error
            //     if (err)
            //         return done(err);

            //     return done(null, newUser);

            // });

            var query = { 'local.email': email };

            var newUser = new User();
            newUser.local.email = email;
            //newUser.local.password = newUser.generateHash(password); // use the generateHash function in our user model
            newUser.local.password = password; // use the generateHash function in our user model
            newUser.local.name = req.body.name;
            newUser.local.address = req.body.address;
            newUser.local.gender = req.body.gender;
            newUser.local.mobile = req.body.mobile;
            newUser.local.role = 'customer';

            var upsertData = newUser.toObject();
            delete upsertData._id;

            console.log("Update User details : ", upsertData);

            User.findOneAndUpdate(query, upsertData, { upsert: true }, function(err, user) {
                if (err)
                    return done(err);
                return done(null, user);
            });

        }));

};
