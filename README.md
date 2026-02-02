---

# 📦 Payroll Management Backend

This is the backend for a Payroll Management System developed as part of an internship project.
It handles employee attendance, leave management, payroll processing, and reporting with role-based access control.

---

## 🚀 Tech Stack

### Backend

* **Node.js** – Runtime environment for executing JavaScript on the server side
* **Express.js** – Web framework for building RESTful APIs
* **MongoDB** – NoSQL database for storing application data
* **Mongoose** – ODM (Object Data Modeling) library for MongoDB

### Security & Configuration

* **JWT (JSON Web Token)** – Authentication and role-based authorization
* **dotenv** – Environment variable management
* **CORS** – Cross-origin request handling

### Testing & Tools

* **Postman** – API testing
* **MongoDB Atlas** – Cloud database service
* **Git & GitHub** – Version control and repository hosting

---

## 🧱 Project Architecture

The project follows the **MVC (Model–View–Controller)** architecture:

* **Models** – Define database schemas (Employee, Attendance, Leave, Payroll, etc.)
* **Controllers** – Contain business logic for each module
* **Routes** – Handle API endpoints and map them to controllers
* **Middleware** – Handles authentication and role-based access control

This structure makes the code modular, scalable, and easy to maintain.

---

## 📌 Implemented Modules

### ✅ Attendance Management

* Mark and fetch employee attendance
* Stores attendance records in MongoDB
* Used for payroll calculations

### ✅ Leave Management

* Employees can apply for leave
* HR/Admin can approve or reject leave requests
* View pending leaves and leave statistics
* Role-based access control implemented

### Other Modules

* Authentication & Authorization
* Employee Management
* Department Management
* Payroll Processing
* Reports & Analytics

---

## 🔐 Authentication & Authorization

* Uses **JWT-based authentication**
* Role-based access control for:

  * Employee
  * HR Admin
  * Admin
  * Super Admin

This ensures users can only access data according to their role.

---

## ▶️ How to Run the Project

1. Clone the repository
2. Install dependencies:

   ```bash
   npm install
   ```
3. Create a `.env` file:

   ```env
   PORT=5000
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_secret_key
   JWT_EXPIRE=7d
   ```
4. Start the server:

   ```bash
   npm start
   ```

---

## 🧪 API Testing

All APIs were tested using **Postman**:

* Authentication
* Attendance
* Leave Management
* Payroll and Reports

Data was verified in **MongoDB Atlas** after each operation.

---