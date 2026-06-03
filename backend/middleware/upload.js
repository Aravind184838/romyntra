import multer from 'multer';

const storage = multer.memoryStorage();

export const uploadPhotos = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 6 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype?.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'), false);
  }
}).array('photos', 6);
