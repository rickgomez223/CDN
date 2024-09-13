import { database, databaseRef as ref, set, get, remove } from "../firebase/firebaseConfig.js";

let navigationHistory = [];
let currentPath = 'user';

// Function to add a new entry
function addEntry(path, key, value) {
    set(ref(database, `${path}/${key}`), value);
}

// Function to get and display entries
function displayEntries(path = 'user') {
    currentPath = path;
    const entriesList = document.getElementById('entriesList');
    entriesList.innerHTML = '';

    get(ref(database, path)).then((snapshot) => {
        if (snapshot.exists()) {
            const data = snapshot.val();
            for (let id in data) {
                const li = document.createElement('li');
                li.textContent = `${id}: ${typeof data[id] === 'object' ? '[Folder]' : data[id]}`;
                li.dataset.id = id;

                if (typeof data[id] === 'object') {
                    const exploreButton = document.createElement('button');
                    exploreButton.textContent = 'Explore';
                    exploreButton.onclick = () => {
                        navigationHistory.push(currentPath);
                        displayEntries(`${path}/${id}`);
                    };
                    li.appendChild(exploreButton);
                } else {
                    const deleteButton = document.createElement('button');
                    deleteButton.textContent = 'Delete';
                    deleteButton.onclick = () => deleteEntry(path, id);
                    li.appendChild(deleteButton);
                }

                entriesList.appendChild(li);
            }
        } else {
            entriesList.textContent = 'No entries found.';
        }
    });

    updateNavigationButtons();
}

// Function to delete an entry
function deleteEntry(path, id) {
    remove(ref(database, `${path}/${id}`)).then(() => {
        displayEntries(path);
    });
}

// Function to update the navigation buttons' state
function updateNavigationButtons() {
    const backButton = document.getElementById('backButton');

    backButton.disabled = currentPath === 'user';

    backButton.disabled = navigationHistory.length === 0;
}

// Function to create the popup
function createPopup() {
    const popup = document.createElement('div');
    popup.id = 'firebasePopup';
    popup.innerHTML = `
        <div id="popupHeader">
            <span id="popupTitle">Firebase CRUD App</span>
            <button id="minimizePopup">_</button>
            <button id="closePopup">X</button>
            <button id="fullscreenPopup">\ud83d\udd32</button>
        </div>
        <div id="popupBody">
            <div id="navigationButtons">
                <button id="backButton" disabled>\u2190 Back</button>
            </div>
            <form id="entryForm">
                <input type="text" id="keyInput" placeholder="Enter key..." required>
                <input type="text" id="valueInput" placeholder="Enter value..." required>
                <button type="submit">Add Entry</button>
            </form>
            <ul id="entriesList"></ul>
        </div>
    `;
    document.body.appendChild(popup);

    // Create minimized tab
    const minimizedTab = document.createElement('div');
    minimizedTab.id = 'minimizedTab';
    minimizedTab.textContent = 'Firebase CRUD App';
    minimizedTab.style.display = 'none';
    minimizedTab.onclick = () => {
        popup.style.display = 'block';
        minimizedTab.style.display = 'none';
    };
    document.body.appendChild(minimizedTab);

    document.getElementById('entryForm').addEventListener('submit', function (e) {
        e.preventDefault();
        const keyInput = document.getElementById('keyInput');
        const valueInput = document.getElementById('valueInput');
        const key = keyInput.value.trim();
        const value = valueInput.value.trim();
        if (key && value) {
            addEntry(currentPath, key, value);
            keyInput.value = '';
            valueInput.value = '';
            displayEntries(currentPath);
        }
    });

    document.getElementById('closePopup').onclick = () => {
        popup.remove();
        minimizedTab.remove();
    };

    document.getElementById('fullscreenPopup').onclick = () => {
        popup.classList.toggle('fullscreen');
    };

    document.getElementById('minimizePopup').onclick = () => {
        popup.style.display = 'none';
        minimizedTab.style.display = 'block';
    };

    document.getElementById('backButton').onclick = () => {
        if (navigationHistory.length > 0) {
            const previousPath = navigationHistory.pop();
            displayEntries(previousPath);
        } else if (currentPath.includes('/')) {
            const parentPath = currentPath.substring(0, currentPath.lastIndexOf('/'));
            displayEntries(parentPath);
        }
    };

    displayEntries();

    let isDragging = false;
    let startX, startY;

    const popupHeader = document.getElementById('popupHeader');

    popupHeader.addEventListener('mousedown', (e) => {
        isDragging = true;
        startX = e.clientX - popup.offsetLeft;
        startY = e.clientY - popup.offsetTop;
        document.addEventListener('mousemove', moveAt);
    });

    document.addEventListener('mouseup', () => {
        isDragging = false;
        document.removeEventListener('mousemove', moveAt);
    });

    popupHeader.addEventListener('touchstart', (e) => {
        isDragging = true;
        startX = e.touches[0].clientX - popup.offsetLeft;
        startY = e.touches[0].clientY - popup.offsetTop;
        document.addEventListener('touchmove', moveAtTouch);
    });

    document.addEventListener('touchend', () => {
        isDragging = false;
        document.removeEventListener('touchmove', moveAtTouch);
    });

    function moveAt(e) {
        if (isDragging) {
            popup.style.left = `${e.clientX - startX}px`;
            popup.style.top = `${e.clientY - startY}px`;
        }
    }

    function moveAtTouch(e) {
        if (isDragging) {
            popup.style.left = `${e.touches[0].clientX - startX}px`;
            popup.style.top = `${e.touches[0].clientY - startY}px`;
        }
    }
}

// Function to inject CSS styles
function injectStyles() {
    const style = document.createElement('style');
    style.innerHTML = `
        #firebasePopup {
            position: fixed;
            top: 20%;
            left: 20%;
            width: 400px;
            height: 500px;
            background-color: white;
            border: 1px solid #ccc;
            border-radius: 8px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            z-index: 1000;
            resize: both;
            overflow: auto;
        }
        #firebasePopup.fullscreen {
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            border-radius: 0;
        }
        #popupHeader {
            background-color: #007bff;
            color: white;
            padding: 10px;
            cursor: move;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-top-left-radius: 8px;
            border-top-right-radius: 8px;
        }
        #popupTitle {
            margin: 0;
        }
        #popupBody {
            padding: 10px;
        }
        #popupBody ul {
            list-style-type: none;
            padding: 0;
        }
        #popupBody ul li {
            padding: 5px;
            border-bottom: 1px solid #ccc;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        #popupBody ul li button {
            margin-left: 10px;
            background-color: #dc3545;
            color: white;
            border: none;
            padding: 5px;
            cursor: pointer;
            border-radius: 4px;
        }
        #popupBody ul li button:hover {
            background-color: #c82333;
        }
        #popupBody ul li button:first-of-type {
            background-color: #007bff;
        }
        #popupBody ul li button:first-of-type:hover {
            background-color: #0056b3;
        }
        #entryForm {
            display: flex;
            flex-direction: column;
            gap: 10px;
            margin-bottom: 10px;
        }
        #entryForm input {
            padding: 5px;
        }
        #entryForm button {
            padding: 5px 10px;
            background-color: #28a745;
            color: white;
            border: none;
            cursor: pointer;
            border-radius: 4px;
        }
        #entryForm button:hover {
            background-color: #218838;
        }
        #navigationButtons {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
        }
        #navigationButtons button {
            padding: 5px 10px;
            background-color: #6c757d;
            color: white;
            border: none;
            cursor: pointer;
            border-radius: 4px;
        }
        #navigationButtons button:disabled {
            background-color: #ccc;
            cursor: not-allowed;
        }
        #navigationButtons button:hover:not(:disabled) {
            background-color: #5a6268;
        }
        #minimizedTab {
            position: fixed;
            bottom: 10px;
            left: 10px;
            background-color: #007bff;
            color: white;
            padding: 10px;
            border-radius: 8px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            cursor: pointer;
            z-index: 999;
        }
    `;
    document.head.appendChild(style);
}

// Export the initialization function
export function startFBDB() {
    injectStyles();
    createPopup();
}

// Automatically run on document load
document.addEventListener('DOMContentLoaded', startFBDB);