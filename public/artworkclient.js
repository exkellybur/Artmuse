console.log("At artwork client...");

//add event listeners
let likeButton = document.getElementById("add-like");
likeButton.addEventListener("click", addLike);

let addReviewBtn = document.getElementById("addReview-btn");
addReviewBtn.addEventListener("click", addReview);


function addLike(){
    let artwork = document.getElementById("add-like").value;
    
    //make new request to server
    let req = new XMLHttpRequest();
    req.onreadystatechange = function() {
    if(this.readyState==4 && this.status==200){
        alert("You've liked this post!")
    }
    else if(this.status==401){
        console.log("Error liking post.");
        alert("You must be logged in to like artworks.");
    }
    else if(this.status==400){
        if(this.responseText === "User has already liked this artwork."){
            console.log("User has already liked this post.");
            alert("You have already liked this artwork. Please to go you user dashboard if you wish to remove your like.");
        }
        if(this.responseText === "User cannot like their own artwork"){
            console.log("User can't like their own artwork.");
            alert("You cannot like your own artwork.");
        }
    }
    }
    //send a PUT request to the server to update number of likes in artwork
    req.open("PUT", '/artwork/addLike');
    req.setRequestHeader("Content-Type", "application/json");
    req.send(JSON.stringify({artwork}));
}

function addReview(){
    let review = document.getElementById("add-review").value;
    let artwork = document.getElementById("addReview-btn").value;

    let data = { //object to send in request 
        review: review,
        artwork: artwork
    };

    console.log(data);

    //make new review request to server
    let req = new XMLHttpRequest();
    req.onreadystatechange = function() {
        if(this.readyState==4 && this.status==200){
            alert("Your review has been added!")
            review = "";
        }
        else if(this.status==401){
            console.log("Error adding review.");
            alert("You must be logged in to review artworks.");
        }
        else if(this.status==400){
            console.log("User can't review their own artwork.");
            alert("You cannot review your own artwork.");
        
        }
    }
    //send a POST request to the server to add a review
    req.open("POST", '/artwork/addReview');
    req.setRequestHeader("Content-Type", "application/json");
    req.send(JSON.stringify({data}));
}

