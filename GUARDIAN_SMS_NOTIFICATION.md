# Guardian SMS Notification System

## Overview
Automatic SMS notification system that alerts guardians when their child's exam results are uploaded. Guardians receive instant SMS messages with score summaries and can login to view complete details.

## Features Implemented

### 1. **Guardian Phone Number Field**
- Added `phoneNumber` field to Guardian model
- Validates phone number format (supports international formats)
- Required field for all guardian registrations

### 2. **SMS Notification Service**
- Integrates with Twilio for SMS delivery
- Automatic notification when exam results are saved
- Graceful fallback to console logging in development mode
- Support for international phone numbers

### 3. **Notification Content**
SMS includes:
- Guardian's name (personalized greeting)
- Student's name
- Subject/Exam name
- Score breakdown (obtained/total)
- Percentage score
- Grade calculation (A+, A, B, C, D, F)
- Call to action to login

### 4. **Error Handling**
- Continues evaluation save even if SMS fails
- Logs notification errors without breaking the flow
- Development mode support (logs SMS to console)

## Setup Instructions

### Step 1: Twilio Account Setup

1. **Create Twilio Account** (Free Trial Available)
   - Visit: https://www.twilio.com/try-twilio
   - Sign up for a free account (includes trial credits)
   - Verify your email and phone number

2. **Get Credentials**
   - Login to Twilio Console
   - Navigate to Account Info section
   - Copy your:
     - Account SID
     - Auth Token
     - Twilio Phone Number (from Phone Numbers section)

3. **Configure Environment Variables**
   
   Update `server/.env` file:
   ```env
   # Twilio SMS Configuration
   TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   TWILIO_AUTH_TOKEN=your_auth_token_here
   TWILIO_PHONE_NUMBER=+1234567890
   ```

### Step 2: Update Guardian Registration

When creating/updating guardian accounts, ensure phone number is included:

```javascript
// Example guardian creation
{
  "name": "John Doe",
  "email": "john.doe@example.com",
  "phoneNumber": "+923001234567", // or "03001234567"
  "password": "securePassword123",
  "student": "studentObjectId"
}
```

### Step 3: Link Students to Guardians

Ensure students are properly linked to their guardians in the database:

```javascript
// Student document should have guardian reference
{
  "name": "Jane Doe",
  "email": "jane@student.edu",
  "rollNumber": "SP22-BSE-001",
  "guardian": "guardianObjectId" // Link to guardian
}
```

## Phone Number Format Support

The system accepts various phone number formats:

- **International**: `+923001234567`
- **National (Pakistan)**: `03001234567`
- **With spaces**: `+92 300 1234567`
- **With dashes**: `+92-300-1234567`

All formats are automatically normalized before sending.

## SMS Message Format

```
Dear [Guardian Name],

The exam result for [Student Name] has been uploaded.

Subject: [Subject Name]
Score: [Obtained]/[Total] ([Percentage]%)
Grade: [A+/A/B/C/D/F]

Login to view complete details.

SmartGrade System
```

## Development Mode

If Twilio credentials are not configured:
- System operates in "development mode"
- SMS messages are logged to console
- No actual SMS is sent
- Evaluation continues normally

Console output example:
```
📱 SMS Notification (Development Mode):
To: +923001234567
Message: Dear John Doe, The exam result for Jane Doe has been uploaded...
---
```

## Testing

### Test with Twilio Trial Account

1. **Trial Limitations**:
   - Can only send SMS to verified phone numbers
   - Add test phone numbers in Twilio Console → Phone Numbers → Verified Caller IDs

2. **Test Flow**:
   ```bash
   # 1. Start backend
   cd server
   npm start

   # 2. Teacher evaluates exam
   # 3. Click "Confirm & Save Evaluation"
   # 4. Check console for notification status
   # 5. Guardian receives SMS (if configured)
   ```

3. **Verify Notification**:
   - Check backend console for: `✓ Guardian notification sent successfully`
   - Check Twilio Console → Logs for delivery status
   - Guardian should receive SMS on registered number

## Cost Considerations

### Twilio Pricing (as of 2024)
- **Trial**: Free credits included (~$15)
- **SMS (Pakistan)**: ~$0.05 per SMS
- **SMS (USA)**: ~$0.0075 per SMS
- **Monthly Base**: Pay-as-you-go (no monthly fee)

### Cost Optimization
- Only send SMS for final evaluations (not drafts)
- Batch notifications for multiple results
- Use email notifications as alternative

## API Endpoints

### Save Evaluation with Notification
```http
POST /api/evaluate/save
Authorization: Bearer {token}
Content-Type: application/json

{
  "submissionId": "submissionObjectId",
  "evaluationData": {
    "mcqResults": [...],
    "shortQuestionResults": [...],
    "scoreSummary": {
      "totalObtained": 85,
      "totalMarks": 100
    }
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Evaluation results saved successfully",
  "resultId": "resultObjectId"
}
```

## Troubleshooting

### Issue: SMS not sending

**Check:**
1. Twilio credentials in `.env` file
2. Phone number format is correct
3. Guardian has phone number in database
4. Twilio account has sufficient balance
5. Backend console for error messages

**Solutions:**
- Verify credentials: Check Twilio Console
- Check phone number: Must be verified in trial mode
- Add credits: Top up Twilio account if needed

### Issue: "Guardian phone number not available"

**Check:**
1. Guardian document has `phoneNumber` field
2. Student is linked to guardian (`guardian` field populated)
3. Guardian reference is valid ObjectId

**Solutions:**
- Update guardian document with phone number
- Link student to guardian in database
- Run migration script if needed

### Issue: "Twilio credentials not found"

**Solutions:**
- Ensure `.env` file exists in `server/` directory
- Check environment variable names match exactly
- Restart server after updating `.env`

## Database Migration

If you have existing guardians without phone numbers:

```javascript
// Run this script in MongoDB shell or create a migration file
db.guardians.updateMany(
  { phoneNumber: { $exists: false } },
  { $set: { phoneNumber: "+923001234567" } } // Set a default or actual number
);
```

## Future Enhancements

Consider adding:
1. **Email Notifications**: Alternative to SMS
2. **Notification Preferences**: Let guardians choose SMS/Email/Both
3. **Custom Templates**: Allow schools to customize message format
4. **Notification History**: Track all sent notifications
5. **Failed Notification Retry**: Auto-retry failed SMS
6. **WhatsApp Integration**: Use WhatsApp Business API
7. **Push Notifications**: Mobile app notifications

## Security Considerations

1. **Credential Security**:
   - Never commit Twilio credentials to Git
   - Use environment variables only
   - Rotate credentials periodically

2. **Phone Number Privacy**:
   - Hash or encrypt phone numbers in logs
   - Implement access controls for guardian data
   - Comply with data protection regulations

3. **Rate Limiting**:
   - Prevent SMS spam/abuse
   - Implement cooldown periods
   - Monitor unusual activity

## Support

For issues or questions:
1. Check Twilio documentation: https://www.twilio.com/docs
2. Review backend console logs
3. Test in development mode first
4. Verify database relationships

## Summary

The SMS notification system provides:
- ✅ Automatic guardian notifications
- ✅ Professional SMS formatting
- ✅ International phone number support
- ✅ Development mode fallback
- ✅ Error handling and logging
- ✅ Easy Twilio integration
- ✅ Cost-effective solution

Guardians stay informed about their child's academic progress instantly, improving communication between school and home.
