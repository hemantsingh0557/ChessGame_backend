const { createErrorResponse, createSuccessResponse } = require("../helpers");
const { userService, fileUploadService } = require("../services");
const { MESSAGES, ERROR_TYPES } = require("../utils/constants");



const fileUploadController = {} ;

fileUploadController.uploadFile = async(payload) => {
    const { user , file } = payload;
    if (!file || !file.buffer) {
        return createErrorResponse(MESSAGES.FILE_REQUIRED_IN_PAYLOAD, ERROR_TYPES.BAD_REQUEST);
    }
    const fileName = `${Date.now()}.${file.originalname}`; // Unique filename
    const fileUrl = await fileUploadService.uploadFileToLocal(payload, fileName, null, null );
    return createSuccessResponse(MESSAGES.FILE_UPLOADED_SUCCESSFULLY , { imageUrl: fileUrl } );

}

module.exports = fileUploadController ;
