const { SOCKET_EVENTS } = require('../utils/constants');
const socketEventsSchema = require('../utils/socketEventsSchema');

function checkResult(result) {
    if (result.error) {
        throw new Error(result.error)
    }
}

const validateService = { }
validateService.validateSocketEvent = ([event, ...args], next) => {
    
    let result
    try {
        if (event === SOCKET_EVENTS.CREATE_GROUP) {
            result = socketEventsSchema.createGroup.validate(JSON.parse(args[0]));
            checkResult(result)
        } else if (event === SOCKET_EVENTS.JOIN_ROOM) {
            result = chatSchema.joinRoom.validate(JSON.parse(args[0]));
            checkResult(result)
        } else if (event === SOCKET_EVENTS.LEAVE_ROOM) {
            result = chatSchema.leaveRoom.validate(JSON.parse(args[0]));
            checkResult(result)
        } else if (event === SOCKET_EVENTS.MESSAGE) {
            result = chatSchema.sendMessageSchema.validate(JSON.parse(args[0]));
            checkResult(result)
        }

        next()
    } catch (error) {
        console.log('Error', error);
    }
}

module.exports = validateService

