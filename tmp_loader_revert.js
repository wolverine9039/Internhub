const fs = require('fs');
const path = require('path');
const dir = 'd:/MCA/accoclite/Internhub/frontend/src/components';

const oldLoader = `<div className="loader">
          <span className="loader-text">loading</span>
          <span className="load"></span>
        </div>`;

const newLoader = `<div className="loading-wave">
          <div className="loading-bar"></div>
          <div className="loading-bar"></div>
          <div className="loading-bar"></div>
          <div className="loading-bar"></div>
        </div>`;

function processDir(directory) {
  const files = fs.readdirSync(directory);
  for (const file of files) {
    const fullPath = path.join(directory, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.tsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      if (content.includes(oldLoader)) {
        content = content.replace(new RegExp(oldLoader.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newLoader);
        fs.writeFileSync(fullPath, content);
        console.log('Updated', fullPath);
      }
    }
  }
}

processDir(dir);
console.log('Done!');
