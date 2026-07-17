const BASE = 'http://localhost:4000';

async function main() {
  const results = [];

  // 1) Register
  let r = await fetch(`${BASE}/auth/register`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({email:'testuser@example.com', password:'TestPass123', firstName:'Test', lastName:'User', role:'INTERN'})
  });
  let data = await r.json();
  results.push(`1. POST /auth/register → ${r.status} ${JSON.stringify(data)}`);

  // save userId for later
  const userId = data.user?.id;
  results.push(`   userId = ${userId}`);

  // print results
  for (const line of results) console.log(line);
}

main().catch(e => console.error(e));