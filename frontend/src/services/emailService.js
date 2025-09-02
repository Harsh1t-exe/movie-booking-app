import emailjs from '@emailjs/browser';

// EmailJS configuration
const EMAILJS_CONFIG = {
  SERVICE_ID: 'service_uvuw6hs', // You'll need to replace this with your EmailJS service ID
  TEMPLATE_ID: 'template_t710ppv', // You'll need to replace this with your EmailJS template ID
  PUBLIC_KEY: 'o8H81S-RCcNLfNHp0' // You'll need to replace this with your EmailJS public key
};

// Initialize EmailJS
emailjs.init(EMAILJS_CONFIG.PUBLIC_KEY);

export const sendBookingConfirmation = async (bookingData) => {
  try {
    console.log('📧 Sending booking confirmation email...');
    
    // Prepare template parameters
    const templateParams = {
      to_email: bookingData.email,
      to_name: bookingData.name,
      movie_title: bookingData.movieTitle,
      theatre_name: bookingData.theatreName,
      theatre_location: bookingData.theatreLocation,
      show_date: new Date(bookingData.showDate).toLocaleDateString('en-GB', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      show_time: bookingData.showTime,
      selected_seats: bookingData.selectedSeats.join(', '),
      total_seats: bookingData.selectedSeats.length,
      booking_id: bookingData.bookingId,
      total_amount: bookingData.totalAmount,
      booking_date: new Date().toLocaleDateString('en-GB'),
      booking_time: new Date().toLocaleTimeString('en-GB')
    };

    console.log('📧 Template params:', templateParams);

    // Send email using EmailJS
    const response = await emailjs.send(
      EMAILJS_CONFIG.SERVICE_ID,
      EMAILJS_CONFIG.TEMPLATE_ID,
      templateParams
    );

    console.log('✅ Email sent successfully:', response);
    return {
      success: true,
      message: 'Booking confirmation email sent successfully!',
      messageId: response.text
    };

  } catch (error) {
    console.error('❌ Failed to send email:', error);
    return {
      success: false,
      message: 'Failed to send confirmation email. Please save your booking details.',
      error: error.message
    };
  }
};

// Mock email service for demonstration (when EmailJS is not configured)
export const sendMockEmail = (bookingData) => {
  console.log('📧 Mock Email Service - Booking Confirmation');
  console.log('='.repeat(50));
  console.log('📧 To:', bookingData.email);
  console.log('👤 Name:', bookingData.name);
  console.log('🎬 Movie:', bookingData.movieTitle);
  console.log('🏛️ Theatre:', bookingData.theatreName, '-', bookingData.theatreLocation);
  console.log('📅 Date:', bookingData.showDate);
  console.log('🕐 Time:', bookingData.showTime);
  console.log('💺 Seats:', bookingData.selectedSeats.join(', '));
  console.log('🎫 Booking ID:', bookingData.bookingId);
  console.log('💰 Total Amount: ₹' + bookingData.totalAmount);
  console.log('='.repeat(50));
  
  return {
    success: true,
    message: 'Mock email logged to console. Check browser console to see email content.',
    messageId: 'mock_' + Date.now()
  };
};

// Email template for reference (to create in EmailJS dashboard)
export const EMAIL_TEMPLATE_REFERENCE = `
Subject: 🎬 Your Movie Tickets - Booking Confirmed

Dear {{to_name}},

Great news! Your movie booking is confirmed! 🎉

🎬 BOOKING DETAILS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎭 Movie: {{movie_title}}
🏛️ Theatre: {{theatre_name}}
📍 Location: {{theatre_location}}
📅 Date: {{show_date}}
🕐 Show Time: {{show_time}}
💺 Seats: {{selected_seats}} ({{total_seats}} seats)
🎫 Booking ID: {{booking_id}}
💰 Total Amount: ₹{{total_amount}}

📝 Booked on: {{booking_date}} at {{booking_time}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📱 IMPORTANT INSTRUCTIONS:
• Please arrive 15 minutes before showtime
• Carry a valid ID proof
• Show this email at the theatre entrance
• No outside food allowed

🍿 Thank you for choosing CineBook!

Enjoy your movie! 🎬✨

Best regards,
CineBook Team
`;
