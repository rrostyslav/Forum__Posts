exports.getAllPosts = async (req, res, next) => {
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
        res.status(200).json({
            posts: posts[0]
        });
        req.con.end();
    } catch (err) {
        console.log(err);
        next(new Error('Error during getting posts'));
    };
};

exports.getPostById = async (req, res, next) => {
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
};

exports.addPost = async (req, res, next) => {
    console.log(req.body);
    const title = req.body.title;
    const text = req.body.text;
    const creatorId = req.params.creatorId;
    const sectionId = req.body.sectionId;
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
};

exports.editPost = async (req, res, next) => {
    const id = +req.params.id;
    console.log(id);
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
};

exports.moveToSection = async (req, res, next) => {
    const sectionId = +req.body.sectionId;
    const id = +req.params.id;
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
};

exports.deletePost = async (req, res, next) => {
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
};

exports.addAnswer = async (req, res, next) => {
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
};

exports.setSolution = async (req, res, next) => {
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
};

exports.getAllAnswers = async (req, res, next) => {
    const quantity = +req.params.quantity;
    const page = +req.params.page;
    if (!quantity || !page || page < 1 || quantity < 1) {
        const error = new Error('Invalid quantity or page');
        error.status = 400;
        return next(error);
    }
    try {
        const posts = await req.con.execute("SELECT * FROM answer ORDER BY last_update ASC LIMIT ?, ?", [
            quantity * (page - 1),
            quantity
        ])
        res.status(200).json(posts[0]);
        req.con.end();
    } catch (err) {
        console.log(err);
        next(new Error('Error during getting answers'));
    };
};

exports.editAnswer = async (req, res, next) => {
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
};

exports.closePost = async (req, res, next) => {
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
};