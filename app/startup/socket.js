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
        await userService.updateUser( { id : userId } , { isOnline : true , userSocketId : socket.id } ) ;




        socket.on(SOCKET_EVENTS.START_GAME, async (callback) => {
            
            const isAlreadyInList = await waitingPlayerService.findOne({
                where: { userId: userId }
            });
            if (isAlreadyInList) {
                console.log(`already in waitnign lsit.`);
                if (typeof callback === 'function') {
                    return callback({ success: false, message: MESSAGES.SOCKET.ALREADY_IN_WAITING_LIST });
                }
                return ;
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
                        playerOneColor: 'w',  
                        playerTwoColor: 'b',  
                        finalGameStatus : CONSTANTS.GAME_STATUS.ONGOING ,
                    });
                    const chess = new Chess();
                    const initialBoardState = chess.fen(); // Get the FEN string
                    const currentTurn = chess.turn();
                    console.log( "initialBoardState" , initialBoardState )
                    const initialGameState = await gameStateService.createGameState({
                        gameRoomId: gameRoom.id,
                        boardState: initialBoardState,
                        currentTurn: "w",
                        nextTurn: "b",
                        status: CONSTANTS.GAME_STATUS.ONGOING
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
                    console.log("Callback not a function", opponentResponseObject);
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

        

        socket.on(SOCKET_EVENTS.JOIN_GAME_ROOM, async (data, callback) => {
            data = JSON.parse(data);
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
            console.log(`User ${userId} joined ggggggggggggggggame room ${gameRoomId}`);
            callback({ success: true, message: MESSAGES.SOCKET.ROOM_JOINED });
        });


        socket.on(SOCKET_EVENTS.GET_GAME_STATE, async (data, callback) => {
            data = JSON.parse(data);
            const { gameRoomId } = data;
            const roomExists = await gameService.checkIfRoomExists({ where : { id : gameRoomId }});  
            if (!roomExists) {
                return callback({ success: false, message: MESSAGES.SOCKET.GAME_ROOM_NOT_EXISTS });
            }
            const playerOneColor = roomExists.userId1 == userId ? roomExists.playerOneColor : roomExists.playerTwoColor ;
            const opponentId = roomExists.userId1 == userId ? roomExists.userId2 : roomExists.userId1 ;
            const opponent = await userService.findOne({ id : opponentId  }) ;
            const gameState = await gameStateService.getCurrentGameState({
                where: { gameRoomId },
                order: [['createdAt', 'DESC']]  
            });
            if (!gameState) {
                return callback({ success: false, message: MESSAGES.SOCKET.GAME_STATE_NOT_FOUND });
            }
            // socket.join(gameRoomId);
            const boardState = gameState.boardState
            const chess = new Chess();
            chess.load(boardState);
            const currentTurn = chess.turn();
            const responseObject = {
                gameRoomId,
                opponentDetails: {
                    id : opponent.id ,
                    name : opponent.name ,
                    username : opponent.username ,
                    imageUrl : opponent.imageUrl
                },
                boardState: gameState.boardState ,
                turn : currentTurn ,
                orientation : playerOneColor ,
            };
            console.log( "get game state response " , responseObject ) ;
            callback({ success: true, message: MESSAGES.SOCKET.GAME_STATE_FOUND , data : responseObject });
        });





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
            // const boardState = '1k6/4P3/8/8/8/8/8/4K3 w - - 0 1';
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
            console.log(validMoves ) ;
            callback({ success: true, data : validMoves });
        });



        socket.on(SOCKET_EVENTS.MOVE_PIECE, async (data, callback) => {
            data = JSON.parse(data);
            // console.log( data) ;
            const { gameRoomId, fromPos, toPos, orientation , promotedPiece } = data;
            const checkGameRoomExists = await gameService.checkIfRoomExists({ where: { id: gameRoomId } });
            if (!checkGameRoomExists) {
                return callback({ success: false, message: MESSAGES.SOCKET.GAME_ROOM_NOT_EXISTS });
            }
            const { userId1, userId2 } = checkGameRoomExists;
            const opponentId = (userId1 === userId) ? userId2 : userId1;
            const opponent = await userService.findOne({ id : opponentId  }) ;
            const gameState = await gameStateService.getCurrentGameState({
                where: { gameRoomId },
                order: [['createdAt', 'DESC']]  
            });
            if (!gameState) {
                return callback({ success: false, message: MESSAGES.SOCKET.GAME_STATE_NOT_FOUND });
            }
            // const boardState = '1k6/4P3/8/8/8/8/8/4K3 w - - 0 1';
            const boardState = gameState.boardState
            const chess = new Chess();
            chess.load(boardState);
            const currentTurn = chess.turn();
            const nextTurn = currentTurn === 'w' ? 'b' : 'w';
            console.log( "current trun " , orientation , " " ,  currentTurn , " " , nextTurn ) ;
            // console.log( "Data ===> " , data ) ;
            if (orientation !== currentTurn) {
                return callback({ success: false, message: MESSAGES.SOCKET.INVALID_GAME_TURN });
            }
            const legalMoves = chess.moves({ square: fromPos, verbose: true });
            // console.log( legalMoves ) ;
            const findValidMove = legalMoves.filter(move => move.from === fromPos && move.to === toPos);
            if (!findValidMove || !findValidMove.length) {
                return callback({ success: false, message: MESSAGES.SOCKET.INVALID_MOVE });
            }
            // console.log( "promotedPiece" , promotedPiece ) ;
            if(!promotedPiece && findValidMove[0].flags.includes('p') ) { // for promotion moves 
                console.log( "promotedPiece ====>    " , data ) ;
                socket.emit(SOCKET_EVENTS.PROMOTION_MOVE , { message : MESSAGES.SOCKET.PAWN_PROMOTION_MOVE , data : data } )
                return callback({ success: true, message: MESSAGES.SOCKET.PAWN_PROMOTION_MOVE , data : findValidMove });
            }
            if( findValidMove[0].flags.includes('e') ) { // for en passant move
                const capturedPawnPosition = `${toPos.charAt(0)}${fromPos.charAt(1)}` ;
                console.log( "PAWN_EN_PASSANT_MOVE   " , fromPos , " " , toPos ,  " " , capturedPawnPosition ) ;
                socket.emit(SOCKET_EVENTS.EN_PASSANT_MOVE , { message : MESSAGES.SOCKET.PAWN_EN_PASSANT_MOVE , data : {capturedPawnPosition} } )
                socket.to(gameRoomId).emit(SOCKET_EVENTS.EN_PASSANT_MOVE , { message : MESSAGES.SOCKET.PAWN_EN_PASSANT_MOVE , data : {capturedPawnPosition} } )
            }
            if (findValidMove[0].flags.includes('k')) { // King's Side Castling move
                const rookFrom = 'h' + fromPos[1]; 
                const rookTo = 'f' + fromPos[1];   
                const updatedPosition = {
                    kingFromPos : fromPos ,
                    kingToPos : toPos ,
                    rookFromPos : rookFrom ,
                    rookToPos : rookTo ,
                }
                console.log("King's Side Castling move   ", updatedPosition);
                socket.emit(SOCKET_EVENTS.CASTLING_MOVE, { message: MESSAGES.SOCKET.KINGS_SIDE_CASTLING, data: updatedPosition });
                socket.to(gameRoomId).emit(SOCKET_EVENTS.CASTLING_MOVE, { message: MESSAGES.SOCKET.KINGS_SIDE_CASTLING, data: updatedPosition });
            } 
            if (findValidMove[0].flags.includes('q')) { // Queen's Side Castling move
                const rookFrom = 'a' + fromPos[1]; 
                const rookTo = 'd' + fromPos[1];   
                const updatedPosition = {
                    kingFromPos : fromPos ,
                    kingToPos : toPos ,
                    rookFromPos : rookFrom ,
                    rookToPos : rookTo ,
                }
                console.log("Queen's Side Castling move   ", updatedPosition);
                socket.emit(SOCKET_EVENTS.CASTLING_MOVE, {  message: MESSAGES.SOCKET.QUEENS_SIDE_CASTLING, data : updatedPosition });
            }
            // console.log( "promotedPiece111111" , promotedPiece ) ;
            const moveResult = chess.move({ from: fromPos, to: toPos , promotion : promotedPiece });
            console.log( "moveResult ====>    " , moveResult ) ;
            let gameStatus = CONSTANTS.GAME_STATUS.ONGOING ; 
            let messageForCurrentUser, messageForOpponent ;
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
            else if (chess.inCheck()) {
                gameStatus = CONSTANTS.GAME_STATUS.CHECK;
                messageForCurrentUser = MESSAGES.SOCKET.GETTING_CHECK;
                messageForOpponent = MESSAGES.SOCKET.GETTING_CHECK;
            }
            const currentMove = `${fromPos}-${toPos}`;
            const responseObject = { 
                gameRoomId: gameRoomId,
                boardState: chess.fen(),
                // boardState: "1k6/5R2/R7/1pP1p2p/8/4K3/6PP/8 b - - 0 41",
                piece : moveResult.piece ,
                currentTurn: currentTurn,
                currentMove: currentMove,
                nextTurn: nextTurn,
                status: gameStatus,
                promotedPiece
            };
            await gameService.UpdateGame({ where: { id: gameRoomId } },   { finalGameStatus: gameStatus }  );
            await gameStateService.createGameState(responseObject);
            socket.to(gameRoomId).emit(SOCKET_EVENTS.MOVED, {message: MESSAGES.SOCKET.MOVE_SUCCESS, data: responseObject}) ;
            if (gameStatus === CONSTANTS.GAME_STATUS.CHECKMATE) {
                console.log( "checkmate => " , gameStatus ) ;
                await gameService.UpdateGame({ where: { id: gameRoomId } },   { finalGameStatus : gameStatus , finalWinnerUserId : userId }  );
                socket.emit(SOCKET_EVENTS.GAME_ENDED, { success : true , gameStatus: gameStatus, message: messageForCurrentUser });
                socket.to(opponent.userSocketId).emit(SOCKET_EVENTS.GAME_ENDED, { status: gameStatus, message: messageForOpponent });
            } 
            else if ( gameStatus === CONSTANTS.GAME_STATUS.CHECK ) {
                console.log( "check king  => " ,   currentTurn  )
                socket.to(gameRoomId).emit(SOCKET_EVENTS.GAME_CHECK, { success : true , gameStatus: gameStatus, message: messageForCurrentUser });
            }
            else if (gameStatus !== CONSTANTS.GAME_STATUS.ONGOING ) {
                console.log( "not ongoing => " , gameStatus ) ;
                socket.to(gameRoomId).emit(SOCKET_EVENTS.GAME_ENDED, { success : true , gameStatus: gameStatus, message: messageForCurrentUser });
            }
            // else if ( gameStatus === CONSTANTS.GAME_STATUS.ONGOING )
            // {
            //     socket.to(gameRoomId).emit(SOCKET_EVENTS.MOVED, {message: MESSAGES.SOCKET.MOVE_SUCCESS, data: responseObject}) ;
            // }
           
            // console.log( "opponetn => " , opponentId , opponent.userSocketId ) ;
            
            // socket.emit(SOCKET_EVENTS.MOVED, {message: MESSAGES.SOCKET.MOVE_SUCCESS, data: responseObject}) ;
            // socket.to(socket.id).emit(SOCKET_EVENTS.MOVED, {message: MESSAGES.SOCKET.MOVE_SUCCESS, responseObject})
            // socket.to(opponent.userSocketId).emit(SOCKET_EVENTS.MOVED, {message: MESSAGES.SOCKET.MOVE_SUCCESS, responseObject})

            callback({ success: true, message: MESSAGES.SOCKET.MOVE_SUCCESS, data: responseObject });
        });


        
        socket.on(SOCKET_EVENTS.LEAVE_GAME , async(data , callback) => {
            data = JSON.parse(data);
            const { gameRoomId } = data ;
            callback({success : true , message : MESSAGES.SOCKET.GAME_LEAVE_SUCCESSFULLY})
        })
        
        
        

        // Handle user disconnect
        socket.on(SOCKET_EVENTS.DISCONNECT, async () => {
            console.log('User disconnected:', socket.id);
            await userService.updateUser( { id : userId } , { isOnline : false } )
        });
    });
};

module.exports = socketConnection;
