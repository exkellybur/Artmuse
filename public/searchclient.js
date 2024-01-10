console.log("At search cient...");

let searchBtn = document.getElementById("search-box");
searchBtn.addEventListener("click", search);

let currPage = 1;

function search(){
    //put search parameteers in object
    let search = {
        artist: document.getElementById("search-artist").value.trim(),
        title: document.getElementById("search-title").value.trim(),
        category: document.getElementById("search-category").value.trim(),
        page: currPage
    }

    //makee a new request to the server
    let req = new XMLHttpRequest();
    req.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            console.log(JSON.parse(this.responseText));
            //update html
            const results = JSON.parse(this.responseText);
            updateResults(results);
        }
    };

    req.open("POST", '/search');
    req.setRequestHeader("Content-Type", "application/json");
    req.send(JSON.stringify({search}));
}

function updateResults(results) {
    let resultsDiv = document.querySelector(".results");

    //reset
    resultsDiv.innerHTML = '';

    //if no results
    if(results.length === 0){
        resultsDiv.innerHTML = `
            <p>No results found.</p>
        `;
    }
    else{
    //append to results div
    results.forEach(artwork => {
        let resultElement = document.createElement("div");
        resultElement.innerHTML = `
            <a href="/artwork/${artwork.title}">
                <img src="${artwork.poster}" alt="${artwork.title}">
            </a>
            <p>Artist: <a href="/artist/${artwork.artist.username}">${artwork.artist.username}</a></p>
            <p>Description: ${artwork.description}</p>
            <hr>
        `;
        resultsDiv.appendChild(resultElement);
    });

    // Add pagination buttons
    let paginationDiv = document.querySelector(".pagination");
    paginationDiv.innerHTML = '';

        // previous buttons
        if (currPage > 1) {
            let prevButton = document.createElement("button");
            prevButton.textContent = "Previous";
            prevButton.addEventListener("click", () => {
                currPage--;
                search();
            });
            paginationDiv.appendChild(prevButton);
        }

        // Create Next button
        let nextButton = document.createElement("button");
        nextButton.textContent = "Next";
        nextButton.addEventListener("click", () => {
            currPage++;
            search();
        });
        paginationDiv.appendChild(nextButton);
    }
}