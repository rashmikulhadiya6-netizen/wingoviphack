// 📡 GAME API & REQUEST CONFIGURATION
const CURRENT_API = 'https://api.bdg88zf.com/api/webapi/GetGameIssue';
const HISTORY_API = 'https://draw.ar-lottery01.com/WinGo/WinGo_1M/GetHistoryIssuePage.json';
const REQUEST_DATA = { 
  typeId: 1, 
  language: 0, 
  random: "e7fe6c090da2495ab8290dac551ef1ed", 
  signature: "1F390E2B2D8A55D693E57FD905AE73A7" 
};

// 🤖 TELEGRAM PIPELINE SETTINGS
const BOT_TOKEN = '8893431457:AAEPrWw1LfvvvZH5ObStCRlQHkrUKqbs_6A';
const CHAT_ID = '@fxpredictionalltime';

// Global Memory State Variables
let predictionHistory = [];
let lastHistoryHash = '';
let currentPeriodGlobal = '';
let currentPredictedSizeGlobal = '';
let currentOppositesGlobal = [];

function getBigSmall(num) { 
  return num >= 5 ? "Big" : "Small"; 
}

// 🎯 HEDGING POOL MATRIX: Prediction ka safe counter target select karta hai
function getOppositeNumbers(size) {
  const pool = size === "Big" ? [0, 1, 2, 3, 4] : [5, 6, 7, 8, 9];
  let numbers = [];
  while(numbers.length < 2) {
    const number = pool[Math.floor(Math.random() * pool.length)];
    if (!numbers.includes(number)) numbers.push(number);
  }
  return numbers.sort((a, b) => a - b);
}

// Trend calculation engine based on last 3 outcomes
function getPrediction(history) {
  if(!history || history.length < 3) return { text: "**Small**", predictedSize: "Small", opposites: [6, 8] };
  const last3Sizes = history.slice(0, 3).map(item => getBigSmall(item.number));
  const sizeCounts = {};
  for (const size of last3Sizes) { sizeCounts[size] = (sizeCounts[size] || 0) + 1; }
  
  let predictedSize = null, maxCount = 0;
  for (const size in sizeCounts) { 
    if (sizeCounts[size] > maxCount) { 
      maxCount = sizeCounts[size]; 
      predictedSize = size; 
    } 
  }
  const oppositeNumbers = getOppositeNumbers(predictedSize);
  return { text: `**${predictedSize}**`, predictedSize: predictedSize, opposites: oppositeNumbers };
}

// Sends standalone execution signal alerts to Telegram
async function sendToTelegram(msgText) {
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage?chat_id=${CHAT_ID}&text=${encodeURIComponent(msgText)}`;
  try {
    await fetch(url);
  } catch (e) {
    console.error("❌ Telegram transmission failed:", e.message);
  }
}

// Compiles detailed history matrix overview payload
function generateTelegramReportMessage(activePeriod, predSize, oppositesArray) {
  let baseMsg = `🔥 PROSPERLY AI PREMIUM REPORT 🔥\n━━━━━━━━━━━━━━━━━━━━━━━━\n📅 PERIOD    : #${activePeriod.slice(-3)}\n🎯 PREDICTION : ${predSize}\n🎲 OPPOSITES : [ ${oppositesArray.join(", ")} ]\n━━━━━━━━━━━━━━━━━━━━━━━━\n\n📊 RECENT HISTORY TRENDS:\n`;
  
  let settledHistory = predictionHistory.filter(h => h.status !== "Pending").slice(0, 8);
  
  if (settledHistory.length > 0) {
    settledHistory.forEach(h => {
      let tag = h.status === "JK" ? `🔥 JK (NUM ${h.actualNum} WIN)` : h.status === "Win" ? `✅ WIN` : `❌ LOSS`;
      baseMsg += `• Period ${h.period.slice(-3)} ➔ ${tag}\n`;
    });
  } else {
    baseMsg += `• System initializing trends...\n`;
  }
  
  baseMsg += `━━━━━━━━━━━━━━━━━━━━━━━━\n📢 Auto-generated via Prosperly Neural Node`;
  return baseMsg;
}

// Main execution process loop engine
async function fetchData() {
  try {
    // 1. Fetch current live structural period
    const periodRes = await fetch(CURRENT_API, { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify({ ...REQUEST_DATA, timestamp: Math.floor(Date.now() / 1000) }) 
    });
    const periodData = await periodRes.json(); 
    const period = periodData?.data?.issueNumber || periodData?.issueNumber || "Unavailable";
    
    if (period === "Unavailable") return;
    
    if (period !== currentPeriodGlobal) {
      currentPeriodGlobal = period;
      console.log(`\n=======================================\n🔄 Period changed! Current Live Period: ${period.slice(-3)}`);
    }

    // 2. Fetch history records logs
    const res = await fetch(HISTORY_API + '?ts=' + Date.now()); 
    const data = await res.json();
    const listData = data?.data?.list || data?.list || [];
    if (listData.length === 0) return;
    
    const newResults = listData.slice(0, 100).map(item => ({ period: item.issueNumber, number: parseInt(item.number) }));
    const newHash = newResults.map(item => item.period + item.number).join(','); 

    let historyUpdated = false;
    
    // 3. Evaluate pending predictions in memory backlog logs
    predictionHistory.forEach(async (ph) => {
      if (ph.status === "Pending") {
        const match = newResults.find(h => h.period === ph.period);
        if (match) {
          ph.actual = getBigSmall(match.number); 
          ph.actualNum = match.number;
          
          // Cross hedging safeguard verification matrix check
          let isWin = false;
          if (ph.predictedSize === "Small" && match.number <= 4) isWin = true;
          else if (ph.predictedSize === "Big" && match.number >= 5) isWin = true;
          
          if (ph.opposites.includes(match.number)) {
            ph.status = "JK"; 
          } else {
            ph.status = isWin ? "Win" : "Loss";
          }
          
          historyUpdated = true;
          console.log(`✅ Period ${ph.period.slice(-3)} Settled. Result: ${ph.actual} (${ph.actualNum}) | Status: ${ph.status}`);
          
          // Transmit standalone quick status report directly
          if (ph.status === "Win" || ph.status === "JK") {
            await sendToTelegram("Win ❤️");
          } else {
            await sendToTelegram("Loss 👍");
          }
        }
      }
    });

    // 4. Calculate and dispatch upcoming period pipeline forecasts
    const nextPeriodString = (BigInt(newResults[0].period) + 1n).toString();
    const existingPrediction = predictionHistory.find(ph => ph.period === nextPeriodString);
    
    if (!existingPrediction) {
      const predObj = getPrediction(newResults);
      
      predictionHistory.unshift({
        period: nextPeriodString,
        prediction: predObj.text,
        predictedSize: predObj.predictedSize,
        opposites: predObj.opposites,
        actual: "--",
        actualNum: "--",
        status: "Pending"
      });
      
      currentPredictedSizeGlobal = predObj.predictedSize;
      currentOppositesGlobal = predObj.opposites;
      
      console.log(`🎯 New Forecast Generated for Period ${nextPeriodString.slice(-3)}: ${predObj.predictedSize.toUpperCase()} | Targets: ${predObj.opposites.join(", ")}`);
      
      // Dispatch premium card layout matrix overview details directly to chat channel
      const reportMsg = generateTelegramReportMessage(nextPeriodString, predObj.predictedSize.toUpperCase(), predObj.opposites);
      await sendToTelegram(reportMsg);
      
      historyUpdated = true;
    }
    
    if (newHash !== lastHistoryHash || historyUpdated) {
      lastHistoryHash = newHash;
    }
  } catch (err) {
    console.error("⚠️ System polling hold sync trace: ", err.message);
  }
}

// Engine execution kickstarter context
function startServerEngine() {
  console.log("🚀 Prosperly AI Neural Core Server successfully initiated...");
  fetchData();
  // Poll data loops smoothly every 4 seconds
  setInterval(fetchData, 4000);
}

startServerEngine();
