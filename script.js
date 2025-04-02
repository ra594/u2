document.addEventListener('DOMContentLoaded', function() {
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
    
    // Hide the upload form (upload box) upon submission
    uploadForm.style.display = 'none';

    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = function(e) {
      const arrayBuffer = e.target.result;
      JSZip.loadAsync(arrayBuffer)
        .then(function(zip) {
          const folder = zip.folder("connections/followers_and_following");
          if (!folder) {
            alert('The ZIP file does not contain the required folder structure: connections/followers_and_following');
            return;
          }
          const followingFile = folder.file("following.json");
          const followersFile = folder.file("followers_1.json");
          if (!followingFile || !followersFile) {
            alert('The ZIP file is missing one or both required JSON files (following.json, followers_1.json).');
            return;
          }
          const followingPromise = followingFile.async("string").then(function(content) {
            let data = JSON.parse(content);
            const followingUsernames = data.relationships_following.map(item => {
              if (item.string_list_data && item.string_list_data.length > 0) {
                return item.string_list_data[0].value;
              }
              return null;
            }).filter(username => username !== null);
            return followingUsernames;
          });
          const followersPromise = followersFile.async("string").then(function(content) {
            let data = JSON.parse(content);
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

            // Calculate the lists
            const mutual = followingUsernames.filter(username => followersUsernames.includes(username));
            const nonFollowers = followingUsernames.filter(username => !followersUsernames.includes(username));
            const fans = followersUsernames.filter(username => !followingUsernames.includes(username));

            populateList(mutualList, mutual);
            populateList(nonFollowersList, nonFollowers);
            populateList(fansList, fans);

            resultsDiv.style.display = 'block';
          }).catch(function(error) {
            console.error('Error processing JSON files:', error);
          });
        }).catch(function(error) {
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
