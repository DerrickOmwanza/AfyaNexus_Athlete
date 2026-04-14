const router = require('express').Router();
const { authenticate, authorizeRoles } = require('../middleware/auth');
const { getDashboard, submitRecoveryLog, submitTrainingLog, submitNutritionLog, getReports, getWearable } = require('../controllers/athleteController');
const { syncWearable } = require('../controllers/wearableController');
const { importHealthConnect } = require('../controllers/integrationController');
const { getMyComments, markCommentsRead } = require('../controllers/commentsController');

router.use(authenticate, authorizeRoles('athlete'));

router.get('/dashboard',     getDashboard);
router.get('/reports',       getReports);
router.get('/wearable',      getWearable);
router.get('/comments',      getMyComments);
router.post('/comments/read', markCommentsRead);
router.post('/recovery-log', submitRecoveryLog);
router.post('/training-log', submitTrainingLog);
router.post('/nutrition-log', submitNutritionLog);
router.post('/wearable/sync', syncWearable);
router.post('/sources/health-connect/import', importHealthConnect);

module.exports = router;
