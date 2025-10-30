/**
 * Example of how to use the Create Order API
 * 
 * This file demonstrates how to make a request to the create order endpoint.
 */

// Using fetch for browser environments or node-fetch for Node.js
// For Node.js: const fetch = require('node-fetch');

// Example function to create an order
async function createOrder() {
  try {
    // Replace with your actual API base URL
    const apiUrl = 'http://localhost:3000/order/create';
    
    // Replace with your actual authentication token
    const authToken = 'your-auth-token';
    
    // Example request payload
    const requestData = {
      cart_item_ids: '1,2,3', // Comma-separated list of cart item IDs
      display_type: 'ALL',    // Display type (ALL, MOBILE, WEB, etc.)
      whatsapp: 'Y',          // Whether to send WhatsApp notifications
      utm_source: 'website'   // UTM source for tracking
    };
    
    // Make the API request
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(requestData)
    });
    
    // Parse the response
    const result = await response.json();
    
    if (result.status) {
      console.log('Order created successfully!');
      console.log('Order ID:', result.data.order_id);
      console.log('Order GUID:', result.data.order_guid);
      console.log('Total Amount:', result.data.total_amount);
      console.log('Cash Spent:', result.data.cash_spent);
    } else {
      console.error('Failed to create order:', result.message);
    }
    
    return result;
  } catch (error) {
    console.error('Error creating order:', error.message);
    throw error;
  }
}

// Example usage with async/await
// (async () => {
//   try {
//     const result = await createOrder();
//     console.log(result);
//   } catch (error) {
//     console.error('Error in example:', error);
//   }
// })();

// Example usage with promises
// createOrder()
//   .then(result => console.log(result))
//   .catch(error => console.error('Error in example:', error));

module.exports = { createOrder };