// Quick check for Momentum Trader activity today
const momentumTraderWallet = "BHREKJGvPJJJdHZMBTGj9pCBMSS8cTyVw9fXvJQYG2AtX";
const apiUrl = `https://45152da1-96ee-4672-b427-69702b128dff-00-2ydknlzrpib47.worf.replit.dev/api/${momentumTraderWallet}/activity/ALL/days/1`;

console.log("Checking Momentum Trader activity for today...");
console.log("API URL:", apiUrl);
console.log("Copy this URL into your browser or Postman to check for today's trades");

// This can be run in browser console
fetch(apiUrl)
  .then(response => response.json())
  .then(data => {
    console.log("Momentum Trader Activity Today:");
    
    const todayActivity = data.dataPoints.filter(point => point.transactions > 0);
    
    if (todayActivity.length === 0) {
      console.log("❌ No trading activity detected today");
    } else {
      console.log(`✅ Found ${todayActivity.length} active periods today`);
      
      todayActivity.forEach(period => {
        console.log(`🕐 ${period.timestamp}`);
        console.log(`📊 ${period.transactions} transactions`);
        console.log(`💰 Volume: $${period.volume}`);
        console.log(`📈 P&L: $${period.profitLoss}`);
        console.log("---");
      });
    }
  })
  .catch(error => {
    console.error("Error fetching data:", error);
  });