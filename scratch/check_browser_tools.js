try {
  require('puppeteer');
  console.log('puppeteer is available');
} catch (e) {
  console.log('puppeteer not installed');
}
try {
  require('playwright');
  console.log('playwright is available');
} catch (e) {
  console.log('playwright not installed');
}
