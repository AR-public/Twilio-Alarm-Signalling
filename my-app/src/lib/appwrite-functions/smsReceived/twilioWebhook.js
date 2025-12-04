/**
 * Appwrite Function to receive SMS responses from Twilio
 * This webhook receives incoming SMS and stores them in Appwrite Database
 */

import { Client, Databases } from 'node-appwrite';

export default async function (req, res) {
  try {
    // Parse Twilio's form-encoded webhook data
    const contentType = req.headers['content-type'] || '';
    let twilioData = {};

    if (contentType.includes('application/x-www-form-urlencoded')) {
      // Parse URL-encoded body
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

    // Initialise Appwrite client
    const client = new Client()
      .setEndpoint('https://fra.cloud.appwrite.io/v1')
      .setProject('69162129001603cdec51')
      .setKey(process.env.APPWRITE_API_KEY);

    const database = new Databases(client);

    // Store the response in Appwrite database
    const databaseId = process.env.DATABASE_ID;
    const collectionId = process.env.RESPONSES_COLLECTION_ID;

    // Normalize the response (convert to uppercase, trim)
    const normalizedResponse = (twilioData.body || '').trim().toUpperCase();

    await database.createDocument(
      databaseId,
      collectionId,
      'unique()', // Auto-generate ID
      {
        phone: twilioData.from,
        response: normalizedResponse,
        originalMessage: twilioData.body,
        messageSid: twilioData.messageSid,
        receivedAt: twilioData.timestamp,
        isAcknowledged: normalizedResponse === 'YES',
      }
    );

    // Respond to Twilio with TwiML (optional - sends confirmation SMS)
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