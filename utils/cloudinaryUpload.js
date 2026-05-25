const cloudinary = require("cloudinary").v2;
const CustomError = require("../errors");

cloudinary.config({
  cloud_name: process.env.CLOUDNARY_NAME,
  api_key: process.env.CLOUDNARY_API_KEY,
  api_secret: process.env.CLOUDNARY_API_SECRET,
});

const uploadToCloudinary = (file, retryCount = 3) => {
  return new Promise((resolve, reject) => {
    const attemptUpload = (attemptsLeft) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder:
            process.env.DEV === "development"
              ? "saleem-test"
              : "salim_api_product_images",
          timeout: 20000,
        },
        (error, result) => {
          if (error) {
            if (attemptsLeft > 0) {
              console.log(
                `Retrying upload... Attempts left: ${attemptsLeft - 1}`
              );
              return attemptUpload(attemptsLeft - 1);
            }
            return reject(
              new CustomError.BadRequestError(
                "Something went wrong while uploading image into the cloud.",
                error.message
              )
            );
          }
          resolve(result.secure_url);
        }
      );
      stream.end(file.buffer);
    };

    attemptUpload(retryCount);
  });
};

module.exports = { uploadToCloudinary };
