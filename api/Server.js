const WebSocket = require('ws');
const http = require('http');

// Port for both HTTP and WebSocket connections
const PORT = 3000;

let latestLocation = null; // Store the latest location

// Create HTTP server
const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/update-location') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });

    req.on('end', () => {
      try {
        const data = JSON.parse(body); // Expecting JSON payload { latitude: xx, longitude: yy }
        latestLocation = data; // Update the latest location
        console.log('Received location:', latestLocation);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'success' }));
      } catch (error) {
        console.error('Error parsing location data:', error);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'error', message: 'Invalid data' }));
      }
    });
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'error', message: 'Not Found' }));
  }
});

// Attach WebSocket server to the same HTTP server
const wss = new WebSocket.Server({ server });
console.log(`Server running on http://localhost:${PORT}`);

wss.on('connection', (ws) => {
  console.log('WebSocket client connected');

  // Broadcast the latest location every second
  const interval = setInterval(() => {
    if (latestLocation) {
      ws.send(JSON.stringify({ destination: latestLocation }));
    }
  }, 1000);

  ws.on('close', () => {
    clearInterval(interval);
    console.log('WebSocket client disconnected');
  });
});

// Start the HTTP and WebSocket server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`HTTP server and WebSocket running on port ${PORT}`);
});

