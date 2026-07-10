const connectDatabase = require("../database");

async function getSettings(req, res) {
    try {
        const db = await connectDatabase();
        const rows = await db.all("SELECT key, value FROM settings");

        const settings = {};

        rows.forEach(row => {
            settings[row.key] = row.value;
        });

        res.json(settings);
    } catch (error) {
        console.error("Erro ao carregar definições:", error);

        res.status(500).json({
            error: "Erro ao carregar definições."
        });
    }
}

async function updateSettings(req, res) {
    try {
        const db = await connectDatabase();

        const settings = {
            siteName: req.body.siteName,
            homeTitle: req.body.homeTitle,
            homeSubtitle: req.body.homeSubtitle,
            homeAdLink: req.body.homeAdLink
        };

        if (req.files?.siteLogo?.[0]) {
            settings.siteLogo =
                "/images/" + req.files.siteLogo[0].filename;
        }

        if (req.files?.siteFavicon?.[0]) {
            settings.siteFavicon =
                "/images/" + req.files.siteFavicon[0].filename;
        }

        if (req.files?.homeAdImage?.[0]) {
            settings.homeAdImage =
                "/images/" + req.files.homeAdImage[0].filename;
        }

        if (req.files?.homeBackground?.[0]) {
            settings.homeBackground =
                "/images/" + req.files.homeBackground[0].filename;
        }

        for (const [key, value] of Object.entries(settings)) {
            if (value !== undefined && value !== "") {
                await db.run(
                    `
                    INSERT INTO settings (key, value)
                    VALUES (?, ?)
                    ON CONFLICT(key)
                    DO UPDATE SET value = excluded.value
                    `,
                    [key, value]
                );
            }
        }

        res.json({ success: true });
    } catch (error) {
        console.error("Erro ao guardar definições:", error);

        res.status(500).json({
            error: "Erro ao guardar definições."
        });
    }
}

async function updateWeeklyCard(req, res) {
    try {
        const weeklyCardId = String(
            req.body.weeklyCardId || ""
        ).trim();

        if (!weeklyCardId) {
            return res.status(400).json({
                error: "Escolhe uma Carta da Semana."
            });
        }

        const db = await connectDatabase();

        const card = await db.get(
            "SELECT id FROM cards WHERE id = ?",
            [weeklyCardId]
        );

        if (!card) {
            return res.status(404).json({
                error: "A carta escolhida não existe."
            });
        }

        await db.run(
            `
            INSERT INTO settings (key, value)
            VALUES ('weeklyCardId', ?)
            ON CONFLICT(key)
            DO UPDATE SET value = excluded.value
            `,
            [weeklyCardId]
        );

        res.json({
            success: true,
            weeklyCardId
        });
    } catch (error) {
        console.error("Erro ao guardar Carta da Semana:", error);

        res.status(500).json({
            error: "Erro ao guardar a Carta da Semana."
        });
    }
}

module.exports = {
    getSettings,
    updateSettings,
    updateWeeklyCard
};