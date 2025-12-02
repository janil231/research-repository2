const express = require('express');
const router = express.Router();
const { auth, adminOnly } = require('../middleware/auth');
const Research = require('../models/Research');
const User = require('../models/User');
const ResetRequest = require('../models/ResetRequest');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Get overall statistics
router.get('/overall', [auth, adminOnly], async (req, res) => {
    try {
        console.log('Statistics API called by user:', req.user);
        
        const now = new Date();
        const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

        // Only include approved research (exclude archived, pending, rejected)
        const approvedOnly = { status: { $nin: ['archived', 'pending', 'rejected'] } };

        const [
            totalResearch,
            totalStudents,
            totalAdmins,
            pendingApprovals,
            resetRequests,
            researchThisMonth,
            researchLastMonth,
            usersThisMonth,
            usersLastMonth,
            topDepartments,
            viewsAgg,
            downloadsAgg
        ] = await Promise.all([
            Research.countDocuments(approvedOnly),
            User.countDocuments({ role: 'student' }),
            User.countDocuments({ role: 'admin' }),
            User.countDocuments({ role: 'student', status: 'pending' }),
            ResetRequest.countDocuments(),
            Research.countDocuments({ ...approvedOnly, createdAt: { $gte: startOfThisMonth } }),
            Research.countDocuments({ ...approvedOnly, createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } }),
            User.countDocuments({ createdAt: { $gte: startOfThisMonth } }),
            User.countDocuments({ createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } }),
            Research.aggregate([{ $match: approvedOnly }, { $group: { _id: '$department', count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 5 } ]),
            Research.aggregate([{ $match: approvedOnly }, { $group: { _id: null, total: { $sum: '$views' } } }]),
            Research.aggregate([{ $match: approvedOnly }, { $group: { _id: null, total: { $sum: '$downloads' } } }])
        ]);
        
        console.log('Statistics counts:', {
            totalResearch,
            totalStudents,
            totalAdmins,
            pendingApprovals,
            resetRequests
        });
        
        // Check if any queries failed
        if (totalStudents === undefined || totalAdmins === undefined) {
            console.error('Database query failed - undefined values detected');
            return res.status(500).json({ message: 'Database query failed' });
        }
        
        const totalViews = (viewsAgg[0]?.total) || 0;
        const totalDownloads = (downloadsAgg[0]?.total) || 0;

        const pct = (curr, prev) => {
            if (prev === 0) return curr > 0 ? 100 : 0;
            return Number((((curr - prev) / prev) * 100).toFixed(1));
        };

        const stats = {
            totals: {
                research: totalResearch,
                students: totalStudents,
                admins: totalAdmins,
                users: totalStudents + totalAdmins,
                views: totalViews,
                downloads: totalDownloads
            },
            growth: {
                researchPct: pct(researchThisMonth, researchLastMonth),
                usersPct: pct(usersThisMonth, usersLastMonth)
            },
            thisMonth: { research: researchThisMonth, users: usersThisMonth },
            lastMonth: { research: researchLastMonth, users: usersLastMonth },
            pendingApprovals,
            resetRequests,
            topDepartments: topDepartments.map(d => ({ department: d._id, count: d.count }))
        };
        
        res.json(stats);
    } catch (error) {
        console.error('Statistics API error:', error);
        console.error('Error details:', error.message);
        console.error('Error stack:', error.stack);
        res.status(500).json({ 
            message: 'Error fetching overall statistics',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

// Get department-wise statistics
router.get('/by-department', [auth, adminOnly], async (req, res) => {
    try {
        const { year, semester } = req.query;
        const match = { status: { $nin: ['archived', 'pending', 'rejected'] } };
        if (year) match.year = parseInt(year);
        if (semester) match.semester = semester;

        const pipeline = [];
        if (Object.keys(match).length) pipeline.push({ $match: match });
        pipeline.push(
            { $group: { _id: '$department', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        );

        const stats = await Research.aggregate(pipeline);
        const total = stats.reduce((sum, s) => sum + s.count, 0) || 1;

        const departmentStats = stats.map(stat => ({
            department: stat._id || 'Unknown',
            count: stat.count,
            percentage: ((stat.count / total) * 100).toFixed(2)
        }));

        res.json(departmentStats);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching department statistics' });
    }
});

// Research uploaded by adviser (supports optional year/semester filters)
router.get('/by-adviser', [auth, adminOnly], async (req, res) => {
    try {
        const { year, semester } = req.query;
        const match = { status: { $nin: ['archived', 'pending', 'rejected'] } };
        if (year) match.year = parseInt(year);
        if (semester) match.semester = semester;

        const pipeline = [];
        if (Object.keys(match).length) pipeline.push({ $match: match });
        pipeline.push(
          // split comma-separated advisers, then normalize to lower-case and trim for grouping
          {
            $project: {
              advisers: {
                $map: {
                  input: { $split: ['$adviser', ','] },
                  as: 'a',
                  in: { $toLower: { $trim: { input: '$$a' } } }
                }
              }
            }
          },
          { $unwind: '$advisers' },
          { $group: { _id: '$advisers', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        );

        const stats = await Research.aggregate(pipeline);
        res.json(stats.map(s => ({ adviser: s._id || 'Unknown', count: s.count })));
    } catch (error) {
        res.status(500).json({ message: 'Error fetching adviser statistics' });
    }
});

// Get yearly statistics
router.get('/by-year', [auth, adminOnly], async (req, res) => {
    try {
        const stats = await Research.aggregate([
            { $match: { status: { $nin: ['archived', 'pending', 'rejected'] } } },
            {
                $group: {
                    _id: '$year',
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);

        res.json(stats);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching yearly statistics' });
    }
});

// Get top authors
router.get('/top-authors', [auth, adminOnly], async (req, res) => {
    try {
        const { limit = 10 } = req.query;
        const stats = await Research.aggregate([
            { $match: { status: { $nin: ['archived', 'pending', 'rejected'] } } },
            { $unwind: '$authors' },
            {
                $group: {
                    _id: '$authors',
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { count: -1 }
            },
            {
                $limit: parseInt(limit)
            }
        ]);

        res.json(stats.map(s => ({ author: s._id, count: s.count })));
    } catch (error) {
        res.status(500).json({ message: 'Error fetching top authors' });
    }
});

// Get top keywords
router.get('/top-keywords', [auth, adminOnly], async (req, res) => {
    try {
        const { limit = 10 } = req.query;
        const stats = await Research.aggregate([
            { $match: { status: { $nin: ['archived', 'pending', 'rejected'] } } },
            { $unwind: '$keywords' },
            {
                $group: {
                    _id: '$keywords',
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { count: -1 }
            },
            {
                $limit: parseInt(limit)
            }
        ]);

        res.json(stats.map(s => ({ keyword: s._id, count: s.count })));
    } catch (error) {
        res.status(500).json({ message: 'Error fetching top keywords' });
    }
});

// Get monthly upload trends
router.get('/trends', [auth, adminOnly], async (req, res) => {
    try {
        const stats = await Research.aggregate([
            { $match: { status: { $nin: ['archived', 'pending', 'rejected'] } } },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' }
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { '_id.year': 1, '_id.month': 1 }
            }
        ]);

        res.json(stats);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching upload trends' });
    }
});

// Export PDF report
router.get('/export-pdf', [auth, adminOnly], async (req, res) => {
    try {
        // Only include approved research (exclude archived, pending, rejected)
        const approvedOnly = { status: { $nin: ['archived', 'pending', 'rejected'] } };
        // FILTER BY YEAR & SEMESTER from query params
        const year = req.query.year;
        const semester = req.query.semester;
        console.log('PDF Export - Filter params:', { year, semester });
        if (year && year !== '' && year !== 'All Years') approvedOnly.year = parseInt(year);
        if (semester && semester !== '' && semester !== 'All Semesters') approvedOnly.semester = semester;
        console.log('PDF Export - Approved only filter:', JSON.stringify(approvedOnly));

        // Build payload for the PDF generator
        const [overall, departmentsAgg, advisersAgg] = await Promise.all([
            (async () => {
                const totalResearch = await Research.countDocuments(approvedOnly);
                const totalViewsAgg = await Research.aggregate([
                    { $match: approvedOnly },
                    { $group: { _id: null, total: { $sum: '$views' } } }
                ]);
                const totalViews = totalViewsAgg[0]?.total || 0;
                return { totalResearch, totalViews };
            })(),
            Research.aggregate([
                { $match: approvedOnly },
                { $group: { _id: '$department', count: { $sum: 1 } } },
                { $sort: { count: -1 } }
            ]),
            Research.aggregate([
                { $match: approvedOnly },
                { $project: {
                    advisers: {
                        $map: {
                            input: { $split: ['$adviser', ','] },
                            as: 'a',
                            in: { $toLower: { $trim: { input: '$$a' } } }
                        }
                    }
                }},
                { $unwind: '$advisers' },
                { $group: { _id: '$advisers', count: { $sum: 1 } } },
                { $sort: { count: -1 } }
            ])
        ]);
        const departments = departmentsAgg.map(d => ({
            name: d._id || 'Unknown',
            count: d.count,
            percentage: ((d.count / (overall.totalResearch || 1)) * 100).toFixed(2)
        }));
        const advisers = advisersAgg.map(a => ({
            name: a._id || 'Unknown',
            count: a.count,
            percentage: ((a.count / (overall.totalResearch || 1)) * 100).toFixed(2)
        }));
        
        // Find all departments and advisers with the maximum count
        const maxDeptCount = Math.max(...departments.map(d => d.count), 0);
        const maxAdvCount = Math.max(...advisers.map(a => a.count), 0);
        const mostActiveDepartments = departments.filter(d => d.count === maxDeptCount).map(d => d.name).join(', ');
        const mostActiveAdvisers = advisers.filter(a => a.count === maxAdvCount).map(a => a.name).join(', ');
        
        let accountName = 'ADMIN';
        if (req.user) {
            const fn = req.user.firstName || '';
            const ln = req.user.lastName || '';
            if (fn && ln) {
                accountName = fn.toUpperCase() + ' ' + ln.toUpperCase();
            } else if (ln) {
                accountName = ln.toUpperCase();
            } else if (fn) {
                accountName = fn.toUpperCase();
            } else if (req.user.username) {
                accountName = req.user.username.toUpperCase();
            }
        }
        console.log('PDF Export - User object:', req.user);
        console.log('PDF Export - Account name:', accountName);

        const payload = {
            summary: {
                totalResearch: overall.totalResearch,
                totalViews: overall.totalViews,
                totalDepartments: departments.length,
                totalAdvisers: advisers.length,
                mostActiveDepartment: mostActiveDepartments || 'N/A',
                mostActiveAdviser: mostActiveAdvisers || 'N/A'
            },
            departments,
            advisers,
            account_name: accountName,
            year: year || '',
            semester: semester || ''
        };
        console.log('PDF Export - Payload account_name:', payload.account_name);
        const scriptPath = path.join(__dirname, '..', 'scripts', 'generate_pdf.py');
        const py = spawn('python', [scriptPath], { cwd: path.join(__dirname, '..') });
        let stdout = '';
        let stderr = '';
        py.stdout.on('data', d => { stdout += d.toString(); });
        py.stderr.on('data', d => { stderr += d.toString(); });
        py.on('close', code => {
            if (code !== 0) {
                return res.status(500).json({ message: 'Failed to generate PDF: ' + stderr });
            }
            const outputPath = (stdout || '').trim();
            if (!outputPath || !fs.existsSync(outputPath)) {
                return res.status(500).json({ message: 'PDF file not produced' });
            }
            // Create dynamic filename
            let safeSemester = (semester && semester !== '' && semester !== 'All Semesters') ? semester.replace(/\s+/g, '_') : 'All_Semesters';
            let safeYear = (year && year !== '' && year !== 'All Years') ? year : 'All_Years';
            let fname = `Research_Statistics_${safeSemester}_${safeYear}.pdf`;
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="${fname}"`);
            const stream = fs.createReadStream(outputPath);
            stream.pipe(res);
            stream.on('close', () => { fs.unlink(outputPath, () => {}); });
        });
        py.stdin.write(JSON.stringify(payload));
        py.stdin.end();
    } catch (err) {
        res.status(500).json({ message: 'Failed to build PDF report' });
    }
});

module.exports = router;