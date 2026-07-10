const connectDatabase = require("../database");

async function getUsers(req, res) {
    const db = await connectDatabase();

    const users = await db.all(`
        SELECT 
            users.id,
            users.twitch_id,
            users.username,
            users.profile_image,
            users.is_admin,
            COALESCE(packs.amount, 0) AS packs
        FROM users
        LEFT JOIN packs ON packs.user_id = users.id
        ORDER BY users.username ASC
    `);

    res.json(users);
}

async function toggleAdmin(req, res) {
    const { id } = req.params;
    const db = await connectDatabase();

    const user = await db.get("SELECT * FROM users WHERE id = ?", [id]);

    if (!user) {
        return res.status(404).json({ error: "Utilizador não encontrado." });
    }

    const newValue = user.is_admin ? 0 : 1;

    await db.run(
        "UPDATE users SET is_admin = ? WHERE id = ?",
        [newValue, id]
    );

    res.json({ success: true });
}

async function addPacks(req, res) {
    const { id } = req.params;
    const { amount } = req.body;

    const packsToAdd = Number(amount);

    if (!packsToAdd || packsToAdd <= 0) {
        return res.status(400).json({ error: "Quantidade inválida." });
    }

    const db = await connectDatabase();

    const user = await db.get("SELECT * FROM users WHERE id = ?", [id]);

    if (!user) {
        return res.status(404).json({ error: "Utilizador não encontrado." });
    }

    const packData = await db.get(
        "SELECT * FROM packs WHERE user_id = ?",
        [id]
    );

    if (!packData) {
        await db.run(
            "INSERT INTO packs (user_id, amount) VALUES (?, ?)",
            [id, packsToAdd]
        );
    } else {
        await db.run(
            "UPDATE packs SET amount = amount + ? WHERE user_id = ?",
            [packsToAdd, id]
        );
    }

    res.json({ success: true });
}

module.exports = {
    getUsers,
    toggleAdmin,
    addPacks
};