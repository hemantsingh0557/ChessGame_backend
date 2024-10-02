/* eslint-disable no-console */

'use strict';

const fs = require('fs');
const pino = require('pino');
const BCRYPT = require('bcrypt');
const JWT = require('jsonwebtoken');
const { createPinoBrowserSend, createWriteStream } = require('pino-logflare');
const CONSTANTS  = require('./constants');
const {SOCKET_EVENTS , MESSAGES } = require('./constants');
const CONFIG = require(`../../config`);

const { PINO, LIVE_LOGGER_ENABLE } = require('../../config');
const socketEventsSchema = require('./socketEventsSchema');

const PINO_CRED = { apiKey: PINO.API_KEY, sourceToken: PINO.API_SECRET };

const stream = createWriteStream(PINO_CRED); // create pino-logflare stream
const send = createPinoBrowserSend(PINO_CRED); // create pino-logflare browser stream

const commonFunctions = {};



commonFunctions.validateSocketEvent = ([event, ...args], next) => {
    console.log(`Event received: ${event}, Data received:`, args[0]);
    let data = {} ;
    if (event !== SOCKET_EVENTS.START_GAME) {
        console.log( "eventname  " , event  ) ;
        data = args[0] ? JSON.parse(args[0]) : {}; 
        args[0] = data; // Store parsed data in args[0]
        console.log( data , "okkoko ", args[0] ) ;
    }
    let result;
    try {
        if (event === SOCKET_EVENTS.START_GAME) {
            result = socketEventsSchema.startGame.validate(data);
        } 
        else if (event === SOCKET_EVENTS.JOIN_GAME_ROOM) {
            result = socketEventsSchema.joinGameRoom.validate(data);
        } 
        else if (event === SOCKET_EVENTS.VALID_MOVES) {
            result = socketEventsSchema.validMoves.validate(data);
        } 
        else if (event === SOCKET_EVENTS.MOVE_PIECE) {
            result = socketEventsSchema.movePiece.validate(data);
        }
        if (result.error) {
            console.log(`Validation Error:`, result.error.details[0].message);
            return next(new Error(result.error.details[0].message));
        }
        console.log( "validate sucessfully" ) ;
        next(); 
    } catch (error) {
        console.log('Validation Error:', error);
        next(new Error('Invalid event data'));
    }
};




/**
 * incrypt password in case user login implementation
 * @param {*} payloadString
 */
commonFunctions.hashPassword = (payloadString) => BCRYPT.hashSync(payloadString, CONSTANTS.SECURITY.BCRYPT_SALT);

/**
 * @param {string} plainText
 * @param {string} hash
 */
commonFunctions.compareHash = (payloadPassword, userPassword) => BCRYPT.compareSync(payloadPassword, userPassword);

/**
 * function to get array of key-values by using key name of the object.
 */
// commonFunctions.getEnumArray = (obj) => Object.keys(obj).map((key) => obj[key]);

/**
 * used for converting string id to mongoose object id
 */
// commonFunctions.convertIdToMongooseId = (stringId) => MONGOOSE.Types.ObjectId(stringId);

/** used for comare mongoose object id */
// commonFunctions.matchMongoId = (id1, id2) => id1.toString() === id2.toString();

/**
 * create jsonwebtoken
 */
commonFunctions.encryptJwt = (payload, expTime = '365d') => JWT.sign(payload, CONSTANTS.SECURITY.JWT_SIGN_KEY, { algorithm: 'HS256' }, { expTime: expTime });

/**
 * decrypt jsonwebtoken
 */
commonFunctions.decryptJwt = (token) => JWT.verify(token, CONSTANTS.SECURITY.JWT_SIGN_KEY, { algorithm: 'HS256' });

/**
 * function to convert an error into a readable form.
 * @param {} error
 */
commonFunctions.convertErrorIntoReadableForm = (error) => {
    let errorMessage = '';
    if (error.message.indexOf('[') > -1) {
        errorMessage = error.message.substr(error.message.indexOf('['));
    } else {
        errorMessage = error.message;
    }
    errorMessage = errorMessage.replace(/"/g, '');
    errorMessage = errorMessage.replace('[', '');
    errorMessage = errorMessage.replace(']', '');
    error.message = errorMessage;
    return error;
};

/**
 * Logger for error and success
 */
commonFunctions.log = {
    info: (data) => {
        console.log(`\x1b[33m${data}`, '\x1b[0m');
    },
    success: (data) => {
        console.log(`\x1b[32m${data}`, '\x1b[0m');
    },
    error: (data) => {
        console.log(`\x1b[31m${data}`, '\x1b[0m');
    },
    default: (data) => {
        console.log(data, '\x1b[0m');
    },
};

/**
 * function to get pagination condition for aggregate query.
 * @param {*} sort
 * @param {*} skip
 * @param {*} limit
 */
// commonFunctions.getPaginationConditionForAggregate = (sort, skip, limit) => {
//     const condition = [
//         ...(sort ? [{ $sort: sort }] : []),
//         { $skip: skip },
//         { $limit: limit },
//     ];
//     return condition;
// };

/**
 * Function to send email from aws
 * @param {*} userData 
 * @param {*} type 
 * @returns 
 */
// commonFunctions.sendEmailViaAWS = async (userData, subject, template) => {
//     let params = {
//         Source: CONFIG.SES.SENDER,
//         Destination: {
//             ToAddresses: [
//                 userData.email
//             ],
//         },
//         Message: {
//             Body: {
//                 Html: {
//                     Charset: 'UTF-8',
//                     Data: template,
//                 },
//             },
//             Subject: {
//                 Charset: 'UTF-8',
//                 Data: subject,
//             }
//         },
//     };

//     return AWS_SES.sendEmail(params).promise();
// }

/**
 * Send an email to perticular user mail
 * @param {*} email email address
 * @param {*} subject  subject
 * @param {*} content content
 * @param {*} cb callback
 */

// commonFunctions.sendEmail = async (userData, type) => {
//     const HANDLEBARS = require('handlebars');

//     /* setup email data */
//     userData.baseURL = CONFIG.SERVER_URL;
//     const mailData = commonFunctions.emailTypes(userData, type);
//     mailData.template = fs.readFileSync(mailData.template, 'utf-8');
//     let template = HANDLEBARS.compile(mailData.template);
//     let result = template(mailData.data);

//     return await commonFunctions.sendEmailViaAWS(userData, mailData.Subject, result)

// };

/**
 * function to create template
 */
// commonFunctions.emailTypes = (user, type) => {
//     const EmailStatus = {
//         Subject: '',
//         data: {},
//         template: '',
//     };
//     switch (type) {
//         case CONSTANTS.EMAIL_TYPES.FORGOT_PASSWORD_EMAIL:
//             EmailStatus["Subject"] = CONSTANTS.EMAIL_SUBJECTS.RESET_PASSWORD_EMAIL;;
//             EmailStatus.template = CONSTANTS.EMAIL_CONTENTS.RESET_PASSWORD_TEMPLATE;
//             EmailStatus.data["name"] = user.userName;
//             EmailStatus.data["link"] = user.resetPasswordLink;
//             EmailStatus.data["baseURL"] = user.baseURL;
//             break;
//         default:
//             EmailStatus.Subject = 'Welcome Email!';
//             break;
//     }
//     return EmailStatus;
// };

/**
 * function to make email template dynamic.
 */
// commonFunctions.renderTemplate = (template, data) => handlebars.compile(template)(data);

/**
 * function to create reset password link.
 */
// commonFunctions.createResetPasswordLink = (userData) => {
//     const dataForJWT = { ...userData, Date: Date.now };
//     let resetPasswordLink = CONFIG.WEB_ADMIN_URL + '/auth/reset-password/' + commonFunctions.encryptJwt(dataForJWT, '1h');
//     return resetPasswordLink;
// };

/**
 * function to generate random otp string
 */
// commonFunctions.generateOTP = (length) => {
//     const chracters = '0123456789';
//     let randomString = '';
//     for (let i = length; i > 0; --i) { randomString += chracters[Math.floor(Math.random() * chracters.length)]; }

//     return randomString;
// };

/**
 * function to returns a random number between min and max (both included)
 */
// commonFunctions.getRandomInteger = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

/**
 * Function to generate expiry time in seconds
 */
// commonFunctions.generateExpiryTime = (seconds) => new Date(new Date().setSeconds(new Date().getSeconds() + seconds));

/**
 * function to convert seconds in HMS string
 */
// commonFunctions.convertSecondsToHMS = (value) => {
//     const sec = parseInt(value, 10);
//     const hours = Math.floor(sec / 3600);
//     const minutes = Math.floor((sec - (hours * 3600)) / 60);
//     const seconds = sec - (hours * 3600) - (minutes * 60);
//     let str = '';
//     if (hours) str = str + hours + (hours > 1 ? ' Hours' : ' Hour');
//     if (minutes) str = `${str} ${minutes}${minutes > 1 ? ' Minutes' : ' Minute'}`;
//     if (seconds) str = `${str} ${seconds}${seconds > 1 ? ' Seconds' : ' Second'}`;

//     return str.trim();
// };

/**
 * Variable to create logging
 */
commonFunctions.logger = (() => {
    if (LIVE_LOGGER_ENABLE) {
        return pino({
            browser: {
                transmit: {
                    send,
                },
            },
        }, stream);
    }

    if (!fs.existsSync('./error.log')) {
        fs.writeFileSync('./error.log', '');
    }
    return pino(pino.destination('./error.log'));
})();

/**
 * Function to connect to blockchain network
 */
// commonFunctions.connectToNetwork = async () => {
//     const web3 = new WEB3(new WEB3.providers.HttpProvider(process.env.INFURA_LINK));
//     const contract = new web3.eth.Contract(require('../../abi.json'), process.env.CONTRACT_ADDRESS);
//     const decoder = new InputDataDecoder(require('../../abi.json'));
//     return { web3, contract, decoder };
// };

/**
 * Function to connect to blockchain socekets
 */
// commonFunctions.connectToSocketNetwork = async () => {
//     const web3 = new WEB3(new WEB3.providers.WebsocketProvider(process.env.INFURA_WEBSOCKET_LINK));
//     const contract = new web3.eth.Contract(require('../../abi.json'), process.env.CONTRACT_ADDRESS);
//     const decoder = new InputDataDecoder(require('../../abi.json'));
//     return { web3, contract, decoder };
// };


/**
* function to add time
*/
// commonFunctions.addMinutesToDate = (date, minutes) => {
//     return new Date(date.getTime() + minutes * 60000);
// }

// commonFunctions.generateReferralCode = () => {
//     let code = '';
//     // without zero or 'O'  
//     let characters = 'ABCDEFGHIJKLMNPQRSTUVWXYZ123456789';
//     let charactersLength = characters.length;
//     for (let i = 0; i < CONSTANTS.REFERRAL_CODE_LENGTH; i++) {
//         code += characters.charAt(Math.floor(Math.random() * charactersLength));
//     }
//     return code;
// }

/** 
 * function to generate random password
 */
// commonFunctions.generatePassword = () => {
//     let numLc = 4;
//     let numUc = 2;
//     let numDigits = 2;
//     let numSpecial = 1;

//     var lowerCaseLetter = 'abcdefghijklmnopqrstuvwxyz';
//     var uperCaseLetter = lowerCaseLetter.toUpperCase();
//     var numbers = '0123456789';
//     var special = '!?=#*$@+-';

//     var pass = [];
//     for (var i = 0; i < numLc; ++i) { pass.push(commonFunctions.getRandom(lowerCaseLetter)) }
//     for (var i = 0; i < numUc; ++i) { pass.push(commonFunctions.getRandom(uperCaseLetter)) }
//     for (var i = 0; i < numDigits; ++i) { pass.push(commonFunctions.getRandom(numbers)) }
//     for (var i = 0; i < numSpecial; ++i) { pass.push(commonFunctions.getRandom(special)) }

//     return commonFunctions.shuffle(pass).join('');

//     // let chracters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
//     // let randomString = '';
//     // for (let i = length; i > 0; --i) randomString += chracters[Math.floor(Math.random() * chracters.length)];
//     // return randomString;
// };

// commonFunctions.getRandom = function (values) {
//     return values.charAt(Math.floor(Math.random() * values.length));
// }

// commonFunctions.shuffle = function (o) {
//     for (var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
//     return o;
// };

// commonFunctions.timeStampDiffernceInSeconds = (t1, t2) => {
//     const result = Math.floor(Math.abs(+t1 - (+t2)) / 1000)
//     return result;
// };

/*
* Function to multiply two strings
*/
// commonFunctions.multiplyString = (num1, num2) => {
//     let len1 = num1.length;
//     let len2 = num2.length;
//     let res = Array(len1 + len2).fill(0);
//     let carry = 0;
//     let val = 0;
//     let index = 0;

//     for (let i = len1 - 1; i >= 0; i--) {
//         carry = 0;
//         for (let j = len2 - 1; j >= 0; j--) {
//             index = len1 + len2 - 2 - i - j;
//             val = (num1[i] * num2[j]) + carry + res[index];
//             carry = Math.floor(val / 10);
//             res[index] = val % 10;
//         }
//         if (carry) res[index + 1] = carry;
//     }

//     while (res.length > 1 && res[res.length - 1] === 0) res.pop();

//     return res.reverse().join('');
// }

/**
 * function to convert currency
 */
// commonFunctions.convertWeiToEther = async (wei) => {
//     const { web3 } = await commonFunctions.connectToNetwork();
//     const valueInEth = await web3.utils.fromWei(wei.toString(), 'ether');
//     return valueInEth;
// }

/*
Function for encodeing upperCase string to number
*/
// commonFunctions.encodeString = (string) => {
//     let encodedRefrral = 0;
//     for (let i = 0; i < string.length; i++) {
//         encodedRefrral *= 100;
//         encodedRefrral += string.charCodeAt(i)
//     }
//     return encodedRefrral;
// }

/*
Function for decoding number to upperCase string
*/
// commonFunctions.decodeNumberString = (encodedNumber) => {
//     const decodedStringLength = encodedNumber.toString().length / 2
//     let output = "";
//     let num = encodedNumber;

//     for (let i = 0; i < decodedStringLength; i++) {
//         let charCode = num / Math.pow(100, decodedStringLength - 1 - i);
//         num = num % Math.pow(100, decodedStringLength - 1 - i);
//         output += String.fromCharCode(charCode);
//     }
//     return output;
// };

module.exports = commonFunctions;
