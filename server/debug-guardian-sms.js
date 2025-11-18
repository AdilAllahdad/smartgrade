/**
 * Debug Script - Check Guardian SMS Notification Setup
 * Run this to verify guardian phone numbers and test SMS sending
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Guardian = require('./models/guardianModel');
const Student = require('./models/studentModel');
const { sendSMS, notifyGuardianOfResult } = require('./services/notificationService');

async function checkGuardianSetup() {
    try {
        // Connect to MongoDB
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✓ Connected to MongoDB\n');

        // Check all guardians
        console.log('=== Checking Guardian Setup ===\n');
        const guardians = await Guardian.find();
        
        if (guardians.length === 0) {
            console.log('❌ No guardians found in database!');
            console.log('   Please add a student with guardian information first.\n');
            process.exit(0);
        }

        console.log(`Found ${guardians.length} guardian(s):\n`);
        
        for (const guardian of guardians) {
            console.log(`Guardian: ${guardian.name}`);
            console.log(`  Email: ${guardian.email}`);
            console.log(`  Phone: ${guardian.phoneNumber || '❌ NOT SET'}`);
            console.log(`  Student ID: ${guardian.student || '❌ NOT LINKED'}`);
            
            // Check if student exists
            if (guardian.student) {
                const student = await Student.findById(guardian.student);
                if (student) {
                    console.log(`  ✓ Linked to student: ${student.name} (${student.rollNumber})`);
                } else {
                    console.log(`  ❌ Student not found!`);
                }
            }
            console.log('');
        }

        // Find a guardian with phone number for testing
        const testGuardian = guardians.find(g => g.phoneNumber);
        
        if (!testGuardian) {
            console.log('❌ No guardian has a phone number set!');
            console.log('   Please update guardian records with phone numbers.\n');
            console.log('To fix this, you can run:');
            console.log('   db.guardians.updateOne(');
            console.log('     { email: "guardian@example.com" },');
            console.log('     { $set: { phoneNumber: "+923001234567" } }');
            console.log('   )\n');
            process.exit(0);
        }

        // Test SMS sending
        console.log('\n=== Testing SMS Notification ===\n');
        console.log(`Sending test SMS to: ${testGuardian.name}`);
        console.log(`Phone: ${testGuardian.phoneNumber}\n`);

        const testMessage = `Test SMS from SmartGrade System\n\n` +
            `This is a test notification to verify SMS functionality.\n\n` +
            `If you received this message, notifications are working correctly!`;

        const result = await sendSMS(testGuardian.phoneNumber, testMessage);
        
        if (result.success) {
            console.log('✓ Test SMS sent successfully!');
            console.log(`  Message ID: ${result.messageId}`);
            console.log(`  Status: ${result.status}`);
            console.log(`  To: ${result.to}`);
            
            if (result.note) {
                console.log(`  Note: ${result.note}`);
            }
        } else {
            console.log('❌ Failed to send test SMS');
            console.log(`   Error: ${result.error}`);
        }

        console.log('\n=== Twilio Configuration ===\n');
        console.log(`Account SID: ${process.env.TWILIO_ACCOUNT_SID ? '✓ Set' : '❌ Not Set'}`);
        console.log(`Auth Token: ${process.env.TWILIO_AUTH_TOKEN ? '✓ Set' : '❌ Not Set'}`);
        console.log(`Phone Number: ${process.env.TWILIO_PHONE_NUMBER || '❌ Not Set'}`);
        
        console.log('\n=== Summary ===\n');
        console.log('Checklist:');
        console.log(`  [${guardians.some(g => g.phoneNumber) ? '✓' : '❌'}] Guardian has phone number`);
        console.log(`  [${guardians.some(g => g.student) ? '✓' : '❌'}] Guardian linked to student`);
        console.log(`  [${process.env.TWILIO_ACCOUNT_SID ? '✓' : '❌'}] Twilio credentials configured`);
        console.log(`  [${result.success ? '✓' : '❌'}] SMS sending works`);

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error(error);
    } finally {
        await mongoose.connection.close();
        console.log('\n✓ Database connection closed');
        process.exit(0);
    }
}

// Run the check
checkGuardianSetup();
