const { DataTypes, UUID } = require('sequelize');
const { sequelize } = require('../startup/db_mySql');

const GameModel = sequelize.define('GameModel', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    userId1: {
        type: DataTypes.UUID,
    },
    userId2: {
        type: DataTypes.UUID,
    },
}, 
{
    timestamps: true,
    tableName: 'games',
});

module.exports = GameModel;
