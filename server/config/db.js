const mongoose = require('mongoose');
require('dotenv').config();

console.log('Initializing MongoDB connection');

// Mongoose debug mode to see detailed connection info
mongoose.set('debug', true);

const connectDB = async () => {
    try {
        console.log('Attempting to connect to MongoDB...');
        console.log('MongoDB URI exists:', !!process.env.MONGODB_URI);
        
        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 30000, // Increase timeouts
            socketTimeoutMS: 60000,
            connectTimeoutMS: 30000,
            maxPoolSize: 10,
            minPoolSize: 2
        });

        // Handle initial connection errors
        conn.connection.on('error', (err) => {
            console.error('MongoDB connection error:', err);
        });

        // Handle disconnection
        conn.connection.on('disconnected', () => {
            console.log('MongoDB disconnected');
        });

        // Handle reconnection
        conn.connection.on('reconnected', () => {
            console.log('MongoDB reconnected');
        });

        // Handle successful connection
        conn.connection.once('open', () => {
            console.log(`MongoDB Connected: ${conn.connection.host}`);
            
            // Initialize collections and indexes
            console.log('MongoDB connection open, checking collections...');
            
            // Log available collections
            conn.connection.db.listCollections().toArray((err, collections) => {
                if (err) {
                    console.error('Error listing collections:', err);
                } else {
                    console.log('Available collections:');
                    collections.forEach(collection => {
                        console.log(`- ${collection.name}`);
                    });
                }
            });
        });

        return conn;
    } catch (error) {
        console.error(`MongoDB Connection Error: ${error.message}`);
        console.error(error.stack);
        // Instead of exiting, we'll throw the error to handle it in the route
        throw error;
    }
};

module.exports = connectDB;
