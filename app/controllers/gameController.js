'use strict';

const { Chess } = require("chess.js");
const { createSuccessResponse, createErrorResponse } = require("../helpers");
const { userService, gameService, gameStateService } = require("../services");
const { Op } = require('sequelize');
const CONSTANTS = require("../utils/constants");
const { sequelize } = require("../startup/db_mySql");

const gameController = {};

gameController.getGameCurrentState = async (payload) => {
    const { user , gameRoomId } = payload;
    const userId = user.id ;
    const roomExists = await gameService.checkIfRoomExists({ where: { id: gameRoomId } });
    if (!roomExists) {
        return createErrorResponse(CONSTANTS.MESSAGES.GAME_ROOM_NOT_EXISTS, CONSTANTS.ERROR_TYPES.DATA_NOT_FOUND);
    }
    const playerOneColor = roomExists.userId1 == userId ? roomExists.playerOneColor : roomExists.playerTwoColor ;
    const opponentId = roomExists.userId1 == userId ? roomExists.userId2 : roomExists.userId1 ;
    const opponent = await userService.findOne({ id : opponentId  }) ;
    const gameState = await gameStateService.getCurrentGameState({
        where: { gameRoomId },
        order: [['createdAt', 'DESC']]  
    });
    if (!gameState) {
        return createErrorResponse(CONSTANTS.MESSAGES.GAME_STATE_NOT_FOUND, CONSTANTS.ERROR_TYPES.DATA_NOT_FOUND);
    }
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
    return createSuccessResponse(CONSTANTS.MESSAGES.GAME_STATE_FOUND, responseObject );
}

gameController.getMovesHistory = async (payload) => {
    const { user, gameRoomId , skip , limit } = payload;
    const roomExists = await gameService.checkIfRoomExists({ where: { id: gameRoomId } });
    if (!roomExists) {
        return createErrorResponse(CONSTANTS.MESSAGES.GAME_ROOM_NOT_EXISTS, CONSTANTS.ERROR_TYPES.DATA_NOT_FOUND);
    }
    const gameMovesHistory = await gameStateService.getAllGameState({
        where: { gameRoomId },
        attributes: [
            'currentTurn',
            'currentMove',
            'piece',
            'promotedPiece',
        ],
        order: [['createdAt', 'ASC']],  
        offset: skip + 1,   
        limit: limit   
    });    
    if (!gameMovesHistory ) {
        return createErrorResponse(CONSTANTS.MESSAGES.GAME_MOVES_NOT_FOUND, CONSTANTS.ERROR_TYPES.DATA_NOT_FOUND);
    }
    const whiteMoves = gameMovesHistory.filter(data => data.currentTurn === 'w');
    const blackMoves = gameMovesHistory.filter(data => data.currentTurn === 'b');
    const combinedMoves = whiteMoves.map((whiteMove, index) => {
        const blackMove = blackMoves[index] || {}; 
        return {
            whiteMove: whiteMove.currentMove?.substr(3),
            whitePiece: whiteMove.piece,
            whitePromotedPiece: whiteMove.promotedPiece,
            blackMove: blackMove.currentMove?.substr(3) || null, 
            blackPiece: blackMove.piece || null,
            blackPromotedPiece: blackMove.promotedPiece || null,
        };
    });
    return createSuccessResponse(CONSTANTS.MESSAGES.SUCCESS, combinedMoves );
};



// gameService.getUserAllGameHistory = async(payload) => {
//     const {user } = payload ;
//     const getAllGames = await gameService.getAllGamesFromDB(
//         { where: { id: gameRoomId } }
//     );
//     if (!roomExists) {
//         return createErrorResponse(CONSTANTS.MESSAGES.GAME_ROOM_NOT_EXISTS, CONSTANTS.ERROR_TYPES.DATA_NOT_FOUND);
//     }
// }

module.exports = gameController;
