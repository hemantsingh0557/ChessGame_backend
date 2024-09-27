'use strict';

const { Chess } = require("chess.js");
const { createSuccessResponse, createErrorResponse } = require("../helpers");
const { userService, gameService } = require("../services");
const { MESSAGES, ERROR_TYPES } = require("../utils/constants");
const { Op } = require('sequelize');



const gameController = {};


gameController.startGame = async (payload) => {
    const { user } = payload;
    const userId = user.id;
    console.log( userId ) ;
    // await userService.updateUser({ id: userId }, { isLookingForGame: true });
    await userService.updateUser({ id: userId }, { isOnline: true });
    const matchDuration = 60000;  
    const checkInterval = 5000;  
    const endTime = Date.now() + matchDuration;
    return new Promise((resolve, reject) => {
        const checkForMatch = async () => {
            if (Date.now() >= endTime) {
                return resolve(createErrorResponse(MESSAGES.NO_MATCH_FOUND, ERROR_TYPES.BAD_REQUEST));
            }
            const allUsersLookingForGame = await userService.allUsersLookingForGameFromDB({
                where: {
                    // isLookingForGame: true,
                    isOnline: true,
                    id: {
                        [Op.ne]: userId 
                    }
                }
            });
            if (allUsersLookingForGame.length > 0) {
                const opponentPlayer = allUsersLookingForGame[0] ;
                // await userService.updateUser( {id : opponentPlayer.id } , { isLookingForGame: false });
                await userService.updateUser(
                    { [Op.or]: [{ id: userId }, { id: opponentPlayer.id }] },
                    { isOnline: false }
                );

                const gameRoom = await gameService.createGameRoom({
                    userId1 : userId ,
                    userId2 : opponentPlayer.id ,
                }) ;
                const initialBoardState = new Chess() ;
                const initialGameState = await gameService.createOrUpdateGameState({
                    gameRoomId : gameRoom.id ,
                    userId1 : userId ,
                    userId2 : opponentPlayer.id ,
                    boardState : initialBoardState
                }) ;
                
                // allUsersLookingForGame.forEach(opponentPlayer => {
                //     userService.updateUserStatus(opponentPlayer.id, { isLookingForGame: false });
                // });
                const responseObejct = { 
                    gameRoomId : gameRoom.id , 
                    opponentPlayerId: opponentPlayer.id ,
                    boardState : initialGameState.boardState,
                    currentTurn : initialBoardState.currentTurn ,
                }
                return resolve(createSuccessResponse(MESSAGES.MATCH_FOUND_SUCCESSFULLY, responseObejct ));
            }
            setTimeout(checkForMatch, checkInterval);
        };
        checkForMatch(); 
    });
};



module.exports = gameController;