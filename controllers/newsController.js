const connectDatabase = require("../database");

async function getNews(req, res) {
    const db = await connectDatabase();

    const news = await db.all(`
        SELECT *
        FROM news
        ORDER BY created_at DESC
        LIMIT 5
    `);

    res.json(news);
}

async function createNews(req, res) {
    const { title, content } = req.body;

    if (!title || !content) {
        return res.status(400).json({
            error: "Título e texto são obrigatórios."
        });
    }

    const db = await connectDatabase();

    await db.run(
        "INSERT INTO news (title, content, created_at) VALUES (?, ?, datetime('now'))",
        [title, content]
    );

    res.json({
        success: true
    });
}

async function deleteNews(req, res) {
    const { id } = req.params;

    const db = await connectDatabase();

    await db.run(
        "DELETE FROM news WHERE id = ?",
        [id]
    );

    res.json({
        success: true
    });
}

module.exports = {
    getNews,
    createNews,
    deleteNews
};