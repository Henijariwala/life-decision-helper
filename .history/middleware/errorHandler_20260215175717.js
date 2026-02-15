// middleware/errorHandler.js - Centralized Error Handling
const errorHandler = (err, req, res, next) => {
  // Log error details
  console.error("❌ Error occurred:");
  console.error("Message:", err.message);
  console.error("Stack:", err.stack);
  
  // Default error status
  const status = err.status || err.statusCode || 500;
  
  // Determine if this is an API request or web page request
  const isApiRequest = req.path.startsWith('/api/') || req.xhr || req.headers.accept?.includes('application/json');
  
  // Error response object
  const errorResponse = {
    error: {
      message: err.message || 'Internal Server Error',
      status: status,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  };
  
  // Handle specific error types
  if (err.name === 'ValidationError') {
    errorResponse.error.message = 'Invalid input data';
    errorResponse.error.details = err.details;
  } else if (err.name === 'UnauthorizedError') {
    errorResponse.error.message = 'Authentication required';
  } else if (err.code === 'ECONNREFUSED') {
    errorResponse.error.message = 'Service temporarily unavailable';
  }
  
  // Send appropriate response
  if (isApiRequest) {
    res.status(status).json(errorResponse);
  } else {
    res.status(status).render('error', {
      title: 'Error',
      message: errorResponse.error.message,
      code: status,
      stack: process.env.NODE_ENV === 'development' ? err.stack : null
    });
  }
};

module.exports = errorHandler;