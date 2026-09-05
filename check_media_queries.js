const fs = require('fs');

const css = fs.readFileSync('public/styles.css', 'utf-8');

// Find all @media screen queries
const mediaMatches = css.match(/@media[^{]+\{/gi);
console.log('Media queries:', mediaMatches);
