console.log("At add workshop client...");

let addArtButton = document.getElementById("add-workshop");
addArtButton.addEventListener("click", addWorkshop);

function addWorkshop(){
    //store new artwork details in object
    let newWorkshop = {
        title: document.getElementById("add-worktitle").value,
        description: document.getElementById("add-workdescr").value,
    };

    //make new request to server
    let req = new XMLHttpRequest();
    req.onreadystatechange = function() {
    if(this.readyState==4 && this.status==200){
        alert("Successfully added workshop!")
    }
    else if(this.status==401){
        console.log("Error adding workshop.");
        alert("You must be an artist to add workshops.");
    }
    }
    //send a POST request to the server to add workshop
    req.open("POST", '/addWorkshop');
    req.setRequestHeader("Content-Type", "application/json");
    req.send(JSON.stringify({newWorkshop}));

}