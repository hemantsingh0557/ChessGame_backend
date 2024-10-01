const { Joi } = require("../utils/joiUtils");

const socketEventsSchema = { } ;


socketEventsSchema.startGame = Joi.object({}); // Empty object for now

socketEventsSchema.joinGameRoom = Joi.object({
    gameRoomId: Joi.string().uuid().required(),
});

socketEventsSchema.validMoves = Joi.object({
    gameRoomId: Joi.string().uuid().required(),
    selectedPosition: Joi.string().length(2).required(),
    orientation: Joi.string().valid('w', 'b').required(),
});

socketEventsSchema.movePiece = Joi.object({
    gameRoomId: Joi.string().uuid().required(),
    fromPos: Joi.string().length(2).required(),
    toPos: Joi.string().length(2).required(),
    orientation: Joi.string().valid('w', 'b').required(),
});

module.exports = socketEventsSchema;
