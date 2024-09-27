const { Sequelize, DataTypes } = require("sequelize");
const CONSTANTS = require("../utils/constants");

const GameStateModel = new Sequelize({
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    gameRoomId: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    userId1: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    userId2: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    boardState: {
        type: DataTypes.JSON,  
        allowNull: false,
    },
    currentTurn: {
        type: DataTypes.STRING,
        defaultValue: CONSTANTS.GAME_TURNS.WHITE ,  
        allowNull: false,
    },
    status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: CONSTANTS.GAME_STATUS.ONGOING , 
    },
},
{
    timestamps: true,
    tableName: 'gamesState',
});

module.exports = GameStateModel;
