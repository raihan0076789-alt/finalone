// backend-main/middleware/uploadMiddleware.js
// Handles multipart/form-data file uploads for client project attachments.
// Accepts: images (jpg/png/webp/gif), PDFs, DXF/DWG CAD files.
// Max file size: 10 MB each · Max 10 files per request.

const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const crypto  = require('crypto');

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads', 'client-projects');

// Ensure directory exists
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const ALLOWED_TYPES = new Set([
    'image/jpeg', 'image/png', 'image/webp', 'image/gif',
    'application/pdf',
    'application/octet-stream',        // .dwg
    'image/vnd.dxf',                   // .dxf
    'application/dxf',
    'application/acad',
]);

const ALLOWED_EXTS = new Set([
    '.jpg', '.jpeg', '.png', '.webp', '.gif',
    '.pdf', '.dxf', '.dwg'
]);

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
    filename:    (_req, file, cb) => {
        const ext    = path.extname(file.originalname).toLowerCase();
        const unique = crypto.randomBytes(12).toString('hex');
        cb(null, `${Date.now()}-${unique}${ext}`);
    }
});

function fileFilter(_req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ALLOWED_TYPES.has(file.mimetype) || ALLOWED_EXTS.has(ext)) {
        cb(null, true);
    } else {
        cb(new Error(`File type not allowed: ${file.originalname}`), false);
    }
}

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize:  10 * 1024 * 1024,  // 10 MB
        files:     10
    }
});

module.exports = upload;
