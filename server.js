// server.js
import express from 'express';
import puppeteer from 'puppeteer';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

app.post('/capture', async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).send('Missing URL');
  }

  try {
    const browser = await puppeteer.launch({
      headless: "new",
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    // Desktop mode
    await page.setViewport({ width: 1280, height: 800 });

    await page.goto(url, { waitUntil: 'networkidle2', timeout: 0 });

    // 🔥 Auto-scroll to load lazy content
    await autoScroll(page);

    // 🔥 Remove sticky elements
    await page.evaluate(() => {
      document.querySelectorAll('*').forEach(el => {
        const style = window.getComputedStyle(el);
        if (style.position === 'sticky' || style.position === 'fixed') {
          el.style.position = 'absolute';
        }
      });
    });

    const screenshot = await page.screenshot({
      fullPage: true,
      type: 'png'
    });

    await browser.close();

    res.set('Content-Type', 'image/png');
    res.send(screenshot);

  } catch (err) {
    console.error(err);
    res.status(500).send('Capture failed');
  }
});

async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let totalHeight = 0;
      const distance = 800;

      const timer = setInterval(() => {
        window.scrollBy(0, distance);
        totalHeight += distance;

        if (totalHeight >= document.body.scrollHeight) {
          clearInterval(timer);
          window.scrollTo(0, 0);
          resolve();
        }
      }, 200);
    });
  });
}

app.listen(3000, () => {
  console.log('🚀 Server running on http://localhost:3000');
});
