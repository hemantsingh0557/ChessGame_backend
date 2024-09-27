/* eslint-disable no-console */

const { where } = require('sequelize');
const { authService, userService, gameService, gameStateService } = require('../services');
const { MESSAGES, SOCKET_EVENTS } = require('../utils/constants');
const commonFunctions = require('../utils/utils');
const CONSTANTS = require('../utils/constants');
const { Chess } = require('chess.js');

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
            const isAlreadyInRoom = socket.rooms.has(gameRoomId);  
            if (isAlreadyInRoom) {
                return callback({ success: false, message: MESSAGES.SOCKET.ALREADY_IN_ROOM });
            }
            socket.join(gameRoomId);
            console.log(`User ${userId} joined game room ${gameRoomId}`);
            socket.to(gameRoomId).emit(SOCKET_EVENTS.USER_JOINED, { userId });
            callback({ success: true, message: MESSAGES.SOCKET.ROOM_JOINED });
        });
        
        socket.on(SOCKET_EVENTS.VALID_MOVES_SELECTED_PLAYER, async (data, callback) => {
            const { gameRoomId , user , selectedPosition  } = data;
            const currentGameState = await gameStateService.getCurrentGameState({
                where: { gameRoomId },  
                order: [['updatedAt',  CONSTANTS.SORT_ORDER.ASC ]], 
                limit : 1 , 
            });
            if (!currentGameState) {
                return callback({ success: false, message: MESSAGES.SOCKET.GAME_STATE_NOT_FOUND });
            }
            const boardState = currentGameState.boardState;
            const chess = new Chess();
            chess.load(boardState);  
            const validMoves = chess.moves({
                square: selectedPosition,  
                verbose: true  
            });
            callback({ success: true, validMoves });
        });
        
        socket.on(SOCKET_EVENTS.MOVE_PIECE, async (data, callback) => {
            const { gameRoomId , user , userColor , opponentId , fromPos , toPos } = data;
            const currentGameState = await gameStateService.getCurrentGameState({
                where: { gameRoomId },  
                order: [['updatedAt',  CONSTANTS.SORT_ORDER.DESC ]], 
                limit : 1 , 
            });
            if (!currentGameState) {
                return callback({ success: false, message: MESSAGES.SOCKET.GAME_STATE_NOT_FOUND });
            }
            const boardState = currentGameState.boardState;
            const chess = new Chess();
            chess.load(boardState);  
            if (chess.turn() !== userColor ) {  
                return callback({ success: false, message: MESSAGES.SOCKET.NOT_YOUR_TURN });
            }
            const moveResult = chess.move({ from: fromPos, to: toPos });
            if (!moveResult) {
                return callback({ success: false, message: MESSAGES.SOCKET.INVALID_MOVE });
            }
            const createNewGameState = await gameStateService.createGameState(
                { 
                    gameRoomId : gameRoomId  ,
                    userId1 : user.id ,
                    userId2 : opponentId ,
                    boardState: chess.fen(), 
                    currentTurn: chess.turn(), 
                }
            ) ;
            socket.to(gameRoomId).emit(SOCKET_EVENTS.PIECE_MOVED, { fromPos, toPos, gameRoomId });
            callback({ success: true, message: MESSAGES.SOCKET.MOVE_SUCCESS  , boardState: createNewGameState.boardState });
        });



        // Handle user disconnect
        socket.on(SOCKET_EVENTS.DISCONNECT, async () => {
            console.log('User disconnected:', socket.id);
            await userService.updateUser( { id : userId } , { isOnline : false , isLookingForGame : false } )
        });
    });
};

module.exports = socketConnection;
