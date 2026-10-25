import multer from 'multer';

// Photos are kept in memory and saved into MongoDB with their post, not on
// disk: free hosts wipe the disk on every restart, which would lose them.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 3 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
      return cb(null, true);
    }
    cb(new Error('Only JPEG, PNG or WebP photos, up to 3 MB'));
  },
});

// The browser's word for the type is only a claim; check the first bytes too.
export function looksLikeImage(buffer) {
  if (!buffer || buffer.length < 12) return false;
  const jpeg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  const png = buffer.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  const webp = buffer.slice(0, 4).toString('ascii') === 'RIFF' && buffer.slice(8, 12).toString('ascii') === 'WEBP';
  return jpeg || png || webp;
}

export default upload;
