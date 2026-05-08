const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 4444;
const FILE = path.join(__dirname, 'index.html');

http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(fs.readFileSync(FILE));
}).listen(PORT, '127.0.0.1', () => {
  console.log(`Preview running at http://localhost:${PORT}`);
});
