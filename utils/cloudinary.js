const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Set up storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'cabx/blogs',
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
    transformation: [{ width: 1200, height: 630, crop: 'limit' }],
  },
});

const upload = multer({ storage: storage });

module.exports = { cloudinary, upload };
