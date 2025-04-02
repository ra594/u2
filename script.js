document.addEventListener('DOMContentLoaded', function() {
  const fileInput = document.getElementById('file-input');
  const fileNameSpan = document.getElementById('file-name');
  const uploadForm = document.getElementById('upload-form');
  const resultsDiv = document.getElementById('results');

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
    
    // Hide the upload form upon submission
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
            const followingOnly = followingUsernames.filter(username => !followersUsernames.includes(username));
            const followersOnly = followersUsernames.filter(username => !followingUsernames.includes(username));

            // Save lists to localStorage
            localStorage.setItem('mutualList', JSON.stringify(mutual));
            localStorage.setItem('followingOnlyList', JSON.stringify(followingOnly));
            localStorage.setItem('followersOnlyList', JSON.stringify(followersOnly));

            // Create links to new pages including counts
            resultsDiv.innerHTML = ''; // Clear any existing content

            const container = document.createElement('div');
            container.className = 'results-links';

            const mutualLink = document.createElement('a');
            mutualLink.href = 'pages/mutual.html';
            mutualLink.textContent = `View Mutual Connections (${mutual.length})`;
            mutualLink.className = 'btn';

            const followingLink = document.createElement('a');
            followingLink.href = 'pages/following.html';
            followingLink.textContent = `View Following Only (${followingOnly.length})`;
            followingLink.className = 'btn';

            const followersLink = document.createElement('a');
            followersLink.href = 'pages/followers.html';
            followersLink.textContent = `View Followers Only (${followersOnly.length})`;
            followersLink.className = 'btn';

            // Append links to container
            container.appendChild(mutualLink);
            container.appendChild(followingLink);
            container.appendChild(followersLink);

            // Append container to resultsDiv and display it
            resultsDiv.appendChild(container);
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
});
