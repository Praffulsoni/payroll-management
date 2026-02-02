// Pagination helper
const paginate = (query, page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  return query.skip(skip).limit(limit);
};

// Response formatter
const formatResponse = (success, message, data = null, meta = null) => {
  const response = {
    success,
    message
  };

  if (data !== null) {
    response.data = data;
  }

  if (meta !== null) {
    response.meta = meta;
  }

  return response;
};

// Date helpers
const getMonthName = (month) => {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[month - 1];
};

const getFinancialYear = (date = new Date()) => {
  const year = date.getFullYear();
  const month = date.getMonth();

  if (month >= 3) { // April onwards
    return `${year}-${year + 1}`;
  } else {
    return `${year - 1}-${year}`;
  }
};

const getDaysInMonth = (month, year) => {
  return new Date(year, month, 0).getDate();
};

const getWorkingDays = (month, year) => {
  const daysInMonth = getDaysInMonth(month, year);
  let workingDays = 0;

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month - 1, day);
    const dayOfWeek = date.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not Sunday or Saturday
      workingDays++;
    }
  }

  return workingDays;
};

// Salary calculation helpers
const calculateTax = (annualIncome) => {
  // Simple Indian tax calculation (Old Regime approximation)
  let tax = 0;

  if (annualIncome <= 250000) {
    tax = 0;
  } else if (annualIncome <= 500000) {
    tax = (annualIncome - 250000) * 0.05;
  } else if (annualIncome <= 1000000) {
    tax = 12500 + (annualIncome - 500000) * 0.2;
  } else {
    tax = 112500 + (annualIncome - 1000000) * 0.3;
  }

  return Math.round(tax / 12); // Monthly tax
};

const calculatePF = (basicSalary) => {
  // 12% of basic salary, max ₹1800 per month
  const pf = basicSalary * 0.12;
  return Math.min(pf, 1800);
};

const calculateESI = (grossSalary) => {
  // 0.75% of gross salary if gross <= 21000
  if (grossSalary <= 21000) {
    return grossSalary * 0.0075;
  }
  return 0;
};

// Generate unique ID
const generateUniqueId = (prefix = 'ID') => {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 8);
  return `${prefix}_${timestamp}${randomStr}`.toUpperCase();
};

// Validate email format
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Sanitize object - remove undefined/null values
const sanitizeObject = (obj) => {
  return Object.entries(obj).reduce((acc, [key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      acc[key] = value;
    }
    return acc;
  }, {});
};

module.exports = {
  paginate,
  formatResponse,
  getMonthName,
  getFinancialYear,
  getDaysInMonth,
  getWorkingDays,
  calculateTax,
  calculatePF,
  calculateESI,
  generateUniqueId,
  isValidEmail,
  sanitizeObject
};
