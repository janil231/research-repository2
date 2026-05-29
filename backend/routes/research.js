const express = require('express');
const router = express.Router();
const researchController = require('../controllers/researchController');
const { auth, adminOnly } = require('../middleware/auth');

// GET /api/research - Get all research papers
router.get('/', researchController.getResearch);

// POST /api/research - Upload new research paper
router.post('/', auth, researchController.upload, researchController.uploadResearch);

// GET /api/research/search?keyword=ai&author=joe&department=IS&year=2024&keywords=data&sortBy=newest|oldest|alpha&page=1&limit=20
router.get('/search', researchController.searchResearch);

// GET /api/research/archived - List archived research (Admin only)
router.get('/archived', auth, adminOnly, researchController.getArchivedResearch);

// GET /api/research/archived/count - Get archived research count (Admin only)
router.get('/archived/count', auth, adminOnly, researchController.getArchivedResearchCount);

// GET /api/research/pending - List pending research (Admin only)
router.get('/pending', auth, adminOnly, researchController.getPendingResearch);

// GET /api/research/backup - Backup all research data (Admin only)
router.get('/backup', auth, adminOnly, researchController.backupResearch);

// GET /api/research/:id/pdf - Serve PDF file with proper error handling (must come after specific routes)
router.get('/:id/pdf', researchController.servePDF);

// Track views/downloads (allow logged-in students)
router.post('/:id/view', auth, researchController.incrementView);
router.post('/:id/download', auth, researchController.incrementDownload);

// PUT /api/research/:id/approve - Approve research paper (Admin only)
router.put('/:id/approve', auth, adminOnly, researchController.approveResearch);

// PUT /api/research/:id/reject - Reject research paper (Admin only)
router.put('/:id/reject', auth, adminOnly, researchController.rejectResearch);

// PUT /api/research/:id/archive - Archive research paper (Admin only)
router.put('/:id/archive', auth, adminOnly, researchController.archiveResearch);

// PUT /api/research/:id/restore - Restore archived research paper (Admin only)
router.put('/:id/restore', auth, adminOnly, researchController.restoreResearch);

// DELETE /api/research - Clear ALL research (Admin only)
router.delete('/', auth, adminOnly, researchController.clearAllResearch);

// DELETE /api/research/:id - Delete research paper (Admin only)
router.delete('/:id', auth, adminOnly, researchController.deleteResearch);

// POST /api/research/restore - Restore from backup ZIP (Admin only)
router.post('/restore', auth, adminOnly, (req, res, next) => {
  // attach multer for 'backup' field
  researchController.uploadBackupZip
    ? researchController.uploadBackupZip(req, res, (err) => {
        if (err) return res.status(400).json({ message: err.message || 'Invalid backup file.' });
        next();
      })
    : next();
}, researchController.restoreFromBackup);

// POST /api/research/seed-samples - Seed pending and archived sample research (Admin only)
router.post('/seed-samples', auth, adminOnly, researchController.seedSampleResearch);

module.exports = router;
