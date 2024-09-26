const { Sequelize } = require('sequelize');
const { MYSQL } = require('../../config');

// Create a new Sequelize instance
const sequelize = new Sequelize(
  MYSQL.DATABASE,
  MYSQL.USER,
  MYSQL.PASSWORD,
  {
    host: MYSQL.HOST,
    dialect: MYSQL.DAILECT ,
    logging : false ,
  }
);
//  sequelize.sync({ force: false });

// Function to establish the database connection
const dbConnection = async () => {
  try {
     sequelize.authenticate();
    // This will create the table if it doesn't exist
    //  sequelize.sync({ alter: true }); 
    console.log('MySQL Database connected and synced successfully');
  } 
  catch (error) {
    console.error('Unable to connect to the MySQL database:', error);
    throw error;
  }
};


// Export the connection function and sequelize instance
module.exports = {
  dbConnection,
  sequelize,
};
