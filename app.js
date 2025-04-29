const express = require('express');
const bodyParser = require('body-parser');
const https = require('https');

const app = express();
const jsonParser = bodyParser.json();

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

app.post('/', (req, res) => {
    const fullName = req.body.Fullname;
    const email = req.body.email;
    const password = req.body.password;
    const confirmPassword = req.body.confirmPassword;

    const data = {
        members: [{
            email_address: email,
            status: "subscribed",
            merge_fields: {
                FNAME: fullName
            }
        }]
    };

    const jsonData = JSON.stringify(data);
    const url = "https://us8.api.mailchimp.com/3.0/lists/4ddb448867"; 
    const options = {
        method: "POST",
        auth: "brian:7a5eb9762e7f17d5ff41b33e23d824d0-us8"
    };

    const request = https.request(url, options, (response) => {
        let responseData = '';
        
        response.on("data", (chunk) => {
            responseData += chunk;
        });

        response.on("end", () => {
            console.log(JSON.parse(responseData));
            if (response.statusCode === 200) {
                res.sendFile(__dirname + '/success.html');
            } else {
                res.sendFile(__dirname + '/failure.html');
            }
        });
    });

    request.on("error", (error) => {
        console.error("Error:", error);
        res.sendFile(__dirname + '/failure.html');
    });

    request.write(jsonData);
    request.end();
});

app.post('/failure', (req, res) => {
    res.sendFile(__dirname + '/failure.html');
});

app.listen(process.env.PORT || 3000, () => {
    console.log('Server started on port 3000');
});