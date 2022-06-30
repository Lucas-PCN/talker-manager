const fs = require('fs').promises;

const readFile = async () => {
  const file = await fs.readFile('./talker.json', 'utf-8');

  return JSON.parse(file);
};

module.exports = readFile;