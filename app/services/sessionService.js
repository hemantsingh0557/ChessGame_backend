const { SessionModel } = require("../models");


const sessionService = {} ;

sessionService.createSession = async(payload) => await SessionModel.create(payload) ;

sessionService.findSession = async(criteria) => await SessionModel.findOne(criteria) ;


module.exports = sessionService ;