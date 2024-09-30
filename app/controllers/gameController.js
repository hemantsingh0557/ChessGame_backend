'use strict';

const { Chess } = require("chess.js");
const { createSuccessResponse, createErrorResponse } = require("../helpers");
const { userService, gameService, gameStateService } = require("../services");
const { MESSAGES, ERROR_TYPES } = require("../utils/constants");
const { Op, where } = require('sequelize');
const CONSTANTS = require("../utils/constants");



const gameController = {};


// gameController.startGame = async (payload) => {
//     const { user } = payload;
//     const userId = user.id;
//     await userService.updateUser({ id: userId }, { isLookingForGame: true });
//     const matchDuration = CONSTANTS.MATCH_DURATION;  
//     const checkInterval = CONSTANTS.CHECK_INTERVAL ;  
//     const endTime = Date.now() + matchDuration;
//     return new Promise((resolve, reject) => {
//         const checkForMatch = async () => {
//             if (Date.now() >= endTime) {
//                 return resolve(createErrorResponse(MESSAGES.NO_MATCH_FOUND, ERROR_TYPES.BAD_REQUEST));
//             }
//             const allUsersLookingForGame = await userService.allUsersLookingForGameFromDB({
//                 where: {
//                     isLookingForGame: true,
//                     id: {
//                         [Op.ne]: userId 
//                     }
//                 }
//             });
//             if (allUsersLookingForGame.length > 0) {
//                 const opponentPlayer = allUsersLookingForGame[0] ;
//                 await userService.updateUser( 
//                     { [Op.or]: [{ id: userId }, { id: opponentPlayer.id }] },
//                     { isLookingForGame: false }
//                 );
//                 const gameRoom = await gameService.createGameRoom({
//                     userId1 : userId ,
//                     userId2 : opponentPlayer.id ,
//                 }) ;
//                 const initialBoardState = new Chess().fen(); 
//                 const initialGameState = await gameStateService.createGameState(
//                     { 
//                         gameRoomId : gameRoom.id  ,
//                         boardState : initialBoardState 
//                     }
//                 ) ;
//                 const responseObejct = { 
//                     gameRoomId : gameRoom.id , 
//                     opponentPlayerId: opponentPlayer.id ,
//                     boardState : initialGameState.boardState,
//                     currentTurn : initialBoardState.currentTurn ,
//                 }
//                 return resolve(createSuccessResponse(MESSAGES.MATCH_FOUND_SUCCESSFULLY, responseObejct ));
//             }
//             else {
//                 setTimeout(checkForMatch, checkInterval);
//             }
//         };
//         checkForMatch(); 
//     });
// };



module.exports = gameController;