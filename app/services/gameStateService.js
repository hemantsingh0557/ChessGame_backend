
const { GameStateModel } = require("../models");




const gameStateService = {} ;



// gameStateService.createOrUpdateGameState = async(condition , updatePayload) => await GameStateModel.upsert({...condition.where , ...updatePayload})  ;
gameStateService.createGameState = async(payload) => await GameStateModel.create(payload)  ;

gameStateService.getCurrentGameState = async(payload) => await GameStateModel.findOne(payload)  ;

gameStateService.getAllGameState = async(payload) => await GameStateModel.find(payload)  ;



module.exports = gameStateService ;