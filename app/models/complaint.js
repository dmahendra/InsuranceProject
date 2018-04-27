var mongoose = require('mongoose');

// define the schema for our user model
var complaintSchema = mongoose.Schema({

    username: String,
    email: String,
    complaintid: String,
    complaint: String,
    status: String,
    resolution: String

});

module.exports = mongoose.model('Complaint', complaintSchema);
