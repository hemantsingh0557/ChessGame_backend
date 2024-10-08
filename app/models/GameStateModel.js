const { DataTypes } = require('sequelize');
const { sequelize } = require('../startup/db_mySql');
const CONSTANTS = require("../utils/constants");

const GameStateModel = sequelize.define('GameState', { 
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    gameRoomId: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    boardState: {
        type: DataTypes.STRING,  
        allowNull: false,
    },
    currentTurn: {
        type: DataTypes.STRING,
        defaultValue: CONSTANTS.GAME_TURNS.WHITE, 
        allowNull: false,
    },
    nextTurn: {
        type: DataTypes.STRING,
        defaultValue: CONSTANTS.GAME_TURNS.BLACK, 
        allowNull: false,
    },
    currentMove: {
        type: DataTypes.STRING,  
        allowNull: true,
    },
    piece: {
        type: DataTypes.STRING,  
        allowNull: true,
    },
    promotedPiece: {
        type: DataTypes.STRING,  
        allowNull: true,
    },
    status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: CONSTANTS.GAME_STATUS.ONGOING,
    },
}, {
    timestamps: true,
    tableName: 'gamesStates',
});

module.exports = GameStateModel;
