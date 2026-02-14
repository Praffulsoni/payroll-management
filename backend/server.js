const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

const helmet = require('helmet');

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const departmentRoutes = require('./routes/departmentRoutes');
const payrollRoutes = require('./routes/payrollRoutes');
const leaveRoutes = require('./routes/leaveRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const reportRoutes = require('./routes/reportRoutes');
const organizationRoutes = require("./routes/organizationRoutes");
const statutoryRoutes = require("./routes/statutoryRoutes");
const salaryStructureRoutes = require("./routes/salaryStructureRoutes");
const payslipRoutes = require("./routes/payslipRoutes");
const taxDeclarationRoutes = require("./routes/taxDeclarationRoutes");
const statutoryReportRoutes = require("./routes/statutoryReportRoutes");
const payrollAnalyticsRoutes = require("./routes/payrollAnalyticsRoutes");
const essRoutes = require("./routes/essRoutes");
const notificationRoutes = require("./routes/notificationRoutes");

const app = express();

// Middleware
app.use(helmet());

// Set up a restrictive CORS policy
const whitelist = [process.env.FRONTEND_URL, 'http://localhost:3000'];
const corsOptions = {
  origin: function (origin, callback) {
    if (whitelist.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
};
app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB Atlas'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/reports', reportRoutes);
app.use("/api/organization", organizationRoutes);
app.use("/api/statutory", statutoryRoutes);
app.use("/api/salary-structures", salaryStructureRoutes);
app.use("/api/payslips", payslipRoutes);
app.use("/api/tax-declarations", taxDeclarationRoutes);
app.use("/api/statutory-reports", statutoryReportRoutes);
app.use("/api/payroll-analytics", payrollAnalyticsRoutes);
app.use("/api/ess", essRoutes);
app.use("/api/notifications", notificationRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Payroll Management API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});