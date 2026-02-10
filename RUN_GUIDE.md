# How to Run the Payroll System

## 1. Prerequisites
- **Node.js** installed on your computer.
- **MongoDB** installed and running locally.

## 2. Start the Backend
1. Open a terminal in the project folder.
2. Go to the backend folder:
   ```bash
   cd backend
   ```
3. Install dependencies (if you haven't already):
   ```bash
   npm install
   ```
4. Start the server:
   ```bash
   npm start
   ```
   *You should see "Server running on port 5000" and "Connected to MongoDB Atlas".*

   **Troubleshooting:**
   - If you see `EADDRINUSE :::5000`, it means the server is already running. Close other terminal windows or stop the process.

## 3. Open the Frontend
1. Go to the `frontend` folder.
2. Double-click **`index.html`** to open it in your browser.

## 4. Login Credentials
Since you are using a local database, you need to create a user first (or use one you created earlier).

**To create a user via Postman:**
- **POST** `http://localhost:5000/api/users`
- **Body:**
  ```json
  {
    "name": "Test User",
    "email": "test@company.com",
    "password": "password123",
    "role": "employee"
  }
  ```

**To Login:**
- **Email:** `test@company.com`
- **Password:** `password123`
- **Role:** Employee

---
**Note:** The backend code has NOT been modified. Only a local `.env` configuration file was created to connect to your local MongoDB.
