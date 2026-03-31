require('dotenv').config();
require('./src/services/firebase.service');
const admin = require('firebase-admin');

async function test() {
    try {
        const token = "dq9a9wcZBPmiUU2ti-IJ7f:APA91bEukbz2KAHOGIENvg9cKjc9yHRVuF0-4iK1BWQbboDiBu7Wzz8Is-Kk7T6AzEUX5dnpWDI8T8css2OFSGCp36xSfKkA7fMxyMaTgN35ucnOp3UJOEI";
        const response = await admin.messaging().sendEachForMulticast({
            tokens: [token],
            notification: { title: "Test", body: "Does this work?" }
        });
        console.log("SUCCESS:", response.responses[0].success);
        if (!response.responses[0].success) {
            console.log("Raw Firebase Error Code:", response.responses[0].error.code);
            console.log("Raw Firebase Error Message:", response.responses[0].error.message);
        }
    } catch(e) {
        console.error("Crash:", e);
    }
}
test();
