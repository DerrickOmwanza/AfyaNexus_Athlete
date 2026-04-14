const router = require('express').Router();
const { authenticate, authorizeRoles } = require('../middleware/auth');
const { getMyAthletes, getAthleteDashboard, getInjuryAlerts } = require('../controllers/coachController');
const { postComment, getCommentsForAthlete } = require('../controllers/commentsController');

router.use(authenticate, authorizeRoles('coach'));

router.get('/athletes',                          getMyAthletes);
router.get('/athletes/:athlete_id/dashboard',    getAthleteDashboard);
router.get('/injury-alerts',                     getInjuryAlerts);
router.post('/athletes/:athlete_id/comment',     postComment);
router.get('/athletes/:athlete_id/comments',     getCommentsForAthlete);

module.exports = router;
