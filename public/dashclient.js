console.log("At dahsboard client...");

//get buttons
let remRevBtns = document.querySelectorAll('.remove-review');
let delLikeBtns = document.querySelectorAll('.remove-like');
let changeTypeBtn = document.getElementById("change-type");
let signoutBtn = document.getElementById("signout");

//event listener for change type button
changeTypeBtn.addEventListener("click", changeType);
signoutBtn.addEventListener("click", signout);
    
function signout(){
    //make new login request to server
    let req = new XMLHttpRequest();
    req.onreadystatechange = function() {
        if(this.readyState==4 && this.status==200){  
            window.location.href = '/';
        }
        else if(this.status==401){
            alert("You have to be logged in to log out.");
        }
        
    }
    //send a POST request to the server to log out
    req.open("POST", '/logout');
    req.setRequestHeader("Content-Type", "application/json");
    req.send();
}

function loadAddArt(){
    let req = new XMLHttpRequest();
    req.onreadystatechange = function() {
    if(this.readyState==4 && this.status==200){
        window.location.href = '/addArtwork';
    }
    else if(this.status==401){
        console.log("Error loading add artwork page.");
        alert("You must be logged in as artist.");
    }
    }
    //send a GET request to the server
    req.open("GET", '/artwork/addArtwork');
    req.setRequestHeader("Content-Type", "application/json");
    req.send();
}

function changeType(){
    //make new request to server
    let req = new XMLHttpRequest();
    req.onreadystatechange = function() {
    if(this.readyState==4 && this.status==200){
        if(this.responseText === "Change saved."){
            alert("You've successfully changed your account type!")
        }
        else if(this.responseText === "Add artwork first to become an artist."){
            window.location.href = '/changerequest/addArtwork';
        }
    }
    else if(this.status==401){
        console.log("Error changing account type")
        alert("You must be logged in.")
    }
    }
    //send a PUT request to the server
    req.open("PUT", '/changeType');
    req.setRequestHeader("Content-Type", "application/json");
    req.send();
}

//event listener for remove like button
if(delLikeBtns){ //check if they exist
    delLikeBtns.forEach(function(button){
        button.addEventListener("click", function(){
            let artwork = button.value;
            console.log("Like to delete: " + artwork);

            //make new request to server
            let req = new XMLHttpRequest();
            req.onreadystatechange = function() {
            if(this.readyState==4 && this.status==200){
                alert("Like removed!")
            }
            else if(this.status==401){
                console.log("Error removing like from artwork")
                alert("You must be logged in.")
            }
            }
            //send a PUT request to the server to update number of likes 
            req.open("PUT", '/artwork/deleteLike');
            req.setRequestHeader("Content-Type", "application/json");
            req.send(JSON.stringify({artwork}));
        });
    });
}

if(remRevBtns){//check if they exist
    //event listener for remove review button 
    remRevBtns.forEach(function(button){
        button.addEventListener("click", function(){
            let artwork = button.value;
            console.log(button.value);
            //console.log("Review to delete: " + artwork);

            //make new request to server
            let req = new XMLHttpRequest();
            req.onreadystatechange = function() {
            if(this.readyState==4 && this.status==200){
                alert("Review removed!")
            }
            else if(this.status==401){
                console.log("Error removing review from artwork")
                alert("You must be logged in.")
            }
            }
            //send a PUT request to the server to update number of likes 
            req.open("DELETE", '/artwork/deleteReview');
            req.setRequestHeader("Content-Type", "application/json");
            req.send(JSON.stringify({artwork}));
        });
    });
}

