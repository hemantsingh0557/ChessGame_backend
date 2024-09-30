'use strict';

/** ******************************
 ********* Import All routes ***********
 ******************************* */
const v1Routes = [
  ...require('./userRoutes.js'),
  ...require('./fileUploadRoutes.js') ,
];

module.exports = v1Routes;
