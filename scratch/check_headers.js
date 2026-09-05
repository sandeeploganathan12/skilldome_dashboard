async function checkHeaders() {
  const res1 = await fetch('http://localhost:5000/');
  console.log('GET / status:', res1.status);
  for (const [k, v] of res1.headers.entries()) {
    console.log(`  ${k}: ${v}`);
  }

  const res2 = await fetch('http://localhost:5000/styles.css?v=16.0');
  console.log('GET /styles.css?v=16.0 status:', res2.status);
  for (const [k, v] of res2.headers.entries()) {
    console.log(`  ${k}: ${v}`);
  }
}
checkHeaders();
