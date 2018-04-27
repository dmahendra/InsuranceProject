var sendEmail = require('./send-email');
var sendResponse = require('./send-response');
var Policy = require('../app/models/policy');
var User = require('../app/models/user');
var Complaint = require('../app/models/complaint');
var path = require('path');
var lodash = require('lodash');

// app/routes.js
module.exports = function(app, passport) {

    // =====================================
    // HOME PAGE (with login links) ========
    // =====================================
    app.get('/', function(req, res) {
        res.render('index'); // load the index.ejs file
    });

    // =====================================
    // LOGIN ===============================
    // =====================================
    // show the login form
    app.get('/login', function(req, res) {

        // render the page and pass in any flash data if it exists
        res.render('login.ejs', { message: req.flash('loginMessage') });
    });

    // process the login form
    app.post('/login', passport.authenticate('local-login', {
        successRedirect: '/profile', // redirect to the secure profile section
        failureRedirect: '/login', // redirect back to the login page if there is an error
        failureFlash: true // allow flash messages
    }));

    // =====================================
    // SIGNUP ==============================
    // =====================================
    // show the signup form
    app.get('/signup', function(req, res) {

        // render the page and pass in any flash data if it exists
        res.render('signup.ejs', { message: req.flash('signupMessage') });
    });

    // process the signup form
    app.post('/signup', passport.authenticate('local-signup', {
        successRedirect: '/profile/new', // redirect to the secure profile section
        failureRedirect: '/signup', // redirect back to the signup page if there is an error
        failureFlash: true // allow flash messages
    }));


    app.post('/update', passport.authenticate('local-update', {
        successRedirect: '/login', // redirect to the secure profile section
        failureRedirect: '/signup', // redirect back to the signup page if there is an error
        failureFlash: true // allow flash messages
    }));

    // =====================================
    // PROFILE SECTION =========================
    // =====================================
    // we will want this protected so you have to be logged in to visit
    // we will use route middleware to verify this (the isLoggedIn function)
    // app.get('/profile', isLoggedIn, function(req, res) {
    //     res.render('profile.ejs', {
    //         user: req.user // get the user out of session and pass to template
    //     });
    // });

    app.get('/user', isLoggedIn, function(req, res) {
        //console.log('Reponse :', req.user);
        res.json({
            user: req.user // get the user out of session and pass to template
        });
    });

    app.post('/newpolicy', isLoggedIn, function(req, res) {
        console.log("New policy : ", req.body); 

        var id = Date.now(); // Generate unique ID

        var fileName = "newPolicy_" + id + "_" + req.files.file.name;
        var filePath = path.join(__dirname, 'uploads', fileName);
        var sampleFile;

        console.log("filePath : ", filePath);
        console.log("Files : ", req.files);
        console.log("Body : ", req.body);
        if (!req.files) {
            res.send(500, 'failure');
        }

        var today = new Date();
        var dd = today.getDate();
        var mm = today.getMonth() + 1; //January is 0!

        var yyyy = today.getFullYear() + 1;
        if (dd < 10) {
            dd = '0' + dd
        }
        if (mm < 10) {
            mm = '0' + mm
        }
        var expdate = mm + '/' + dd + '/' + yyyy;
        var policy = new Policy();
        console.log(" policy :", policy);
        policy.new.username = req.body.username;
        policy.new.email = req.body.email;
        policy.new.policyid = id;
        policy.new.category = req.body.category;
        policy.new.benifit = req.body.benifit;
        policy.new.idproof = req.body.idproof;
        policy.new.expdate = expdate;
        policy.new.status = "Applied";
        policy.new.comments = "";
        policy.new.filename = fileName;
        console.log("Policy Schema :", policy);

        sampleFile = req.files.file;
        sampleFile.mv(filePath, function(err) {
            if (err) {
                console.log("Error uploading file");
                res.send(500, err);
            } else {
                console.log("File Uploaded success");
                policy.save(function(err) {
                    if (err)
                        res.send(500, err);
                    res.send(200, 'success');
                });
            }
        });

    });

    app.post('/policyrenewal', isLoggedIn, function(req, res) {
        console.log("New policy : ", req.body);

        var fileName = "renewPolicy_" + req.body.policyid + "_" + req.files.file.name;
        var filePath = path.join(__dirname, 'uploads', fileName);
        var sampleFile;

        //var expdate = mm + '/' + dd + '/' + yyyy;
        var expdate = req.body.expdate;
        var temp = expdate.split("/");
        var yyyy = temp[2];
        yyyy++;
        expdate = temp[0] + '/' + temp[1] + '/' + yyyy;

        var policy = new Policy();
        //console.log(" policy :", policy);
        policy.new.username = req.body.username;
        policy.new.email = req.body.email;
        policy.new.policyid = req.body.policyid;
        policy.new.category = req.body.category;
        policy.new.benifit = req.body.benifit;
        policy.new.idproof = req.body.idproof;
        policy.new.expdate = expdate;
        policy.new.status = "Applied";
        policy.new.comments = "Renewed Policy";
        policy.new.filename = fileName;
        console.log("Policy Schema :", policy);

        sampleFile = req.files.file;
        sampleFile.mv(filePath, function(err) {
            if (err) {
                console.log("Error uploading file");
                res.send(500, err);
            } else {
                console.log("File Uploaded success");

                var query = { 'new.policyid': req.body.policyid };

                var upsertData = policy.toObject();
                delete upsertData._id;

                console.log("Update User details : ", upsertData);

                Policy.findOneAndUpdate(query, upsertData, { upsert: true }, function(err, policy) {
                    if (err)
                        res.send(500, err);
                    var subject = "Policy Renewal for" + policy.new.policyid + " has been " + "Applied";
                    var content = "<b> Hello " + policy.new.username + "</b>" + "<p> Your Policy number : " + policy.new.policyid + "has been " + " Applied. You will receive eamil once approved." + "</p> <p> Expiry Date : " + policy.new.expdate + "</p>";
                    sendResponse(policy.new.username, policy.new.email, subject, content, function(error, response) {
                        if (error)
                            console.log(" Error :", error);
                        res.send(200, 'success');
                    });
                });
            }
        });

    });

    app.post('/newclaim', isLoggedIn, function(req, res) {
        var id = Date.now();
        var fileName = "newClaim_" + id + "_" + req.files.file.name;
        var filePath = path.join(__dirname, 'uploads', fileName);
        var sampleFile;

        console.log("filePath : ", filePath);
        console.log("Files : ", req.files);
        console.log("Body : ", req.body);
        if (!req.files) {
            res.send(500, 'failure');
        }

        sampleFile = req.files.file;
        sampleFile.mv(filePath, function(err) {
            if (err) {
                console.log("Error uploading file");
                res.send(500, err);
            } else {
                console.log("File Uploaded success");
                var policy = new Policy();
                policy.claim.claimid = id;
                policy.claim.username = req.body.username;
                policy.claim.email = req.body.email;
                policy.claim.policyid = req.body.policyid;
                policy.claim.category = req.body.category;
                policy.claim.benifit = req.body.benifit;
                policy.claim.bill = req.body.billamount;
                policy.claim.expdate = req.body.expdate;
                policy.claim.status = "Applied";
                policy.claim.filename = fileName;
                policy.claim.comments = "";
                console.log("Claim : ", policy);
                policy.save(function(err) {
                    if (err)
                        res.send(500, err);
                    res.send(200, 'success');
                });
            }
        });



    });

    app.post('/approvepolicy', isLoggedIn, function(req, res) {
        // console.log("===========");
        // console.log(req.body);
        // console.log("===========");
        var query = { 'new.policyid': req.body.policyid };

        var policy = new Policy();
        policy.new.username = req.body.username;
        policy.new.email = req.body.email;
        policy.new.policyid = req.body.policyid;
        policy.new.category = req.body.category;
        policy.new.benifit = req.body.benifit;
        policy.new.idproof = req.body.idproof;
        policy.new.expdate = req.body.expdate;
        policy.new.status = "Approved";
        policy.new.comments = req.body.comments;

        var upsertData = policy.toObject();
        delete upsertData._id;

        console.log("Update User details : ", upsertData);

        Policy.findOneAndUpdate(query, upsertData, { upsert: true }, function(err, policy) {
            if (err)
                res.send(500, err);

            var subject = "New Policy " + policy.new.policyid + " has been " + policy.new.status;
            var content = "<b> Hello " + policy.new.username + "</b>" + "<p> Your Policy number : " + policy.new.policyid + "has been" + policy.new.status + "</p> <p>" + policy.new.comments + "</p>";
            sendResponse(policy.new.username, policy.new.email, subject, content, function(error, response) {
                if (error)
                    console.log(" Error :", error);
                res.send(200, 'success');
            });

        });

        res.send(200, 'success');
    });

    app.post('/approveclaim', isLoggedIn, function(req, res) {
        // console.log("===========");
        // console.log(req.body);
        // console.log("===========");
        var query = { 'claim.claimid': req.body.claimid };

        var policy = new Policy();
        policy.claim.username = req.body.username;
        policy.claim.email = req.body.email;
        policy.claim.claimid = req.body.claimid;
        policy.claim.policyid = req.body.policyid;
        policy.claim.category = req.body.category;
        policy.claim.benifit = req.body.benifit;
        policy.claim.bill = req.body.bill;
        policy.claim.expdate = req.body.expdate;
        policy.claim.filename = req.body.filename;
        policy.claim.status = "Approved";
        policy.claim.comments = req.body.comments;

        var upsertData = policy.toObject();
        delete upsertData._id;

        console.log("Update User details : ", upsertData);

        Policy.findOneAndUpdate(query, upsertData, { upsert: true }, function(err, policy) {
            if (err)
                res.send(500, err);
            var subject = "New Claim " + policy.claim.policyid + " has been " + policy.claim.status;
            var content = "<b> Hello " + policy.claim.username + "</b>" + "<p> Your Claim number : " + policy.claim.policyid + "has been" + policy.claim.status + "</p> <p>" + policy.claim.comments + "</p>";
            sendResponse(policy.claim.username, policy.claim.email, subject, content, function(error, response) {
                if (error)
                    console.log(" Error :", error);
                res.send(200, 'success');
            });
        });

        res.send(200, 'success');
    });

    app.post('/rejectclaim', isLoggedIn, function(req, res) {
        // console.log("===========");
        // console.log(req.body);
        // console.log("===========");
        var query = { 'claim.claimid': req.body.claimid };

        var policy = new Policy();
        policy.claim.username = req.body.username;
        policy.claim.email = req.body.email;
        policy.claim.claimid = req.body.claimid;
        policy.claim.policyid = req.body.policyid;
        policy.claim.category = req.body.category;
        policy.claim.benifit = req.body.benifit;
        policy.claim.bill = req.body.bill;
        policy.claim.expdate = req.body.expdate;
        policy.claim.filename = req.body.filename;
        policy.claim.status = "Rejected";
        policy.claim.comments = req.body.comments;

        var upsertData = policy.toObject();
        delete upsertData._id;

        console.log("Update User details : ", upsertData);

        Policy.findOneAndUpdate(query, upsertData, { upsert: true }, function(err, policy) {
            if (err)
                res.send(500, err);
            var subject = "New Claim " + policy.claim.policyid + " has been " + policy.claim.status;
            var content = "<b> Hello " + policy.claim.username + "</b>" + "<p> Your Claim number : " + policy.claim.policyid + "has been" + policy.claim.status + "</p> <p>" + policy.claim.comments + "</p>";
            sendResponse(policy.claim.username, policy.claim.email, subject, content, function(error, response) {
                if (error)
                    console.log(" Error :", error);
                res.send(200, 'success');
            });
        });

        res.send(200, 'success');
    });

    app.post('/rejectpolicy', isLoggedIn, function(req, res) {
        // console.log("===========");
        // console.log(req.body);
        // console.log("===========");
        var query = { 'new.policyid': req.body.policyid };

        var policy = new Policy();
        policy.new.username = req.body.username;
        policy.new.email = req.body.email;
        policy.new.policyid = req.body.policyid;
        policy.new.category = req.body.category;
        policy.new.benifit = req.body.benifit;
        policy.new.idproof = req.body.idproof;
        policy.new.expdate = req.body.expdate;
        policy.new.status = "Rejected";
        policy.new.comments = req.body.comments;

        var upsertData = policy.toObject();
        delete upsertData._id;

        console.log("Update User details : ", upsertData);

        Policy.findOneAndUpdate(query, upsertData, { upsert: true }, function(err, policy) {
            if (err)
                res.send(500, err);
            var subject = "New Policy " + policy.new.policyid + " has been " + policy.new.status;
            var content = "<b> Hello " + policy.new.username + "</b>" + "<p> Your Policy number : " + policy.new.policyid + "has been" + policy.new.status + "</p> <p>" + policy.new.comments + "</p>";
            sendResponse(policy.new.username, policy.new.email, subject, content, function(error, response) {
                if (error)
                    console.log(" Error :", error);
                res.send(200, 'success');
            });
        });

        res.send(200, 'success');
    });

    app.post('/complaint', isLoggedIn, function(req, res) {
        var id = Date.now();

        var complaint = new Complaint();
        complaint.username = req.body.username;
        complaint.email = req.body.email;
        complaint.complaintid = id;
        complaint.complaint = req.body.complaint;
        complaint.status = "active";
        complaint.resolution = "";

        console.log("Claim : ", complaint);
        complaint.save(function(err) {
            if (err)
                res.send(500, err);
            res.send(200, 'success');
        });

        res.send(200, 'success');
    });

    app.post('/activeInsTypes', isLoggedIn, function(req, res) {
        var email = req.body.email;
        var activeInsTypes = ['Package1 - $1000', 'Package2 - $1500', 'Package3 - $2000', 'Package4 - $2500'];
        Policy.find({}, function(err, policies) {
            if (err)
                res.send(500, err);

            //console.log("activeInsTypes : ", Object.keys(policies));
            lodash.forEach(policies, function(policy) {
                if (policy.new.email === email) {
                    console.log("===================");
                    console.log(policy.new.benifit);
                    var index = activeInsTypes.indexOf(policy.new.benifit);
                    if (index > -1) {
                        activeInsTypes.splice(index, 1);
                    }
                    console.log("activeInsTypes :", activeInsTypes);
                    console.log("activeInsTypes :", activeInsTypes);
                    console.log("===================");
                }
            });


            res.send(200, activeInsTypes);
        });
    });

    // app.get('/sendresponse/:complaintid/:response', function(req, res) {
    //     var id = req.params.complaintid;
    //     var response = req.params.response;

    //     Complaint.find({ 'complaintid': id }, function(err, complaint) {
    //         if (err)
    //             res.send("Error Updating record");
    //         console.log("complaint : ", complaint);

    //         var query = { 'complaintid': complaint.complaintid };

    //         var complaint = new Complaint();
    //         complaint.username = complaint.username;
    //         complaint.email = complaint.email;
    //         complaint.complaintid = id;
    //         complaint.complaint = complaint.complaint;
    //         complaint.status = "closed";
    //         complaint.resolution = response;


    //         var upsertData = complaint.toObject();
    //         delete upsertData._id;

    //         console.log("Update complaint details : ", upsertData);

    //         // Complaint.findOneAndUpdate(query, upsertData, { upsert: true }, function(err, complaint) {
    //         //     if (err)
    //         //         res.send("Error");

    //         //     res.send("Success");
    //         // });


    //     });

    // });

    app.post('/sendresponse', isLoggedIn, function(req, res) {

        var query = { 'complaintid': req.body.complaintid };

        var complaint = new Complaint();
        complaint.username = req.body.username;
        complaint.email = req.body.email;
        complaint.complaintid = req.body.complaintid;
        complaint.complaint = req.body.complaint;
        complaint.status = "closed";
        complaint.resolution = req.body.resolution;


        var upsertData = complaint.toObject();
        delete upsertData._id;

        console.log("Update complaint details : ", upsertData);

        Complaint.findOneAndUpdate(query, upsertData, { upsert: true }, function(err, complaint) {
            if (err)
                res.send(500, err);

            var subject = "Response for compaint ID : " + complaint.complaintid;
            var content = "<b> Hello " + complaint.username + "</b>" + "<p> This is regarding complaint Id : " + complaint.complaintid + "</p> <p>" + complaint.resolution + "</p>";
            sendResponse(complaint.username, complaint.email, subject, content, function(error, response) {
                if (error)
                    console.log(" Error :", error);
                res.send(200, 'success');
            });
        });

        console.log('User Name :', req.user.local.email);

        res.send(200, 'success');
    });

    app.get('/complaint', isLoggedIn, function(req, res) {
        Complaint.find({ 'status': 'active' }, function(err, complaints) {
            if (err)
                res.send(500, err);
            console.log("Complaints : ", complaints);
            res.send(200, complaints);
        });
    });


    app.get('/myprofile', isLoggedIn, function(req, res) {
        res.render('myprofile');
    });

    app.get('/healthinsurance', function(req, res) {
        res.render('healthinsurance');
    });

    app.get('/renewalpolicy', function(req, res) {
        res.render('renewalpolicy');
    });

    app.get('/healthclaims', function(req, res) {
        res.render('healthclaims');
    });



    app.get('/profile/new', function(req, res) {
        // console.log('New User :', req.user.local.email);
        sendEmail(req.user.local.email, function(error, response) {
            //console.log('Email response : ', response);
        });
        res.render('login.ejs', { message: req.flash('loginMessage') });
    });


    app.get('/profile', isLoggedIn, function(req, res) {
        console.log("req.user.local.role : ", req.user.local.role);
        if (req.user.local.role == 'customer') {
            res.sendfile('./views/myaccount.html');
        }

        if (req.user.local.role == 'agent') {
            res.sendfile('./views/agent.html');
        }

        if (req.user.local.role == 'employee') {
            res.sendfile('./views/employee.html');
        }

    });

    //User.findOne({ 'local.email': email }, function(err, user) {});

    app.get('/newpolicies', isLoggedIn, function(req, res) {
        Policy.find({}, { new: 1, _id: 0 }, function(err, policies) {
            if (err)
                res.send(500, err);
            console.log("Policies : ", policies);
            res.send(200, policies);
        });
    });

    app.get('/newclaims', isLoggedIn, function(req, res) {
        Policy.find({}, { claim: 1, _id: 0 }, function(err, policies) {
            if (err)
                res.send(500, err);
            console.log("Policies : ", policies);
            res.send(200, policies);
        });
    });



    app.get('/approvedpolicies', isLoggedIn, function(req, res) {
        Policy.find({ 'new.status': 'Approved' }, function(err, policies) {
            if (err)
                res.send(500, err);
            console.log("Policies : ", policies);
            res.send(200, policies);
        });
    });



    app.get('/profile/home', isLoggedIn, function(req, res) {
        res.render('home');
    });

    app.get('/profile/nerds', isLoggedIn, function(req, res) {
        res.render('nerd');
    });

    app.get('/profile/geeks', isLoggedIn, function(req, res) {
        res.render('geek');
    });

    app.get('/profile/nerds', isLoggedIn, function(req, res) {
        res.render('nerd');
    });

    // =====================================
    // LOGOUT ==============================
    // =====================================
    app.get('/logout', function(req, res) {
        req.logout();
        res.redirect('/');
    });
};

// route middleware to make sure
function isLoggedIn(req, res, next) {

    // if user is authenticated in the session, carry on
    if (req.isAuthenticated())
        return next();

    // if they aren't redirect them to the home page
    res.redirect('/');
}
