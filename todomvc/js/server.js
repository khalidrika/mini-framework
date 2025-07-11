import { createServer } from 'http';
import { readFile } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const server = createServer((req, res) => {
  // Block all DevTools probing requests first thing
  if (req.url.match(/(\.well-known|\.map|chrome-devtools|favicon)/i)) {
    res.writeHead(204).end(); // No content
    return;
  }

  let filePath;
  const sanitizedUrl = req.url.replace(/^(\.\.[\/\\])+/, ''); // Prevent diretory traversal
  if (sanitizedUrl.startsWith('/shedjs/')) {
    // Go up two levels from /todomvc/js/ to reach project-root/shedjs/
    filePath = path.join(__dirname, '../../shedjs', sanitizedUrl.slice('/shedjs/'.length));
  } else if (sanitizedUrl === '/' || sanitizedUrl === '') {
    filePath = path.join(__dirname, '../index.html');
  } else {
    filePath = path.join(__dirname, '..', sanitizedUrl); // All other files are in todomvc/
  }

  const mimeTypes = {
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.html': 'text/html',
    '.png': 'image/png'
  };

  const ext = path.extname(filePath);
  const contentType = mimeTypes[ext] || 'text/plain';

  readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        console.error('Not found:', filePath);
        res.writeHead(404);
        res.end('Not found');
      } else {
        res.writeHead(500);
        res.end('Server error');
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
});

server.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
