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
//router.get("/page/addWorkshop", authArtist, addWorkshop);
router.get("/:username", loadArtistPage);
router.post("/workshop", authLoggedIn, enrollUser);
router.post("/follow", authLoggedIn, followArtist);
router.delete("/unfollow", authLoggedIn, unfollowArtist);

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

//function to load the artist's page 
async function loadArtistPage(req, res){
    console.log("Loading artist's page...");
    let currName = req.params.username;

    try{
        let isFollowing = false;
        //get artist from database
        //let targetArtist = await db.collection("users").findOne({username:artistName}).populate("likes");
        let targetUser = await User.findOne({ username: currName }).populate('likes');
        //console.log(targetArtist);
        //find all artist's artworks
        let art = await Artwork.find().where("artist").equals(targetUser._id).populate('artist').exec();
        //console.log(art);
        //find artists workshops 
        let foundWorkshops = await Workshop.find().where("artist").equals(targetUser._id).populate("artist").exec();
        //get user's likes
		let likes = targetUser.likes;
        //find users reviews
		let reviews = await Review.find().where("user").equals(targetUser._id).populate("artwork").exec();

        //see if user is currently following artist 
        if(req.session.loggedin){
            let user = await User.findOne({ username: req.session.username });
            //console.log(user);
            isFollowing = await user.following.some(artist => artist._id.equals(targetUser._id));
        }

        res.status(200).render("pages/artist", {artist: targetUser, artworks: art, workshops: foundWorkshops, isFollowing: isFollowing, likes: likes, reviews: reviews});
    }   
    catch(err){
        console.log(err);
        res.status(404).send("That user does not exist.");
		return;
    }

}

async function enrollUser(req, res){
    console.log("Enrolling user in workshop...");
    console.log(req.body.workshop);
    try{
        //find workshop in database
        let targetWorkshop = await Workshop.findOne({_id: new ObjectId(req.body.workshop)}).populate("artist").exec();
        //add user to the list of enrolled users
        targetWorkshop.enrolled.push(req.session.userId);
        await targetWorkshop.save();//save changes
        res.status(200).send("Successfully enrolled");
    }
    catch(err){
        res.status(404).send("Workshop not found.");
        console.log(err);
        return;
    }
}

async function loadWorkshopPage(req, res){
    console.log("Loading workshop's page...");
    let workshopID = req.params.workshopID.slice(1);
    console.log(workshopID);
    try{
        //find workshop in database
        let targetWorkshop = await Workshop.findOne({_id: new ObjectId(workshopID)}).populate("artist").populate("enrolled").exec();
        //console.log(targetWorkshop);
        res.status(200).render("pages/workshop", {workshop: targetWorkshop});

    }
    catch(err){
        res.status(404).send("Workshop not found.");
        console.log(err);
        return;
    }
}

async function followArtist(req, res){
    console.log("Following artist...");

    try{
        //find artist in database 
        let artist = await User.findOne({username: req.body.artist}).exec();
        //find user of current session
        let user = await User.findOne({username: req.session.username}).exec();
        //check if they're trying to follow themselves 
        if(user.username === artist.username){
            console.log("User cannot follow themselves.");
            res.status(409).send("User cannot follow themselves.");
        }
        else{
            //update following property of user 
            user.following.push(artist._id);
            await user.save(); //save changes
            //notify artist that user followed them
            //let followers = await User.find().where("following").in(req.session.userId).exec();
            await User.findByIdAndUpdate(artist._id,{$push: {notifications: {user: req.session.userId, text: "Started following you."}}});

            res.status(200).send("Follow artist success.");
        }
    }
    catch(err){
        console.log(err);
        res.status(500).send("Error retrieving data from database");
    }
    
}

async function unfollowArtist(req, res){
    console.log("unfollowing artist...");

    try{
        //find artist in database 
        let artist = await User.findOne({username: req.body.artist}).exec();
        //find user of current session
        let user = await User.findOne({username: req.session.username}).exec();
        //update following property of user 
        user.following.pull(artist._id);
        await user.save(); //save changes
        res.status(200).send("unfollow artist success.");
    }
    catch(err){
        console.log(err);
        res.status(500).send("Error retrieving data from database");
    }
    
}



//export the router so it can be mounted to main app 
module.exports = router; 