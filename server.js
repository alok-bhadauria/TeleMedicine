require('dotenv').config();
const http = require('http');
const app = require('./backend/app');
const { initSocket } = require('./backend/utils/socket');

const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Initialize Socket.io
initSocket(server);

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
