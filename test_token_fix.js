// Test script to verify token activity fix
const axios = require('axios');

const testTokenActivity = async () => {
  try {
    console.log('Testing token activity endpoint...');
    
    const response = await axios.get('http://localhost:5000/api/B2icxTVZantkLrzZV69koG6bf9WAoEXpk1yrbwvMmoon/activity/hours/days/7');
    
    console.log('Response type:', response.data.type);
    console.log('Token address:', response.data.address);
    console.log('First datapoint:');
    console.log('- Transactions:', response.data.dataPoints[0].transactions);
    console.log('- Volume:', response.data.dataPoints[0].volume);
    console.log('- Token Name:', response.data.dataPoints[0].tokenName);
    console.log('- Token Address:', response.data.dataPoints[0].tokenAddress);
    
    if (response.data.dataPoints[0].transactionDetails) {
      console.log('Transaction details (first 2):');
      response.data.dataPoints[0].transactionDetails.slice(0, 2).forEach((tx, i) => {
        console.log(`  ${i+1}. ${tx.action} ${tx.token} by ${tx.trader} - ${tx.solAmount} SOL`);
      });
    }
    
    // Verify it's correctly identified as token
    if (response.data.type === 'token') {
      console.log('✅ SUCCESS: Token correctly identified as token type');
    } else {
      console.log('❌ FAILED: Still being identified as wallet');
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
};

testTokenActivity();