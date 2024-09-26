'use strict';

/** ******************************
 ********* Import All routes ***********
 ******************************* */
const v1Routes = [
  ...require('./userRoutes'),
  ...require('./fileUploadRoutes') ,
];

module.exports = v1Routes;
