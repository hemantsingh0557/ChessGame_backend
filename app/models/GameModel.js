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
}, 
{
    timestamps: true,    
    tableName: 'games',  
});

module.exports = GameModel;
