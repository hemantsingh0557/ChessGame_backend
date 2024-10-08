const { GameModel } = require("../models");
const {chess} = require("chess.js") ;

const gameService = {} ;


gameService.createGameRoom = async(payload) => await GameModel.create(payload)  ;

gameService.checkIfRoomExists = async(payload) => await GameModel.findOne(payload)  ;


gameService.getAllGamesFromDB = async(payload) => await GameModel.findAll(payload)  ;



module.exports = gameService ;
