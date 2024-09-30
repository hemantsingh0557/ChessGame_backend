// cronJobs.js

const cron = require('node-cron');
const { Op } = require('sequelize');
const { WaitingPlayerModel } = require('../models');

// Scheduled job to run every minute
cron.schedule('* * * * *', async () => {
    const cutoffTime = new Date(Date.now() - 60 * 1000); // 1 minute ago
    try {
        await WaitingPlayerModel.destroy({
            where: {
                createdAt: {
                    [Op.lt]: cutoffTime, // Delete records older than 1 minute
                },
            },
        });
        console.log('Old waiting players removed successfully.');
    } catch (error) {
        console.error('Error removing old waiting players:', error);
    }
});
