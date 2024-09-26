'use strict';

const { userModel } = require('../models');
const { NORMAL_PROJECTION } = require('../utils/constants');




const userService = {};


userService.findOne = async (criteria) => await userModel.findOne({ where: criteria });

userService.create = async (payload) => await userModel.create(payload);

userService.updateUser = async (user, payload) => {
    const { name, email, username, mobileNumber, profileImage, age, statusMessage } = payload;
    if(name) user.name = name;
    if(email) user.email = email;
    if(username) user.username = username;
    if(mobileNumber) user.mobileNumber = mobileNumber;
    if(profileImage) user.profileImage = profileImage;
    if(age) user.age = age;
    if(statusMessage) user.statusMessage = statusMessage;
    await user.save(); 
    return user; 
};

module.exports = userService;




