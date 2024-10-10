const { DataTypes } = require('sequelize');
const { sequelize } = require('../startup/db_mySql');
const CONSTANTS = require('../utils/constants');


const GameModel = sequelize.define('GameModel', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    userId1: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    userId2: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    playerOneColor: {
        type: DataTypes.ENUM('w', 'b'),
        allowNull: false,
    },
    playerTwoColor: {
        type: DataTypes.ENUM('w', 'b'),
        allowNull: false,
    },
    finalGameStatus: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: CONSTANTS.GAME_STATUS.ONGOING,
    },
    finalWinnerUserId: {
        type: DataTypes.UUID,
        allowNull: true,
    },
    isCompleted: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: CONSTANTS.GAME_STATUS.NOT_COMPLETED
    },
    playerOneTimeRemaining: {  
        type: DataTypes.INTEGER, 
        allowNull: false,
        defaultValue: CONSTANTS.TIMER.CLASSICAL,  
    },
    playerTwoTimeRemaining: {  
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: CONSTANTS.TIMER.CLASSICAL,
    },
}, {
    timestamps: true,
    tableName: 'games',
});

module.exports = GameModel;
