// Wait until the DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
  const uploadForm = document.getElementById('upload-form');
  const fileInput = document.getElementById('file-input');
  const fileNameEl = document.getElementById('file-name');
  const resultsDiv = document.getElementById('results');
  const mutualListEl = document.getElementById('mutual-list');
  const nonFollowersListEl = document.getElementById('non-followers-list');
  const fansListEl = document.getElementById('fans-list');

  // Display the file name when selected
  fileInput.addEventListener('change', function(e) {
    fileNameEl.textContent = e.target.files[0] ? e.target.files[0].name : 'No file chosen';
  });

  // Process the uploaded file on form submission
  uploadForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const file = fileInput.files[0];
    if (!file) {
      alert('Please choose a JSON file.');
      return;
    }
    const reader = new FileReader();
    reader.onload = function(e) {
      try {
        const data = JSON.parse(e.target.result);

        // Adjust these lines if your JSON file structure is different.
        // For example, Instagram download might provide objects with 'username' properties.
        const followers = (data.followers || []).map(item => item.username || item);
        const following = (data.following || []).map(item => item.username || item);

        // Create sets for easier lookup
        const setFollowers = new Set(followers);
        const setFollowing = new Set(following);

        // Compute mutuals (intersection)
        const mutuals = following.filter(user => setFollowers.has(user));
        // Compute non-followers: people you follow who don't follow you back
        const nonFollowers = following.filter(user => !setFollowers.has(user));
        // Compute fans (one-sided followers): people who follow you but you don’t follow back
        const fans = followers.filter(user => !setFollowing.has(user));

        // Populate the lists
        mutualListEl.innerHTML = mutuals.map(user => `<li>${user}</li>`).join('');
        nonFollowersListEl.innerHTML = nonFollowers.map(user => `<li>${user}</li>`).join('');
        fansListEl.innerHTML = fans.map(user => `<li>${user}</li>`).join('');

        resultsDiv.style.display = 'block';
      } catch (error) {
        alert('Error parsing JSON file: ' + error.message);
      }
    };
    reader.readAsText(file);
  });
});
