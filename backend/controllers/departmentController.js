const Department = require('../models/Department');
const Employee = require('../models/Employee');
const AuditLog = require('../models/AuditLog');

// @desc    Get all departments
// @route   GET /api/departments
// @access  Private
exports.getDepartments = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, isActive } = req.query;

    const query = {};

    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } }
      ];
    }

    const total = await Department.countDocuments(query);
    const departments = await Department.find(query)
      .populate('head', 'firstName lastName employeeId')
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ name: 1 });

    // Get employee count for each department
    const departmentsWithCount = await Promise.all(
      departments.map(async (dept) => {
        const employeeCount = await Employee.countDocuments({ department: dept._id });
        return {
          ...dept.toObject(),
          employeeCount
        };
      })
    );

    res.status(200).json({
      success: true,
      data: departmentsWithCount,
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

// @desc    Get all departments (no pagination)
// @route   GET /api/departments/all
// @access  Private
exports.getAllDepartments = async (req, res) => {
  try {
    const departments = await Department.find({ isActive: true })
      .select('name code')
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      data: departments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get single department
// @route   GET /api/departments/:id
// @access  Private
exports.getDepartment = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id)
      .populate('head', 'firstName lastName employeeId email');

    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    // Get employees in this department
    const employees = await Employee.find({ department: department._id })
      .select('firstName lastName employeeId designation status')
      .limit(10);

    const employeeCount = await Employee.countDocuments({ department: department._id });

    res.status(200).json({
      success: true,
      data: {
        ...department.toObject(),
        employees,
        employeeCount
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

// @desc    Create department
// @route   POST /api/departments
// @access  Private (Admin, HR Admin)
exports.createDepartment = async (req, res) => {
  try {
    const { name, code, description, head, budget } = req.body;

    // Check if department code already exists
    const existingDept = await Department.findOne({ code: code.toUpperCase() });
    if (existingDept) {
      return res.status(400).json({
        success: false,
        message: 'Department with this code already exists'
      });
    }

    const department = await Department.create({
      name,
      code: code.toUpperCase(),
      description,
      head,
      budget
    });

    // Create audit log
    await AuditLog.create({
      user: req.user._id,
      action: 'CREATE_DEPARTMENT',
      module: 'departments',
      description: `Created department ${name}`,
      targetId: department._id,
      targetModel: 'Department',
      newData: { name, code },
      ipAddress: req.ip
    });

    res.status(201).json({
      success: true,
      message: 'Department created successfully',
      data: department
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Update department
// @route   PUT /api/departments/:id
// @access  Private (Admin, HR Admin)
exports.updateDepartment = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);

    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    const previousData = {
      name: department.name,
      code: department.code,
      head: department.head,
      isActive: department.isActive
    };

    const updatedDepartment = await Department.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('head', 'firstName lastName employeeId');

    // Create audit log
    await AuditLog.create({
      user: req.user._id,
      action: 'UPDATE_DEPARTMENT',
      module: 'departments',
      description: `Updated department ${updatedDepartment.name}`,
      targetId: department._id,
      targetModel: 'Department',
      previousData,
      newData: req.body,
      ipAddress: req.ip
    });

    res.status(200).json({
      success: true,
      message: 'Department updated successfully',
      data: updatedDepartment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Delete department
// @route   DELETE /api/departments/:id
// @access  Private (Admin)
exports.deleteDepartment = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);

    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    // Check if department has employees
    const employeeCount = await Employee.countDocuments({ department: department._id });
    if (employeeCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete department. ${employeeCount} employees are assigned to this department.`
      });
    }

    await department.deleteOne();

    // Create audit log
    await AuditLog.create({
      user: req.user._id,
      action: 'DELETE_DEPARTMENT',
      module: 'departments',
      description: `Deleted department ${department.name}`,
      previousData: { name: department.name, code: department.code },
      ipAddress: req.ip
    });

    res.status(200).json({
      success: true,
      message: 'Department deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get department statistics
// @route   GET /api/departments/stats
// @access  Private
exports.getDepartmentStats = async (req, res) => {
  try {
    const totalDepartments = await Department.countDocuments();
    const activeDepartments = await Department.countDocuments({ isActive: true });

    const departmentEmployeeStats = await Employee.aggregate([
      { $match: { status: 'active' } },
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
          _id: { name: '$dept.name', code: '$dept.code' },
          count: { $sum: 1 },
          totalSalary: { $sum: '$salary.basic' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalDepartments,
        activeDepartments,
        departmentEmployeeStats
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
