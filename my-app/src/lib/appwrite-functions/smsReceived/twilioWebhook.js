/**
 * Appwrite Function: Twilio SMS Webhook (store replies)
 * ESM + Appwrite context API
 */
import { Client, Databases, ID } from 'node-appwrite';

export default async function ({ req, res, log, error }) {
  try {
    // Twilio sends application/x-www-form-urlencoded
    const contentType = (req.headers?.['content-type'] || '').toLowerCase();
    if (!contentType.includes('application/x-www-form-urlencoded')) {
      return res.json({ error: 'Invalid content type' }, 400);
    }

    // Parse body (use req.bodyText per Appwrite docs)
    const params = new URLSearchParams(req.bodyText || '');

    const twilioData = {
      from: params.get('From'),
      to: params.get('To'),
      body: params.get('Body'),
      messageSid: params.get('MessageSid'),
      timestamp: new Date().toISOString(),
    };

    log?.(`Received SMS: ${JSON.stringify(twilioData)}`);

    // Init Appwrite client with env vars injected by Functions
    const client = new Client()
      .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT) // Appwrite Function Endpoint
      .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID) // Appwrite Project ID
      .setKey(process.env.APPWRITE_API_KEY); // Appwrite API Key

    const databases = new Databases(client);

    const databaseId = process.env.DATABASE_ID;
    const collectionId = process.env.RESPONSES_COLLECTION_ID;

    const normalizedResponse = (twilioData.body || '').trim().toUpperCase();

    await databases.createDocument(
      databaseId,
      collectionId,
      ID.unique(),
      {
        phone: twilioData.from,
        response: normalizedResponse,
        originalMessage: twilioData.body,
        messageSid: twilioData.messageSid,
        receivedAt: twilioData.timestamp,
        isAcknowledged: normalizedResponse === 'YES',
      }
    );

    // TwiML confirmation
    const twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>Thank you for your response.</Message>
</Response>`;

    return res.text(twimlResponse, 200, { 'Content-Type': 'text/xml' });
  } catch (err) {
    error?.(err);
    return res.json(
      {
        error: 'Failed to process webhook',
        details: err?.message || String(err),
      },
      500
    );
  }
}
