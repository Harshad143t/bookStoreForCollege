const SHEETS_API_URL = window.BOOKMART_SHEETS_API_URL || "PASTE_YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE";

function isSheetsConfigured() {
    return SHEETS_API_URL && !SHEETS_API_URL.includes("PASTE_YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE");
}

// --- LOADING ANIMATION FUNCTIONS ---
function showLoading(message = "Processing...") {
    let loader = document.getElementById("global-loader");
    if (!loader) {
        loader = document.createElement("div");
        loader.id = "global-loader";
        Object.assign(loader.style, {
            position: "fixed", top: "0", left: "0", width: "100%", height: "100%",
            backgroundColor: "rgba(255, 255, 255, 0.8)", zIndex: "9999",
            display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center",
            fontFamily: "sans-serif", fontSize: "18px", color: "#1e3a5f", backdropFilter: "blur(5px)"
        });
        loader.innerHTML = `
            <div style="width: 50px; height: 50px; border: 5px solid #e9ecef; border-top: 5px solid #4a90e2; border-radius: 50%; animation: spinLoader 1s linear infinite; margin-bottom: 15px;"></div>
            <div id="loader-text" style="font-weight: 600;">${message}</div>
            <style>@keyframes spinLoader { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }</style>
        `;
        document.body.appendChild(loader);
    } else {
        document.getElementById("loader-text").innerText = message;
        loader.style.display = "flex";
    }
}

function hideLoading() {
    const loader = document.getElementById("global-loader");
    if (loader) loader.style.display = "none";
}
// ------------------------------------

async function apiRequest(action, payload = {}) {
    if (!isSheetsConfigured()) {
        throw new Error("Google Sheets API URL is not configured yet.");
    }

    const formBody = new URLSearchParams({
        action,
        payload: JSON.stringify(payload)
    });

    let response;
    try {
        response = await fetch(SHEETS_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8"
            },
            body: formBody.toString()
        });
    } catch (networkError) {
        throw new Error("Network error while reaching Google Apps Script. Check deployment access (Anyone) and URL.");
    }

    if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
    }

    let data;
    try {
        data = await response.json();
    } catch (parseError) {
        throw new Error("Apps Script did not return valid JSON. Re-deploy the latest script version.");
    }

    if (!data.success) {
        throw new Error(data.message || "Google Sheets request failed.");
    }

    return data;
}

async function fetchBooks() {
    const data = await apiRequest("getBooks");
    return data.books || [];
}

async function fetchUsers() {
    const data = await apiRequest("getUsers");
    return data.users || {};
}

document.addEventListener("DOMContentLoaded", async function () {
    const profileBtn = document.getElementById("profile");
    const searchBtn = document.getElementById("searchBtn");
    const searchInput = document.getElementById("searchBook");
    
    if (profileBtn) {
        setupProfileButton(profileBtn);
    }

    if (searchBtn) {
        searchBtn.addEventListener("click", searchBooks);
    }

    if (searchInput) {
        searchInput.addEventListener("keydown", function (event) {
            if (event.key === "Enter") {
                event.preventDefault();
                searchBooks();
            }
        });
    }

    const bookContainer = document.getElementById("container");
    if (bookContainer) {
        await loadAndDisplayBooks();
    }

    if (window.location.href.includes("createAc.html")) {
        const box = document.createElement("div");
        box.className = "warning-box";
        box.innerHTML = `
          <p>Make sure to note your ID and password. Because You won’t be able to recover them later as of now.</p>
          <button class="warning-ok-btn">OK</button>
        `;
        document.body.appendChild(box);

        box.querySelector(".warning-ok-btn").addEventListener("click", function () {
            box.remove();
        });
    }
});

function setupProfileButton(profileBtn) {
    const loggedUser = localStorage.getItem("loggedUser");

    if (loggedUser) {
        document.getElementById("loggeduser").innerText = `UserId:${loggedUser}`;
        profileBtn.innerText = "Log out";
        profileBtn.onclick = function () {
            showDialog("Are you sure you want to log out?", () => {
                logOut();
            });
        };
        return;
    }

    profileBtn.innerText = "Log in";
    profileBtn.onclick = logInbtn;
}

function showDialog(message, onConfirm, onCancel) {
    const existing = document.querySelector(".dialog-overlay");
    if (existing) existing.remove();

    const overlay = document.createElement("div");
    overlay.className = "dialog-overlay";
    overlay.innerHTML = `
        <div class="custom-dialog">
            <p>${message}</p>
            <button id="dialogYes">Yes</button>
            <button id="dialogNo">No</button>
        </div>
    `;
    document.body.appendChild(overlay);

    document.getElementById("dialogYes").onclick = () => {
        overlay.remove();
        if (onConfirm) onConfirm();
    };
    document.getElementById("dialogNo").onclick = () => {
        overlay.remove();
        if (onCancel) onCancel();
    };
}

function logInbtn() {
    window.location.href = "index.html";
}

function logOut() {
    localStorage.removeItem("loggedUser");
    alert("Logged out successfully!");
    window.location.href = "index.html";
}

async function login(event) {
    event.preventDefault();

    const enterId = document.getElementById("number");
    const enterPass = document.getElementById("passwd");

    const id = enterId.value.trim();
    const pass = enterPass.value.trim();

    if (!id || !pass) {
        alert("Empty fields not allowed");
        return;
    }

    showLoading("Signing in...");
    try {
        const users = await fetchUsers();

        if (Object.prototype.hasOwnProperty.call(users, id) && users[id] === pass) {
            localStorage.setItem("loggedUser", id);
            window.location.href = "home.html";
            return;
        }

        if (Object.prototype.hasOwnProperty.call(users, id) && users[id] !== pass) {
            alert("Incorrect ID or password.");
            return;
        }

        alert("No ID found with such information!");
    } catch (error) {
        alert(`Login failed: ${error.message}`);
    } finally {
        hideLoading();
    }
}

async function creatId(event) {
    if (event) event.preventDefault();

    const userId = document.getElementById("number");
    const userPass = document.getElementById("Pass");
    const userConfPass = document.getElementById("passs");

    const password = userPass.value.trim();
    const confirmPass = userConfPass.value.trim();
    const id = userId.value.trim();

    if (!id || !confirmPass || !password) {
        alert("Empty fields not allowed");
        return;
    }
    if (id.length < 10) {
        alert("ID must be at least 10 characters long.");
        return;
    }
    if (password.length < 5) {
        alert("Password must be at least 5 characters long.");
        return;
    }
    if (password !== confirmPass) {
        alert("Enter matching passwords");
        return;
    }

    showLoading("Creating account...");
    try {
        const users = await fetchUsers();
        if (Object.prototype.hasOwnProperty.call(users, id)) {
            alert("This ID is already in use");
            return;
        }

        await apiRequest("createUser", { id, password });
        localStorage.setItem("loggedUser", id);
        alert("Account created successfully!");
        window.location.href = "home.html";
    } catch (error) {
        alert(`Account creation failed: ${error.message}`);
    } finally {
        hideLoading();
    }
}

function postBook() {
    const loggedUser = localStorage.getItem("loggedUser");
    if (!loggedUser) {
        alert("You need to log in to post a book.");
        return;
    }

    const divElement = document.getElementById("createBooksss");
    if (divElement) {
        divElement.style.display = divElement.style.display === "none" ? "flex" : "none";
    }
}

function cancel() {
    const divElement = document.getElementById("createBooksss");
    divElement.style.display = divElement.style.display === "none" ? "flex" : "none";
}

async function addNewBook() {
    const bookPrice = document.getElementById("enterPrice").value.trim();
    const bookName = document.getElementById("enterbookname").value.trim();
    const bookimg = document.getElementById("addphoto").value.trim();

    if (!bookPrice || !bookName) {
        alert("Please enter book name and price. Image is optional.");
        return;
    }
    if (!/^[A-Za-z\s]+$/.test(bookName)) {
        alert("Book name should contain only letters and spaces.");
        return;
    }
    if (Number(bookPrice) > 100) {
        alert("Book price is too high.");
        return;
    }
    if (bookName.length > 30) {
        alert("Book name is too long.");
        return;
    }

    const loggedUser = localStorage.getItem("loggedUser");
    if (!loggedUser) {
        alert("You need to log in to post a book.");
        return;
    }

    const book = {
        id: Date.now().toString(),
        name: bookName,
        price: bookPrice,
        img: bookimg,
        owner: loggedUser
    };

    showLoading("Uploading book...");
    try {
        await apiRequest("createBook", { book });

        const divElement = document.getElementById("createBooksss");
        divElement.style.display = "none";
        displayBook(book);
        clearInputs();
    } catch (error) {
        alert(`Failed to post book: ${error.message}`);
    } finally {
        hideLoading();
    }
}

async function loadAndDisplayBooks() {
    const container = document.getElementById("container");
    if (!container) return;

    const existingBooks = Array.from(container.querySelectorAll(".books"));
    existingBooks.forEach((book) => book.remove());

    showLoading("Loading books...");
    try {
        const storedBooks = await fetchBooks();
        storedBooks.forEach((book) => displayBook(book));
    } catch (error) {
        alert(`Could not load books: ${error.message}`);
    } finally {
        hideLoading();
    }
}

function displayBook(book) {
    const newBook = document.createElement("div");
    newBook.className = "books";
    newBook.setAttribute("data-id", book.id);
    newBook.innerHTML = `
        <div class="bookImg">
            <img src="${book.img}" alt="book image">
            <button class="bookDelBtn">Remove</button>
        </div>
        <div class="bookInfo">
            <p class="bookname">Book name: ${book.name}</p>
            <hr id="bookname">
            <p class="price">Price :<span class="Price">${book.price}</span> RS</p>
            <hr id="prc">
            <button class="buyBtn">Buy now</button>
        </div>`;

    document.getElementById("container").prepend(newBook);

    const loggedUser = localStorage.getItem("loggedUser");
    if (book.owner === loggedUser) {
        newBook.querySelector(".bookDelBtn").style.display = "flex";
    }

    newBook.querySelector(".buyBtn").addEventListener("click", function () {
        buyBook(book.owner, book.name, book.price, book.img);
    });

    newBook.querySelector(".bookDelBtn").addEventListener("click", function () {
        removeBook(book.id, this);
    });
}

function clearInputs() {
    document.getElementById("enterbookname").value = "";
    document.getElementById("enterPrice").value = "";
    document.getElementById("addphoto").value = "";
}

function buyBook(owner, name, price, img) {
    const bImg = document.getElementById("buyPageImg");
    bImg.src = img;

    document.getElementById("bookPageName").innerText = `Book Name : ${name}`;
    document.getElementById("bookPagePrice").innerText = `Book Price : ${price} Rs`;
    document.getElementById("ContactNumber").innerText = `Contact : ${owner}`;

    const buyPage = document.getElementById("buyPage");
    buyPage.style.display = "flex";
}

async function removeBook(bookId, buttonElement) {
    showDialog("Are you sure you want to delete this book?", async () => {
        showLoading("Deleting book...");
        try {
            await apiRequest("deleteBook", { id: bookId });
            const bookDiv = buttonElement.closest(".books");
            if (bookDiv) bookDiv.remove();
        } catch (error) {
            alert(`Failed to delete book: ${error.message}`);
        } finally {
            hideLoading();
        }
    });
}

function Done() {
    const buyPage = document.getElementById("buyPage");
    buyPage.style.display = "none";
}

async function searchBooks() {
    const bookName = document.getElementById("searchBook").value.trim().toLowerCase();

    showLoading("Searching...");
    try {
        const storedBooks = await fetchBooks();
        const container = document.getElementById("container");
        const existingBooks = Array.from(container.querySelectorAll(".books"));
        existingBooks.forEach((book) => book.remove());

        const foundBooks = storedBooks.filter((book) => book.name.toLowerCase().includes(bookName));

        if (foundBooks.length === 0) {
            alert("No books found matching that name.");
            return;
        }

        foundBooks.forEach((book) => displayBook(book));
    } catch (error) {
        alert(`Search failed: ${error.message}`);
    } finally {
        hideLoading();
    }
}

function openBuyPage() {
    document.getElementById("buyPage").style.display = "flex";
    document.getElementById("nav").style.filter = "blur(5px)";
}

function closeBuyPage() {
    document.getElementById("buyPage").style.display = "none";
    document.getElementById("nav").style.filter = "none";
}
