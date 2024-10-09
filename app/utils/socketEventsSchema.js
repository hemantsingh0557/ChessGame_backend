const { Joi } = require("../utils/joiUtils");

const socketEventsSchema = { } ;


socketEventsSchema.startGame = Joi.object({}); // Empty object for now

socketEventsSchema.joinGameRoom = Joi.object({
    gameRoomId: Joi.string().uuid().required(),
});

socketEventsSchema.getGameState = Joi.object({
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
    promotedPiece: Joi.string().valid('q', 'r' , 'b' , 'n').optional(),
});

socketEventsSchema.leaveGame = Joi.object({
    gameRoomId: Joi.string().uuid().required(),
});

module.exports = socketEventsSchema;
