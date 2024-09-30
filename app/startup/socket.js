/* eslint-disable no-console */

const { where, Op } = require('sequelize');
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
        console.log( "userid" ,  userId )
        await userService.updateUser( { id : userId } , { isOnline : true } ) ;

        socket.on(SOCKET_EVENTS.START_GAME, async (callback) => {
            // Start game logic
            console.log("okoko " )
            await userService.updateUser({ id: userId }, { isLookingForGame: true });
            const matchDuration = CONSTANTS.MATCH_DURATION;  
            const checkInterval = CONSTANTS.CHECK_INTERVAL;  
            const endTime = Date.now() + matchDuration;

            const checkForMatch = async () => {
                if (Date.now() >= endTime) {
                    await userService.updateUser({ id: userId }, { isLookingForGame: false });
                    return callback({ success: false, message: MESSAGES.NO_MATCH_FOUND });
                }
                const allUsersLookingForGame = await userService.allUsersLookingForGameFromDB({
                    where: {
                        isLookingForGame: true,
                        id: {
                            [Op.ne]: userId 
                        }
                    }
                });
                if (allUsersLookingForGame.length > 0) {
                    const opponentPlayer = allUsersLookingForGame[0];
                    await userService.updateUser(
                        { [Op.or]: [{ id: userId }, { id: opponentPlayer.id }] },
                        { isLookingForGame: false }
                    );
                    const gameRoom = await gameService.createGameRoom({
                        userId1: userId,
                        userId2: opponentPlayer.id,
                    });
                    const initialBoardState = new Chess().fen(); 
                    const initialGameState = await gameStateService.createGameState(
                        { 
                            gameRoomId: gameRoom.id,
                            boardState: initialBoardState 
                        }
                    );
                    const responseObject = { 
                        gameRoomId: gameRoom.id, 
                        opponentPlayerId: opponentPlayer.id,
                        boardState: initialGameState.boardState,
                        currentTurn: CONSTANTS.GAME_TURNS.WHITE , 
                    };
                    socket.join(gameRoom.id);
                    socket.emit(SOCKET_EVENTS.MATCH_FOUND, responseObject);
                    socket.to(opponentPlayer.id).emit(SOCKET_EVENTS.MATCH_FOUND, responseObject);
                    return callback({ success: true, message: MESSAGES.MATCH_FOUND_SUCCESSFULLY, responseObject });
                } 
                else {
                    setTimeout(checkForMatch, checkInterval);
                }
            };

            checkForMatch(); 
        });


        // socket.on(SOCKET_EVENTS.JOIN_GAME_ROOM, async (data, callback) => {
        //     // data = JSON.parse(data);
        //     const { gameRoomId } = data;
        //     const roomExists = await gameService.checkIfRoomExists({ where : { id : gameRoomId }});  
        //     if (!roomExists) {
        //         return callback({ success: false, message: MESSAGES.SOCKET.GAME_ROOM_NOT_EXISTS });
        //     }
        //     const isAlreadyInRoom = socket.rooms.has(gameRoomId);  
        //     if (isAlreadyInRoom) {
        //         return callback({ success: false, message: MESSAGES.SOCKET.ALREADY_IN_ROOM });
        //     }
        //     socket.join(gameRoomId);
        //     console.log(`User ${userId} joined game room ${gameRoomId}`);
        //     socket.to(gameRoomId).emit(SOCKET_EVENTS.USER_JOINED, { userId });
        //     callback({ success: true, message: MESSAGES.SOCKET.ROOM_JOINED });
        // });
        
        socket.on(SOCKET_EVENTS.VALID_MOVES, async (data, callback) => {
            const { gameRoomId , selectedPosition  } = data;
            const currentGameState = await gameStateService.getCurrentGameState({
                where: { gameRoomId },  
                order: [['updatedAt',  CONSTANTS.SORT_ORDER.ASC ]], 
                limit : 1 , 
            });
            if (!currentGameState) {
                return callback({ success: false, message: MESSAGES.SOCKET.GAME_STATE_NOT_FOUND });
            }
            const boardState = currentGameState.boardState;
            console.log("boardState => " , boardState) ;
            const chess = new Chess();
            chess.load(boardState);  
            // console.log("boardState => " , boardState) ;
            const validMoves = chess.moves({
                square: selectedPosition,  
                verbose: true  
            });
            callback({ success: true, validMoves });
        });
        
        socket.on(SOCKET_EVENTS.MOVE_PIECE, async (data, callback) => {
            const { gameRoomId , currentBoardState , fromPos , toPos } = data;
            const boardState = currentBoardState;
            const chess = new Chess();
            chess.load(boardState);  
            const moveResult = chess.move({ from: fromPos, to: toPos });
            if (!moveResult) {
                return callback({ success: false, message: MESSAGES.SOCKET.INVALID_MOVE });
            }
            const currentTurn = chess.turn(); 
            const nextTurn = currentTurn === 'w' ? 'b' : 'w';  
            const currentMove = `${fromPos}-${toPos}`;
            const responseObject = { 
                gameRoomId: gameRoomId,
                boardState: chess.fen(),
                currentTurn: currentTurn,
                currentMove: currentMove,
                nextTurn: nextTurn,
            }
            const createNewGameState = await gameStateService.createGameState(
                responseObject
            );
            socket.to(gameRoomId).emit(SOCKET_EVENTS.PIECE_MOVED, { fromPos, toPos, gameRoomId });
            callback({ success: true, message: MESSAGES.SOCKET.MOVE_SUCCESS  , responseObject });
        });



        // Handle user disconnect
        socket.on(SOCKET_EVENTS.DISCONNECT, async () => {
            console.log('User disconnected:', socket.id);
            await userService.updateUser( { id : userId } , { isOnline : false , isLookingForGame : false } )
        });
    });
};

module.exports = socketConnection;
