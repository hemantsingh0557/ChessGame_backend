'use strict';

const { API_AUTH_KEY } = require('../../config');
const CONFIG = require('../../config');
const { decryptJwt } = require('../utils/utils');
const { createErrorResponse } = require('../helpers');
const { UserModel } = require('../models');
const { MESSAGES, ERROR_TYPES } = require('../utils/constants');
const CONSTANTS = require('../utils/constants');
const commonFunctions = require('../utils/utils');
const userService = require('./userService');
const sessionService = require('./sessionService');


const authService = {};

// authService.validateApiKey = () => (request, response, next) => {
//     if (request.headers['x-api-key'] === API_AUTH_KEY) {
//         return next();
//     }
//     const responseObject = createErrorResponse(MESSAGES.UNAUTHORIZED, ERROR_TYPES.UNAUTHORIZED);
//     return response.status(responseObject.statusCode).json(responseObject);
// };


authService.userValidate = () => async (req, res, next) => {
    try {
        const token = req.headers.authorization.split(" ")[1];
        const decodedToken = commonFunctions.decryptJwt(token);
        if (!decodedToken || !decodedToken.userId) {
            return res.status(401).json(createErrorResponse(MESSAGES.UNAUTHORIZED, ERROR_TYPES.UNAUTHORIZED));
        }
        const { userId } = decodedToken;
        const user = await UserModel.findOne({ where: { id: userId } });
        if (!user) {
            return res.status(401).json(createErrorResponse(MESSAGES.UNAUTHORIZED, ERROR_TYPES.UNAUTHORIZED));
        }
        const session = await sessionService.findSession({ where: { userId, token } });
        if (!session) {
            return res.status(401).json(createErrorResponse(MESSAGES.UNAUTHORIZED, ERROR_TYPES.UNAUTHORIZED));
        }
        req.userId = userId;
        req.user = user;
        next();
    } catch (error) {
        const responseObject = createErrorResponse(MESSAGES.UNAUTHORIZED, ERROR_TYPES.UNAUTHORIZED);
        return res.status(responseObject.statusCode).json(responseObject);
    }
};


authService.socketAuthentication = async (socket, next) => {
    try {
        const token = socket.handshake.query.authorization.split(" ")[1];  
        const decodedToken = decryptJwt(token);
        if (!decodedToken || !decodedToken.userId) {
            return next({ success: false, message: MESSAGES.UNAUTHORIZED });
        }
        const { userId } = decodedToken;
        const user = await userService.findOne({ id: userId });
        if (!user) {
            return next({ success: false, message: MESSAGES.UNAUTHORIZED });
        }
        const session = await sessionService.findSession({ where: { userId : user.id , token } });
        if (!session) {
            return next({ success: false, message: MESSAGES.UNAUTHORIZED });
        }
        socket.user = user;

        /*
        const groupData = await dbService.find(conversationRoomModel, { 'members.userId': { $eq: userId } });
        if (!groupData) {
            return next({ success: false, message: MESSAGES.NOT_FOUND });
        }
        for (let i = 0; i < groupData.length; i++) {
            socket.join(groupData[i].uniqueCode);
        }
        */
        
        return next(); // Proceed to the next middleware
    } 
    catch (err) {
        console.error('Error in socket authentication:', err); // Log the error for debugging
        return next({ success: false, message: MESSAGES.SOMETHING_WENT_WRONG });
    }
};


module.exports = authService;
