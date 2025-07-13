// Start the trading bot
const baseUrl = "https://45152da1-96ee-4672-b427-69702b128dff-00-2ydknlzrpib47.worf.replit.dev";

console.log("Starting trading bot...");

fetch(`${baseUrl}/api/monitoring/start`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
})
.then(response => response.json())
.then(data => {
  console.log("✅ Trading bot started:", data);
  
  // Check status
  return fetch(`${baseUrl}/api/status`);
})
.then(response => response.json())
.then(status => {
  console.log("📊 Current status:", status);
  console.log(`🔗 Solana connected: ${status.solana.connected}`);
  console.log(`📈 Monitoring active: ${status.monitoring}`);
  console.log(`💼 Active positions: ${status.activePositions}`);
})
.catch(error => {
  console.error("❌ Error:", error);
});