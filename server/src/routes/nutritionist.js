const router = require('express').Router();
const { authenticate, authorizeRoles } = require('../middleware/auth');
const { getMyAthletes, getAthleteDashboard, createDietPlan, getAllDietPlans } = require('../controllers/nutritionistController');
const { postComment, getCommentsForAthlete } = require('../controllers/commentsController');

router.use(authenticate, authorizeRoles('nutritionist'));

router.get('/athletes',                          getMyAthletes);
router.get('/athletes/:athlete_id/dashboard',    getAthleteDashboard);
router.get('/diet-plans',                        getAllDietPlans);
router.post('/diet-plan',                        createDietPlan);
router.post('/athletes/:athlete_id/comment',     postComment);
router.get('/athletes/:athlete_id/comments',     getCommentsForAthlete);

module.exports = router;
