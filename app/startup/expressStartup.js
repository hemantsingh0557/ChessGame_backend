/* eslint-disable import/no-extraneous-dependencies */

'use strict';

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const routes = require('../routes');
const routeUtils = require('../utils/routeUtils');
const { log, logger } = require('../utils/utils');

module.exports = async (app) => {
    app.use(cors());
    app.use(express.json()) ;
    app.use('/public', express.static('public'));

    app.use((request, response, next) => {
        const start = process.hrtime.bigint();
        response.on('finish', () => {
            const end = process.hrtime.bigint();
            const seconds = Number(end - start) / 1000000000;
            const message = `${request.method} ${response.statusCode} ${request.url} took ${seconds} seconds`;

            if (response.statusCode >= 200 && response.statusCode <= 299) {
                log.success(message);
            } 
            else if (response.statusCode >= 400) {
                log.error(message);

                const payload = {
                    body: ((request.body || {}).value || {}),
                    params: ((request.params || {}).value || {}),
                    query: ((request.query || {}).value || {}),
                };
                // console.log( request.body ) ;
                const apiRequestData = `${request.method} ${request.routepath} ${response.statusCode} | 
                    ${response.statusMessage} ${request.body.error ? request.body.error.message : ''} | ${JSON.stringify(payload)}`;

                logger.error(apiRequestData);
            } else {
                log.info(message);
            }
        });
        next();
    });
    // app.all('/*', (request, response, next) => {
    //     response.header('Access-Control-Allow-Origin', '*');
    //     response.header(
    //         'Access-Control-Allow-Headers',
    //         'Content-Type, api_key, Authorization,x-requested-with, Total-Count, Total-Pages, Error-Message',
    //     );
    //     response.header('Access-Control-Allow-Methods', 'POST, GET, DELETE, PUT, OPTIONS');
    //     response.header('Access-Control-Max-Age', 1800);
    //     next();
    // });


    await routeUtils.route(app, routes); // initalize routes.
};