const User = require("./UserModel");
const Review = require("./ReviewModel");
const Artwork = require("./ArtworkModel");
const Workshop = require("./WorkshopModel");
const mongoose = require("mongoose");
const ObjectId = require('mongoose').Types.ObjectId;
const express = require('express');
const session = require('express-session');
let router = express.Router();

let db = mongoose.connection;

//Middleware to log requests 
router.use(function(req,res,next){ 
    console.log(req.method);
    console.log(req.url);
    console.log(req.path);
    console.log("Body: ", req.body);
    next(); // next registered handler for this requested URL
});

//routes
router.get("/:artworkName", loadArtworkPage);
router.put("/addLike", authLoggedIn, addLike);
router.put("/deleteLike", authLoggedIn, deleteLike);
router.post("/addReview", authLoggedIn, addReview);
router.delete("/deleteReview", deleteReview);
router.get("/category/:category", loadCategoryResult);
router.get("/medium/:medium", loadMediumResults);
router.post("/addArtwork", specialAuth, addArtwork);


//loads the artwork's page
async function loadArtworkPage(req, res){
    console.log("Loading artwork page...");
    try{
        //find artwork in database
        //let artwork = await db.collection("artworks").findOne({title: req.params.artworkName});
        let artwork = await Artwork.findOne().where("title").equals(req.params.artworkName).populate("artist").exec();
        console.log(artwork);
        //await artwork.populate("artist"); //populate artist property 

        //find reviews 
        let reviews  = await Review.find().where("artwork").equals(artwork._id).populate("user").exec();

        //render paage
        res.status(200).render("pages/artwork", {artwork: artwork, reviews: reviews});
    }
    catch(err){
        console.log(err);
        res.status(404).send("That artwork does not exist.");
    }
}

//function to check if user is logged in 
function authLoggedIn(req, res, next){
	if(req.session.loggedin){
		next();
	}
	else{
		res.status(401).send("Not logged in");
	}
}

//function to check if user is artist
async function authArtist(req, res, next){
    let user = await User.findOne({username: req.session.username});
	if(user.accountType === "artist"){
		next();
	}
	else{
		res.status(401).send("You must be an artist to perform this action.");
	}
}

//special authorization to see if user is either a patron trying to change to an artist
//or if they're an artist
async function specialAuth(req, res, next){
    let user = await User.findOne({username: req.session.username});
	if(user.accountType === "artist" || req.session.changeRequest == true){
		next();
	}
	else{
		res.status(401).send("You must be an artist to perform this action.");
	}
}


async function addArtwork(req, res){
    console.log("Adding artwork...");
    //get new artwork from req body
    let data = req.body.newArtwork;
    console.log(data);

    //check if artwork name is unique
    //let isUnique = await Artwork.find().where("title").equals(data.title);
    let isUnique = await Artwork.find({ title: { $regex: new RegExp(data.title, 'i') } });
    if(isUnique.length > 0){
        console.log("An artwork with this title already exists.");
        res.status(409).send("Title already exists.");
        return;
    }

    try{
        //add to database
        let newArtwork = new Artwork({
            artist: req.session.userId,
            title: data.title,
            year: data.year,
            category: data.category,
            medium: data.medium,
            description: data.description,
            poster: data.poster
        });
       await newArtwork.save(); //save

       //add to any followers notifs
       let followers = await User.find().where("following").in(req.session.userId).exec();
       console.log(followers);
       if(followers.length > 0){
           for(let follower of followers){
               await User.findByIdAndUpdate(
                   follower._id,
                   {
                       $push: {
                           notifications: {
                               user: req.session.userId,
                               text: "Added an artwork."
                           }
                       }
                   }
               );
               await follower.save();
           }
       }

       //if it's the user's first artwork - make them an artist
       let user = await User.findOne({username: req.session.username});
       let artworks = await Artwork.find().where("artist").equals(user._id);
       if(artworks.length == 1){
            user.accountType = "artist";
            await user.save();
            req.session.changeRequest = false;
            res.status(200).send("Artist change complete.");
            return;
       }
       else{
        res.status(200).send("Artwork added successfully.");
       }
       
    }
    catch(err){
        req.session.changeRequest = false;
        console.log(err);
        res.status(404).send("Error reading database");
    }

}


async function addLike(req, res){
    console.log("Editing likes...");
    try{
        //find artwork in database
        let artwork = await Artwork.findOne({title: req.body.artwork});
        console.log(artwork);

        //find user in database
        let user = await User.findOne({username: req.session.username});
        
        //check if this is their artwork
        if(artwork.artist.equals(user._id)){
            console.log("Can't like your own artwork.");
            res.status(400).send("User cannot like their own artwork");
            return;
        }

        //Check if user has already liked the artwork 
        if (user.likes.includes(artwork._id)) {
            console.log("User has already liked this artwork.");
            res.status(400).send("User has already liked this artwork.");
            return;
        }

        //increment likes for artwork 
        artwork = await Artwork.findOneAndUpdate(
            {title: req.body.artwork},
            {$inc: { likes: 1 }},
            {new: true}
        );
        console.log(artwork);

        //add artwork to the user's likes 
        await User.findOneAndUpdate(
            { username: user.username },
            { $push: { likes: artwork._id}},
            { new: true }
        );
        
        //send notification to artist that a user liked their artwork
        await User.findByIdAndUpdate(artwork.artist._id,{$push: {notifications: {user: req.session.userId, text: "Liked your artwork."}}});

        res.status(200).send("Successfully added like to artwork!");
    }
    catch(err){
        res.status(404).send("Error getting data from database.");
        console.log(err);
        return;
    }
}

async function deleteLike(req, res){
    console.log("Removing like from artwork...");
    try{
        //find artwork in database
        let artwork = await Artwork.findOne({title: req.body.artwork});
        console.log(artwork);

        //find user in database
        let user = await User.findOne({username: req.session.username});

        //update likes for artwork (-1)
        artwork = await Artwork.findOneAndUpdate(
            {title: req.body.artwork},
            {$inc: { likes: -1 }},
            {new: true}
        );
        //console.log(artwork);

        //remove artwork from the user's likes 
        await User.findOneAndUpdate(
            { username: user.username },
            { $pull: { likes: artwork._id}},
            { new: true }
        );

        res.status(200).send("Successfully removed this artwork from your likes");
    }
    catch(err){
        res.status(404).send("Error getting data from database.");
        console.log(err);
        return;
    }
}

async function addReview(req, res){
    console.log("Adding review...");
    try{
        //find artwork in database
        let artwork = await Artwork.findOne({title: req.body.data.artwork});

        //check if this is the current user's artwork
        if(artwork.artist.equals(req.session.userId)){
            console.log("User cannot review their own artwork");
            res.status(400).send("User cannot review their own artwork");
            return;
        }

        //console.log(req.body.data.artwork)
        //console.log(artwork);
        //create new review
        let newReview = new Review({
            artwork: artwork._id,
            user: req.session.userId,
            text: req.body.data.review
        });
        //console.log(newReview)
        await newReview.save(); //save review to database
        res.status(200).send("Successfully added review!");
    }
    catch(err){
        console.log(err);
        res.status(404).send("Error getting data from database.")
    } 
}

async function deleteReview(req, res){
    console.log("Deleting review..."); 
    try{
        //find artwork in database
        let artwork = await Artwork.findOne({title: req.body.artwork});

        //delete review from database
        await Review.deleteOne({artwork: artwork._id});

        res.status(200).send("Successfully deleted review!");
    }
    catch(err){
        console.log(err);
        res.status(404).send("Error getting data from database.")
    } 
}

async function loadCategoryResult(req, res){
    //get category from parameters
    try{
        let category = req.params.category;
        category = category.slice(1);
        console.log(category);

        //find artworks with the same category
        let results = await Artwork.find().where("category").equals(category);

        console.log(results);
        res.status(200).render("pages/searchResult", {artworks: results});
    }
    catch(err){
        console.log(err);
        res.status(404).send("Error reading databse");
        return;
    }
}

async function loadMediumResults(req, res){
    //get category from parameters
    try{
        let medium = req.params.medium;
        medium = medium.slice(1);
        console.log(medium);

        //find artworks with the same category
        let results = await Artwork.find().where("medium").equals(medium);

        console.log(results);
        res.status(200).render("pages/searchResult", {artworks: results});
    }
    catch(err){
        console.log(err);
        res.status(404).send("Error reading database");
        return;
    }
}




//export the router so it can be mounted to main app 
module.exports = router; 