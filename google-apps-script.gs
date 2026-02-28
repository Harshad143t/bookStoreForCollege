/**
 * BookMart Google Sheets backend.
 *
 * Sheet: users -> columns: id,password
 * Sheet: books -> columns: id,name,price,img,owner
 */

function doGet(e) {
  return handleRequest_(e);
}

function doPost(e) {
  return handleRequest_(e);
}

function handleRequest_(e) {
  try {
    const payload = parsePayload_(e);
    const action = String(payload.action || '').trim();
function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents || '{}');
    const action = payload.action;

    if (!action) {
      return jsonResponse({ success: false, message: 'Missing action.' });
    }

    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const usersSheet = spreadsheet.getSheetByName('users');
    const booksSheet = spreadsheet.getSheetByName('books');

    if (!usersSheet || !booksSheet) {
      return jsonResponse({ success: false, message: 'Missing sheets. Create tabs: users and books.' });
    }

    switch (action) {
      case 'getUsers':
        return jsonResponse({ success: true, users: getUsersMap(usersSheet) });

      case 'createUser': {
        const id = String(payload.id || '').trim();
        const password = String(payload.password || '').trim();
        if (!id || !password) {
          return jsonResponse({ success: false, message: 'ID and password are required.' });
        }

        const users = getUsersMap(usersSheet);
        if (users[id]) {
          return jsonResponse({ success: false, message: 'User already exists.' });
        }

        usersSheet.appendRow([id, password]);
        return jsonResponse({ success: true, message: 'User created.' });
      }

      case 'getBooks':
        return jsonResponse({ success: true, books: getBooksArray(booksSheet) });

      case 'createBook': {
        const book = payload.book || {};
        if (!book.id || !book.name || !book.price || !book.owner) {
          return jsonResponse({ success: false, message: 'Missing required book fields.' });
        }

        booksSheet.appendRow([
          String(book.id),
          String(book.name),
          String(book.price),
          String(book.img || ''),
          String(book.owner),
        ]);

        return jsonResponse({ success: true, message: 'Book created.' });
      }

      case 'deleteBook': {
        const id = String(payload.id || '').trim();
        if (!id) {
          return jsonResponse({ success: false, message: 'Book ID is required.' });
        }

        const rows = booksSheet.getDataRange().getValues();
        for (let i = rows.length - 1; i >= 1; i--) {
          if (String(rows[i][0]) === id) {
            booksSheet.deleteRow(i + 1);
            return jsonResponse({ success: true, message: 'Book deleted.' });
          }
        }

        return jsonResponse({ success: false, message: 'Book not found.' });
      }

      default:
        return jsonResponse({ success: false, message: 'Unknown action.' });
    }
  } catch (error) {
    return jsonResponse({ success: false, message: error.message });
  }
}

function parsePayload_(e) {
  const result = {};

  if (e && e.parameter) {
    if (e.parameter.action) {
      result.action = e.parameter.action;
    }

    if (e.parameter.payload) {
      const nested = JSON.parse(e.parameter.payload);
      Object.keys(nested).forEach((key) => {
        result[key] = nested[key];
      });
    }

    Object.keys(e.parameter).forEach((key) => {
      if (key !== 'payload') {
        result[key] = e.parameter[key];
      }
    });
  }

  if (Object.keys(result).length === 0 && e && e.postData && e.postData.contents) {
    const fromBody = JSON.parse(e.postData.contents);
    Object.keys(fromBody).forEach((key) => {
      result[key] = fromBody[key];
    });
  }

  return result;
}

function getUsersMap(usersSheet) {
  const values = usersSheet.getDataRange().getValues();
  const users = {};
  for (let i = 1; i < values.length; i++) {
    const id = String(values[i][0] || '').trim();
    const password = String(values[i][1] || '').trim();
    if (id) users[id] = password;
  }
  return users;
}

function getBooksArray(booksSheet) {
  const values = booksSheet.getDataRange().getValues();
  const books = [];

  for (let i = 1; i < values.length; i++) {
    books.push({
      id: String(values[i][0] || ''),
      name: String(values[i][1] || ''),
      price: String(values[i][2] || ''),
      img: String(values[i][3] || ''),
      owner: String(values[i][4] || ''),
    });
  }

  return books;
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
