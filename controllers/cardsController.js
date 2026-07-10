const connectDatabase = require("../database");

async function getCards(req, res) {
    const db = await connectDatabase();
    const cards = await db.all("SELECT * FROM cards ORDER BY id DESC");
    res.json(cards);
}

async function createCard(req, res) {
    try {
        const { name, rarity } = req.body;

        if (!name || !rarity || !req.file) {
            return res.status(400).json({ error: "Faltam dados da carta." });
        }

        const imagePath = "cards/" + req.file.filename;
        const db = await connectDatabase();

        await db.run(
            "INSERT INTO cards (name, rarity, image) VALUES (?, ?, ?)",
            [name, rarity, imagePath]
        );

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: "Erro ao adicionar carta." });
    }
}

async function updateCard(req, res) {
    try {
        const { id } = req.params;
        const { name, rarity } = req.body;

        if (!name || !rarity) {
            return res.status(400).json({ error: "Nome e raridade são obrigatórios." });
        }

        const db = await connectDatabase();

        const card = await db.get("SELECT * FROM cards WHERE id = ?", [id]);

        if (!card) {
            return res.status(404).json({ error: "Carta não encontrada." });
        }

        if (req.file) {
            const imagePath = "cards/" + req.file.filename;

            await db.run(
                "UPDATE cards SET name = ?, rarity = ?, image = ? WHERE id = ?",
                [name, rarity, imagePath, id]
            );
        } else {
            await db.run(
                "UPDATE cards SET name = ?, rarity = ? WHERE id = ?",
                [name, rarity, id]
            );
        }

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: "Erro ao editar carta." });
    }
}

async function deleteCard(req, res) {
    try {
        const { id } = req.params;
        const db = await connectDatabase();

        await db.run("DELETE FROM collections WHERE card_id = ?", [id]);
        await db.run("DELETE FROM cards WHERE id = ?", [id]);

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: "Erro ao apagar carta." });
    }
}

async function openPack(req, res) {
    try {
        if (!req.isAuthenticated()) {
            return res.status(401).json({ error: "Precisas de fazer login." });
        }

        const db = await connectDatabase();
        const userId = req.user.id;

        let packData = await db.get(
            "SELECT * FROM packs WHERE user_id = ?",
            [userId]
        );

        if (!packData) {
            await db.run(
                "INSERT INTO packs (user_id, amount) VALUES (?, ?)",
                [userId, 0]
            );

            packData = { user_id: userId, amount: 0 };
        }

        if (packData.amount <= 0) {
            return res.status(400).json({
                error: "Não tens packs disponíveis."
            });
        }

        const allCards = await db.all("SELECT * FROM cards");

        if (allCards.length < 5) {
            return res.status(400).json({
                error: "Ainda não existem cartas suficientes para abrir um pack."
            });
        }

        function getRandomCardByRarity(rarity) {
            const filtered = allCards.filter(card => card.rarity === rarity);

            if (filtered.length === 0) {
                return allCards[Math.floor(Math.random() * allCards.length)];
            }

            return filtered[Math.floor(Math.random() * filtered.length)];
        }

        function getBonusCard() {
            const roll = Math.random() * 100;

            if (roll < 5) return getRandomCardByRarity("Lendária");
            if (roll < 25) return getRandomCardByRarity("Épica");
            if (roll < 60) return getRandomCardByRarity("Rara");

            return getRandomCardByRarity("Comum");
        }

        const packCards = [
            getRandomCardByRarity("Comum"),
            getRandomCardByRarity("Comum"),
            getRandomCardByRarity("Comum"),
            getRandomCardByRarity("Rara"),
            getBonusCard()
        ];

        for (const card of packCards) {
            const existing = await db.get(
                "SELECT * FROM collections WHERE user_id = ? AND card_id = ?",
                [userId, card.id]
            );

            if (existing) {
                await db.run(
                    "UPDATE collections SET quantity = quantity + 1 WHERE user_id = ? AND card_id = ?",
                    [userId, card.id]
                );
            } else {
                await db.run(
                    "INSERT INTO collections (user_id, card_id, quantity) VALUES (?, ?, ?)",
                    [userId, card.id, 1]
                );
            }
        }

        await db.run(
            "UPDATE packs SET amount = amount - 1 WHERE user_id = ?",
            [userId]
        );

        res.json({
            success: true,
            cards: packCards
        });

    } catch (error) {
        res.status(500).json({ error: "Erro ao abrir pack." });
    }
}

module.exports = {
    getCards,
    createCard,
    updateCard,
    deleteCard,
    openPack
};