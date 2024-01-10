const User = require("./UserModel");
const Review = require("./ReviewModel");
const Artwork = require("./ArtworkModel");
const Workshop = require("./WorkshopModel");
const mongoose = require("mongoose");
const ObjectId = require('mongoose').Types.ObjectId
const fs = require("fs");
const path = require("path");

//start connection to database
mongoose.connect('mongodb://127.0.0.1:27017/gallery');

let db = mongoose.connection; 

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', async function() {

    await mongoose.connection.dropDatabase()
	console.log("Dropped database. Starting re-creation.");
    
    let followID; //holds the id of the aritst the dummy user will follow

    fs.readFile("gallery.json", "utf8", async function (err, contents) {
        if (err) {
            console.log("Error occurred reading file");
        }

        let artwork_data = JSON.parse(contents);

        let counter = 0; //to randomize which artworks gets likes 

        for(const artwork of artwork_data){
            let artistUser = null;
            //make username of aritst
            let artistUsername = artwork.Artist.toLowerCase().replace(/\s/g, '');
            
            //check for uniqueness 
            let existingUser = await db.collection("users").findOne({ username: artistUsername });

            if(!existingUser) { //if they don't exist - create new artist user
                const newArtist = new User({
                    username: artistUsername,
                    password: "password",
                    accountType: "artist" 
                });

                if(artistUsername == "vincentvangogh"){
                    //console.log(newArtist)
                    //followID = new ObjectId(newArtist._id);
                    followID = newArtist._id;
                    
                    //create testUser and follow banksy
                    const testUser = new User({
                        username: "test",
                        password: "password",
                        accountType: "patron",
                        following: [followID],
                    });
                    //console.log(testUser);
                    
                    //create a workshop for vincentvangogh - testing purpsoses
                    const testWorkshop = new Workshop({
                        artist: newArtist._id,
                        title: "super cool workshop",
                        description: "Very cool workshop where you do very cool things!!"
                    })
                
                    // save the artist to the database
                    await testUser.save();
                    await testWorkshop.save();
                }

                // save the artist to the database
                artistUser = await newArtist.save();
            } 
            else{
                //console.log("User already exists in the database:");
                artistUser = existingUser; 
            }

            //create artwork and asoociate the artist's ObjectID with it
            let newArtwork = new Artwork({
                title: artwork.Title,
                artist: artistUser._id,
                year: artwork.Year,
                category: artwork.Category,
                medium: artwork.Medium,
                description: artwork.Description,
                poster: artwork.Poster,
            });
            //add likes if counter is even 
            // if(counter%3 == 0){
            //     newArtwork.likes = 2;
            // }
            //save the artwork to the database 
            await newArtwork.save();
            //console.log("Artwork: " + newArtwork.title + " saved.");
            counter++;
        } 
        console.log("Database initialization complete.");
    });

})