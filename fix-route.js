const fs = require('fs');
const file = 'src/app/api/auth/[...all]/route.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  /bootstrapCorsairCredentials\(\)\.catch\(console\.error\);\s*const { GET: _GET, POST } = toNextJsHandler\(auth\);\s*export { POST };/,
  `const { GET: _GET, POST: _POST } = toNextJsHandler(auth);\n\nexport async function POST(req: NextRequest) {\n  await bootstrapCorsairCredentials().catch(console.error);\n  return _POST(req);\n}`
);

code = code.replace(
  /export async function GET\(req: NextRequest\) \{\s*const url = new URL\(req\.url\);/,
  `export async function GET(req: NextRequest) {\n  await bootstrapCorsairCredentials().catch(console.error);\n\n  const url = new URL(req.url);`
);

fs.writeFileSync(file, code);
