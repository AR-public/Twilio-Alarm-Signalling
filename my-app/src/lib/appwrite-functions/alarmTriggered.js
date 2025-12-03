import { Client, Functions } from "appwrite";

const client = new Client();

const functions = new Functions(client);

client
    .setProject('69162129001603cdec51') // Your project ID
;

// const promise = functions.createExecution({
//     functionId: '69308174001eacdbf343',
//     body: '<BODY>',  // optional
//     async: false,  // optional
//     xpath: '<PATH>',  // optional
//     method: 'GET',  // optional
//     headers: {} // optional
// });

// promise.then(function (response) {
//     console.log(response); // Success
// }, function (error) {
//     console.log(error); // Failure
// });

module.exports = async function (req, res) {
    // Log to Appwrite's function logs
    console.log("✅ Appwrite function has started successfully!");

    // You can also log environment variables for debugging
    console.log("Environment:", process.env);

    // Your function logic here
    res.json({
        message: "Function executed successfully!"
    });
};
