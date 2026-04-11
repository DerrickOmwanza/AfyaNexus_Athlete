const router = require('express').Router();
const { authenticate, authorizeRoles } = require('../middleware/auth');
const { getMyAthletes, getAthleteDashboard, getInjuryAlerts } = require('../controllers/coachController');

router.use(authenticate, authorizeRoles('coach'));

router.get('/athletes', getMyAthletes);
router.get('/athletes/:athlete_id/dashboard', getAthleteDashboard);
router.get('/injury-alerts', getInjuryAlerts);

module.exports = router;
