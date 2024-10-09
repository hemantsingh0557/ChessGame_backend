const { gameController } = require("../../controllers");
const { Joi } = require("../../utils/joiUtils");



module.exports = [
    {
        method : "GET" ,
        path : "/getGameCurrentState/:gameRoomId",
        joiSchemaForSwagger : {
            group: 'Game',
            description: 'Route to get the current state of the game ',
            model: 'getGameCurrentState',
            headers: {
                authorization: Joi.string().required()
            },
            params : {
                gameRoomId: Joi.string().uuid().required(),
            } ,  
        } ,
        auth : true ,
        handler: gameController.getGameCurrentState ,
    } ,
    {
        method : "GET" ,
        path : "/getMovesHistory/:gameRoomId",
        joiSchemaForSwagger : {
            group: 'Game',
            description: 'Route to get the moves history of the game ',
            model: 'getMovesHistory',
            headers: {
                authorization: Joi.string().required()
            },
            params : {
                gameRoomId: Joi.string().uuid().required(),
            } ,
            query :{
                skip : Joi.number().default(0) ,
                limit : Joi.number().default(10) ,
            }    
        } ,
        auth : true ,
        handler: gameController.getMovesHistory ,
    } ,
    {
        method : "GET" ,
        path : "/getUserAllGameHistory/",
        joiSchemaForSwagger : {
            group: 'Game',
            description: 'Route to get all the games history of the user ',
            model: 'getUserAllGameHistory',
            headers: {
                authorization: Joi.string().required()
            },
            query :{
                skip : Joi.number().default(0) ,
                limit : Joi.number().default(20) ,
            }    
        } ,
        auth : true ,
        handler: gameController.getUserAllGameHistory ,
    }
]