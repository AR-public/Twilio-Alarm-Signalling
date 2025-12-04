// BELOW WORKS FOR ALARM FUNCTION ONLY

import { Client, Functions } from 'appwrite';

// Initialise Appwrite client
const client = new Client();

client
  .setEndpoint('https://fra.cloud.appwrite.io/v1') // Appwrite endpoint
  .setProject('69162129001603cdec51'); // Appwrite project ID

// Initialise Functions service
export const functions = new Functions(client);

// Appwrite function ID
export const ALARM_FUNCTION_ID = '69308174001eacdbf343';
