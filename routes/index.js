const router = require('express').Router();
const PostRoutes = require('./post');
const AnswerRoutes = require('./answer');
const SectionRoutes = require('./section');

router.use('/post', PostRoutes);
router.use('/answer', AnswerRoutes);
router.use('/section', SectionRoutes);

module.exports = router;