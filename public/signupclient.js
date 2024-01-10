console.log("At signup client.");

let signupBtn = document.getElementById("signup-btn");
signupBtn.addEventListener("click", signup);

function signup(){
    let userInfo = {
        username: document.getElementById("signup-username").value,
        password: document.getElementById("signup-password").value,
    }

    console.log(userInfo);

    //make new login request to server
    let req = new XMLHttpRequest();
    req.onreadystatechange = function() {
        if(this.readyState==4 && this.status==200){
            //console.log("client username: " + response);   
            window.location.href = '/dashboard';
        }
        else if(this.status==409){
            alert("Username already exits, please use another one.");
        }
    }
    //send a POST request to the server with user information 
    req.open("POST", '/signup');
    req.setRequestHeader("Content-Type", "application/json");
    req.send(JSON.stringify(userInfo));
}