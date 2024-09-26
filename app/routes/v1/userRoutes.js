'use strict';

const { Joi } = require('../../utils/joiUtils');
const { userController } = require('../../controllers');

module.exports = [
  {
    method: 'POST',
    path: '/userSingup',
    joiSchemaForSwagger: {
      group: 'SERVER',
      description: 'Route to regsiter user',
      model: 'userModel',
      body :{
        name: Joi.string().required() ,   
        email: Joi.string().email().required() , 
        username : Joi.string().min(3).required() ,
        mobileNumber : Joi.string().length(10).pattern(/[6-9]{1}[0-9]{9}/) ,
        profileImage: Joi.string().uri().optional(),
        age : Joi.number().min(10).max(100) ,
        statusMessage: Joi.string() ,
        password: Joi.string().min(4).required() , // // match: [/(?=.*[a-zA-Z])(?=.*\d)(?=.*\W)/, 'Password must contain at least one letter, one number, and one special character']
        confirmPassword : Joi.ref("password") ,
      },
    },
    auth : false ,
    handler: userController.userSignup,
  },
  {
    method: 'POST',
    path: '/userSingin',
    joiSchemaForSwagger: {
      group: 'SERVER',
      description: 'Route to login user.',
      model: 'userModel',
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
      model: 'userModel',
      body :{
        name: Joi.string().required() ,   
        email: Joi.string().email().required() , 
        username : Joi.string().min(3).required() ,
        mobileNumber : Joi.string().length(10).pattern(/[6-9]{1}[0-9]{9}/) ,
        profileImage: Joi.string().uri().optional(),
        age : Joi.number().min(10).max(100) ,
        statusMessage: Joi.string() ,
      },
    },
    auth : true , 
    handler: userController.updateUser,
  },
];
