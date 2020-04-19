const router = require('express').Router();
const sectionsController = require('../controllers/sections');

router.get('/:id', sectionsController.getSectionById);

router.get('/',sectionsController.getAllSections);

router.post('/', sectionsController.addSection);

router.patch('/:id', sectionsController.editSection);

router.delete('/:id', sectionsController.deleteSection);

module.exports = router;