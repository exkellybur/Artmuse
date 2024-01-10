const User = require("./UserModel");
const Review = require("./ReviewModel");
const Artwork = require("./ArtworkModel");
const Workshop = require("./WorkshopModel");
const mongoose = require("mongoose");
const ObjectId = require('mongoose').Types.ObjectId;
const express = require('express');
const app = express();
const session = require('express-session');
const MongoDBGallery = require('connect-mongodb-session')(session);

const gallery = new MongoDBGallery({
	uri: 'mongodb://127.0.0.1:27017/gallery',
	collection: 'sessiondata'
});

app.use(session({
	secret: 'some secret key here',
	resave: true,
	saveUninitialized: true,
	store: gallery,
	loggedin: false
}));

app.set("view engine", "pug");

//automatically parse application/json data
app.use(express.json());

//serve static files in directory 
app.use(express.static("public"));

//require routers 
let artistRouter = require("./artist-router.js");
app.use("/artist", artistRouter);
let artworkRouter = require("./artwork-router.js");
app.use("/artwork", artworkRouter);


//other routes
app.get("/", loadHome);

app.get("/login", authNotLogged, loadLogin);
app.post("/login", login, loadDashboard); // send POST request to /login route to login
app.get("/signup", authNotLogged, loadSignup);
app.post("/logout", authLoggedIn, logout);
app.post("/signup", authNotLogged, signup, loadDashboard);

app.get("/dashboard", authLoggedIn, loadDashboard);

app.put("/changeType", changeAccount);

app.get("/addArtwork", authArtist ,loadAddArtwork);
app.get("/changerequest/addArtwork", auth, loadAddArtwork);

app.get("/notifications", auth, loadNotifications);
app.get("/following", auth, loadFollowing);

app.get("/addWorkshop", authArtist, loadAddWorkshop);
app.post("/addWorkshop", authArtist, addWorkshop);
app.get("/workshop/:workshopID", authLoggedIn, loadWorkshop);

app.post("/search", performSearch);
app.get("/search", loadSearchPage);

//for URLS that don't exist
app.get('*', (req, res) => {
    res.status(404).send('404 Page Not Found');
});

//logging session data
app.use(function (req, res, next) {
	console.log(req.session);
	next();
});

//Middleware to log requests 
app.use(function(req,res,next){ 
    console.log(req.method);
    console.log(req.url);
    console.log(req.path);
    console.log("Body: ", req.body);
    next(); // next registered handler for this requested URL
});

//check if it's the user's session
function auth(req, res, next){
	if(req.session.username){
		next();
	}
	else{
		res.status(401).send("Not authenticated");
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

//function to check if user is logged in 
function authLoggedIn(req, res, next){
	if(req.session.loggedin){
		next();
	}
	else{
		res.status(401).send("Not logged in");
	}
}

//function to see if nobody is logged in
function authNotLogged(req, res, next){
	if(req.session.loggedin){
		res.status(401).send("Already logged in.");
	}
	else{
		next();
	}
}

//loads search page
async function loadSearchPage(req, res){
    try{
        res.status(200).render('pages/search');
    }
    catch(error){
        console.log(error);
        res.status(500).send('Server error rendering search page');
        return;
    }
}

//loads notifications page for user
async function loadNotifications(req, res){
	console.log("Loading notifications page...");
	try{
		// let user = await User.findOne({ username: req.session.username });
		// await user.notifications.populate("user").exec();
		//find user and populate notifs
		let user = await User.findOne({ username: req.session.username }).populate({path: 'notifications.user', model: 'User' }).exec();
		let notifications = user.notifications; //get array of following 
		console.log(notifications);
		res.status(200).render("pages/notifications", {notifications: notifications});
	}
	catch(error){
		console.log(error);
		res.status(404).send("Error reading database.")
	}
}

//function that loads following page of user
async function loadFollowing(req, res){
	console.log("Loading following page...");
	try{
		let user = await User.findOne({ username: req.session.username }).populate('following').exec();
		let following = user.following; //get array of following
		console.log(following); 
		res.status(200).render("pages/following", {following: following});
	}
	catch(error){
		console.log(err);
		res.status(404).send("Error reading database.")
	}
}

//loads add artwork page
async function loadAddArtwork(req, res){
	try{
        console.log("loading add artwork page...");
		res.status(200).render("pages/addArtwork");
	}
	catch(err){
		console.log(err);
		res.status(500).send("Internal Server Error");
	}
}

//loads add workshop page
async function loadAddWorkshop(req, res){
	try{
        console.log("loading add workshop page...");
		res.status(200).render("pages/addWorkshop");
	}
	catch(err){
		console.log(err);
		res.status(500).send("Internal Server Error");
	}
}

//render main home page 
async function loadHome(req, res){
	try{
        console.log("loading home page...");
		let result = await Artwork.find().populate("artist").exec();
		let loggedin = req.session.loggedin;
		res.status(200).render('pages/index', {artworks: result, loggedin: loggedin});
	}
	catch(err){
		console.log(err);
		res.status(500).send("Internal Server Error");
	}
}
// app.get('/', async function(req, res){
// 	//let result = await Artwork.find().where("likes").gte(2);
// 	let result = await Artwork.find().populate("artist").exec();
// 	let loggedin = req.session.loggedin;
// 	res.status(200).render('pages/index', {artworks: result, loggedin: loggedin});
// });

//render signup page
async function loadSignup(req,res){
	try{
		res.status(200).render('pages/signup');
	}
	catch(error){
		console.log(error);
        res.status(500).send("Error redndering signup");
        return;
	}
}

//render login page
async function loadLogin(req, res){
	try{
		res.status(200).render('pages/login');
	}
	catch(error){
		console.log(error);
        res.status(500).send("Error rendering login page");
        return;
	}
}


//function that loads the user's dashboard 
async function loadDashboard(req, res){
	console.log("Loading dashboard...");
	try{
		//find user in database
		let currUser = await User.findOne({ username: req.session.username }).populate('likes');
		//get user's likes
		let likes = currUser.likes;
		//find users reviews
		let reviews = await Review.find().where("user").equals(currUser._id).populate("artwork").exec();

		//render dashboard for user 
		res.status(200).render(`pages/dashboard`, {user: currUser, likes: likes, reviews: reviews});
	}
	catch(err){
		console.log(err);
		res.status(404).send("Error reading database.")
	}

}

//load a specific workshop page
async function loadWorkshop(req, res){
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
        res.status(500).send("Error in server.");
        console.log(err);
        return;
    }
}

//function that logs user out
async function logout(req, res){
	console.log("Attempting to log out");
	try{
		req.session.loggedin = false;
    	req.session.userId = null;
    	req.session.username = null;
		res.status(200).send("Successfully logged out.");
		}
	catch(error){
		console.log(error);
        res.status(500).send("Error retrieving data from database");
        return;
	}
}

//signup new user 
async function signup(req, res, next){
	console.log("Attempting to signup...");
	try{
		//check if username already exists
		if(await User.findOne({username: req.body.username})){
			console.log("username already exists.")
			res.status(409).send("Username already in use.")
			return;
		}
		else{
			let newUser = new User({ //create new user model
				username: req.body.username,
				password: req.body.password,
				accountType: "patron",
				likes: [],
				following: [],
				notifications: []
			});
			console.log(newUser);
			newUser.save();//save user

			//update session information
			req.session.userId = newUser._id;
			req.session.username = req.body.username; //we keep track of what user this session belongs to
			req.session.loggedin = true;

			console.log("Successfully signed up!");
			res.status(200).send("Successfully signed up!")
		}
	}
	catch(error){
		console.log(error);
        res.status(500).send("Error retrieving data from database");
        return;
	}
}

//If the username and password match somebody in our database,
// then create a new session ID and save it in the database.
//That session ID will be associated with the requesting user.
async function login(req, res, next){
	console.log("Attempting log in...");

	//if already logged in 
	if (req.session.loggedin) {
		//res.status(200).send("Already logged in.");
		return;
	}

	//console.log(req.body);
	let username = req.body.username;
	let password = req.body.password;

	console.log("Logging in with credentials: ");
	console.log("Username: " + req.body.username);
	console.log("Password: " + req.body.password);
	
	try{
		//search username in db
		let user = await User.findOne({ username });
		console.log(user);

		//check if the user exists
		if (!user) {
			res.status(401).send("Unauthorized");
			return;
		}
		
		//check if right passwrod
		if(req.body.password === user.password){
			req.session.loggedin = true; // now that particular user session has loggedin value, and it is set to true
			req.session.userId = user._id;
			//We set the username associated with this session
			//On future requests, we KNOW who the user is
			//We can look up their information specifically
			//We can authorize based on who they are
			req.session.username = username; //we keep track of what user this session belongs to
			//res.status(200).json({username});
			console.log("login success");
			next();
		}
		else{
			res.status(401).send("Unauthorized");
			return;
		}

	}
	catch(error){
		console.log(error);
		res.status(500).send("Internal server error.");
		return;
	}
		
}

//function to change user account type
async function changeAccount(req, res, next){
	console.log("Changing account type...");
	try{
		//find user in database
		let user = await User.findOne({username: req.session.username});
		//change to opposite of what they currently are
		if(user.accountType === "patron"){
			
			//let artworks = await Artwork.find({ artist: user._id });

			//check if user has artwork
			let artworks = await Artwork.find().where("artist").equals(user._id);
			console.log(artworks);
			if(artworks.length == 0){
				console.log("at new artist condition");
				req.session.changeRequest = true;
				res.status(200).send("Add artwork first to become an artist.");
				return;
			}
			else{
				//change
				user.accountType = "artist";
				await user.save(); //save changes 

				res.status(200).send("Change saved.");
			}
		}
		else{
			user.accountType = "patron";
			await user.save(); //save changes 
			res.status(200).send("Change saved.");
		}
	}
	catch(err){
		console.log(err);
		res.status(404).send("Error reading database.");
	}
}

//function to adda workshop
async function addWorkshop(req, res){
    console.log("Adding workshop...");
    try{
        let data = req.body.newWorkshop;
        console.log(data);

        let newWorkshop = new Workshop({
            artist: req.session.userId,
            title: data.title,
            description: data.description,
            enrolled: [],
        });
        await newWorkshop.save();

        //find followers and update their notifications
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
                                text: "Added a workshop."
                            }
                        }
                    }
                );
                await follower.save();
            }
        }
        res.status(200).send("Successfully added workshop");

    }
    catch(error){
        console.log(error);
        res.status(500).send("Error retrieving data from database");
        return;
    }
}

//function to perform a search from the search page 
async function performSearch(req, res){
	console.log("Performing search...");
    try{
		//get search parameters from the request body
        //const { artist, title, category } = req.body.search;
		let title = req.body.search.title;
		let artistname = req.body.search.artist;
		let category = req.body.search.category;
		let page = req.body.search.page;

		const perPage = 10;
        let skip = (page - 1) * perPage;

        //object to store filter for search
        let toSearch = {};
		let results = {}; //store results from search

        //check if strings are empty
		//if not - create case-insensitive regex for each search val
        if (artistname.length != 0) {
            let targetArtist = await User.findOne({username: artistname});
			console.log(targetArtist);
			if(targetArtist){
            	toSearch.artist = targetArtist._id;
			}
        }
        if (title.length != 0) {
			console.log("here");
            const regexTitle = new RegExp(title, 'i');
            toSearch.title = { $regex: regexTitle };
        }
        if (category.length != 0) {
			console.log("here");
            const regexCategory = new RegExp(category, 'i');
            toSearch.category = { $regex: regexCategory };
        }
		//console.log(toSearch);

        //find matching artworks in databse and limit results to 10 for pagination
        //let results = await Artwork.find(toSearch).limit(10).exec();
		if(Object.keys(toSearch).length === 0){ //if search filter is empty - don't perform search at all
			console.log("Empty search");
			res.status(200).json([results]);
		}
		else{
			results = await Artwork.find(toSearch)
				.skip(skip)
				.limit(perPage)
				.populate("artist")
				.exec();
			//console.log(results);

        	res.status(200).json(results);
		}
    }
    catch(error){
        console.log(error);
        res.status(500).send("Server error.")
        return;
    }
}

mongoose.connect('mongodb://127.0.0.1/gallery');

let db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', async function() {
	let welcomeMessage = "Welcome to the Gallery Home Page";
	await mongoose.connection.db.collection("config").replaceOne({id:"mainpage"}, {id:"mainpage", message: welcomeMessage}, {upsert:true})
	app.listen(3000);
	console.log("Server listening on port 3000");
});