console.log("At artist client...");

//add event listeners
let followArtistBtn = document.getElementById("follow-artist");
// if (followArtistBtn) {//check if it exists
//     followArtistBtn.addEventListener('click', unfollowArtist);
// }
if(followArtistBtn){
    followArtistBtn.addEventListener("click", function(){
        let artist = document.getElementById("follow-artist").value;
        console.log(artist); 

        //make new following request to server
        let req = new XMLHttpRequest();
        req.onreadystatechange = function() {
        if(this.readyState==4 && this.status==200){
            alert("You've successfully followed this artist!")
        }
        else if(this.status==401){
            console.log("Error following artist.")
            alert("You must be logged in to follow artists.")
        }
        else if(this.status==409){
            console.log("Error following artist.")
            alert("You cannot follow yourself.")
        }
        }
        //send a POST request to the server to follow an artist
        req.open("POST", '/artist/follow');
        req.setRequestHeader("Content-Type", "application/json");
        req.send(JSON.stringify({artist}));
    })
}

let unfollowBtn = document.getElementById("unfollow-artist");
// if (unfollowBtn) {
//     unfollowBtn.addEventListener('click', unfollowArtist);
// }
if(unfollowBtn){
    unfollowBtn.addEventListener("click", function(){
        //console.log("here");
        let artist = document.getElementById("unfollow-artist").value;

        console.log(artist); 

        //make new following request to server
        let req = new XMLHttpRequest();
        req.onreadystatechange = function() {
        if(this.readyState==4 && this.status==200){
            alert("You've successfully unfollowed this artist!")
        }
        else if(this.status==401){
            console.log("Error following artist.")
            alert("You must be logged in to perform this action.")
        }
        }
        //send a DELETE request to the server to unfollow an artist
        req.open("DELETE", '/artist/unfollow');
        req.setRequestHeader("Content-Type", "application/json");
        req.send(JSON.stringify({artist}));
    })
}

let enrollButtons = document.querySelectorAll('.enroll-button');
enrollButtons.forEach(function(button){
    button.addEventListener('click', function(){
        let workshop = button.value; //store workshop id 
        console.log(workshop);

        //make new enrollment request to server
        let req = new XMLHttpRequest();
        req.onreadystatechange = function() {
        if(this.readyState==4 && this.status==200){
            alert("You've successfully enrolled in the workshop!")
        }
        else if(this.status==401){
            console.log("Error enrolling in workshop.")
            alert("You must be logged in to enroll in workshops.")
        }
        }
        //send a POST request to the server with user information 
        req.open("POST", '/artist/workshop');
        req.setRequestHeader("Content-Type", "application/json");
        req.send(JSON.stringify({workshop}));
    });
});


