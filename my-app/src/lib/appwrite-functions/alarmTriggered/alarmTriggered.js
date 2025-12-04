/**
 * Appwrite Function (Node.js) entry point
 * Sends an SMS via Twilio when triggered.
 */

import { URLSearchParams } from 'url';
import https from 'https';

const ORIGIN = 'https://alarm-dashboard.netlify.app/';

function corsHeaders(req) {
  // Echo requested headers if present to satisfy stricter preflights
  const requested = req?.headers?.['access-control-request-headers'];
  return {
    'Access-Control-Allow-Origin': ORIGIN,
    'Access-Control-Allow-Methods': 'POST',
    'Access-Control-Allow-Headers': requested || 'Content-Type, Authorization',
    'Access-Control-Max-Age': '600',
  };
}

export default async function ({ req, res, log, error }) {
  // 1) Handle preflight early.
  if (req.method === 'OPTIONS') {
    return res.send('', 204, corsHeaders(req));
  }

  // 2) Handle simple POST route (JSON "ok" or error) — keep CORS headers.
  if (req.method === 'POST') {
    try {
      return res.json({ ok: true }, 200, corsHeaders(req));
    } catch (e) {
      error?.(e);
      return res.json({ error: 'Internal Server Error' }, 500, corsHeaders(req));
    }
  }

  // 3) Default path: perform Twilio call (also CORS-protected).
  try {
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
        500,
        corsHeaders(req)
      );
    }

    // Parse overrides
    let overrides = {};
    if (req?.bodyJson && typeof req.bodyJson === 'object') {
      overrides = req.bodyJson;
    } else if (req?.bodyText) {
      try { overrides = JSON.parse(req.bodyText); } catch { /* ignore */ }
    } else if (req?.body) {
      try { overrides = JSON.parse(req.body); } catch { /* ignore */ }
    }

    const to = overrides.to ?? TWILIO_TO;
    const from = overrides.from ?? TWILIO_FROM;
    const body =
      overrides.body ??
      ALARM_MESSAGE ??
      "TEST: Alarm Triggered. Reply 'YES' to acknowledge you have read this message.";

    if (!to || !from) {
      return res.json(
        { error: 'Missing "to" or "from" number (env or request body).' },
        400,
        corsHeaders(req)
      );
    }

    // Build form-encoded payload
    const form = new URLSearchParams();
    form.append('To', to);
    form.append('From', from);
    form.append('Body', body);
    const payload = form.toString();

    // Twilio API endpoint and auth
    const path = `/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
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
      agent: new https.Agent({ keepAlive: true }),
    };

    const twilioResponse = await sendHttpsRequest(options, payload);

    if (twilioResponse.statusCode < 200 || twilioResponse.statusCode >= 300) {
      return res.json(
        {
          error: 'Twilio API call failed',
          statusCode: twilioResponse.statusCode,
          body: safeJsonParse(twilioResponse.body) ?? twilioResponse.body,
        },
        twilioResponse.statusCode,
        corsHeaders(req)
      );
    }

    // Success
    return res.json(
      {
        message: 'SMS sent successfully via Twilio.',
        twilio: safeJsonParse(twilioResponse.body) ?? twilioResponse.body,
      },
      200,
      corsHeaders(req)
    );
  } catch (err) {
    error?.(err);
    return res.json(
      {
        error: 'Unexpected error while sending SMS.',
        details: err?.message ?? String(err),
      },
      500,
      corsHeaders(req)
    );
  }
}

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

function safeJsonParse(str) {
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}
