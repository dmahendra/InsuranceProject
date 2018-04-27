var mongoose = require('mongoose');

// define the schema for our user model
var policySchema = mongoose.Schema({

    new: {
        username: String,
        email: String,
        policyid: String,
        category: String,
        benifit: String,
        idproof: String,
        filename: String,
        status: String,
        expdate: String,
        comments: String,
    },

    claim: {
        claimid: String,
        username: String,
        email: String,
        policyid: String,
        category: String,
        benifit: String,
        bill: String,
        filename: String,
        status: String,
        expdate: String,
        comments: String,
    },

    /*renewal: {
        id: String,
        token: String,
        email: String,
        name: String
    }*/

});


// create the model for users and expose it to our app
module.exports = mongoose.model('Policy', policySchema);
