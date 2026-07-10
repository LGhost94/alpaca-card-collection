const connectDatabase = require("../database");

async function getStats(req, res) {
    try {
        const db = await connectDatabase();

        const users = await db.get(`
            SELECT COUNT(*) AS total FROM users
        `);

        const cards = await db.get(`
            SELECT COUNT(*) AS total FROM cards
        `);

        const packsAvailable = await db.get(`
            SELECT COALESCE(SUM(amount), 0) AS total FROM packs
        `);

        const collectionCards = await db.get(`
            SELECT COALESCE(SUM(quantity), 0) AS total FROM collections
        `);

        res.json({
            users: users.total,
            cards: cards.total,
            packsAvailable: packsAvailable.total,
            cardsCollected: collectionCards.total
        });

    } catch (error) {
        res.status(500).json({
            error: "Erro ao carregar estatísticas."
        });
    }
}

module.exports = {
    getStats
};