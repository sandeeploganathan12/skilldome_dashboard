const fs = require('fs');

const css = fs.readFileSync('public/styles.css', 'utf-8');
const start = css.indexOf('@media screen and (max-width: 1100px)');
if (start !== -1) {
  console.log(css.substring(start, start + 1000));
}
