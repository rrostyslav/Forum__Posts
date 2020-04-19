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
        res.status(200).json({
            section: section[0][0]
        });
        req.con.end();
    } catch (err) {
        console.log(err);
        next(new Error('Failed to get section by ID'))
    }
});

router.get('/', async (req, res, next) => {
    try {
        const sections = await req.con.execute("SELECT * FROM section ORDER BY title ASC");
        res.status(200).json({
            sections: sections[0]
        });
        req.con.end();
    } catch (err) {
        console.log(err);
        next(new Error('Failed to get sections'))
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
            message: "Section added"
        });
        req.con.end();
    } catch (err) {
        console.log(err);
        next(new Error('Failed to add section'))
    }
});

router.patch('/:id', async (req, res, next) => {
    const id = +req.params.id;
    const title = req.body.title;
    if(!id) {
        const error = new Error('No ID or title provided');
        error.status = 400;
        return next(error);
    }
    try {
        await req.con.execute("UPDATE section SET title=? WHERE id=?", [title, id]);
        res.status(200).json({
            message: "Section edited"
        });
        req.con.end();
    } catch (err) {
        console.log(err);
        next(new Error('Failed to edit section'))
    }
});

router.delete('/:id', async (req, res, next) => {
    const id = req.params.id;
    if(!id) {
        const error = new Error('No ID provided');
        error.status = 400;
        return next(error);
    }
    try {
        await req.con.execute("DELETE FROM section WHERE id=?", [id]);
        res.status(200).json({
            message: "Section deleted"
        });
        req.con.end();
    } catch(err) {
        console.log(err);
        next(new Error('Failed to delete section'))
    }
});

module.exports = router;