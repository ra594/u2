document.addEventListener('DOMContentLoaded', function() {
  // DOM element references
  const fileInput = document.getElementById('file-input');
  const fileNameSpan = document.getElementById('file-name');
  const uploadForm = document.getElementById('upload-form');
  const resultsDiv = document.getElementById('results');
  const mutualList = document.getElementById('mutual-list');
  const nonFollowersList = document.getElementById('non-followers-list');
  const fansList = document.getElementById('fans-list');

  // Update file name when a file is selected
  fileInput.addEventListener('change', function() {
    if (fileInput.files.length > 0) {
      fileNameSpan.textContent = fileInput.files[0].name;
    } else {
      fileNameSpan.textContent = 'No file chosen';
    }
  });

  // Handle form submission
  uploadForm.addEventListener('submit', function(e) {
    e.preventDefault();

    if (!fileInput.files || fileInput.files.length === 0) {
      alert('Please choose a ZIP file.');
      return;
    }

    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = function(e) {
      const arrayBuffer = e.target.result;
      // Load the ZIP file using JSZip
      JSZip.loadAsync(arrayBuffer)
        .then(function(zip) {
          // Navigate to the folder "connections/followers_and_following"
          const folder = zip.folder("connections/followers_and_following");
          if (!folder) {
            alert('The ZIP file does not contain the required folder structure: connections/followers_and_following');
            return;
          }
          // Get the JSON files
          const followingFile = folder.file("following.json");
          const followersFile = folder.file("followers_1.json");
          if (!followingFile || !followersFile) {
            alert('The ZIP file is missing one or both required JSON files (following.json, followers_1.json).');
            return;
          }
          // Read following.json
          const followingPromise = followingFile.async("string").then(function(content) {
            let data;
            try {
              data = JSON.parse(content);
            } catch (error) {
              alert('Error parsing following.json');
              throw error;
            }
            // Extract usernames from relationships_following array
            const followingUsernames = data.relationships_following.map(item => {
              if (item.string_list_data && item.string_list_data.length > 0) {
                return item.string_list_data[0].value;
              }
              return null;
            }).filter(username => username !== null);
            return followingUsernames;
          });
          // Read followers_1.json
          const followersPromise = followersFile.async("string").then(function(content) {
            let data;
            try {
              data = JSON.parse(content);
            } catch (error) {
              alert('Error parsing followers_1.json');
              throw error;
            }
            // Extract usernames from each item in the array
            const followersUsernames = data.map(item => {
              if (item.string_list_data && item.string_list_data.length > 0) {
                return item.string_list_data[0].value;
              }
              return null;
            }).filter(username => username !== null);
            return followersUsernames;
          });

          Promise.all([followingPromise, followersPromise]).then(function(values) {
            const followingUsernames = values[0];
            const followersUsernames = values[1];

            // Compute the three lists
            // Mutual: users present in both lists
            const mutual = followingUsernames.filter(username => followersUsernames.includes(username));
            // Non-Followers: users you follow who don't follow you back
            const nonFollowers = followingUsernames.filter(username => !followersUsernames.includes(username));
            // Fans: users who follow you but you don't follow back
            const fans = followersUsernames.filter(username => !followingUsernames.includes(username));

            // Populate the lists in the DOM
            populateList(mutualList, mutual);
            populateList(nonFollowersList, nonFollowers);
            populateList(fansList, fans);

            // Show the results section
            resultsDiv.style.display = 'block';
          }).catch(function(error) {
            console.error('Error processing JSON files:', error);
          });
        })
        .catch(function(error) {
          console.error('Error loading ZIP file:', error);
          alert('An error occurred while processing the ZIP file.');
        });
    };
    reader.readAsArrayBuffer(file);
  });

  // Helper function to populate a given list element with usernames
  function populateList(listElement, usernames) {
    listElement.innerHTML = '';
    if (usernames.length === 0) {
      const li = document.createElement('li');
      li.textContent = 'No users found.';
      listElement.appendChild(li);
    } else {
      usernames.forEach(username => {
        const li = document.createElement('li');
        li.textContent = username;
        listElement.appendChild(li);
      });
    }
  }
});
