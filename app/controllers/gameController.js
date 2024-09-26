'use strict';

const { userService } = require("../services");



const gameController = {};


gameController.startGame = async (payload) => {
    const { user } = payload ;
    const userId = user.id ;
    const allUsersLookingForGame = await userService.allUsersLookingForGameFromDB({isLookingForGame : true }) ;
    
};



module.exports = gameController;