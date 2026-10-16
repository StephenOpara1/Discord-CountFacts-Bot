
const fs = require('node:fs/promises');
const path = require('node:path');
const { createFactCard } = require('./factCard');

async function main() {
  const number = 187;

  const fact =
    'Hi';

  const username = 'Quaternnion';

  const image = await createFactCard(number, fact, username);

  const outputPath = path.join(__dirname, 'test-fact-card.png');

  await fs.writeFile(outputPath, image);

  console.log(`Image saved to: ${outputPath}`);
}

main().catch(console.error);
