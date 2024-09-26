const { fileUploadController } = require("../../controllers");




module.exports = [
    {
        method : "POST" ,
        path : "/uploadFile" ,
        joiSchemaForSwagger: {
            formData: {
                file: {
                    profileImage: 1, 
                }
            },
        },
        auth : false ,
        handler : fileUploadController.uploadFile
    }
]
