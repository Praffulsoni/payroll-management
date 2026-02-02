const Employee = require('../models/Employee');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');

// @desc    Get all employees
// @route   GET /api/employees
// @access  Private (Admin, HR Admin, Payroll Admin, Finance)
exports.getEmployees = async (req, res) => {
  try {
    const { page = 1, limit = 10, department, status, search } = req.query;

    const query = {};

    if (department) query.department = department;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } }
      ];
    }

    const total = await Employee.countDocuments(query);
    const employees = await Employee.find(query)
      .populate('department', 'name code')
      .populate('user', 'name email role')
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: employees,
      meta: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get single employee
// @route   GET /api/employees/:id
// @access  Private
exports.getEmployee = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id)
      .populate('department', 'name code')
      .populate('user', 'name email role');

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    res.status(200).json({
      success: true,
      data: employee
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Create employee
// @route   POST /api/employees
// @access  Private (Admin, HR Admin)
exports.createEmployee = async (req, res) => {
  try {
    const {
      firstName, lastName, email, phone, dateOfBirth, gender,
      department, designation, dateOfJoining, salary, bankDetails,
      address, emergencyContact, password
    } = req.body;

    // Check if employee email already exists
    const existingEmployee = await Employee.findOne({ email });
    if (existingEmployee) {
      return res.status(400).json({
        success: false,
        message: 'Employee with this email already exists'
      });
    }

    // Create user account for employee
    const user = await User.create({
      name: `${firstName} ${lastName}`,
      email,
      password: password || 'Employee@123', // Default password
      role: 'employee'
    });

    // Create employee
    const employee = await Employee.create({
      user: user._id,
      firstName,
      lastName,
      email,
      phone,
      dateOfBirth,
      gender,
      department,
      designation,
      dateOfJoining,
      salary,
      bankDetails,
      address,
      emergencyContact,
      taxRegime
    });

    // Create audit log
    await AuditLog.create({
      user: req.user._id,
      action: 'CREATE_EMPLOYEE',
      module: 'employees',
      description: `Created employee ${firstName} ${lastName}`,
      targetId: employee._id,
      targetModel: 'Employee',
      newData: { firstName, lastName, email, designation },
      ipAddress: req.ip
    });

    const populatedEmployee = await Employee.findById(employee._id)
      .populate('department', 'name code')
      .populate('user', 'name email role');

    res.status(201).json({
      success: true,
      message: 'Employee created successfully',
      data: populatedEmployee
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Update employee
// @route   PUT /api/employees/:id
// @access  Private (Admin, HR Admin)
exports.updateEmployee = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    const previousData = {
      firstName: employee.firstName,
      lastName: employee.lastName,
      designation: employee.designation,
      department: employee.department,
      status: employee.status
    };

    const updatedEmployee = await Employee.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
      .populate('department', 'name code')
      .populate('user', 'name email role');

    // Update user name if first/last name changed
    if (req.body.firstName || req.body.lastName) {
      await User.findByIdAndUpdate(employee.user, {
        name: `${req.body.firstName || employee.firstName} ${req.body.lastName || employee.lastName}`
      });
    }

    // Create audit log
    await AuditLog.create({
      user: req.user._id,
      action: 'UPDATE_EMPLOYEE',
      module: 'employees',
      description: `Updated employee ${updatedEmployee.firstName} ${updatedEmployee.lastName}`,
      targetId: employee._id,
      targetModel: 'Employee',
      previousData,
      newData: req.body,
      ipAddress: req.ip
    });

    res.status(200).json({
      success: true,
      message: 'Employee updated successfully',
      data: updatedEmployee
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Delete employee
// @route   DELETE /api/employees/:id
// @access  Private (Admin, HR Admin)
exports.deleteEmployee = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    // Delete associated user
    await User.findByIdAndDelete(employee.user);

    // Delete employee
    await employee.deleteOne();

    // Create audit log
    await AuditLog.create({
      user: req.user._id,
      action: 'DELETE_EMPLOYEE',
      module: 'employees',
      description: `Deleted employee ${employee.firstName} ${employee.lastName}`,
      previousData: {
        employeeId: employee.employeeId,
        name: `${employee.firstName} ${employee.lastName}`,
        email: employee.email
      },
      ipAddress: req.ip
    });

    res.status(200).json({
      success: true,
      message: 'Employee deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get employee statistics
// @route   GET /api/employees/stats
// @access  Private (Admin, HR Admin)
exports.getEmployeeStats = async (req, res) => {
  try {
    const totalEmployees = await Employee.countDocuments();
    const activeEmployees = await Employee.countDocuments({ status: 'active' });
    const inactiveEmployees = await Employee.countDocuments({ status: 'inactive' });
    const onNotice = await Employee.countDocuments({ status: 'on_notice' });

    const departmentStats = await Employee.aggregate([
      {
        $lookup: {
          from: 'departments',
          localField: 'department',
          foreignField: '_id',
          as: 'dept'
        }
      },
      { $unwind: { path: '$dept', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: '$dept.name',
          count: { $sum: 1 }
        }
      }
    ]);

    const genderStats = await Employee.aggregate([
      { $group: { _id: '$gender', count: { $sum: 1 } } }
    ]);

    // New joinings this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const newJoinings = await Employee.countDocuments({
      dateOfJoining: { $gte: startOfMonth }
    });

    res.status(200).json({
      success: true,
      data: {
        totalEmployees,
        activeEmployees,
        inactiveEmployees,
        onNotice,
        newJoinings,
        departmentStats,
        genderStats
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get my profile (for employee role)
// @route   GET /api/employees/me
// @access  Private (Employee)
exports.getMyProfile = async (req, res) => {
  try {
    const employee = await Employee.findOne({ user: req.user._id })
      .populate('department', 'name code')
      .populate('user', 'name email role');

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee profile not found'
      });
    }

    res.status(200).json({
      success: true,
      data: employee
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};
