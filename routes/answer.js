const router = require('express').Router();

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
        const rows = await req.con.execute("SELECT closed FROM post WHERE id=?", [postId]);
        const status = +rows[0][0].closed;
        if (status !== 0) {
            const error = new Error('Failed to add answer. Post closed');
            error.status = 403;
            return next(error);
        }
        const answer = await req.con.execute("INSERT INTO answer VALUES(null, ?, ?, 0, ?, NOW(), 0)", [text, creatorId, postId]);
        await req.con.execute("UPDATE post SET last_update=NOW()");
        res.status(200).json({
            answerId: answer[0].insertId,
            message: "Added new answer"
        });
        req.con.end();
    }
    catch (err) {
        console.log(err);
        next(new Error('Error during adding answer'));
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
            answerId: id,
            message: "Answer edited"
        });
        req.con.end();
    } catch (err) {
        console.log(err);
        next(new Error('Error while editing answer'))
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
            answerId: id,
            set: set,
            message: (set ? "Setted" : "Unsetted") + " as solution"
        });
        req.con.end();
    } catch (err) {
        console.log(err);
        next(new Error('Error while set solution'))
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
        const answers = await req.con.execute("SELECT * FROM answer WHERE post_id=? ORDER BY last_update ASC LIMIT ?, ?", [
            postId,
            quantity * (page - 1),
            quantity
        ]);
        const count = await req.con.execute("SELECT COUNT(1) FROM answer WHERE post_id=?", [postId]);
        res.status(200).json({
            count: count[0][0]['COUNT(1)'],
            answers: answers[0]
        });
        req.con.end();
    } catch (err) {
        console.log(err);
        next(new Error('Error during getting answers'));
    };
});

router.get('/:id', async (req, res, next) => {
    const id = +req.params.id;
    if (isNaN(id) || id < 0) return res.sendStatus(400);
    try {
        const response = (await req.con.execute("SELECT * FROM answer WHERE id=?", [id]))[0];
        if(response.length === 0) return res.sendStatus(404);
        res.status(200).json({
            answer: response[0]
        });
    } catch (err) {
        console.log(err.message);
        next(new Error('ERROR 500'));
    }
});

module.exports = router;