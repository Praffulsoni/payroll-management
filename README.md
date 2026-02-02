---

# 🧾 Payroll Management System (Backend)

A complete backend system for managing employee payroll, attendance, leave, taxation, and compliance with role-based access control and audit logging.

This project is developed as part of an internship assignment to demonstrate backend development using Node.js, Express.js, and MongoDB.

---

## 🚀 Features

### 🔐 Authentication & Authorization

* Secure login and logout using JWT
* Role-based access control (RBAC)
* Roles supported: Super Admin, Admin, HR Admin, Payroll Admin, Finance, Employee

---

### 🏢 Organization & Employee Management

* Employee creation, update, and deletion
* Department management
* Salary structure and payroll profile assignment
* Bank and personal details storage
* Employee self-service profile access

---

### 🕒 Attendance & Leave Management

* Daily attendance marking (check-in & check-out)
* Bulk attendance upload
* Attendance-based salary calculation
* Leave application and approval workflow
* Loss of Pay (LOP) handling

---

### 💰 Payroll Processing

* Monthly payroll generation
* Attendance and leave integrated salary calculation
* Payroll approval workflow
* Payroll payment status tracking
* Payslip generation (PDF supported)
* Bank transfer and disbursement records

---

### 🧮 Tax & Compliance

* Income tax calculation (old/new regime supported)
* PF and ESI deductions
* Investment declaration support
* Statutory compliance configuration

---

### 📊 Reports & Analytics

* Payroll summary reports
* Department-wise payroll reports
* Statutory reports (PF, ESI, PT)
* Exportable reports (JSON/PDF)

---

### 👨‍💼 Employee Self Service (ESS)

* View salary breakup
* View tax details
* Download payslips
* View attendance history

---

### 🔔 Notifications & Audit Logs

* Payroll completion notifications
* Complete audit trail of actions:

  * Payroll processing
  * Attendance marking
  * Leave approval
  * Employee management
* IP and timestamp logging

---

## 🛠️ Tech Stack

* **Backend:** Node.js, Express.js
* **Database:** MongoDB (Atlas)
* **Authentication:** JWT
* **ORM:** Mongoose
* **Testing:** Postman
* **PDF Generation:** pdfkit
* **Security:** bcrypt, role-based middleware

---

## 📂 Project Structure

```
backend/
│
├── controllers/
├── models/
├── routes/
├── middleware/
├── utils/
├── config/
├── .env
├── server.js
└── package.json
```

---

## ⚙️ Environment Variables (.env)

Create a `.env` file in the root directory:

```
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/payroll_db
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=7d
```

---

## ▶️ How to Run the Project

1. Clone the repository:

```bash
git clone https://github.com/your-username/payroll-management-system.git
```

2. Install dependencies:

```bash
npm install
```

3. Start the server:

```bash
npm start
```

4. API will run on:

```
http://localhost:5000
```

---

## 🔍 API Modules Implemented

| Module                         | Status |
| ------------------------------ | ------ |
| Authentication & RBAC          | ✅      |
| Statutory & Compliance Config  | ✅      |
| Employee Payroll Profile       | ✅      |
| Salary Structure               | ✅      |
| Attendance & Leave Integration | ✅      |
| Payroll Processing             | ✅      |
| Payslip & Disbursement         | ✅      |
| Tax Management                 | ✅      |
| Statutory Reports              | ✅      |
| Payroll Analytics              | ✅      |
| Employee Self Service          | ✅      |
| Notifications & Audit Logs     | ✅      |

---

## 🧪 Testing

All APIs are tested using **Postman**:

* Authentication flow
* Payroll generation
* Attendance & leave integration
* Employee self-service
* Notification system

---

## 🔐 Security

* Passwords encrypted using bcrypt
* JWT-based authentication
* Role-based authorization middleware
* Input validation and error handling

---

## 👨‍💻 Developer

Developed by: **Prafful Rajesh Soni**
Internship Project – Payroll Management System

---

## 📜 License

This project is for educational and internship purposes only.

---