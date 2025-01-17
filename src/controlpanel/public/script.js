// Tab Navigation
document.querySelectorAll(".tab-link").forEach(link => {
    link.addEventListener("click", e => {
        e.preventDefault();
        const targetTab = e.target.getAttribute("data-tab");

        // Switch active tab
        document.querySelectorAll(".tab-link").forEach(l => l.classList.remove("active"));
        document.querySelectorAll(".tabcontent").forEach(tab => tab.classList.remove("active"));

        e.target.classList.add("active");
        document.getElementById(targetTab).classList.add("active");
    });
});

// Fetch categories and roles
async function fetchCategories() {
    try {
        const response = await fetch('/api/categories');
        const data = await response.json();
        if (data.success) {
            const categoryDropdown = document.getElementById('categoryDropdown');
            data.categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category.id;
                option.textContent = category.name;
                categoryDropdown.appendChild(option);
            });
        } else {
            console.error('Failed to fetch categories:', data.message);
        }
    } catch (error) {
        console.error('Error fetching categories:', error);
    }
}


async function fetchChannels() {
    try {
        const response = await fetch('/api/channels');
        const data = await response.json();
        if (data.success) {
            const categoryDropdown = document.getElementById('channelsDropdown');
            data.categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category.id;
                option.textContent = category.name;
                categoryDropdown.appendChild(option);
            });
        } else {
            console.error('Failed to fetch channels:', data.message);
        }
    } catch (error) {
        console.error('Error fetching channels:', error);
    }
}


async function fetchRoles() {
    try {
        const response = await fetch('/api/roles');
        const data = await response.json();
        if (data.success) {
            const roleDropdown = document.getElementById('roleDropdown');
            data.roles.forEach(role => {
                const option = document.createElement('option');
                option.value = role.id;
                option.textContent = role.name;
                roleDropdown.appendChild(option);
            });
        } else {
            console.error('Failed to fetch roles:', data.message);
        }
    } catch (error) {
        console.error('Error fetching roles:', error);
    }
}

async function fetchBannedUsers() {
    try {
        const response = await fetch('/api/bannedUsers');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (data.success) {
            populateUserList("bannedUsersList", data.bannedUsers);
        } else {
            console.error('Failed to fetch banned users:', data.message);
        }
    } catch (error) {
        console.error('Error fetching banned users:', error);
    }
}

async function fetchTimedOutUsers() {
    try {
        const response = await fetch('/api/timedOutUsers');
        if (!response.ok) {
            const message = `HTTP error! status: ${response.status}`;
            console.error(message); // Log the error
            // Optionally display an error message to the user
            alert(message);  // Or a more sophisticated error display
            return; // Exit the function
        }
        const data = await response.json();
        populateUserList("mutedUsersList", data.timedOutUsers); // Pass only the data to the function
    } catch (error) {
        console.error('Error fetching timed-out users:', error);
        // Handle error (e.g., display an error message)
        alert("Error fetching timed-out users. Please try again later.");
    }
}

fetchTimedOutUsers()
fetchBannedUsers()

const bannedUsers = [
    { username: "User1", reason: "Spamming", pfp: "https://i.pinimg.com/236x/68/31/12/68311248ba2f6e0ba94ff6da62eac9f6.jpg" },
    { username: "User3", reason: "Harassment", pfp: "https://i.pinimg.com/236x/68/31/12/68311248ba2f6e0ba94ff6da62eac9f6.jpg" },
    // ... more users
  ];

  const mutedUsers = [
    { username: "User1", reason: "Spamming", pfp: "https://i.pinimg.com/236x/68/31/12/68311248ba2f6e0ba94ff6da62eac9f6.jpg" },
    { username: "User3", reason: "Harassment", pfp: "https://i.pinimg.com/236x/68/31/12/68311248ba2f6e0ba94ff6da62eac9f6.jpg" },
    // ... more users
  ];

  function populateUserList(userListId, users) {
    const userList = document.getElementById(userListId);
    userList.innerHTML = '';

    users.forEach((user, index) => { //Note the index parameter
        const listItem = document.createElement('li');
        listItem.classList.add('user-card');
        listItem.innerHTML = `
            <img src="${user.pfp}" alt="${user.username}'s Profile Picture" class="user-pfp">
            <div class="user-info">
                <h3>${user.username}</h3>
                <p>Reason: ${user.reason}</p>
            </div>
            <button class="unban-btn" data-index="${index}">
              <i class="fas fa-undo"></i><!-- Font Awesome icon -->
            </button>
        `;
        userList.appendChild(listItem);
    });

    // Add event listeners for unban buttons *after* appending to the DOM
    const unbanButtons = userList.querySelectorAll('.unban-btn');
    unbanButtons.forEach(button => {
      button.addEventListener('click', handleUnbanClick);
    });
}

function handleUnbanClick(event) {
  const index = parseInt(event.target.dataset.index, 10);
  unbanUser(index);
}

function unbanUser(index) {
  bannedUsers.splice(index, 1); // Remove user from bannedUsers array
  populateUserList("bannedUsersList", bannedUsers); // Re-render the list
}

// Populate lists on page load
populateUserList("bannedUsersList", bannedUsers);
populateUserList("mutedUsersList", mutedUsers);

// Example of adding a user (replace with your actual ban/mute logic)
document.getElementById('banBtn').addEventListener('click', () => {
    bannedUsers.push("NewBannedUser");
    populateUserList("bannedUsersList", bannedUsers);
});

// Initial Data Fetch
fetchChannels();
fetchCategories();
fetchRoles();

document.getElementById("confirmCategory").addEventListener("click", async () => {
    const selectedCategory = document.getElementById("categoryDropdown").value;
    document.getElementById("embedFeedback").innerText = `Category selected: ${selectedCategory}`;
    document.getElementById("embedFeedback").style.display = "block";

    try {
        const response = await fetch('/api/submitCategory', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ categoryId: selectedCategory })
        });
        if (!response.ok) throw new Error('Failed to submit category.');
    } catch (error) {
        console.error('Error:', error);
    }
});

// Category Confirmation
document.getElementById("createEmbed").addEventListener("click", async () => {
    const selectedCategory = document.getElementById("channelsDropdown").value;
    document.getElementById("embedFeedback").innerText = `Category selected: ${selectedCategory}`;
    document.getElementById("embedFeedback").style.display = "block";

    try {
        const response = await fetch('/api/createEmbed', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ channelId: selectedCategory })
        });
        const data = await response.json();
        
        if (response.ok) {
            document.getElementById("embedFeedback").innerText = data.message;
        } else {
            throw new Error(data.message || 'Failed to create embed.');
        }
    } catch (error) {
        console.error('Error:', error);
        document.getElementById("embedFeedback").innerText = 'Failed to create embed.';
    }
});

// Role Buttons
document.querySelectorAll('.role-button').forEach(button => {
    button.addEventListener('click', async event => {
        const roleType = event.target.getAttribute('role-type');
        const roleValue = document.getElementById("roleDropdown").value;

        try {
            const response = await fetch('/api/submitRole', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ roleType, roleValue })
            });
            const data = await response.json();
            if (data.success) {
                document.getElementById("embedFeedback").innerText = `${roleType} role set to ${roleValue}`;
                document.getElementById("embedFeedback").style.display = "block";
            } else {
                console.error(data.message);
            }
        } catch (error) {
            console.error('Error:', error);
        }
    });
});

// Ticket Control Buttons
document.getElementById("toggleLinkedAccount").addEventListener("click", () => {
    alert("Toggling Linked Account Check for Tickets");
});

document.getElementById("reminderBtn").addEventListener("click", () => {
    alert("Reminder to Vouch");
});

document.getElementById("clearTicketsBtn").addEventListener("click", () => {
    alert("Clearing All Tickets");
});


document.addEventListener('DOMContentLoaded', function() {
    // Function to format the file name to a user-friendly name
    const formatFileName = (fileName) => {
        return fileName
            .replace('.json', '')  // Remove the '.json' extension
            .replace(/([a-z])([A-Z])/g, '$1 $2') // Add space before uppercase letters
            .replace(/([a-z])([0-9])/g, '$1 $2') // Add space between letter and number (if needed)
            .replace(/_/g, ' ') // Replace underscores with space
            .replace(/\b\w/g, char => char.toUpperCase()); // Capitalize the first letter of each word
    };

    // Fetch the JSON file list from your server
    fetch('/api/json-files') // This is the backend endpoint for fetching JSON files
        .then(response => response.json())
        .then(jsonFiles => {
            const jsonFileList = document.getElementById('jsonFileList');
            jsonFiles.forEach(file => {
                const formattedFileName = formatFileName(file);

                const listItem = document.createElement('li');
                listItem.classList.add('file-item');
                listItem.setAttribute('data-file-name', file); // Store unformatted file name

                const fileNameLabel = document.createElement('button');
                fileNameLabel.classList.add('file-name');
                fileNameLabel.textContent = formattedFileName;
                fileNameLabel.addEventListener('click', () => {
                    toggleFileContent(file, listItem);
                });

                const contentContainer = document.createElement('div');
                contentContainer.classList.add('file-content');
                contentContainer.id = `content-${file}`;
                contentContainer.style.display = 'none'; // Initially hidden

                const saveButton = document.createElement('button');
                saveButton.textContent = 'Save';
                saveButton.classList.add('save-button');
                saveButton.addEventListener('click', () => {
                    saveJsonContent(file, contentContainer);
                });

                const addLineButton = document.createElement('button');
                addLineButton.textContent = 'Add New Line';
                addLineButton.classList.add('add-line-button');
                addLineButton.addEventListener('click', () => {
                    addNewLine(contentContainer.children[0]);
                });

                listItem.appendChild(fileNameLabel);
                listItem.appendChild(contentContainer);
                listItem.appendChild(saveButton); // Append the Save button
                listItem.appendChild(addLineButton); // Append the Add New Line button
                
                jsonFileList.appendChild(listItem);
            });
        })
        .catch(error => {
            console.error('Error fetching JSON files:', error);
            alert('There was an error fetching the list of files.');
        });

    // Function to toggle file content visibility
    const toggleFileContent = (fileName, listItem) => {
        const contentContainer = listItem.querySelector('.file-content');

        // If content is already loaded, toggle visibility
        if (contentContainer.innerHTML) {
            contentContainer.style.display = contentContainer.style.display === 'none' ? 'block' : 'none';
        } else {
            // Fetch the content if not loaded
            fetch(`/api/json-file-content?fileName=${fileName}`) // Backend endpoint to get content of specific file
                .then(response => response.json())
                .then(data => {
                    displayJsonContent(data, contentContainer, listItem); // Pass listItem to access file name
                })
                .catch(error => {
                    console.error('Error fetching file content:', error);
                    alert('There was an error fetching the content of the file.');
                });
        }
    };

    // Function to display the JSON file content in a structured, clean format
    const displayJsonContent = (jsonData, contentContainer, listItem) => {
        contentContainer.innerHTML = ''; // Clear any existing content
        const jsonContentDiv = document.createElement('div');
        jsonContentDiv.classList.add('jsonContent');

        // Loop through the keys and values of the JSON object
        Object.keys(jsonData).forEach(key => {
            const jsonLineDiv = document.createElement('div');
            jsonLineDiv.classList.add('jsonline');

            const jsonNameDiv = document.createElement('div');
            jsonNameDiv.classList.add('jsonName');
            jsonNameDiv.textContent = key;

            const jsonValueDiv = document.createElement('div');
            jsonValueDiv.classList.add('jsonValue');
            jsonValueDiv.textContent = jsonData[key];

            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Delete';
            deleteButton.style.margin = 0;
            deleteButton.classList.add('delete-line-button');
            deleteButton.addEventListener('click', () => {
                jsonLineDiv.remove();
            });


            // Make jsonName and jsonValue editable
            jsonNameDiv.setAttribute('contenteditable', 'true');
            jsonValueDiv.setAttribute('contenteditable', 'true');

            // Event listeners to save the updated data when editing is done
            jsonValueDiv.addEventListener('blur', () => {
                const fileName = listItem.getAttribute('data-file-name'); // Get the unformatted file name
                saveJsonContent(fileName, jsonNameDiv.textContent, jsonValueDiv.textContent);
            });

            jsonLineDiv.appendChild(jsonNameDiv);
            jsonLineDiv.appendChild(jsonValueDiv);
            jsonLineDiv.appendChild(deleteButton); // Append the Delete button
            console.log("added item " + jsonData[key])
            jsonContentDiv.appendChild(jsonLineDiv);
        });

        contentContainer.appendChild(jsonContentDiv);
        contentContainer.style.display = 'block'; // Make the content visible after loading
    };

    // Function to add a new line (key-value pair) to the JSON content
    const addNewLine = (contentContainer) => {
        const newLineDiv = document.createElement('div');
        newLineDiv.classList.add('jsonline');

        const newKeyDiv = document.createElement('div');
        newKeyDiv.classList.add('jsonName');
        newKeyDiv.setAttribute('contenteditable', 'true');
        newKeyDiv.textContent = 'New Key';

        const newValueDiv = document.createElement('div');
        newValueDiv.classList.add('jsonValue');
        newValueDiv.setAttribute('contenteditable', 'true');
        newValueDiv.textContent = 'New Value';

        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete';
        deleteButton.style.margin = 0;
        deleteButton.classList.add('delete-line-button');
        deleteButton.addEventListener('click', () => {
            newLineDiv.remove();
        });



        newLineDiv.appendChild(newKeyDiv);
        newLineDiv.appendChild(newValueDiv);
        newLineDiv.appendChild(deleteButton); // Append the Delete button

        contentContainer.appendChild(newLineDiv); // Append the new line to the first `.jsonline` element
    };

    function getJsonContent() {
        const jsonContentDiv = document.querySelector('.jsonContent');
        const jsonObject = {};
    
        // Loop through all `.jsonline` elements
        jsonContentDiv.querySelectorAll('.jsonline').forEach(line => {
            const keyElement = line.querySelector('.jsonName');
            const valueElement = line.querySelector('.jsonValue');
    
            if (keyElement && valueElement) {
                const key = keyElement.textContent.trim();
                const value = valueElement.textContent.trim();
    
                // Add to JSON object
                if (key) {
                    jsonObject[key] = value;
                }
            }
        });
    
        return jsonObject;
    }

    
    // Function to save updated JSON content
    function saveJsonContent() {
        const fileName = 'config.json'; // Example file name
        const jsonContent = getJsonContent();
    
        // If getJsonContent returned null, exit early
        if (!jsonContent) {
            console.error("Failed to retrieve JSON content.");
            return;
        }
    
        fetch('/api/update-json', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                fileName: fileName,
                jsonContent: jsonContent,
            }),
        })
            .then(response => response.json())
            .then(data => {
                console.log('Saved successfully:', data);
            })
            .catch(error => {
                console.error('Error saving JSON content:', error);
            });
    }    
});

