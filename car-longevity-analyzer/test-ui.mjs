import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1400, height: 900 }
  });
  const page = await browser.newPage();

  const scratchpad = 'C:/Users/Logan/AppData/Local/Temp/claude/D--Downloads-car-finder/0f3d19f3-6b0d-4f6a-8fe5-414023ebfd66/scratchpad';

  try {
    // Go to the app
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
    await page.waitForSelector('h1');
    console.log('Page loaded');

    // Take screenshot of initial state
    await page.screenshot({ path: `${scratchpad}/01-empty-state.png`, fullPage: true });
    console.log('Screenshot 1: Empty state');

    // Fill in the VIN in the textarea
    const textarea = await page.$('textarea');
    if (textarea) {
      await textarea.click();
      await textarea.type('1HGCM82633A004352');
      console.log('Entered VIN');
      await new Promise(r => setTimeout(r, 500));
    }

    // Fill mileage (first number input)
    const inputs = await page.$$('input[type="number"]');
    if (inputs.length >= 2) {
      await inputs[0].click();
      await inputs[0].type('85000');
      console.log('Entered mileage');

      await inputs[1].click();
      await inputs[1].type('12500');
      console.log('Entered price');
    }

    // Take screenshot before submit
    await page.screenshot({ path: `${scratchpad}/02-form-filled.png`, fullPage: true });
    console.log('Screenshot 2: Form filled');

    // Submit
    const submitButton = await page.$('button[type="submit"]');
    if (submitButton) {
      await submitButton.click();
      console.log('Submitted form');

      // Wait for results (longer wait for API)
      console.log('Waiting for results...');
      await new Promise(r => setTimeout(r, 15000));

      // Scroll to top
      await page.evaluate(() => window.scrollTo(0, 0));
      await new Promise(r => setTimeout(r, 500));

      // Take screenshot of results top
      await page.screenshot({ path: `${scratchpad}/03-results-top.png`, fullPage: true });
      console.log('Screenshot 3: Results top');

      // Scroll down to see more cards
      await page.evaluate(() => window.scrollTo(0, 800));
      await new Promise(r => setTimeout(r, 500));
      await page.screenshot({ path: `${scratchpad}/04-results-mid.png`, fullPage: true });
      console.log('Screenshot 4: Results mid');

      // Scroll more
      await page.evaluate(() => window.scrollTo(0, 1600));
      await new Promise(r => setTimeout(r, 500));
      await page.screenshot({ path: `${scratchpad}/05-results-lower.png`, fullPage: true });
      console.log('Screenshot 5: Results lower');

      // Scroll to bottom
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await new Promise(r => setTimeout(r, 500));
      await page.screenshot({ path: `${scratchpad}/06-results-bottom.png`, fullPage: true });
      console.log('Screenshot 6: Results bottom');
    }

    console.log('Test complete!');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
})();
