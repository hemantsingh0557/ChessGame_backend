const { SessionModel } = require("../models");


const sessionService = {} ;

sessionService.createSession = async(payload) => await SessionModel.create(payload) ;

sessionService.findSession = async(criteria) => await SessionModel.findOne(criteria) ;


sessionService.deleteSession = async(criteria) => await SessionModel.destroy(criteria) ;


module.exports = sessionService ;