const { DataTypes, UUID } = require('sequelize');
const { sequelize } = require('../startup/db_mySql');

const UserModel = sequelize.define('UserModel', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    imageUrl: {
        type: DataTypes.STRING,
        allowNull: false,
        // validate: { isUrl: true }, 
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: { notEmpty: true, len: [3, 30] },
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: { isEmail: true },
    },
    username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: { len: [3, 30] },
    },
    age: {
        type: DataTypes.INTEGER,
        allowNull: true,
        validate: { min: 10, max: 150 },
    },
    isOnline: {
        type:DataTypes.BOOLEAN ,
        allowNull :false ,
        defaultValue: true ,
    },
    isLookingForGame: {
        type:DataTypes.BOOLEAN ,
        allowNull :false ,
        defaultValue: false ,
    },
    rating: {
        type: DataTypes.INTEGER,
        allowNull: false ,
        defaultValue: 0,
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: { notEmpty: true },
    },
}, 
{
    timestamps: true,
    tableName: 'users',
});

module.exports = UserModel;
