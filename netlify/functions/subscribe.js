require('dotenv').config();
const https = require('https');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch (error) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid request body' }) };
  }

  const { Fullname, email, password, confirmPassword } = body;


  if (!Fullname || !email || !password || !confirmPassword) {
    return { statusCode: 400, body: JSON.stringify({ error: 'All fields are required' }) };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid email address' }) };
  }

  if (password !== confirmPassword) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Passwords do not match' }) };
  }

  if (password.length < 6) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Password must be at least 6 characters long' }) };
  }

  const data = {
    members: [{
      email_address: email,
      status: 'subscribed',
      merge_fields: { FNAME: Fullname }
    }]
  };

  const jsonData = JSON.stringify(data);
  const url = 'https://us8.api.mailchimp.com/3.0/lists/4ddb448867';
  const options = {
    method: 'POST',
    auth: `brian:7a5eb9762e7f17d5ff41b33e23d824d0-us8`
  };

  return new Promise((resolve) => {
    const request = https.request(url, options, (response) => {
      let responseData = '';
      response.on('data', (chunk) => { responseData += chunk; });
      response.on('end', () => {
        try {
          const parsedData = JSON.parse(responseData);
          if (response.statusCode === 200 && parsedData.errors.length === 0) {
            resolve({
              statusCode: 200,
              body: JSON.stringify({ redirect: '/success.html' })
            });
          } else {
            const errorMessage = parsedData.errors && parsedData.errors[0] && parsedData.errors[0].error
              ? parsedData.errors[0].error
              : 'Failed to subscribe. Please try again.';
            resolve({
              statusCode: 400,
              body: JSON.stringify({ error: errorMessage, redirect: '/failure.html' })
            });
          }
        } catch (error) {
          resolve({
            statusCode: 500,
            body: JSON.stringify({ error: 'Server error processing response', redirect: '/failure.html' })
          });
        }
      });
    });

    request.on('error', () => {
      resolve({
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to connect to Mailchimp', redirect: '/failure.html' })
      });
    });

    request.write(jsonData);
    request.end();
  });
};