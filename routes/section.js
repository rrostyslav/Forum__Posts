'use strict';
const router = require('express').Router();

router.get('/:id', async (req, res, next) => {
  const id = +req.params.id;
  if (!id) {
    const error = new Error('Invalid ID');
    error.status = 400;
    return next(error);
  }
  try {
    const section = await req.con.execute("SELECT * FROM section WHERE id=? ORDER BY title ASC", [id]);
    if (section[0].length === 0) {
      const error = new Error('Not found');
      error.status = 404;
      return next(error)
    };
    res.status(200).json({
      success: true,
      section: section[0][0]
    });
  } catch (err) {
    console.log(err);
    next(err)
  }

});

router.get('/', async (req, res, next) => {
  try {
    const sections = await req.con.execute("SELECT * FROM section ORDER BY title ASC");
    if (sections[0].length === 0) {
      const error = new Error('Sections Not Found!');
      error.status = 404;
      return next(error);
    }
    res.status(200).json({
      success: true,
      sections: sections[0]
    });

  } catch (err) {
    console.log(err);
    next(err)
  }

});

router.post('/', async (req, res, next) => {
  const title = req.body.title;
  if (!title) {
    const error = new Error('No title provided');
    error.status = 400;
    return next(error);
  }
  try {
    await req.con.execute("INSERT INTO section VALUES(null, ?)", [title]);
    res.status(200).json({
      success: true,
      message: "Section added"
    });
  } catch (err) {
    console.log(err);
    next(err)
  }

});

router.put('/:id', async (req, res, next) => {
  const id = +req.params.id;
  const title = req.body.title;
  if (!id || !title) {
    const error = new Error('No ID or title provided');
    error.status = 400;
    return next(error);
  }
  try {
    await req.con.execute("UPDATE section SET title=? WHERE id=?", [title, id]);
    res.status(200).json({
      success: true,
      message: "Section edited"
    });
  } catch (err) {
    console.log(err);
    next(err)
  }

});

router.delete('/:id', async (req, res, next) => {
  const id = req.params.id;
  if (!id) {
    const error = new Error('No ID provided');
    error.status = 400;
    return next(error);
  }
  try {
    await req.con.execute("DELETE FROM section WHERE id=?", [id]);
    res.status(200).json({
      message: "Section deleted"
    });
  } catch (err) {
    console.log(err);
    next(err)
  }

});

module.exports = router;