const { createErrorResponse, createSuccessResponse } = require("../helpers");
const { userService, fileUploadService } = require("../services");
const { MESSAGES, ERROR_TYPES } = require("../utils/constants");



const fileUploadController = {} ;

fileUploadController.uploadFile = async(payload) => {
    const { user , file } = payload;
    if (!file || !file.buffer) {
        return createErrorResponse(MESSAGES.FILE_REQUIRED_IN_PAYLOAD, ERROR_TYPES.BAD_REQUEST);
    }
    const fileName = `profile_${user.id}_${Date.now()}.${file.originalname.split('.').pop()}`; // Unique filename
    const fileUrl = await fileUploadService.uploadFileToLocal(payload, fileName, null, null );
    return createSuccessResponse({ fileUrl }, MESSAGES.FILE_UPLOADED_SUCCESSFULLY);

}

module.exports = fileUploadController ;
