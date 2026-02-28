# BookMart Google Sheets Backend Setup

## 1) Create the spreadsheet
1. Create a new Google Sheet.
2. Add sheet tab **users** with headers in row 1:
   - `id`
   - `password`
3. Add sheet tab **books** with headers in row 1:
   - `id`
   - `name`
   - `price`
   - `img`
   - `owner`

## 2) Add Apps Script backend
1. Open your Google Sheet.
2. Go to **Extensions → Apps Script**.
3. Replace default code with code from `google-apps-script.gs`.
4. Save.

## 3) Deploy web app
1. Click **Deploy → New deployment**.
2. Select type **Web app**.
3. Execute as: **Me**.
4. Who has access: **Anyone**.
5. Deploy and copy the generated web app URL.

## 4) Configure this frontend
1. Open `config.js`.
2. Replace:
   - `PASTE_YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE`
   with your deployed URL.

## 5) Test
- Create account from `createAc.html`.
- Login from `index.html`.
- Add/remove books from `home.html`.
- Verify rows appear in the Google Sheet.

## 6) If you see "Failed to fetch"
- In Apps Script deployment, ensure **Who has access = Anyone**.
- After any code changes in Apps Script, **Deploy a new version** and copy the latest `/exec` URL again.
- Confirm `config.js` contains the real URL (not placeholder text).
- Hard refresh browser (`Ctrl+Shift+R`).
