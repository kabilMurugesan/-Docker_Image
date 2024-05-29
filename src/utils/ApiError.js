class ApiError extends Error {
  constructor(statusCode, message, isOperational = true, stack = '',field= '') {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.field=field;
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

module.exports = ApiError;
