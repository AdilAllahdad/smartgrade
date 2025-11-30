/**
 * Notification Service
 * Handles sending SMS and email notifications
 */

const twilio = require('twilio');

// Initialize Twilio client (will be null if credentials not provided)
let twilioClient = null;

try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

    if (accountSid && authToken && twilioPhoneNumber) {
        twilioClient = twilio(accountSid, authToken);
        console.log('✓ Twilio SMS service initialized');
    } else {
        console.warn('⚠ Twilio credentials not found. SMS notifications will be logged only.');
    }
} catch (error) {
    console.warn('⚠ Failed to initialize Twilio:', error.message);
}

/**
 * Send SMS notification
 * @param {string} phoneNumber - Recipient phone number
 * @param {string} message - Message content
 * @returns {Promise<Object>} - Notification result
 */
async function sendSMS(phoneNumber, message) {
    // Format phone number (remove spaces and dashes)
    const formattedNumber = phoneNumber.replace(/[\s-]/g, '');
    
    // Ensure phone number has country code
    let fullNumber = formattedNumber;
    if (!formattedNumber.startsWith('+')) {
        // Default to Pakistan (+92) if no country code
        if (formattedNumber.startsWith('0')) {
            fullNumber = '+92' + formattedNumber.substring(1);
        } else {
            fullNumber = '+92' + formattedNumber;
        }
    }

    try {
        if (twilioClient) {
            // Send actual SMS via Twilio
            const result = await twilioClient.messages.create({
                body: message,
                from: process.env.TWILIO_PHONE_NUMBER,
                to: fullNumber
            });

            console.log(`✓ SMS sent successfully to ${fullNumber}`);
            return {
                success: true,
                messageId: result.sid,
                status: result.status,
                to: fullNumber
            };
        } else {
            // Development mode - just log the message
            console.log('\n📱 SMS Notification (Development Mode):');
            console.log(`To: ${fullNumber}`);
            console.log(`Message: ${message}`);
            console.log('---\n');

            return {
                success: true,
                messageId: 'dev-mode-' + Date.now(),
                status: 'logged',
                to: fullNumber,
                note: 'SMS logged only (Twilio not configured)'
            };
        }
    } catch (error) {
        console.error('✗ Failed to send SMS:', error.message);
        
        // Log the SMS even if sending fails
        console.log('\n📱 SMS Notification (Failed to send):');
        console.log(`To: ${fullNumber}`);
        console.log(`Message: ${message}`);
        console.log(`Error: ${error.message}`);
        console.log('---\n');

        return {
            success: false,
            error: error.message,
            to: fullNumber
        };
    }
}

/**
 * Send result notification to guardian
 * @param {Object} guardian - Guardian object with phone number
 * @param {Object} student - Student object
 * @param {Object} exam - Exam object
 * @param {Object} result - Result summary
 * @returns {Promise<Object>} - Notification result
 */
async function notifyGuardianOfResult(guardian, student, exam, result) {
    if (!guardian || !guardian.phoneNumber) {
        throw new Error('Guardian phone number not available');
    }

    const percentage = result.percentage || 0;
    const grade = getGrade(percentage);
    
    const message = `Dear ${guardian.name},\n\n` +
        `The exam result for ${student.name} has been uploaded.\n\n` +
        `Subject: ${exam.title || exam.subject || 'Exam'}\n` +
        `Score: ${result.score}/${result.maxScore} (${percentage}%)\n` +
        `Grade: ${grade}\n\n` +
        `Login to view complete details.\n\n` +
        `SmartGrade System`;

    return await sendSMS(guardian.phoneNumber, message);
}

/**
 * Calculate grade from percentage
 * @param {number} percentage - Percentage score
 * @returns {string} - Grade letter
 */
function getGrade(percentage) {
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B';
    if (percentage >= 60) return 'C';
    if (percentage >= 50) return 'D';
    return 'F';
}

/**
 * Send bulk notifications to multiple guardians
 * @param {Array} notifications - Array of notification objects
 * @returns {Promise<Array>} - Array of results
 */
async function sendBulkNotifications(notifications) {
    const results = [];
    
    for (const notification of notifications) {
        try {
            const result = await notifyGuardianOfResult(
                notification.guardian,
                notification.student,
                notification.exam,
                notification.result
            );
            results.push({ ...result, guardianId: notification.guardian._id });
        } catch (error) {
            results.push({
                success: false,
                error: error.message,
                guardianId: notification.guardian?._id
            });
        }
    }
    
    return results;
}

module.exports = {
    sendSMS,
    notifyGuardianOfResult,
    sendBulkNotifications,
    getGrade
};
