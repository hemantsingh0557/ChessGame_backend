const { gameController } = require("../../controllers");
const { Joi } = require("../../utils/joiUtils");



module.exports = [
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
            }
        } ,
        auth : true ,
        handler: gameController.getMovesHistory ,
    }
]