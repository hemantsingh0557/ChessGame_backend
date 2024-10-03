'use strict';

const { UserModel } = require('../models');
const { NORMAL_PROJECTION } = require('../utils/constants');




const userService = {};


userService.findOne = async (criteria) => await UserModel.findOne({ where: criteria });

userService.create = async (payload) => await UserModel.create(payload);

userService.updateUser = async (condition, updates) => {
    const [updatedCount] = await UserModel.update(updates, { where: condition });
    if(updatedCount) {
        return UserModel.findOne({ where: condition }); 
    }
    return null;  
};

userService.allUsersLookingForGameFromDB = async (criteria) => await UserModel.findAll(criteria) ;


userService.findAll = async (criteria) => await UserModel.findAll(criteria) ;

module.exports = userService;




