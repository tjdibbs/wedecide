require("dotenv").config();
const fs = require("fs");
const { S3 } = require("aws-sdk");

const bucketName = process.env.AWS_BUCKET_NAME;
const region = process.env.AWS_REGION;
const accessKeyId = process.env.AWS_ACCESS_KEY;
const secretAccessKey = process.env.AWS_SECRET_KEY;

const s3 = new S3({
  region,
  accessKeyId,
  secretAccessKey,
});

// uploads a file to s3
function uploadFile(file, name) {
  const fileStream = fs.createReadStream(file.filepath);

  const uploadParams = {
    Bucket: bucketName,
    Body: fileStream,
    Key: name,
  };

  console.log({ uploadParams, fileStream });
  return s3.upload(uploadParams).promise();
}
exports.uploadFile = uploadFile;

// downloads a file from s3
async function getFileStream(fileKey) {
  try {
    const downloadParams = {
      Key: fileKey,
      Bucket: bucketName,
    };

    const file = await s3.getObject(downloadParams).promise();
    console.log({ file });

    return file;
  } catch (err) {
    console.log({ err });
    return { err: err.message };
  }
}

exports.getFileStream = getFileStream;
