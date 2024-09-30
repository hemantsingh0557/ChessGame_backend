/* eslint-disable no-console */

'use strict';


const { dbConnection , sequelize } = require('./app/startup/db_mySql');


/** *********************************
**** node module defined here *****
********************************** */
require('dotenv').config();
const http = require('http');
const process = require('process');
const EXPRESS = require('express');
const { SERVER } = require('./config');

/** creating express server app for server. */
const app = EXPRESS();

/** ******************************
***** Server Configuration *****
******************************* */
const server = http.Server(app);
const io = require('socket.io')(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
});

/** Server is running here */
const startNodeserver = async () => {
    await dbConnection();
    await require('./app/startup/expressStartup')(app); 
    await require('./app/startup/socket').connect(io);
    
    // await sequelize.sync({ force: true });
    await sequelize.sync({ alter: true });
    require('./app/utils/task.js');

    return new Promise((resolve, reject) => {
        server.listen(SERVER.PORT, (err) => {
            if (err) reject(err);
            resolve();
        });
    });
};

startNodeserver().then(() => {
    console.log('Node server running on', SERVER.URL);
}).catch((err) => {
    console.log('Error in starting server', err);
    // process.exit(1);
});




