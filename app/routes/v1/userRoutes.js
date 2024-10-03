'use strict';

const { Joi } = require('../../utils/joiUtils');
const { userController } = require('../../controllers');
const { query } = require('express');

module.exports = [
    {
        method: 'POST',
        path: '/userSignup',
        joiSchemaForSwagger: {
            group: 'User',
            description: 'Route to regsiter user',
            model: 'userSignup',
            body :{
                imageUrl: Joi.string().required() ,   
                name: Joi.string().required() ,   
                email: Joi.string().email().required() , 
                username : Joi.string().min(3).required() ,
                age : Joi.number().min(10).max(100) ,
                password: Joi.string().min(4).required() , // // match: [/(?=.*[a-zA-Z])(?=.*\d)(?=.*\W)/, 'Password must contain at least one letter, one number, and one special character']
                confirmPassword : Joi.ref("password") ,
            },
        },
        auth : false ,
        handler: userController.userSignup,
    },
    {
        method: 'POST',
        path: '/userSignin',
        joiSchemaForSwagger: {
            group: 'User',
            description: 'Route to login user.',
            model: 'userSignin',
            body : {
                email: Joi.string().email().required(),
                password: Joi.string().min(4).required(),
            }
        },
        auth : false ,
        handler: userController.userSignin,
    } ,
    {
        method: 'PUT',
        path: '/updateUser',
        joiSchemaForSwagger: {
            group: 'User',
            description: 'Route to update user',
            model: 'updateUser',
            body :{
                imageUrl: Joi.string().required() ,  
                name: Joi.string().required() ,   
                email: Joi.string().email().required() , 
                username : Joi.string().min(3).required() ,
                age : Joi.number().max(150) ,
            },
            headers: {
                authorization: Joi.string().required()
            }
        },
        auth : true , 
        handler: userController.updateUser,
    },
    {
        method: 'GET',
        path: '/getUserDetails',
        joiSchemaForSwagger: {
            group: 'User',
            description: 'Route to get user details',
            model: 'getUserDetails',
            headers: {
                authorization: Joi.string().required()
            }
        },
        auth : true , 
        handler: userController.getUserDetails,
    },
    {
        method: 'GET',
        path: '/getOtherUserDetails/:otherUserId',
        joiSchemaForSwagger: {
            group: 'User',
            description: 'Route to get other user details',
            model: 'getOtherUserDetails',
            headers: {
                authorization: Joi.string().required()
            } ,
            params : {
                otherUserId : Joi.string().required() ,
            }
        },
        auth : true , 
        handler: userController.getOtherUserDetails,
    },
    {
        method: 'PUT',
        path: '/changePassword',
        joiSchemaForSwagger: {
            group: 'User',
            description: 'Route to change password',
            model: 'changePassword',
            headers: {
                authorization: Joi.string().required()
            } ,
            body :{
                oldPassword: Joi.string().min(4).required() , // // match: [/(?=.*[a-zA-Z])(?=.*\d)(?=.*\W)/, 'Password must contain at least one letter, one number, and one special character']
                newPassword: Joi.string().min(4).required() , // // match: [/(?=.*[a-zA-Z])(?=.*\d)(?=.*\W)/, 'Password must contain at least one letter, one number, and one special character']
                confirmNewPassword : Joi.ref("newPassword") ,
            },
        },
        auth : true , 
        handler: userController.changePassword,
    },
    {
        method: 'GET',
        path: '/getAllUsernamesAndEmails',
        joiSchemaForSwagger: {
            group: 'User',
            description: 'Route to get all usernames And Emails',
            model: 'getAllUsernamesAndEmails',
            query :{
                username : Joi.string(),
                isOnline : Joi.boolean() ,
                skip : Joi.number().default(0) ,
                limit : Joi.number().default(10) ,
            }      
           
        },
        auth : false , 
        handler: userController.getAllUsernamesAndEmails,
    },
];
