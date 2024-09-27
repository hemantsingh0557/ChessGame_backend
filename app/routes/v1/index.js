'use strict';

/** ******************************
 ********* Import All routes ***********
 ******************************* */
const v1Routes = [
  ...require('./userRoutes.js'),
  ...require('./fileUploadRoutes.js') ,
  ...require('./gameRoutes.js') ,
];

module.exports = v1Routes;
