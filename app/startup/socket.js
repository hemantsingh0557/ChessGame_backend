/* eslint-disable no-console */

const { authService, userService, gameService } = require('../services');
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
        const userId = socket.user.id ;
        await userService.updateUser( { id : userId } , { isOnline : true } ) ;


        socket.on(SOCKET_EVENTS.JOIN_GAME_ROOM, async (data, callback) => {
            const { gameRoomId } = data;
            const roomExists = await gameService.checkIfRoomExists({ where : { id : gameRoomId }});  
            if (!roomExists) {
                return callback({ success: false, message: MESSAGES.SOCKET.GAME_ROOM_NOT_EXISTS });
            }
            const isAlreadyInRoom = socket.rooms.has(gameRoomId); // Check if the user is already in this room
            if (isAlreadyInRoom) {
                return callback({ success: false, message: MESSAGES.SOCKET.ALREADY_IN_ROOM });
            }
            socket.join(gameRoomId);
            console.log(`User ${userId} joined game room ${gameRoomId}`);
            socket.to(gameRoomId).emit(SOCKET_EVENTS.USER_JOINED, { userId });
            callback({ success: true, message: MESSAGES.SOCKET.ROOM_JOINED });
        });
        
        socket.on(SOCKET_EVENTS.VALID_MOVES_SELECTED_PLAYER, async (data, callback) => {
            const { gameRoomId , userId1 , userId2 } = data;
            
            socket.join(gameRoomId);
            console.log(`User ${userId} joined game room ${gameRoomId}`);
            socket.to(gameRoomId).emit(SOCKET_EVENTS.USER_JOINED, { userId });
            callback({ success: true, message: MESSAGES.SOCKET.ROOM_JOINED });
        });
        
        // socket.on(SOCKET_EVENTS.MOVE_PIECE, async (data, callback) => {
        //     const { gameRoomId , userId1 , userId2 } = data;
            
        //     socket.join(gameRoomId);
        //     console.log(`User ${userId} joined game room ${gameRoomId}`);
        //     socket.to(gameRoomId).emit(SOCKET_EVENTS.USER_JOINED, { userId });
        //     callback({ success: true, message: MESSAGES.SOCKET.ROOM_JOINED });
        // });
        



        // Handle user disconnect
        socket.on(SOCKET_EVENTS.DISCONNECT, async () => {
            console.log('User disconnected:', socket.id);
            await userService.updateUser( { id : userId } , { isOnline : false , isLookingForGame : false } )
        });
    });
};

module.exports = socketConnection;
