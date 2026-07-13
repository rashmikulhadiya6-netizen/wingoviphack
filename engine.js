async function run24HourEngine() {
  const token = '8893431457:AAEPrWw1LfvvvZH5ObStCRlQHkrUKqbs_6A';
  const chatId = '@fxpredictionalltime';

  try {
    const pRes = await fetch('https://api.bdg88zf.com/api/webapi/GetGameIssue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ typeId: 1, language: 0, random: "e7", signature: "1F", timestamp: Math.floor(Date.now() / 1000) })
    });
    const pData = await pRes.json();
    const period = pData?.data?.issueNumber || "";
    if (!period) return;

    const hRes = await fetch('https://draw.ar-lottery01.com/WinGo/WinGo_1M/GetHistoryIssuePage.json?ts=' + Date.now());
    const hData = await hRes.json();
    const list = hData?.data?.list;
    if (!list) return;

    const countBig = [list[0].number, list[1].number, list[2].number].filter(n => parseInt(n) >= 5).length;
    const pred = (countBig >= 2) ? "Big" : "Small";
    const pool = (pred === "Big") ? [0,1,2,3,4] : [5,6,7,8,9];
    const opp1 = pool[Math.floor(Math.random() * pool.length)];
    const opp2 = pool[Math.floor(Math.random() * pool.length)];
    
    const report = `🔥 PROSPERLY AI PREMIUM REPORT 🔥\n━━━━━━━━━━━━━━━━━━━━━━━━\n📅 PERIOD    : #${period.slice(-3)}\n🎯 PREDICTION : ${pred}\n🎲 OPPOSITES : [ ${opp1}, ${opp2} ]\n━━━━━━━━━━━━━━━━━━━━━━━━\n📢 Auto-generated 24/7`;
    
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: report })
    });
    console.log("Prediction sent successfully!");
  } catch (e) {
    console.error("Error:", e);
  }
}

run24HourEngine();
