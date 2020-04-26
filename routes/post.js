const router = require('express').Router();

router.get('/:id', async (req, res, next) => {
    const id = +req.params.id;
    if (!id || id < 0) {
        const error = new Error('Invalid post ID');
        error.status = 400;
        return next(error);
    }
    try {
        const rows = await req.con.execute("SELECT post.id id, post.text text, post.text text, post.creator creator, post.closed closed, post.last_update last_update, section.id section_id, section.title section_name FROM post LEFT JOIN section ON post.section_id = section.id WHERE post.id=? ORDER BY last_update DESC", [+id]);
        res.status(200).json({
            post: rows[0]
        });
        req.con.end();
    } catch (err) {
        console.log(err);
        next(new Error('Error during getting post'));
    }
});

router.get('/:sectionId/:quantity/:page', async (req, res, next) => {
    const quantity = +req.params.quantity;
    const page = +req.params.page;
    const sectionId = +req.params.sectionId;
    if (!quantity || !page || page < 1 || quantity < 1 || !sectionId) {
        const error = new Error('Invalid params');
        error.status = 400;
        return next(error);
    }
    try {
        const posts = await req.con.execute("SELECT post.id id, post.text text, post.text text, post.creator creator, post.closed closed, post.last_update last_update, section.id section_id, section.title section_name FROM post LEFT JOIN section ON post.section_id = section.id WHERE section_id=? ORDER BY last_update DESC LIMIT ?, ?", [sectionId, quantity * (page - 1), quantity]);
        const count = await req.con.execute("SELECT COUNT(1) FROM post WHERE section_id=?", [sectionId]);
        res.status(200).json({
            count: count[0][0]['COUNT(1)'],
            posts: posts[0]
        });
        req.con.end();
    } catch (err) {
        console.log(err);
        next(new Error('Error during getting posts'));
    };
});

router.post('/', async (req, res, next) => {
    const title = req.body.title;
    const text = req.body.text;
    const creatorId = req.body.creatorId;
    const sectionId = req.body.section_id;
    if(!title || !text || !creatorId || !sectionId) {
        const error = new Error('No fields provided');
        error.status = 400;
        return next(error);
    }
    try {
        const rows = await req.con.execute("INSERT INTO post VALUES(null, ?, ?, ?, false, ?, NOW())", [title, text, creatorId, sectionId]);
        res.status(200).json({
            postId: rows[0].insertId,
            sectionId: req.body.sectionId,
            creatorId: req.params.creatorId
        });
        req.con.end();
    } catch (err) {
        console.log(err);
        next(new Error('Error during creating post'));
    };
});

router.put('/move', async (req, res, next) => {
    const sectionId = +req.body.section_id;
    const id = +req.body.id;
    if (!sectionId || !id) {
        const error = new Error('Invalid post ID or section ID');
        error.status = 400;
        return next(error);
    }
    try {
        await req.con.execute("UPDATE post SET section_id=?, last_update=NOW() WHERE id=?",
            [
                sectionId,
                id
            ]);
        res.status(200).json({
            message: "Post section is changed"
        });
        req.con.end();
    } catch (err) {
        console.log(err);
        next(new Error('Error during changing post section. Maybe section with this id is not created'));
    };
});

router.put('/:id', async (req, res, next) => {
    const id = +req.params.id;
    const title = req.body.title;
    const text = req.body.text;
    if (isNaN(id) || id < 0 || !title || !text) {
        const error = new Error('Invalid post ID. Or title or text undefined');
        error.status = 400;
        return next(error);
    }
    try {
        await req.con.execute("UPDATE post SET title=?, text=?, last_update=NOW() WHERE id=?",
            [
                title,
                text,
                id
            ]);
        res.status(200).json({
            message: "Post is successfully updated!"
        });
        req.con.end();
    } catch (err) {
        console.log(err);
        next(new Error('Error during editing post'));
    };
});

router.delete('/:id', async (req, res, next) => {
    const id = +req.params.id;
    if (isNaN(id) || id < 0) {
        const error = new Error('Invalid post ID');
        error.status = 400;
        return next(error);
    }
    try {
        await req.con.execute("DELETE FROM post WHERE id=?", [id]);
        res.status(200).json({
            message: `Post #${+id} deleted`
        });
        req.con.end();
    } catch (err) {
        console.log(err);
        next(new Error('Error during deleting post'))
    };
});

router.put('/close/:set/:id', async (req, res, next) => {
    const set = +req.params.set;
    const id = +req.params.id;
    if (isNaN(set) || isNaN(id) || id < 0) {
        const error = new Error('Invalid ID or set');
        error.status = 400;
        return next(error);
    }
    try {
        await req.con.execute("UPDATE post SET closed=? WHERE id=?", [set, id]);
        res.status(200).json({
            message: "Success",
            closed: set
        });
        req.con.end();
    } catch (err) {
        console.log(err);
        next(new Error('Error while closing post'));
    };
});

module.exports = router;