const SHEETS_API_URL = window.BOOKMART_SHEETS_API_URL || "PASTE_YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE";

function isSheetsConfigured() {
    return SHEETS_API_URL && !SHEETS_API_URL.includes("PASTE_YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE");
}

async function apiRequest(action, payload = {}) {
    if (!isSheetsConfigured()) {
        throw new Error("Google Sheets API URL is not configured yet.");
    }

    // Use form-encoded body to avoid browser preflight issues with Apps Script.
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

    if (profileBtn) {
        setupProfileButton(profileBtn);
    }

    if (searchBtn) {
        searchBtn.addEventListener("click", searchBooks);
    }

    const bookContainer = document.getElementById("container");
    if (bookContainer) {
        await loadAndDisplayBooks();
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

    try {
        const users = await fetchUsers();

        if (Object.prototype.hasOwnProperty.call(users, id) && users[id] === pass) {
            localStorage.setItem("loggedUser", id);
            alert("Logged in successfully.");
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
    }
}

async function creatId(event) {
    if (event) {
        event.preventDefault();
    }

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

    try {
        await apiRequest("createBook", { book });

        const divElement = document.getElementById("createBooksss");
        divElement.style.display = "none";
        displayBook(book);
        clearInputs();
    } catch (error) {
        alert(`Failed to post book: ${error.message}`);
    }
}

async function loadAndDisplayBooks() {
    const container = document.getElementById("container");
    if (!container) return;

    const existingBooks = Array.from(container.querySelectorAll(".books"));
    existingBooks.forEach((book) => book.remove());

    try {
        const storedBooks = await fetchBooks();
        storedBooks.forEach((book) => displayBook(book));
    } catch (error) {
        alert(`Could not load books: ${error.message}`);
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
        try {
            await apiRequest("deleteBook", { id: bookId });

            const bookDiv = buttonElement.closest(".books");
            if (bookDiv) {
                bookDiv.remove();
            }
        } catch (error) {
            alert(`Failed to delete book: ${error.message}`);
        }
    });
}

function Done() {
    const buyPage = document.getElementById("buyPage");
    buyPage.style.display = "none";
}

async function searchBooks() {
    const bookName = document.getElementById("searchBook").value.trim().toLowerCase();

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