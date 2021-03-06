const snoowrap = require('snoowrap');
const db = require('./db.js');

/**
 * Connect to the Reddit API via snoowrap
 * */
const r = new snoowrap({
    userAgent       :       process.env.SNOO_USERAGENT,
    clientId        :       process.env.SNOO_CLIENTID,
    clientSecret    :       process.env.SNOO_CLIENTSECRET,
    username        :       process.env.SNOO_USERNAME,
    password        :       process.env.SNOO_PASSWORD
});

r.config({requestDelay: 1000, warnings: false});

module.exports = {

    /**
     * Grab the 100 newest comments from /r/all and check if
     * the comment says "good bot" or "bad bot". If so,
     * obtain the parent name, commenter's name, and good/bad result
     * to store in the database.
     * */
    scrape: function() {
        /**
         * commentObj stores a returned promise containing 100 comments as JSON
         * */
        var commentObj = r.getNewComments('all', {
            limit: 100
        });
    
        commentObj.then(function(listing) {
            listing.forEach(function(key) {
                /**
                 * Check if comment meets the search criteria. 
                 * If so, pass the comment object and vote to storeVote() to 
                 * handle the database insertions and commenting
                 * */
                var comment = key.body.substring(0,8).toLowerCase();
                
                
                if(comment.includes("good bot")) {
                    console.log("Found comment '" + key.body + "'");
                    _storeVote(key, "good");
                }
                else if(comment.includes("bad bot")) {
                    console.log("Found comment '" + key.body + "'");
                    _storeVote(key, "bad");
                }
            });
        });
    }
};

/**
 * @summary Grabs the parent comment's name and sends relevant information
 *      to addToDb();
 * @param {object} comment object containing the comment's metadata
 * @param {string} the vote (good or bad)
 * @returns No return value
 * */
function _storeVote(commentObj, result) {
    /**
     * The type prefix ("t1_") indicates that the comment's parent is a comment
     * */
    if (commentObj.parent_id.substring(0,2) == "t1") {
        var voterName = commentObj.author.name;
        console.log("The voter is " + voterName);
        
        /**
         * Find the username of the parent comment. This is the bot's name.
         * */
        r.getComment(commentObj.parent_id).fetch().then(function (obj) {
            var botName = obj.author.name;
            var voterID = commentObj.name;
            var linkID = obj.link_id;
            console.log("The bot is " + botName);
            /**
             * Check if the voter and bot name are the same. If not then
             * send bot name, voter name, vote result, and voter ID to addToDb found in
             * the db.js file. This handles the database interaction and commenting.
             * */
            if (botName != voterName) {
                db.addToDb(botName, voterName, result, voterID, linkID);
            }
        });
    } else {
        console.log(voterName + " did not respond to a comment");
    }
}





