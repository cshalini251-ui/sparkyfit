const express = require('express');
const router = express.Router();
const versionService = require('../services/versionService');

router.get('/current', (req, res) => {
    const appVersion = versionService.getAppVersion();
    res.json({ version: appVersion });
});

router.get('/latest-github', async (req, res) => {
    try {
        const latestRelease = await versionService.getLatestGitHubRelease();
        res.json(latestRelease);
    } catch (error) {
        console.error('Error fetching latest GitHub release:', error);
        res.status(500).json({ error: 'Failed to fetch latest GitHub release', details: error.message });
    }
});

module.exports = router;