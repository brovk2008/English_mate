const fs = require('fs');
const path = require('path');

const planPath = path.join(__dirname, '..', 'IMPLEMENTATION_PLAN.md');
const planContent = fs.readFileSync(planPath, 'utf8');

// Find the JSON block starting with [ and ending with ] within code blocks
const jsonMatch = planContent.match(/```json\r?\n([\s\S]*?)```/);

if (!jsonMatch) {
  console.error("Could not find any JSON code block in IMPLEMENTATION_PLAN.md");
  process.exit(1);
}

const jsonText = jsonMatch[1].trim();

try {
  const curriculum = JSON.parse(jsonText);
  
  // Create data directory if it doesn't exist
  const dataDir = path.join(__dirname, '..', 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
  }

  const outputPath = path.join(dataDir, 'curriculum.json');
  fs.writeFileSync(outputPath, JSON.stringify(curriculum, null, 2), 'utf8');
  console.log(`Successfully parsed curriculum! Wrote ${curriculum.length} days to ${outputPath}`);
} catch (e) {
  console.error("Failed to parse JSON content: ", e.message);
  // Write to temp file for debugging
  fs.writeFileSync('temp_failed_parse.json', jsonText, 'utf8');
  console.log("Failed JSON content written to temp_failed_parse.json");
  process.exit(1);
}
