console.log("At login client.");

let loginButton = document.getElementById("login-btn");
loginButton.addEventListener("click", login);

function login(){
    let userInfo = {
        username: document.getElementById("login-username").value,
        password: document.getElementById("login-password").value,
    }

    console.log(userInfo);

    //make new login request to server
    let req = new XMLHttpRequest();
    req.onreadystatechange = function() {
        if(this.readyState==4 && this.status==200){
            //console.log("client username: " + response);   
            window.location.href = '/dashboard';
        }
        else if(this.status==401){
            const message = ("error logging in");
            alert("Not authorized. Invalid password or username.");
        }
        else if(this.status==409){
            alert("Already loggedin.")
        }
    }
    //send a POST request to the server with user information 
    req.open("POST", '/login');
    req.setRequestHeader("Content-Type", "application/json");
    req.send(JSON.stringify(userInfo));
}