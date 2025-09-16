const OMDB_API_KEY = "93a9ce8c"; // OMDb API key
const YOUTUBE_API_KEY = "AIzaSyBhBOyN6IpdB_WYmDDhphyVisVH7eljb2s"; // YouTube API key

// ================= LOGIN FUNCTION =================
async function login() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const errorMsg = document.getElementById("errorMsg");

  try {
    // Use relative path for GitHub Pages
    const res = await fetch("./users.json");
    if (!res.ok) throw new Error("Failed to load users.json");
    const users = await res.json();
    const user = users.find(u => u.email === email && u.password === password);

    if (user) {
      document.getElementById("loginPage").style.display = "none";
      document.getElementById("moviePage").style.display = "block";
    } else {
      errorMsg.textContent = "Invalid email or password";
    }
  } catch (err) {
    console.error("Error loading users.json:", err);
    errorMsg.textContent = "Could not load users. Try again later.";
  }
}

// ================= LOGOUT FUNCTION =================
function logout() {
  document.getElementById("moviePage").style.display = "none";
  document.getElementById("loginPage").style.display = "flex";
  document.getElementById("searchInput").value = "";
  document.getElementById("movieList").innerHTML =
    `<p class="ms1"><i> All Movies are Displayed Here... </i></p>`;
}

// ================= SEARCH MOVIES =================
async function searchMovies() {
  const searchTerm = document.getElementById("searchInput").value.trim();
  const movieList = document.getElementById("movieList");

  if (!searchTerm) {
    movieList.innerHTML = `<li class="ms2"><i>!! Please enter a movie name. !!</i></li>`;
    return;
  }

  movieList.innerHTML = `<li class="loading-text"><i>Loading...</i></li>`;

  const apiUrl = `https://www.omdbapi.com/?apikey=${OMDB_API_KEY}&s=${encodeURIComponent(searchTerm)}`;

  try {
    const response = await fetch(apiUrl);
    if (!response.ok) throw new Error("Network response was not ok");
    const data = await response.json();

    movieList.innerHTML = "";
    if (data.Response === "True") {
      data.Search.forEach(movie => {
        const li = document.createElement("li");
        li.classList.add("movie-card");
        const posterUrl = movie.Poster !== "N/A"
          ? movie.Poster
          : "https://dummyimage.com/200x300/1e2a38/ffffff&text=No+Poster";

        li.innerHTML = `
          <div class="poster-container">
            <img src="${posterUrl}" alt="${movie.Title}">
          </div>
          <h3>${movie.Title}</h3>
          <p>Year: ${movie.Year}</p>
        `;
        li.addEventListener("click", () => showMovieDetails(movie.imdbID));
        movieList.appendChild(li);
      });
    } else {
      movieList.innerHTML = `<li style="color:red;">!! No Movies Found For "${searchTerm}" !!</li>`;
    }
  } catch (err) {
    console.error("Error fetching movies:", err);
    movieList.innerHTML = `<li style="color:red;">Could not fetch movies. Check your internet or API key.</li>`;
  }
}

// ================= FETCH YOUTUBE VIDEO =================
async function fetchYouTubeVideo(query, index = 0) {
  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=5&q=${encodeURIComponent(query)}&key=${YOUTUBE_API_KEY}&regionCode=IN&relevanceLanguage=en`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("YouTube API blocked or key invalid");
    const data = await res.json();

    if (data.items && data.items.length > 0) {
      const videoIds = data.items.map(item => item.id.videoId).join(",");
      const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=status,contentDetails&id=${videoIds}&key=${YOUTUBE_API_KEY}`;
      const detailsRes = await fetch(detailsUrl);
      const detailsData = await detailsRes.json();

      const embeddableVideos = detailsData.items.filter(item =>
        item.status.embeddable === true &&
        item.status.privacyStatus === "public" &&
        !item.contentDetails.regionRestriction
      );

      if (embeddableVideos[index]) return `https://www.youtube.com/embed/${embeddableVideos[index].id}`;
      else if (embeddableVideos.length > 0) return `https://www.youtube.com/embed/${embeddableVideos[0].id}`;
    }
    return null;
  } catch (err) {
    console.error("Error fetching YouTube video:", err);
    return null;
  }
}

// ================= SHOW MOVIE DETAILS =================
async function showMovieDetails(imdbID) {
  const movieList = document.getElementById("movieList");
  movieList.innerHTML = `<span style="color:#FF5733; font-size:18px; font-weight:bold; font-style:italic; display:block;">Loading details...</span>`;

  const apiUrl = `https://www.omdbapi.com/?apikey=${OMDB_API_KEY}&i=${imdbID}&plot=full`;

  try {
    const response = await fetch(apiUrl);
    const movie = await response.json();
    movieList.innerHTML = "";

    const posterUrl = movie.Poster !== "N/A"
      ? movie.Poster
      : "https://dummyimage.com/250x375/1e2a38/ffffff&text=No+Poster";
    const template = document.getElementById("movieCardTemplate");
    const card = template.content.cloneNode(true);

    card.querySelector(".movie-title").textContent = `${movie.Title} (${movie.Year})`;
    card.querySelector(".movie-overview").textContent = movie.Plot;
    card.querySelector(".release-date").textContent = movie.Released;
    card.querySelector(".languages").textContent = movie.Language || "English";

    if (card.querySelector(".director")) card.querySelector(".director").textContent = movie.Director || "N/A";
    if (card.querySelector(".actors")) card.querySelector(".actors").textContent = movie.Actors || "N/A";
    if (card.querySelector(".genre")) card.querySelector(".genre").textContent = movie.Genre || "N/A";
    if (card.querySelector(".imdb-rating")) card.querySelector(".imdb-rating").textContent = movie.imdbRating || "N/A";

    const imgEl = card.querySelector("img");
    if (imgEl) { imgEl.src = posterUrl; imgEl.alt = movie.Title; }

    document.getElementById("movieList").appendChild(card);
  } catch (err) {
    console.error("Error fetching movie details:", err);
    movieList.innerHTML = `<li style="color:red;">Could not fetch movie details. Check your internet or API key.</li>`;
  }
}
