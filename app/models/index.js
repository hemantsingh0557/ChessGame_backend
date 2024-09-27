'use strict';

/** ******************************
 **** Managing all the models ***
 ********* independently ********
 ******************************* */

// Import models
const UserModel = require('./UserModel.js');
const GameModel = require('./GameModel.js');
const GameStateModel = require('./GameStateModel.js');


// Define relationships

module.exports = {
  UserModel,
  GameModel ,
  GameStateModel ,
};
