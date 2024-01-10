console.log("At add client...");

let addArtButton = document.getElementById("add-artwork");
addArtButton.addEventListener("click", addArtwork);

function addArtwork(){
    //store new artwork details in object
    let newArtwork = {
        title: document.getElementById("add-title").value,
        year: document.getElementById("add-year").value,
        category: document.getElementById("add-category").value,
        medium: document.getElementById("add-medium").value,
        description: document.getElementById("add-description").value,
        poster: document.getElementById("add-poster").value,
    };

    //make new request to server
    let req = new XMLHttpRequest();
    req.onreadystatechange = function() {
        console.log(this.status);
        if(this.readyState==4 && this.status==200){
            if(this.responseText === "Artist change complete."){
                console.log("User is now an artist");
                alert("You have have successfully changed your account type to artist");
            }
            else{
                alert("Artwork added!")
            }
        }
        else if(this.status == 409){
            alert("This title already exists, please use another one");
        }
        else if(this.status==401){
            console.log("Error adding artwork.");
            alert("You must be an artist to add artworks.");
        }
        else if(this.status==400){
            
        }
    }
    //send a POST request to the server to add artwork
    req.open("POST", '/artwork/addArtwork');
    req.setRequestHeader("Content-Type", "application/json");
    req.send(JSON.stringify({newArtwork}));

}