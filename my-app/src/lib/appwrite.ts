// BELOW WORKS FOR ALARM FUNCTION ONLY

// import { Client, Functions } from 'appwrite';

// // Initialise Appwrite client
// const client = new Client();

// client
//   .setEndpoint('https://fra.cloud.appwrite.io/v1') // Appwrite endpoint
//   .setProject('69162129001603cdec51'); // Appwrite project ID

// // Initialise Functions service
// export const functions = new Functions(client);

// // Appwrite function ID
// export const ALARM_FUNCTION_ID = '69308174001eacdbf343';

// BELOW INCLUDES WEBHOOK FUNCTION FOR SMS RESPONSE CHECKING
import { Client, Functions } from 'appwrite';

// Initialise Appwrite client
const client = new Client();

client
  .setEndpoint('https://fra.cloud.appwrite.io/v1') // Appwrite endpoint
  .setProject('69162129001603cdec51'); // Appwrite project ID

// Initialise Functions service
export const functions = new Functions(client);

// Function IDs from Appwrite
export const ALARM_FUNCTION_ID = '69308174001eacdbf343';
export const WEBHOOK_FUNCTION_ID = '69317565001a895ba191';

// Helper function to check for SMS response
export async function checkSmsResponse(phone: string) {
  try {
    const response = await fetch(`69317565002845ab1e96.fra.appwrite.run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Appwrite-Project': '69162129001603cdec51',
      },
      body: JSON.stringify({
        method: 'GET',
        path: `/?phone=${encodeURIComponent(phone)}`,
      }),
    });

    const execution = await response.json();

    // Parse the response body
    if (execution.responseBody) {
      const data = JSON.parse(execution.responseBody);
      return data.response;
    }

    return null;
  } catch (error) {
    console.error('Error checking SMS response:', error);
    return null;
  }
}
