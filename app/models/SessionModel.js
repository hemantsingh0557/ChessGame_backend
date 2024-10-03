const { DataTypes } = require('sequelize');
const { sequelize } = require('../startup/db_mySql');

const SessionModel = sequelize.define('Session', { 
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
    token: {
        type: DataTypes.TEXT,  
        allowNull: false,    
    }
}, {
    timestamps: true,
    tableName: 'sessions',
});

module.exports = SessionModel;
