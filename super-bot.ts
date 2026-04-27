import axios from 'axios';

async function fetchAllData() {
  console.log("🕵️เริ่มปฏิบัติการดึงข้อมูล Supply Chain เชิงลึก...");

  // 1. ดึงข้อมูลอัตราแลกเปลี่ยน (ธนาคารแห่งประเทศไทย ผ่าน ExchangeRate.host หรือเทียบเท่า)
  const fxData = await axios.get('https://api.exchangerate.host/live?access_key=YOUR_KEY_IF_NEEDED&symbols=USD,CNY,EUR,IDR&base=THB').catch(() => ({data: "N/A"}));

  // 2. ดึงราคาพลังงาน (Brent Oil) ผ่าน Yahoo Finance (API ฟรี)
  const oilData = await axios.get('https://query1.finance.yahoo.com/v8/finance/chart/BZ=F?interval=1d&range=1d').catch(() => ({data: "N/A"}));

  // 3. ดึงข่าวภูมิรัฐศาสตร์จาก GDELT 2.0 (ดึงเหตุการณ์ล่าสุดที่เกี่ยวกับ Supply Chain)
  const gdeltNews = await axios.get('https://api.gdeltproject.org/api/v2/context/context?format=json&query=supply%20chain%20shipping&mode=artlist').catch(() => ({data: "N/A"}));

  // 4. ดึงดัชนีค่าระวางเรือ (Drewry/Freightos) - ใช้การจำลอง Data ล่าสุดหาก API เข้าถึงยาก
  const freightNews = await axios.get('https://newsapi.org/v2/everything?q=shipping+freight+index&pageSize=3&apiKey=YOUR_NEWSAPI_KEY').catch(() => ({data: "N/A"}));

  // 5. ดึงข้อมูลพายุและสภาพอากาศโลก (NOAA/OpenWeather)
  const weatherAlerts = await axios.get('https://api.openweathermap.org/data/2.5/weather?q=Bangkok&appid=YOUR_FREE_KEY').catch(() => ({data: "N/A"}));

  return {
    fx: fxData.data,
    oil: oilData.data,
    geopolitics: gdeltNews.data,
    freight: freightNews.data,
    weather: weatherAlerts.data,
    timestamp: new Date().toISOString()
  };
}

async function runSuperBot() {
  const rawData = await fetchAllData();

  const prompt = `
  คุณคือ "Elite Supply Chain & Geopolitical Intelligence Analyst" 
  จงวิเคราะห์ข้อมูลดิบต่อไปนี้อย่างละเอียดจัดเต็ม:
  
  DATA: ${JSON.stringify(rawData)}

  ข้อกำหนดการเอาท์พุต (ภาษาไทย):
  แบ่งเป็น 2 ส่วนคั่นด้วย ===SPLIT===

  SECTION 1: Website Deep-Dive (สำหรับผู้บริหารและฝ่ายจัดซื้อ)
  - # หัวข้อข่าวอัจฉริยะประจำวันนี้
  - ## Executive Summary: ภาพรวมโลกใน 1 ย่อหน้า
  - ## Financial & Macro: วิเคราะห์ค่าเงิน THB/USD/CNY และราคาน้ำมัน Brent ส่งผลต่อ TCO อย่างไร
  - ## Maritime & Logistics: เจาะลึกค่าระวางเรือและจุดเสี่ยง (Red Sea, Suez, Port Congestion)
  - ## Strategic Advice: คำแนะนำเชิงกลยุทธ์ (เช่น ควรปิดความเสี่ยง FX หรือเปลี่ยน Incoterms)

  ===SPLIT===

  SECTION 2: WhatsApp/Line Alert (สรุปสั้น แรง กระชับ)
  - 🚨 [ประเด็นที่เสี่ยงที่สุดวันนี้]
  - 🚢 [อัปเดตโลจิสติกส์]
  - 💡 [สิ่งที่ต้องทำทันที]
  `;

  try {
    const aiRes = await axios.post(
      'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
      {
        model: "gemini-1.5-flash",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 4000 // จัดหนักจัดเต็ม
      },
      { headers: { 'Authorization': `Bearer ${process.env.AI_INTEGRATIONS_OPENAI_API_KEY}` } }
    );

    const result = aiRes.data.choices[0].message.content;

    // ส่งเข้า Telegram
    await axios.post(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      chat_id: process.env.TELEGRAM_CHAT_ID,
      text: result,
      parse_mode: 'Markdown'
    });

    console.log("✅ ภารกิจสำเร็จ! ข้อมูลถูกส่งเข้า Telegram แล้ว");
  } catch (err) {
    console.error("❌ พลาดที่ขั้นตอน AI:", err.message);
  }
}

runSuperBot();
