/* eslint-disable no-console */

const { groupService, individualChatService, authService, userService } = require('../services');
const { MESSAGES, SOCKET_EVENTS } = require('../utils/constants');
const commonFunctions = require('../utils/utils');

const socketConnection = {};

socketConnection.connect = (io) => {

    
    // Middleware for authenticating sockets
    io.use(authService.socketAuthentication);

    io.on(SOCKET_EVENTS.CONNECTION, async (socket) => {
        console.log('A user connected:', socket.id);

        // Middleware for validating socket events
        socket.use(commonFunctions.validateSocketEvent);


        // Individual chat events
        socket.on(SOCKET_EVENTS.JOIN_ROOM, (roomId) => {
            socket.join(roomId);
            console.log(`User ${socket.id} joined room ${roomId}`);
        });

        socket.on(SOCKET_EVENTS.SEND_MESSAGE, async (data) => {
            console.log("Received data:", data);
            await individualChatService.createOrUpdateChatAndSaveMessage(
                data.roomId,
                data.message.senderId,
                data.message.recipientId,
                data.message.textMessage,
            );
            if (socket.rooms.has(data.roomId)) {
                io.to(data.roomId).emit(SOCKET_EVENTS.CHAT_MESSAGE, data.message);
            } 
            else {
                io.to(userId).emit(SOCKET_EVENTS.NEW_MESSAGE_NOTIFICATION, {
                    roomId: data.roomId,
                    message: data.message
                });
            }
        });

        
        // Handle user disconnect
        socket.on(SOCKET_EVENTS.DISCONNECT, async () => {
            console.log('User disconnected:', socket.id);
        });
    });
};

module.exports = socketConnection;
