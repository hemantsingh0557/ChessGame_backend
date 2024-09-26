/* eslint-disable eqeqeq */
/* eslint-disable consistent-return */
/* eslint-disable no-console */

'use strict';

const fs = require('fs');
const path = require('path');
const CONFIG = require('../../config');
const { FILE_UPLOAD_TYPE } = require('../utils/constants');


const fileUploadService = {};


/**
 * function to upload file to local server.
 */
fileUploadService.uploadFileToLocal = async (payload, fileName, pathToUpload, pathOnServer) => {
    const directoryPath = pathToUpload || path.resolve(`${__dirname}../../../..${CONFIG.PATH_TO_UPLOAD_SUBMISSIONS_ON_LOCAL}`);
    if (!fs.existsSync(directoryPath)) {
        fs.mkdirSync(directoryPath);
    }
    const fileSavePath = `${directoryPath}/${fileName}`;
    const writeStream = fs.createWriteStream(fileSavePath);
    return new Promise((resolve, reject) => {
            writeStream.write(payload.file.buffer);
            writeStream.on('error', (err) => {
            reject(err);
        });
        writeStream.end((err) => {
            if (err) {
                reject(err);
            } 
            else {
                const fileUrl = pathToUpload ? `${CONFIG.SERVER_URL}${pathOnServer}/${fileName}`
                : `${CONFIG.SERVER_URL}${CONFIG.PATH_TO_UPLOAD_SUBMISSIONS_ON_LOCAL}/${fileName}`;
                resolve(fileUrl);
            }
        });
    });
};







/**
 * function to upload a file on either local server or on s3 bucket.
 */
// fileUploadService.uploadFile = async (payload, pathToUpload, pathOnServer) => {
//   const fileNameArray = payload.file.originalname.split('.');
//   const fileExtention = fileNameArray[fileNameArray.length - 1] || 'png';
//   let fileName = `upload_${Date.now()}.${fileExtention}`; let
//     fileUrl = '';

//   if (payload.type == FILE_UPLOAD_TYPE.PROFILE_IMAGE) {
//     fileName = `profile_${Date.now()}.${fileExtention}`;
//   }
//   if (payload.type == FILE_UPLOAD_TYPE.CHAT_MEDIA) {
//     fileName = `${payload.groupId}/chat_${Date.now()}.${fileExtention}`;
//   }

//   if (CONFIG.UPLOAD_TO_S3_BUCKET) {
//     fileUrl = await fileUploadService.uploadFileToS3(payload, fileName, CONFIG.S3_BUCKET.bucketName);
//   } else {
//     fileUrl = await fileUploadService.uploadFileToLocal(payload, fileName, pathToUpload, pathOnServer);
//   }
//   return fileUrl;
// };










module.exports = fileUploadService;
