/**
 * Appwrite Function to receive SMS responses from Twilio
 * Stores responses in-memory cache (resets on function restart)
 */

// In-memory storage (persists during function warm starts)
global.smsResponses = global.smsResponses || new Map();

module.exports = async function (req, res) {
  try {
    // Handle GET requests to retrieve responses
    if (req.method === 'GET') {
      const phone = req.query?.phone;
      
      if (phone) {
        const response = global.smsResponses.get(phone);
        return res.json({
          phone: phone,
          response: response || null,
        });
      }
      
      // Return all responses
      return res.json({
        responses: Array.from(global.smsResponses.entries()).map(([phone, data]) => ({
          phone,
          ...data,
        })),
      });
    }

    // Handle POST requests from Twilio webhook
    const contentType = req.headers['content-type'] || '';
    let twilioData = {};

    if (contentType.includes('application/x-www-form-urlencoded')) {
      const body = req.body || '';
      const params = new URLSearchParams(body);
      
      twilioData = {
        from: params.get('From'),
        to: params.get('To'),
        body: params.get('Body'),
        messageSid: params.get('MessageSid'),
        timestamp: new Date().toISOString(),
      };
    } else {
      return res.json({ error: 'Invalid content type' }, 400);
    }

    console.log('Received SMS:', twilioData);

    // Normalize the response
    const normalizedResponse = (twilioData.body || '').trim().toUpperCase();
    const isAcknowledged = normalizedResponse === 'YES';

    // Store in memory
    global.smsResponses.set(twilioData.from, {
      response: normalizedResponse,
      originalMessage: twilioData.body,
      isAcknowledged: isAcknowledged,
      timestamp: twilioData.timestamp,
      messageSid: twilioData.messageSid,
    });

    console.log(`✓ Stored response from ${twilioData.from}: ${normalizedResponse}`);

    // Respond to Twilio with TwiML
    const twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>Thank you for your response.</Message>
</Response>`;

    return res.send(twimlResponse, 200, {
      'Content-Type': 'text/xml',
    });

  } catch (err) {
    console.error('Webhook error:', err);
    return res.json(
      {
        error: 'Failed to process webhook',
        details: err?.message || String(err),
      },
      500
    );
  }
};