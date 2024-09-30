const { DataTypes } = require('sequelize');
const { sequelize } = require('../startup/db_mySql');

const WaitingPlayerModel = sequelize.define('WaitingPlayer', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: false,  
        unique: true, 
    },
}, 
{
    timestamps: true,
    tableName: 'waitingPlayers',
});

module.exports = WaitingPlayerModel;
