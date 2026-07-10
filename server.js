require("dotenv").config();

const express = require("express");
const session = require("express-session");
const passport = require("./config/passport");

const connectDatabase = require("./database");
const collectionRoutes = require("./routes/collectionRoutes");
const cardsRoutes = require("./routes/cardsRoutes");
const usersRoutes = require("./routes/usersRoutes");
const statsRoutes = require("./routes/statsRoutes");
const newsRoutes = require("./routes/newsRoutes");
const settingsRoutes = require("./routes/settingsRoutes");

const app = express();

const OWNER_TWITCH_ID = "720803911";

app.use(
    session({
        secret: process.env.SESSION_SECRET || "troca-esta-chave-em-producao",
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            sameSite: "lax",
            secure: false
        }
    })
);

app.use(passport.initialize());
app.use(passport.session());

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(express.static("public"));

function isLoggedIn(req, res, next) {
    if (!req.isAuthenticated()) {
        return res.redirect("/");
    }

    next();
}

function isLoggedInApi(req, res, next) {
    if (!req.isAuthenticated()) {
        return res.status(401).json({
            error: "Precisas de fazer login."
        });
    }

    next();
}

function isAdmin(req, res, next) {
    if (!req.isAuthenticated()) {
        return res.status(401).json({
            error: "Precisas de fazer login."
        });
    }

    if (!req.user || !req.user.is_admin) {
        return res.status(403).json({
            error: "Acesso negado."
        });
    }

    next();
}

function protectCardRoutes(req, res, next) {
    if (req.method === "GET") {
        return next();
    }

    if (
        req.method === "POST" &&
        req.path === "/open-pack"
    ) {
        return isLoggedInApi(req, res, next);
    }

    return isAdmin(req, res, next);
}

function protectAdminWrites(req, res, next) {
    if (req.method === "GET") {
        return next();
    }

    return isAdmin(req, res, next);
}

/* ===========================
   ROTAS DA API
=========================== */

app.use(
    "/api/cards",
    protectCardRoutes,
    cardsRoutes
);

app.use(
    "/api/users",
    isAdmin,
    usersRoutes
);

app.use(
    "/api/collection",
    isLoggedInApi,
    collectionRoutes
);

app.use(
    "/api/stats",
    statsRoutes
);

app.use(
    "/api/news",
    protectAdminWrites,
    newsRoutes
);

app.use(
    "/api/settings",
    protectAdminWrites,
    settingsRoutes
);

/* ===========================
   UTILIZADOR ATUAL
=========================== */

app.get("/api/me", async (req, res) => {
    try {
        if (!req.isAuthenticated()) {
            return res.json({
                loggedIn: false
            });
        }

        const db = await connectDatabase();

        const packData = await db.get(
            `
            SELECT COALESCE(amount, 0) AS amount
            FROM packs
            WHERE user_id = ?
            `,
            [req.user.id]
        );

        const totalCards = await db.get(
            `
            SELECT COALESCE(SUM(quantity), 0) AS total
            FROM collections
            WHERE user_id = ?
            `,
            [req.user.id]
        );

        const uniqueCards = await db.get(
            `
            SELECT COUNT(*) AS total
            FROM collections
            WHERE user_id = ?
            AND quantity > 0
            `,
            [req.user.id]
        );

        const allCards = await db.get(
            `
            SELECT COUNT(*) AS total
            FROM cards
            `
        );

        const collectionPercent =
            allCards.total > 0
                ? Math.round(
                    (uniqueCards.total / allCards.total) * 100
                )
                : 0;

        res.json({
            loggedIn: true,
            id: req.user.id,
            username: req.user.username,
            twitch_id: req.user.twitch_id,
            profile_image: req.user.profile_image,
            is_admin: Boolean(req.user.is_admin),
            packs: packData ? packData.amount : 0,
            totalCards: totalCards.total,
            uniqueCards: uniqueCards.total,
            collectionPercent
        });
    } catch (error) {
        console.error(
            "Erro ao carregar utilizador:",
            error
        );

        res.status(500).json({
            error: "Erro ao carregar os dados do utilizador."
        });
    }
});

/* ===========================
   PÁGINAS
=========================== */

app.get("/admin", isAdmin, (req, res) => {
    res.sendFile(
        __dirname + "/public/admin.html"
    );
});

app.get("/profile", isLoggedIn, (req, res) => {
    res.sendFile(
        __dirname + "/public/profile.html"
    );
});

app.get("/packs", isLoggedIn, (req, res) => {
    res.sendFile(
        __dirname + "/public/packs.html"
    );
});

app.get(
    "/collection",
    isLoggedIn,
    (req, res) => {
        res.sendFile(
            __dirname + "/public/collection.html"
        );
    }
);

/* ===========================
   LOGIN TWITCH
=========================== */

app.get(
    "/login",
    passport.authenticate("twitch")
);

app.get(
    "/auth/twitch/callback",
    passport.authenticate("twitch", {
        failureRedirect: "/"
    }),
    (req, res) => {
        res.redirect("/profile");
    }
);

app.get("/logout", (req, res, next) => {
    req.logout(error => {
        if (error) {
            return next(error);
        }

        req.session.destroy(() => {
            res.redirect("/");
        });
    });
});

/* ===========================
   BASE DE DADOS
=========================== */

async function addColumnIfMissing(
    db,
    table,
    column,
    definition
) {
    const columns = await db.all(
        `PRAGMA table_info(${table})`
    );

    const exists = columns.some(
        item => item.name === column
    );

    if (!exists) {
        await db.exec(
            `ALTER TABLE ${table}
             ADD COLUMN ${column} ${definition}`
        );
    }
}

async function startServer() {
    const db = await connectDatabase();

    await db.exec(`
        CREATE TABLE IF NOT EXISTS cards (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            rarity TEXT NOT NULL,
            image TEXT NOT NULL
        );
    `);

    await db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            twitch_id TEXT UNIQUE,
            username TEXT,
            profile_image TEXT,
            is_admin INTEGER DEFAULT 0
        );
    `);

    await addColumnIfMissing(
        db,
        "users",
        "profile_image",
        "TEXT"
    );

    await addColumnIfMissing(
        db,
        "users",
        "is_admin",
        "INTEGER DEFAULT 0"
    );

    await db.run(
        `
        UPDATE users
        SET is_admin = 1
        WHERE twitch_id = ?
        `,
        [OWNER_TWITCH_ID]
    );

    await db.exec(`
        CREATE TABLE IF NOT EXISTS collections (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            card_id INTEGER NOT NULL,
            quantity INTEGER DEFAULT 1,
            UNIQUE(user_id, card_id)
        );
    `);

    await db.exec(`
        CREATE TABLE IF NOT EXISTS packs (
            user_id INTEGER PRIMARY KEY,
            amount INTEGER DEFAULT 0
        );
    `);

    await db.exec(`
        CREATE TABLE IF NOT EXISTS news (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
    `);

    await db.exec(`
        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT
        );
    `);

    console.log("✅ Base de dados ligada!");
    console.log("✅ APIs protegidas!");
    console.log(
        "✅ Rotas /packs, /collection e /profile carregadas!"
    );

    const port = process.env.PORT || 3000;

    app.listen(port, () => {
        console.log(
            `🚀 Servidor iniciado em http://localhost:${port}`
        );
    });
}

app.use((req,res)=>{

res.status(404).sendFile(
__dirname + "/public/404.html"
);

});

startServer().catch(error => {
    console.error(
        "❌ Erro ao iniciar o servidor:",
        error
    );

    process.exit(1);
});