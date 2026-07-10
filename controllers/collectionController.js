const connectDatabase = require("../database");

async function getCollection(req, res) {

    if (!req.isAuthenticated()) {
        return res.status(401).json({
            error: "Login necessário."
        });
    }

    const db = await connectDatabase();

    const cards = await db.all(`
        SELECT
            collections.card_id,
            collections.quantity
        FROM collections
        WHERE user_id = ?
    `, [req.user.id]);

    res.json(cards);

}

module.exports = {
    getCollection
};