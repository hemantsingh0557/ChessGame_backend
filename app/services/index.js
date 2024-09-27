'use strict';

/** ******************************
 **** Managing all the services ***
 ********* independently ********
 ******************************* */
module.exports = {
    swaggerService: require('./swaggerService'),
    authService: require('./authService'),
    userService: require('./userService.js'),
    fileUploadService: require('./fileUploadService.js'),
    gameService: require('./gameService.js'),
    gameStateService: require('./gameStateService.js'),
};
