'use strict';
const router = require('express').Router();
const axios = require('axios');

// Add answer
router.post('/:id', async (req, res, next) => {
  const text = req.body.text;
  const creatorId = +req.body.creatorId; // ID from Auth
  const postId = +req.params.id;
  try {
    if (!creatorId || !postId) {
      const error = new Error('Invalid creator or post ID');
      error.status = 400;
      return next(error);
    }
    const [rows] = await req.con.execute("SELECT closed FROM post WHERE id=?", [postId]);
    const status = +rows[0].closed;
    if (status !== 0) {
      const error = new Error('Failed to add answer. Post closed');
      error.status = 403;
      return next(error);
    }
    const answer = await req.con.execute("INSERT INTO answer VALUES(null, ?, ?, 0, ?, NOW(), 0)", [text, creatorId, postId]);
    await req.con.execute("UPDATE post SET last_update=NOW()");
    const [[result]] = await req.con.execute("SELECT * FROM answer WHERE id = ?", [answer[0].insertId]);
    res.status(200).json({
      success: true,
      answerId: answer[0].insertId,
      answer: result,
      message: "Added new answer"
    });

  }
  catch (err) {
    console.log(err);
    next(err);
  };
});

router.put('/:id', async (req, res, next) => {
  const id = +req.params.id;
  const text = req.body.text;
  if (isNaN(id) || id < 1 || !text) {
    const error = new Error('Invalid params');
    error.status = 400;
    return next(error);
  }
  try {
    await req.con.execute("UPDATE answer SET text=?, edited=1, last_update=NOW() WHERE id=?", [
      text,
      id
    ])
    res.status(200).json({
      success: true,
      answerId: id,
      message: "Answer edited"
    });

  } catch (err) {
    console.log(err);
    next(err)
  };
});

router.put('/solution/:set/:id', async (req, res, next) => {
  const set = +req.params.set;
  const id = +req.params.id;
  if (isNaN(set) || set < 0 || isNaN(id) || id < 1) {
    const error = new Error('Invalid params');
    error.status = 400;
    return next(error);
  }
  try {
    await req.con.execute("UPDATE answer SET solution=?, last_update=NOW() WHERE id=?", [
      set,
      id
    ])
    res.status(200).json({
      success: true,
      answerId: id,
      set: set,
      message: (set ? "Setted" : "Unsetted") + " as solution"
    });

  } catch (err) {
    console.log(err);
    next(err)
  };
});

router.get('/:postId/:quantity/:page', async (req, res, next) => {
  const quantity = +req.params.quantity;
  const page = +req.params.page;
  const postId = +req.params.postId;
  if (isNaN(quantity) || isNaN(page) || isNaN(postId)) {
    const error = new Error('Invalid quantity or page');
    error.status = 400;
    return next(error);
  }
  try {
    const [answers] = await req.con.execute("SELECT * FROM answer WHERE post_id=? ORDER BY last_update ASC", [
      postId
    ]);
    const [count] = await req.con.execute("SELECT COUNT(1) FROM answer WHERE post_id=?", [postId]);

    const populatedAnswers = await Promise.all(answers.map(async answer => {
      try {
        const getCreator = await axios({
          url: `${process.env.PROFILES_SERVICE}/id/${answer.creator}`,
          method: 'GET',
          json: true
        });
        return {
          ...answer,
          creator: {
            ...getCreator.data,
            password: undefined
          }
        }
      } catch (err) {
        console.log(err);
        return answer;
      }
    }));

    res.status(200).json({
      success: true,
      count: count[0]['COUNT(1)'],
      answers: populatedAnswers
    });
  } catch (err) {
    console.log(err);
    next(err);
  };

});

router.get('/:id', async (req, res, next) => {
  const id = +req.params.id;
  if (isNaN(id) || id < 0) return res.sendStatus(400);
  try {
    const [response] = (await req.con.execute("SELECT * FROM answer WHERE id=?", [id]));
    if (response.length === 0) return res.sendStatus(404);
    res.status(200).json({
      success: true,
      answer: response[0]
    });
  } catch (err) {
    console.log(err.message);
    next(err);
  }

});

module.exports = router;