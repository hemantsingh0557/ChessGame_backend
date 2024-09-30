const { gameController } = require("../../controllers");
const { Joi } = require("../../utils/joiUtils");



module.exports = [
    // {
    //     method : "POST" ,
    //     path : "/startGame",
    //     joiSchemaForSwagger : {
    //         group: 'Game',
    //         description: 'Route to start game',
    //         model: 'gameModel',
    //         headers: {
    //             authorization: Joi.string().required()
    //         }
    //     } ,
    //     auth : true ,
    //     handler: gameController.startGame ,
    // }
]