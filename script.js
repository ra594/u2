document.addEventListener('DOMContentLoaded', function() {
  const fileInput = document.getElementById('file-input');
  const fileNameSpan = document.getElementById('file-name');
  const uploadForm = document.getElementById('upload-form');
  const updateFileInput = document.getElementById('update-file-input');
  const updateFileNameSpan = document.getElementById('update-file-name');
  const updateForm = document.getElementById('update-form');
  const resultsDiv = document.getElementById('results');
  const clearBtn = document.getElementById('clear-btn');
  const confirmOverlay = document.getElementById('confirm-overlay');
  const ackCheckbox = document.getElementById('ack-checkbox');
  const confirmClearBtn = document.getElementById('confirm-clear-btn');
  const sidePanel = document.getElementById('side-panel');
  const sideToggle = document.getElementById('side-toggle');
  const toggleAngle = document.getElementById('toggle-angle');
  const runDatesList = document.getElementById('run-dates');
  const openUploadBtn = document.getElementById('open-upload');
  const uploadOverlay = document.getElementById('upload-overlay');
  const overlayForm = document.getElementById('overlay-form');
  const overlayFileInput = document.getElementById('overlay-file-input');
  const overlayFileName = document.getElementById('overlay-file-name');

  // Bail out if elements aren't present (e.g., help page)
  if (!fileInput || !uploadForm || !resultsDiv) {
    return;
  }

  const showResults = (mutual, followingOnly, followersOnly) => {
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
  };

  const formatDate = (ts) => {
    const d = new Date(ts);
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${month}/${day}/${d.getFullYear()}`;
  };

  const populateRunDates = () => {
    if (!runDatesList) return;
    sortDataRuns();
    runDatesList.innerHTML = '';

    dataRuns.forEach((run, index) => {
      const li = document.createElement('li');
      const dateSpan = document.createElement('span');
      dateSpan.textContent = formatDate(run.timestamp);
      li.appendChild(dateSpan);

      const del = document.createElement('span');
      del.textContent = '\u00D7';
      del.className = 'delete-run';
      li.appendChild(document.createTextNode(' '));
      li.appendChild(del);

      let tooltip;
      const showTooltip = () => {
        if (!tooltip) {
          tooltip = document.createElement('div');
          tooltip.className = 'run-tooltip';
          tooltip.textContent = 'Delete this run';
          document.body.appendChild(tooltip);
        }
        const rect = del.getBoundingClientRect();
        tooltip.style.top = (window.scrollY + rect.top) + 'px';
        tooltip.style.left = (window.scrollX + rect.right + 5) + 'px';
      };
      const hideTooltip = () => {
        del._hideTimeout = setTimeout(() => {
          const iconHovered = del.matches(':hover');
          const tooltipHovered = tooltip ? tooltip.matches(':hover') : false;
          if (!iconHovered && !tooltipHovered && tooltip) {
            document.body.removeChild(tooltip);
            tooltip = null;
          }
        }, 200);
      };

      del.addEventListener('mouseenter', (e) => {
        if (del._hideTimeout) clearTimeout(del._hideTimeout);
        showTooltip();
      });
      del.addEventListener('mouseleave', hideTooltip);

      del.addEventListener('click', () => {
        if (del._hideTimeout) clearTimeout(del._hideTimeout);
        if (tooltip) {
          document.body.removeChild(tooltip);
          tooltip = null;
        }
        dataRuns.splice(index, 1);
        if (dataRuns.length === 0) {
          clearData();
          dataRuns = [];
          populateRunDates();
          return;
        }
        localStorage.setItem('dataRuns', JSON.stringify(dataRuns));
        const latest = dataRuns[dataRuns.length - 1];
        localStorage.setItem('mutualList', JSON.stringify(latest.mutual));
        localStorage.setItem('followingOnlyList', JSON.stringify(latest.followingOnly));
        localStorage.setItem('followersOnlyList', JSON.stringify(latest.followersOnly));
        localStorage.setItem('hasResults', 'true');

        showResults(latest.mutual, latest.followingOnly, latest.followersOnly);
        if (clearBtn) clearBtn.style.display = 'inline-block';
        if (updateForm) updateForm.style.display = 'flex';
        populateRunDates();
      });

      runDatesList.appendChild(li);
    });
  };

  // Update file name when a file is selected
  fileInput.addEventListener('change', function() {
    if (fileInput.files.length > 0) {
      fileNameSpan.textContent = fileInput.files[0].name;
    } else {
      fileNameSpan.textContent = 'No file chosen';
    }
  });

  if (updateFileInput) {
    updateFileInput.addEventListener('change', function() {
      if (updateFileInput.files.length > 0) {
        updateFileNameSpan.textContent = updateFileInput.files[0].name;
      } else {
        updateFileNameSpan.textContent = 'No file chosen';
      }
    });
  }

  let dataRuns = JSON.parse(localStorage.getItem('dataRuns') || '[]');
  const sortDataRuns = () => {
    dataRuns.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  };
  sortDataRuns();
  populateRunDates();
  if (dataRuns.length > 0) {
    const latest = dataRuns[0];
    uploadForm.style.display = 'none';
    if (updateForm) updateForm.style.display = 'flex';
    showResults(latest.mutual, latest.followingOnly, latest.followersOnly);
    if (clearBtn) {
      clearBtn.style.display = 'inline-block';
    }
    populateRunDates();
  } else if (localStorage.getItem('hasResults') === 'true') {
    const mutual = JSON.parse(localStorage.getItem('mutualList') || '[]');
    const followingOnly = JSON.parse(localStorage.getItem('followingOnlyList') || '[]');
    const followersOnly = JSON.parse(localStorage.getItem('followersOnlyList') || '[]');
    uploadForm.style.display = 'none';
    if (updateForm) updateForm.style.display = 'flex';
    showResults(mutual, followingOnly, followersOnly);
    if (clearBtn) {
      clearBtn.style.display = 'inline-block';
    }
    dataRuns = [{ timestamp: new Date().toISOString(), mutual, followingOnly, followersOnly }];
    localStorage.setItem('dataRuns', JSON.stringify(dataRuns));
    populateRunDates();
  }

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

  const extractDate = (name) => {
    const match = name.match(/instagram-[^-]+-(\d{4}-\d{2}-\d{2})/);
    return match ? match[1] : new Date().toISOString().slice(0, 10);
  };

  const parseZip = (file, callback) => {
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
          const archiveDate = followingFile.date || followersFile.date || null;
          Promise.all([followingFile.async("string"), followersFile.async("string")]).then(function([followingContent, followersContent]) {
            const followingData = extractFollowingData(followingContent);
            const followersData = extractFollowersData(followersContent);
            let mutual = [];
            let followingOnly = [];
            let followersOnly = [];

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

            Object.keys(followersData).forEach(username => {
              if (!followingData[username]) {
                followersOnly.push({
                  username,
                  followedYouOn: followersData[username].followedYouOn
                });
              }
            });

            callback({ mutual, followingOnly, followersOnly, timestamp: archiveDate });
          }).catch(function(error) {
            console.error('Error processing JSON files:', error);
          });
        }).catch(function(error) {
          console.error('Error loading ZIP file:', error);
          alert('An error occurred while processing the ZIP file.');
        });
    };
    reader.readAsArrayBuffer(file);
  };

  const saveRunAndShow = (file, data, isUpdate) => {
    const runTimestamp = data.timestamp ? data.timestamp.toISOString() : extractDate(file.name);
    const run = {
      timestamp: runTimestamp,
      mutual: data.mutual,
      followingOnly: data.followingOnly,
      followersOnly: data.followersOnly
    };

    if (isUpdate && dataRuns.length > 0) {
      sortDataRuns();
      const prev = dataRuns[0];
      const prevFollowSet = new Set(prev.followingOnly.map(i => i.username));
      const prevFanSet = new Set(prev.followersOnly.map(i => i.username));
      const prevMutualSet = new Set(prev.mutual.map(i => i.username));
      run.followingOnly = run.followingOnly.map(i => {
        return prevFollowSet.has(i.username) ? i : Object.assign({}, i, { isNew: true });
      });
      run.followersOnly = run.followersOnly.map(i => {
        return prevFanSet.has(i.username) ? i : Object.assign({}, i, { isNew: true });
      });
      run.mutual = run.mutual.map(i => {
        return prevMutualSet.has(i.username) ? i : Object.assign({}, i, { isNew: true });
      });
      dataRuns.push(run);
    } else {
      dataRuns = [run];
    }
    sortDataRuns();
    localStorage.setItem('dataRuns', JSON.stringify(dataRuns));
    // legacy keys for other pages
    localStorage.setItem('mutualList', JSON.stringify(run.mutual));
    localStorage.setItem('followingOnlyList', JSON.stringify(run.followingOnly));
    localStorage.setItem('followersOnlyList', JSON.stringify(run.followersOnly));
    localStorage.setItem('hasResults', 'true');

    showResults(run.mutual, run.followingOnly, run.followersOnly);
    // Hide the initial upload form once we have at least one run
    if (uploadForm) uploadForm.style.display = 'none';
    if (clearBtn) {
      clearBtn.style.display = 'inline-block';
    }
    if (updateForm) updateForm.style.display = 'flex';
    populateRunDates();
  };

  // Initial upload
  uploadForm.addEventListener('submit', function(e) {
    e.preventDefault();
    if (!fileInput.files || fileInput.files.length === 0) {
      alert('Please choose a ZIP file.');
      return;
    }
    uploadForm.style.display = 'none';
    const file = fileInput.files[0];
    parseZip(file, (data) => saveRunAndShow(file, data, false));
  });

  if (updateForm) {
    updateForm.addEventListener('submit', function(e) {
      e.preventDefault();
      if (!updateFileInput.files || updateFileInput.files.length === 0) {
        alert('Please choose a ZIP file.');
        return;
      }
      const file = updateFileInput.files[0];
      parseZip(file, (data) => saveRunAndShow(file, data, true));
    });
  }

  const clearData = () => {
    localStorage.removeItem('mutualList');
    localStorage.removeItem('followingOnlyList');
    localStorage.removeItem('followersOnlyList');
    localStorage.removeItem('hasResults');
    localStorage.removeItem('dataRuns');
    dataRuns = [];
    sortDataRuns();
    resultsDiv.innerHTML = '';
    resultsDiv.style.display = 'none';
    clearBtn.style.display = 'none';
    uploadForm.style.display = 'flex';
    if (updateForm) updateForm.style.display = 'none';
    fileInput.value = '';
    fileNameSpan.textContent = 'No file chosen';
    if (updateFileInput) updateFileInput.value = '';
    if (updateFileNameSpan) updateFileNameSpan.textContent = 'No file chosen';
  };

  if (clearBtn) {
    clearBtn.addEventListener('click', function() {
      if (confirmOverlay) {
        confirmOverlay.style.display = 'flex';
        if (ackCheckbox) ackCheckbox.checked = false;
        if (confirmClearBtn) confirmClearBtn.style.display = 'none';
      } else {
        clearData();
      }
    });
  }

  if (ackCheckbox) {
    ackCheckbox.addEventListener('change', function() {
      if (confirmClearBtn) {
        confirmClearBtn.style.display = this.checked ? 'inline-block' : 'none';
      }
    });
  }

  if (confirmClearBtn) {
    confirmClearBtn.addEventListener('click', function() {
      clearData();
      if (confirmOverlay) confirmOverlay.style.display = 'none';
    });
  }

  if (sideToggle) {
    sideToggle.addEventListener('click', function() {
      if (!sidePanel) return;
      sidePanel.classList.toggle('expanded');
      sidePanel.classList.toggle('collapsed');
    });
  }

  if (openUploadBtn) {
    openUploadBtn.addEventListener('click', function() {
      if (uploadOverlay) uploadOverlay.style.display = 'flex';
    });
  }

  if (uploadOverlay) {
    uploadOverlay.addEventListener('click', function(e) {
      if (e.target === uploadOverlay) {
        uploadOverlay.style.display = 'none';
      }
    });
  }

  if (overlayFileInput) {
    overlayFileInput.addEventListener('change', function() {
      if (overlayFileInput.files.length > 0) {
        overlayFileName.textContent = overlayFileInput.files[0].name;
      } else {
        overlayFileName.textContent = 'No file chosen';
      }
    });
  }

  if (overlayForm) {
    overlayForm.addEventListener('submit', function(e) {
      e.preventDefault();
      if (!overlayFileInput.files || overlayFileInput.files.length === 0) {
        alert('Please choose a ZIP file.');
        return;
      }
      const file = overlayFileInput.files[0];
      parseZip(file, (data) => {
        saveRunAndShow(file, data, true);
        uploadOverlay.style.display = 'none';
        overlayFileInput.value = '';
        overlayFileName.textContent = 'No file chosen';
      });
    });
  }
});
