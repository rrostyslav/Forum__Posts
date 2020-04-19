const router = require('express').Router();
const PostsController = require('../controllers/index');

// CRUD
router.get('/:quantity/:page', PostsController.getAllPosts);

router.get('/:id', PostsController.getPostById);

router.post('/', PostsController.addPost);

router.patch('/:id', PostsController.editPost);

router.patch('/section/:id', PostsController.moveToSection);

router.delete('/:id', PostsController.deletePost);

//Add answer
router.post('/:id', PostsController.addAnswer);

router.patch('/solution/:set/:id', PostsController.setSolution);

router.get('/answers/:quantity/:page', PostsController.getAllAnswers);

router.patch('/answers/:id', PostsController.editAnswer);

router.patch('/close/:set/:id', PostsController.closePost);

module.exports = router;