'use strict';

const { UserModel } = require('../models');
const { userService } = require('../services');
const { createSuccessResponse, createErrorResponse } = require('../helpers');
const CONSTANTS = require('../utils/constants');
const bcrypt = require('bcrypt');
const { USER_ALREADY_EXISTS, NO_USER_FOUND, INVALID_PASSWORD } = require('../utils/messages');
const commonFunctions = require('../utils/utils');
const { Op, where } = require('sequelize');

/** ************************************************
 ***************** User Controller ***************
 ************************************************* */
const userController = {};


userController.userSignup = async (payload) => {
    const { imageUrl , name , email , username , age , password } = payload;
    console.log(payload)
    const existingUser = await userService.findOne({
        [Op.or]: [{ email }, { username }]
    });
    if(existingUser) {
        return createErrorResponse( USER_ALREADY_EXISTS , CONSTANTS.ERROR_TYPES.ALREADY_EXISTS);
    }
    const hashedPassword = commonFunctions.hashPassword(password) ;
    const user = await userService.create({ 
        imageUrl ,
        name , 
        email , 
        username , 
        age  , 
        password : hashedPassword , 
    });
    
    const jwtToken = commonFunctions.encryptJwt({userId : user.id , email, username}) ; 
    return createSuccessResponse({ user , jwtToken }, 201); 
};



userController.userSignin = async (payload) => {
    const { email, password } = payload ; 
    const user = await userService.findOne({ email });
    if(!user) {
        return createErrorResponse( NO_USER_FOUND , CONSTANTS.ERROR_TYPES.DATA_NOT_FOUND);
    }
    const isMatch = commonFunctions.compareHash(password , user.password) ;
    if(!isMatch) {
        return createErrorResponse( INVALID_PASSWORD , CONSTANTS.ERROR_TYPES.BAD_REQUEST);
    }
    const jwtToken = commonFunctions.encryptJwt({userId : user.id , email : user.email, username: user.username}) ;
    return createSuccessResponse({ user , jwtToken }, 201); 
};


userController.updateUser = async (payload) => {
    const { user , imageUrl , name, email, username, age } = payload;
    const checkUser = await userService.findOne({ id: user.id });
    if (!checkUser) {
        return createErrorResponse(NO_USER_FOUND, CONSTANTS.ERROR_TYPES.DATA_NOT_FOUND);
    }
    const existingUser = await userService.findOne({
        [Op.or]: [{ email }, { username }],
        id: { [Op.ne]: user.id }
    });
    if (existingUser) {
        return createErrorResponse(USER_ALREADY_EXISTS, CONSTANTS.ERROR_TYPES.ALREADY_EXISTS);
    }
    const updatedUser = await userService.updateUser(
        { id: user.id },  
        {
            imageUrl,
            name,
            email,
            username,
            age,
        }
    );
    return createSuccessResponse({ user: updatedUser }, 200);
};



module.exports = userController;