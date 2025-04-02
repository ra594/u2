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

  // Extraction function for following.json
  const extractFollowingData = (content) => {
    let data = JSON.parse(content);
    // Create a map: key is username, value is an object with youFollowedOn
    return data.relationships_following.reduce((acc, item) => {
      if (item.string_list_data && item.string_list_data.length > 0) {
        const username = item.string_list_data[0].value;
        // If timestamp exists, use it; otherwise, null.
        const timestamp = item.string_list_data[0].timestamp || null;
        acc[username] = { username, youFollowedOn: timestamp };
      }
      return acc;
    }, {});
  };

  // Extraction function for followers_1.json
  const extractFollowersData = (content) => {
    let data = JSON.parse(content);
    // Create a map: key is username, value is an object with followedYouOn
    return data.reduce((acc, item) => {
      if (item.string_list_data && item.string_list_data.length > 0) {
        const username = item.string_list_data[0].value;
        const timestamp = item.string_list_data[0].timestamp || null;
        acc[username] = { username, followedYouOn: timestamp };
      }
      return acc;
    }, {});
  };

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
          // Navigate to the folder "connections/followers_and_following"
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
          
          // Read both JSON files as strings
          const followingPromise = followingFile.async("string");
          const followersPromise = followersFile.async("string");

          Promise.all([followingPromise, followersPromise]).then(function([followingContent, followersContent]) {
            const followingData = extractFollowingData(followingContent);
            const followersData = extractFollowersData(followersContent);
            
            let mutual = [];
            let followingOnly = [];
            let followersOnly = [];
            
            // Process followingData: check if username also exists in followersData.
            Object.keys(followingData).forEach(username => {
              if (followersData[username]) {
                mutual.push({
                  username,
                  youFollowedOn: followingData[username].youFollowedOn,
                  followedYouOn: followersData[username].followedYouOn
                });
              } else {
                followingOnly.push({
                  username,
                  youFollowedOn: followingData[username].youFollowedOn
                });
              }
            });
            
            // Process followersData: add those that are only in followersData.
            Object.keys(followersData).forEach(username => {
              if (!followingData[username]) {
                followersOnly.push({
                  username,
                  followedYouOn: followersData[username].followedYouOn
                });
              }
            });
            
            // Save arrays with connection objects to localStorage
            localStorage.setItem('mutualList', JSON.stringify(mutual));
            localStorage.setItem('followingOnlyList', JSON.stringify(followingOnly));
            localStorage.setItem('followersOnlyList', JSON.stringify(followersOnly));
            
            // Create view buttons (with counts) to link to separate pages
            resultsDiv.innerHTML = '';
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
            
            container.appendChild(mutualLink);
            container.appendChild(followingLink);
            container.appendChild(followersLink);
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
