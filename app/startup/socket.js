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
        // console.log( "userid" ,  userId )
        await userService.updateUser( { id : userId } , { isOnline : true } ) ;




        socket.on(SOCKET_EVENTS.START_GAME, async (callback) => {
            
            const isAlreadyInList = await waitingPlayerService.findOne({
                where: { userId: userId }
            });
            if (isAlreadyInList) {
                callback({ success: false, message: MESSAGES.SOCKET.ALREADY_IN_WAITING_LIST });
            } 
            else {
                await waitingPlayerService.addPlayerToWaitingListInDb({ userId, userSocketId: socket.id });
            }
            const startTime = Date.now();
            const waitDuration = CONSTANTS.MATCH_DURATION;
            while (Date.now() - startTime < waitDuration) {
                const findAllPlayerWaitingForMatch = await waitingPlayerService.findAllPlayerWaitingForMatchFromDb({
                    where: {

                        userId: { [Op.ne]: userId }
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
                    const gameRoom = await gameService.createGameRoom({
                        userId1: userId,
                        userId2: opponentPlayer.userId,
                    });
        
                    const chess = new Chess();
                    const initialBoardState = chess.fen(); // Get the FEN string
                    const currentTurn = chess.turn();
                    console.log( "initialBoardState" , initialBoardState )
                    const initialGameState = await gameStateService.createGameState({
                        gameRoomId: gameRoom.id,
                        boardState: initialBoardState
                    });
                    const userDetails = await userService.findOne({ id : userId })
                    const opponentDetails = await userService.findOne({ id : opponentPlayer.userId })
                    const userResponseObject = {
                        gameRoomId: gameRoom.id,
                        opponentDetails: {
                            id : opponentDetails.id ,
                            name : opponentDetails.name ,
                            username : opponentDetails.username ,
                            imageUrl : opponentDetails.imageUrl
                        },
                        boardState: initialGameState.boardState,
                        currentTurn,
                    };
                    const opponentResponseObject = {
                        gameRoomId: gameRoom.id,
                        opponentDetails: {
                            id : userDetails.id ,
                            name : userDetails.name ,
                            username : userDetails.username ,
                            imageUrl : userDetails.imageUrl
                        },
                        // boardState: "rnbqkbnr/pppppppp/8/8/8/2N5/PPPPPPPP/R1BQKBNR b KQkq - 1 1" ,
                        boardState: initialGameState.boardState,
                        currentTurn,
                    };
                    // console.log( gameRoom.id , currentTurn ) ;
                    // console.log( boardState ) ;
                    socket.emit(SOCKET_EVENTS.GAME_MATCHED, {...userResponseObject, orientation: 'white'});
                    socket.to(opponentPlayer.userSocketId).emit(SOCKET_EVENTS.GAME_MATCHED, {...opponentResponseObject, orientation: 'black'} );
                    if (typeof callback === 'function') {
                        console.log(`Game matched successfully for User ${userId}`);
                        return callback({ success: true, message: MESSAGES.SOCKET.MATCH_FOUND });
                    }
                    console.log("Callback not a function", userResponseObject);
                    return;
                }
                await new Promise(resolve => setTimeout(resolve, CONSTANTS.CHECK_INTERVAL));
            }
            if (typeof callback === 'function') {
                console.log(`No opponent found for User ${userId} within the waiting duration.`);
                return callback({ success: false, message: MESSAGES.SOCKET.NO_MATCH_FOUND });
            }
            return;
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
            data = JSON.parse(data);
            const { gameRoomId , selectedPosition , orientation } = data;
            const checkGameRoomExits = await gameService.checkIfRoomExists({where : { id : gameRoomId}}) ;
            if( !checkGameRoomExits ) {
                callback( { success : false , message : MESSAGES.SOCKET.GAME_ROOM_NOT_EXISTS} )
            }
            const gameState = await gameStateService.getCurrentGameState({
                where: { gameRoomId },
                order: [['createdAt', 'DESC']]  
            });
            if (!gameState) {
                return callback({ success: false, message: MESSAGES.SOCKET.GAME_STATE_NOT_FOUND });
            }
            const boardState = gameState.boardState
            const chess = new Chess();
            chess.load(boardState);  
            const currentTurn = chess.turn(); 
            console.log( orientation , "   " , currentTurn  ) ;
            if( orientation != currentTurn ) {
                return callback({ success : false , message : MESSAGES.SOCKET.INVALID_GAME_TURN })
            }
            const validMoves = chess.moves({
                square: selectedPosition,  
                verbose: true  
            });
            callback({ success: true, validMoves });
        });

        socket.on(SOCKET_EVENTS.MOVE_PIECE, async (data, callback) => {
            data = JSON.parse(data);
            const { gameRoomId, fromPos, toPos, orientation } = data;
            const checkGameRoomExists = await gameService.checkIfRoomExists({ where: { id: gameRoomId } });
            if (!checkGameRoomExists) {
                return callback({ success: false, message: MESSAGES.SOCKET.GAME_ROOM_NOT_EXISTS });
            }
            const gameState = await gameStateService.getCurrentGameState({
                where: { gameRoomId },
                order: [['createdAt', 'DESC']]  
            });
            if (!gameState) {
                return callback({ success: false, message: MESSAGES.SOCKET.GAME_STATE_NOT_FOUND });
            }
            const boardState = gameState.boardState
            const chess = new Chess();
            chess.load(boardState);
            const currentTurn = chess.turn();
            const nextTurn = currentTurn === 'w' ? 'b' : 'w';
            if (orientation !== currentTurn) {
                return callback({ success: false, message: MESSAGES.SOCKET.INVALID_GAME_TURN });
            }
            const legalMoves = chess.moves({ square: fromPos, verbose: true });
            const isValidMove = legalMoves.some(move => move.from === fromPos && move.to === toPos);
            if (!isValidMove) {
                return callback({ success: false, message: MESSAGES.SOCKET.INVALID_MOVE });
            }
            const moveResult = chess.move({ from: fromPos, to: toPos });
            if (chess.inCheck()) {
                chess.undo();
                return callback({ success: false, message: MESSAGES.SOCKET.CANNOT_MOVE_IN_CHECK });
            }
            let gameStatus = CONSTANTS.GAME_STATUS.ONGOING;
            let messageForCurrentUser, messageForOpponent;
            if (chess.isCheckmate()) {
                gameStatus = CONSTANTS.GAME_STATUS.CHECKMATE;
                messageForCurrentUser = MESSAGES.SOCKET.CHECKMATE_WIN;
                messageForOpponent = MESSAGES.SOCKET.CHECKMATE_LOSS;
            } 
            else if (chess.isDraw()) {
                gameStatus = CONSTANTS.GAME_STATUS.DRAW;
                messageForCurrentUser = MESSAGES.SOCKET.DRAW;
                messageForOpponent = MESSAGES.SOCKET.DRAW;
            } 
            else if (chess.isStalemate()) {
                gameStatus = CONSTANTS.GAME_STATUS.STALEMATE;  
                messageForCurrentUser = MESSAGES.SOCKET.STALEMATE;
                messageForOpponent = MESSAGES.SOCKET.STALEMATE;
            } 
            else if (chess.isInsufficientMaterial()) {
                gameStatus = CONSTANTS.GAME_STATUS.INSUFFICIENT_MATERIAL;  
                messageForCurrentUser = MESSAGES.SOCKET.INSUFFICIENT_MATERIAL;
                messageForOpponent = MESSAGES.SOCKET.INSUFFICIENT_MATERIAL;
            } 
            else if (chess.isThreefoldRepetition()) {
                gameStatus = CONSTANTS.GAME_STATUS.THREEFOLD_REPETITION;  
                messageForCurrentUser = MESSAGES.SOCKET.THREEFOLD_REPETITION;
                messageForOpponent = MESSAGES.SOCKET.THREEFOLD_REPETITION;
            }
            const currentMove = `${fromPos}-${toPos}`;
            const responseObject = { 
                gameRoomId: gameRoomId,
                boardState: chess.fen(),
                currentTurn: currentTurn,
                currentMove: currentMove,
                nextTurn: nextTurn,
                status: gameStatus,
            };
            await gameStateService.createGameState(responseObject);
            if (gameStatus === CONSTANTS.GAME_STATUS.CHECKMATE) {
                socket.to(socket.id).emit(SOCKET_EVENTS.GAME_ENDED, { status: gameStatus, message: messageForCurrentUser });
                socket.to(gameRoomId).emit(SOCKET_EVENTS.GAME_ENDED, { status: gameStatus, message: messageForOpponent });
            } 
            else if (gameStatus !== CONSTANTS.GAME_STATUS.ONGOING) {
                socket.to(gameRoomId).emit(SOCKET_EVENTS.GAME_ENDED, { status: gameStatus, message: messageForCurrentUser });
            }
            callback({ success: true, message: MESSAGES.SOCKET.MOVE_SUCCESS, responseObject });
        });
        
        
        

        // Handle user disconnect
        socket.on(SOCKET_EVENTS.DISCONNECT, async () => {
            console.log('User disconnected:', socket.id);
            await userService.updateUser( { id : userId } , { isOnline : false } )
        });
    });
};

module.exports = socketConnection;
