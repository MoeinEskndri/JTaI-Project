const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const fetch = require("node-fetch");
const cors = require("cors");

const app = express();
const PORT = 3000;
const API_KEY = "sk-81f25d7fe40c4b7fa79dd9126a23f29a";

app.use(cors());
app.use(bodyParser.json());
app.use(express.static("."));

// 🔁 حافظه موقت مکالمه (برای همه کاربران مشترک در این نسخه ساده)
let conversationHistory = [];

app.post("/ask", async (req, res) => {
  const userMessage = req.body.question || "";
  try {
    const prompt = fs.readFileSync("prompt.txt", "utf-8");
    const innoData = fs.readFileSync("inno_data.json", "utf-8");
    const productInfo = JSON.parse(innoData)
      .map(p => `📦 ${p.name}\n${p.description}\n${p.ingredients || ""}\n\n`)
      .join("\n");

    // اگر history خالیه، prompt و دیتا رو بذار اولش
    if (conversationHistory.length === 0) {
      conversationHistory.push({
        role: "system",
        content: prompt + "\n\n" + productInfo.slice(0, 8000)
      });
    }

    // اضافه کردن پیام کاربر
    conversationHistory.push({ role: "user", content: userMessage });

    // فقط آخرین 8 پیام رو نگه می‌داریم (برای سبک بودن)
    const recentMessages = conversationHistory.slice(-9);

    const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: recentMessages
      })
    });

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "متوجه نشدم، لطفاً سوال رو واضح‌تر بپرس 😊";

    // ذخیره پاسخ در history
    conversationHistory.push({ role: "assistant", content: reply });

    res.json({ answer: reply });
  } catch (err) {
    console.error(err);
    res.status(500).json({ answer: "❌ خطا در پردازش درخواست." });
  }
});

app.listen(PORT, () => {
  console.log(`✅ JTaI آماده‌ست روی http://localhost:${PORT}`);
});
