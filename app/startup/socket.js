/* eslint-disable no-console */

const { where, Op } = require('sequelize');
const { authService, userService, gameService, gameStateService, waitingPlayerService } = require('../services');
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
            console.log("Starting game..." , userId );
            await waitingPlayerService.addPlayerToWaitingListInDb({ userId });
            const startTime = Date.now();
            const waitDuration = CONSTANTS.MATCH_DURATION;  
            while (Date.now() - startTime < waitDuration) {
                const findAllPlayerWaitingForMatch = await waitingPlayerService.findAllPlayerWaitingForMatchFromDb({
                    where: {
                        userId: { [Op.ne]: userId  }
                    },
                    limit: 1,
                    order: [['createdAt', 'ASC']],
                });
                if (findAllPlayerWaitingForMatch.length >= 1) {
                    const opponentPlayer = findAllPlayerWaitingForMatch[0];
                    await waitingPlayerService.removePlayerFromWaitingListInDb({
                        where: {
                            [Op.or]: [
                                { userId: opponentPlayer.userId },
                                { userId: userId }
                            ]
                        }
                    });
                    socket.to(userId).emit(SOCKET_EVENTS.GAME_MATCHED, { opponents: opponentPlayer.userId });
                    socket.to(opponentPlayer.userId).emit(SOCKET_EVENTS.GAME_MATCHED, { opponents: userId });
                    const gameRoom = await gameService.createGameRoom({
                        userId1 : userId ,
                        userId2 : opponentPlayer.userId ,
                    }) ;
                    const initialBoardState = new Chess().fen(); 
                    const initialGameState = await gameStateService.createGameState(
                        { 
                            gameRoomId : gameRoom.id  ,
                            boardState : initialBoardState 
                        }
                    ) ;
                    const responseObejct = { 
                        gameRoomId : gameRoom.id , 
                        userId : userId ,
                        opponentPlayerId: opponentPlayer.userId ,
                        boardState : initialGameState.boardState,
                        currentTurn : initialBoardState.currentTurn ,
                    }
                    console.log( "responseObejct" ,  responseObejct ) ;
                    if( typeof callback === 'function' ) return callback({ success: true, message: MESSAGES.SOCKET.MATCH_FOUND , data : responseObejct });
                    console.log( "callback not funciton " ,  responseObejct ) ;
                    return ;
                }
                await new Promise(resolve => setTimeout(resolve, CONSTANTS.CHECK_INTERVAL));
            }
            if( typeof callback === 'function' ) return callback({ success: false, message: MESSAGES.SOCKET.NO_MATCH_FOUND });
            return ;
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
            const { gameRoomId , currentBoardState , currentTurn , fromPos , toPos } = data;
            const boardState = currentBoardState;
            const chess = new Chess();
            chess.load(boardState);  
            const moveResult = chess.move({ from: fromPos, to: toPos });
            if (!moveResult) {
                return callback({ success: false, message: MESSAGES.SOCKET.INVALID_MOVE });
            }
            const realCurrentTurn = chess.turn(); 
            if( currentTurn != realCurrentTurn ) {
                return callback({ success : false , message : MESSAGES.SOCKET.INVALID_GAME_TURN })
            }
            const nextTurn = currentTurn === 'w' ? 'b' : 'w';  
            const currentMove = `${fromPos}-${toPos}`;

            let gameStatus = CONSTANTS.GAME_STATUS.ONGOING ;
            if (chess.in_checkmate()) {
                gameStatus = CONSTANTS.GAME_STATUS.CHECKMATE ;
            } 
            else if (chess.in_draw()) {
                gameStatus = CONSTANTS.GAME_STATUS.DRAW;
            } 
            else if (chess.in_check()) {
                gameStatus = CONSTANTS.GAME_STATUS.CHECK ;
            }

            // Create the response object
            const responseObject = { 
                gameRoomId: gameRoomId,
                boardState: chess.fen(),
                currentTurn: currentTurn,
                currentMove: currentMove,
                nextTurn: nextTurn,
                status: gameStatus,
            };
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
