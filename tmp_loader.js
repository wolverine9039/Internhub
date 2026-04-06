const fs = require('fs');
const path = require('path');
const dir = 'd:/MCA/accoclite/Internhub/frontend/src/components';

const newLoader = `      <div className="loader-wrapper">
        <div className="loader">
          <span className="loader-text">loading</span>
          <span className="load"></span>
        </div>
      </div>`;

function processDir(directory) {
  const files = fs.readdirSync(directory);
  for (const file of files) {
    const fullPath = path.join(directory, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.tsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let modified = false;

      // Replace generic one-liners: return <div className="loading-container">...</div>;
      const regexOneLiner = /return\s*<div className="loading-container"><div className="loading-spinner" \/> Loading.*?<\/div>;/g;
      if (regexOneLiner.test(content)) {
        content = content.replace(regexOneLiner, 'return (\n' + newLoader + '\n    );');
        modified = true;
      }

      // Replace embedded generic: <div className="loading-container"><div className="loading-spinner" /> Loading…</div>
      const regexEmbedded = /<div className="loading-container"><div className="loading-spinner" \/> Loading.*?<\/div>/g;
      if (regexEmbedded.test(content)) {
        content = content.replace(regexEmbedded, newLoader);
        modified = true;
      }

      if (modified) {
        fs.writeFileSync(fullPath, content);
        console.log('Updated', fullPath);
      }
    }
  }
}

processDir(dir);
console.log('Done!');
