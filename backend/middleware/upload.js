import multer from 'multer';

const IMAGE_MAGIC_BYTES = {
  'image/jpeg': [0xFF, 0xD8, 0xFF],
  'image/png': [0x89, 0x50, 0x4E, 0x47],
  'image/gif': [0x47, 0x49, 0x46],
  'image/webp': [0x52, 0x49, 0x46, 0x46],
  'image/bmp': [0x42, 0x4D],
};

const matchesMagicBytes = (buffer, type) => {
  const signature = IMAGE_MAGIC_BYTES[type];
  if (!signature) return false;
  return signature.every((byte, i) => buffer[i] === byte);
};

const storage = multer.memoryStorage();

export const uploadPhotos = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 6 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype?.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'), false);
    }
    cb(null, true);
  }
}).array('photos', 6);