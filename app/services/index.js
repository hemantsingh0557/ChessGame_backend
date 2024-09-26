'use strict';

/** ******************************
 **** Managing all the services ***
 ********* independently ********
 ******************************* */
module.exports = {
    swaggerService: require('./swaggerService'),
    authService: require('./authService'),
    userService: require('./userService.js'),
};
