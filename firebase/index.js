const firebase = require("firebase-admin");
const serviceAccount = require("./sincelotFirebaseKey.json");

firebase.initializeApp({
    credential: firebase.credential.cert(serviceAccount)
});

module.exports = {firebase}


