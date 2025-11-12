/**
 * Global error handler middleware
 */
const errorHandler = (err, req, res, next) => {
    // Default to 500 if no status code was set or if it's OK (200)
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode || 500;
    
    // Log detailed error information
    console.error('=================================');
    console.error(`ERROR [${new Date().toISOString()}]`);
    console.error(`Route: ${req.method} ${req.originalUrl}`);
    console.error(`Error Status: ${statusCode}`);
    console.error(`Error Message: ${err.message}`);
    console.error(`Error Name: ${err.name}`);
    
    // Request details for context
    console.error('Request Details:');
    console.error(`- Headers: ${JSON.stringify(req.headers)}`);
    console.error(`- Query: ${JSON.stringify(req.query)}`);
    console.error(`- Body: ${JSON.stringify(req.body, null, 2).substring(0, 1000)}...`); // Truncated for readability
    
    // If it's a MongoDB/Mongoose error, add more details
    if (err.name === 'MongoServerError' || err.name === 'MongooseError' || err.name === 'CastError' || err.name === 'ValidationError') {
        console.error('MongoDB Error Details:');
        console.error(`- Error Type: ${err.name}`);
        console.error(`- Error Code: ${err.code || 'N/A'}`);
        
        if (err.name === 'CastError') {
            console.error(`- Invalid ID: ${err.value}`);
            console.error(`- Path: ${err.path}`);
            console.error(`- Model: ${err.model?.modelName || 'Unknown'}`);
        }
        
        if (err.name === 'ValidationError') {
            console.error(`- Validation Errors: ${JSON.stringify(err.errors, null, 2)}`);
        }
    }
    
    // Log the stack trace
    console.error('Stack Trace:');
    console.error(err.stack);
    console.error('=================================');
    
    // Customize response based on error type
    let responseMessage = err.message || 'An unexpected error occurred';
    let responseDetails = {};
    
    // Handle specific error types with better user-facing messages
    if (err.name === 'CastError') {
        responseMessage = `Invalid ${err.path}: ${err.value}`;
        responseDetails.path = err.path;
        responseDetails.value = err.value;
        responseDetails.kind = err.kind;
    } else if (err.name === 'ValidationError') {
        responseMessage = 'Validation failed';
        responseDetails.validationErrors = Object.keys(err.errors).reduce((acc, key) => {
            acc[key] = err.errors[key].message;
            return acc;
        }, {});
    } else if (err.name === 'JsonWebTokenError') {
        responseMessage = 'Invalid authentication token';
        responseDetails.tokenError = err.message;
    } else if (err.name === 'TokenExpiredError') {
        responseMessage = 'Authentication token expired';
        responseDetails.expiredAt = err.expiredAt;
    }
    
    // Send a clean response in production, more details in development
    res.status(statusCode).json({
        success: false,
        message: responseMessage,
        details: process.env.NODE_ENV === 'production' ? undefined : responseDetails,
        stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
        timestamp: new Date().toISOString()
    });
};

module.exports = errorHandler;
