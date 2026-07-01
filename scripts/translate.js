const fs = require('fs');
const path = require('path');

const vocabPath = path.join(__dirname, '..', 'data', 'vocab.json');
const vocab = JSON.parse(fs.readFileSync(vocabPath, 'utf8'));

async function translateText(text) {
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=ja&dt=t&q=${encodeURIComponent(text)}`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (data && data[0] && data[0][0] && data[0][0][0]) {
      return data[0][0][0];
    }
  } catch (err) {
    console.error(`Failed to translate: ${text}`, err);
  }
  return text;
}

async function run() {
  console.log(`Starting translation of ${vocab.length} words...`);
  
  for (let i = 0; i < vocab.length; i++) {
    const item = vocab[i];
    if (!item.meaning_ja) {
      item.meaning_ja = await translateText(item.meaning);
      console.log(`[${i+1}/${vocab.length}] Translated "${item.word}" -> "${item.meaning_ja}"`);
      // Sleep slightly to prevent rate limits
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  fs.writeFileSync(vocabPath, JSON.stringify(vocab, null, 2), 'utf8');
  console.log('Saved updated vocab.json successfully!');
}

run();
