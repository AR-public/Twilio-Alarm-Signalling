/**
 * Appwrite Function (Node.js) entry point
 * This function sends an SMS via Twilio when triggered.
 */

const { URLSearchParams } = require('url');
const https = require('https');

module.exports = async function (req, res) {
  try {
    // Load defaults from environment variables
    const {
      TWILIO_ACCOUNT_SID,
      TWILIO_AUTH_TOKEN,
      TWILIO_TO,
      TWILIO_FROM
    } = process.env;

    const ALARM_MESSAGE = "Alarm Triggered. Reply 'YES' to acknowledge you have read this message.";

    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
      return res.json(
        { error: 'Missing Twilio credentials in environment variables.' },
        500
      );
    }

    // Allow runtime overrides via request body (JSON)
    let overrides = {};
    try {
      if (req.body) {
        overrides = JSON.parse(req.body);
      }
    } catch (parseErr) {
      // Ignore parse errors; continue with env defaults
    }

    const to = overrides.to || TWILIO_TO;
    const from = overrides.from || TWILIO_FROM;
    const body =
      overrides.body ||
      ALARM_MESSAGE ||
      "TEST: Alarm Triggered. Reply 'YES' to acknowledge you have read this message.";

    if (!to || !from) {
      return res.json(
        { error: 'Missing "to" or "from" number (env or request body).' },
        400
      );
    }

    // Build form-encoded payload
    const form = new URLSearchParams();
    form.append('To', to);
    form.append('From', from);
    form.append('Body', body);
    const payload = form.toString();

    // Twilio API endpoint
    const path = `/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;

    // Basic Auth header
    const basicAuth = Buffer.from(
      `${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`
    ).toString('base64');

    const options = {
      method: 'POST',
      hostname: 'api.twilio.com',
      port: 443,
      path,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(payload),
        Authorization: `Basic ${basicAuth}`,
      },
      // Keep-alive agent to be friendly in serverless contexts
      agent: new https.Agent({ keepAlive: true }),
    };

    const twilioResponse = await sendHttpsRequest(options, payload);

    // If Twilio returns an error (non-2xx), propagate it
    if (twilioResponse.statusCode < 200 || twilioResponse.statusCode >= 300) {
      return res.json(
        {
          error: 'Twilio API call failed',
          statusCode: twilioResponse.statusCode,
          body: safeJsonParse(twilioResponse.body) || twilioResponse.body,
        },
        twilioResponse.statusCode
      );
    }

    // Success
    return res.json(
      {
        message: 'SMS sent successfully via Twilio.',
        twilio: safeJsonParse(twilioResponse.body) || twilioResponse.body,
      },
      200
    );
  } catch (err) {
    // Unexpected failure
    return res.json(
      {
        error: 'Unexpected error while sending SMS.',
        details: err?.message || String(err),
      },
      500
    );
  }
};

/**
 * Helper: Perform HTTPS request and return { statusCode, headers, body }
 */
function sendHttpsRequest(options, payload) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (resp) => {
      let data = '';
      resp.on('data', (chunk) => (data += chunk));
      resp.on('end', () =>
        resolve({
          statusCode: resp.statusCode,
          headers: resp.headers,
          body: data,
        })
      );
    });

    req.on('error', (e) => reject(e));
    req.write(payload);
    req.end();
  });
}

/**
 * Helper: Parse JSON safely
 */
function safeJsonParse(str) {
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}