const multer = require('multer');
const path = require('path');
const os = require('os');
const fs = require('fs');

// Serverless platforms (Netlify/AWS Lambda) only allow writing to the temp dir
const isServerless = !!(process.env.NETLIFY || process.env.AWS_LAMBDA_FUNCTION_NAME);
const uploadDir = isServerless ? os.tmpdir() : path.join(__dirname, '../uploads');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    fs.mkdir(uploadDir, { recursive: true }, err => cb(err, uploadDir));
  },
  filename: (req, file, cb) => cb(null, `${req.user._id}-${Date.now()}${path.extname(file.originalname)}`),
});

const uploadPdf = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Only PDF files are allowed'));
  },
});

module.exports = { uploadPdf, uploadDir, isServerless };
