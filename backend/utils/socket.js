const socketIo = require('socket.io');

let io;

const initSocket = (server) => {
    io = socketIo(server);

    io.on('connection', (socket) => {
        console.log('New client connected:', socket.id);

        // Join a room based on User ID
        socket.on('join', (userId) => {
            socket.join(userId);
            console.log(`User ${userId} joined room ${userId}`);
        });

        // Handle Private Message
        socket.on('private_message', (data) => {
            const { senderId, receiverId, content, senderName } = data;

            // Emit to receiver's room
            io.to(receiverId).emit('receive_message', {
                senderId,
                content,
                senderName,
                timestamp: new Date()
            });
        });

        socket.on('disconnect', () => {
            console.log('Client disconnected');
        });
    });
};

const getIo = () => {
    if (!io) {
        throw new Error('Socket.io not initialized!');
    }
    return io;
};

module.exports = { initSocket, getIo };
