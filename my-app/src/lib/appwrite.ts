import { Client, Account } from 'appwrite';

export const client = new Client();

client
  .setEndpoint('https://fra.cloud.appwrite.io/v1')
  .setProject('69162129001603cdec51');

export const account = new Account(client);
export { ID } from 'appwrite';
