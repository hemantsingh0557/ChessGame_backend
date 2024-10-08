'use strict';

const { Chess } = require("chess.js");
const { createSuccessResponse, createErrorResponse } = require("../helpers");
const { userService, gameService, gameStateService } = require("../services");
const { Op, where } = require('sequelize');
const CONSTANTS = require("../utils/constants");



const gameController = {};


gameController.getMovesHistory = async (payload) => {
    const { user , gameRoomId } = payload;
    console.log( user , gameRoomId ) ;
    const roomExists = await gameService.checkIfRoomExists({ where : { id : gameRoomId }});  
    if (!roomExists) {
        return createErrorResponse(CONSTANTS.MESSAGES.GAME_ROOM_NOT_EXISTS , CONSTANTS.ERROR_TYPES.DATA_NOT_FOUND)
    }
    console.log( roomExists )
    const gameStates = await gameStateService.getAllGameState({
        where: { gameRoomId },
        order: [['createdAt', 'ASC']]  ,
        attributes : ["currentMove"]
    });
    if (!gameStates || !gameStates.length ) {
        return createErrorResponse(CONSTANTS.MESSAGES.GAME_STATE_NOT_FOUND , CONSTANTS.ERROR_TYPES.DATA_NOT_FOUND)
    }
    console.log( gameStates ) ;
    return createSuccessResponse(CONSTANTS.MESSAGES.SUCCESS , gameStates )
};



module.exports = gameController;