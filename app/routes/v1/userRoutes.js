'use strict';

const { Joi } = require('../../utils/joiUtils');
const { userController } = require('../../controllers');

module.exports = [
    {
        method: 'POST',
        path: '/userSignup',
        joiSchemaForSwagger: {
            group: 'SERVER',
            description: 'Route to regsiter user',
            model: 'UserModel',
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
            group: 'SERVER',
            description: 'Route to login user.',
            model: 'UserModel',
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
            group: 'SERVER',
            description: 'Route to update user',
            model: 'UserModel',
            body :{
                imageUrl: Joi.string().required() ,  
                name: Joi.string().required() ,   
                email: Joi.string().email().required() , 
                username : Joi.string().min(3).required() ,
                age : Joi.number().min(10).max(100) ,
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
            group: 'SERVER',
            description: 'Route to get user details',
            model: 'UserModel',
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
            group: 'SERVER',
            description: 'Route to get other user details',
            model: 'UserModel',
            params : {
                otherUserId : Joi.string().required() ,
            }
        },
        auth : false , 
        handler: userController.getOtherUserDetails,
    },
    {
        method: 'PUT',
        path: '/changePassword',
        joiSchemaForSwagger: {
            group: 'SERVER',
            description: 'Route to change password',
            model: 'UserModel',
            body :{
                oldPassword: Joi.string().min(4).required() , // // match: [/(?=.*[a-zA-Z])(?=.*\d)(?=.*\W)/, 'Password must contain at least one letter, one number, and one special character']
                newPassword: Joi.string().min(4).required() , // // match: [/(?=.*[a-zA-Z])(?=.*\d)(?=.*\W)/, 'Password must contain at least one letter, one number, and one special character']
                confirmNewPassword : Joi.ref("newPassword") ,
            },
            headers: {
                authorization: Joi.string().required()
            }
        },
        auth : true , 
        handler: userController.changePassword,
    },
];
