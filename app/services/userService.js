'use strict';

const { userModel, UserModel } = require('../models');
const { NORMAL_PROJECTION } = require('../utils/constants');




const userService = {};


userService.findOne = async (criteria) => await userModel.findOne({ where: criteria });

userService.create = async (payload) => await userModel.create(payload);

userService.updateUser = async (condition, updates) => {
    const [updated] = await UserModel.update(updates, { where: condition });
    if(updated) {
        return UserModel.findOne({ where: condition }); 
    }
    return null;  
};

userService.allUsersLookingForGameFromDB = async () => await UserModel.findAll({where : criteria }) ;

module.exports = userService;




