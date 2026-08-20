const fs = require('fs');

function patch(file) {
  if (!fs.existsSync(file)) return;
  let code = fs.readFileSync(file, 'utf8');
  
  // add useSearchGrounding to body destructuring
  code = code.replace(
    /const \{ keyword, audience, intent, tone, length, readingLevel \} = (.*);/,
    "const { keyword, audience, intent, tone, length, readingLevel, useSearchGrounding } = $1;"
  );
  
  // add tools inside config
  code = code.replace(
    /config: \{/,
    "config: {\n        tools: useSearchGrounding ? [{ googleSearch: {} }] : undefined,"
  );
  
  fs.writeFileSync(file, code);
}

patch('src/server/api.ts');
patch('api/generate.ts');
patch('app/api/generate/route.ts');
