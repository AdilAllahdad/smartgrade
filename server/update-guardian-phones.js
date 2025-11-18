/**
 * Update Guardian Phone Numbers
 * Use this script to add phone numbers to existing guardians
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Guardian = require('./models/guardianModel');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(prompt) {
    return new Promise((resolve) => {
        rl.question(prompt, resolve);
    });
}

async function updateGuardianPhones() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✓ Connected to MongoDB\n');

        // Get all guardians without phone numbers
        const guardiansWithoutPhone = await Guardian.find({
            $or: [
                { phoneNumber: { $exists: false } },
                { phoneNumber: null },
                { phoneNumber: '' }
            ]
        }).populate('student');

        if (guardiansWithoutPhone.length === 0) {
            console.log('✓ All guardians already have phone numbers!');
            process.exit(0);
        }

        console.log(`Found ${guardiansWithoutPhone.length} guardian(s) without phone numbers:\n`);

        for (const guardian of guardiansWithoutPhone) {
            console.log(`\n===================================`);
            console.log(`Guardian: ${guardian.name}`);
            console.log(`Email: ${guardian.email}`);
            if (guardian.student) {
                console.log(`Student: ${guardian.student.name} (${guardian.student.rollNumber})`);
            }
            console.log(`===================================\n`);

            const phoneNumber = await question('Enter phone number (or "skip" to skip): ');

            if (phoneNumber.toLowerCase() === 'skip') {
                console.log('Skipped.\n');
                continue;
            }

            // Validate phone number format
            const cleanPhone = phoneNumber.replace(/[\s-]/g, '');
            if (!/^(\+?\d{1,3})?\d{10,12}$/.test(phoneNumber) || cleanPhone.length < 10) {
                console.log('❌ Invalid phone number format. Skipped.\n');
                continue;
            }

            // Update guardian
            guardian.phoneNumber = phoneNumber;
            await guardian.save();
            console.log(`✓ Updated phone number for ${guardian.name}\n`);
        }

        console.log('\n✓ All guardians updated!');

    } catch (error) {
        console.error('\n❌ Error:', error.message);
    } finally {
        await mongoose.connection.close();
        rl.close();
        process.exit(0);
    }
}

updateGuardianPhones();
