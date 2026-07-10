const connectDatabase = require("../database");

async function getUsers(req, res) {
    const db = await connectDatabase();

    const users = await db.all(`
        SELECT id, twitch_id, username, profile_image, is_admin
        FROM users
        ORDER BY username ASC
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

    res.json({
        success: true,
        message: "Permissão alterada com sucesso."
    });
}

module.exports = {
    getUsers,
    toggleAdmin
};