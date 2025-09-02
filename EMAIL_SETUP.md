# Email Integration Setup

This project includes email confirmation functionality using EmailJS for booking confirmations.

## Current Configuration

The application currently uses **mock email service** which logs email content to the browser console. This allows testing without external dependencies.

## Setting Up Real Email Service

To enable actual email sending, follow these steps:

### 1. Create EmailJS Account
1. Visit [EmailJS.com](https://www.emailjs.com/) and create a free account
2. Create a new email service (Gmail recommended)
3. Note your Service ID

### 2. Create Email Template
Create a new template in EmailJS dashboard with these variables:
- `{{to_name}}` - Recipient name
- `{{movie_title}}` - Movie name
- `{{theatre_name}}` - Theatre name
- `{{theatre_location}}` - Theatre location
- `{{show_date}}` - Show date
- `{{show_time}}` - Show time
- `{{selected_seats}}` - Seat numbers
- `{{total_seats}}` - Number of seats
- `{{booking_id}}` - Booking reference
- `{{total_amount}}` - Total price
- `{{booking_date}}` - Booking date
- `{{booking_time}}` - Booking time

### 3. Update Configuration
1. Open `frontend/src/services/emailService.js`
2. Replace the configuration values:

```javascript
const EMAILJS_CONFIG = {
  SERVICE_ID: 'your_service_id',
  TEMPLATE_ID: 'your_template_id',
  PUBLIC_KEY: 'your_public_key'
};
```

### 4. Enable Real Email Sending
In `frontend/src/components/SeatSelection.js`, change:
```javascript
// From:
const emailResult = await sendMockEmail(emailData);

// To:
const emailResult = await sendBookingConfirmation(emailData);
```

## Testing

### Mock Email (Current):
- Email content logged to browser console
- No external dependencies
- Immediate testing capability

### Real Email (After Setup):
- Actual emails sent to users
- EmailJS dashboard tracking
- Professional email templates

## Email Template Structure

The booking confirmation email includes:
- Movie and theatre details
- Show date and time
- Selected seats
- Booking reference
- Total amount
- Arrival instructions

## Troubleshooting

Common setup issues:
- Verify Service ID, Template ID, and Public Key
- Check EmailJS dashboard for send logs
- Ensure template variables match code implementation
- Test with your own email address first

---

**Current Status:** Mock email service active  
**Setup Time:** ~5 minutes to enable real emails

