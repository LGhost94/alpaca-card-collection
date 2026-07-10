const passport = require("passport");
const TwitchStrategy = require("passport-twitch-new").Strategy;
const connectDatabase = require("../../database");

passport.use(
    new TwitchStrategy(
        {
            clientID: process.env.TWITCH_CLIENT_ID,
            clientSecret: process.env.TWITCH_CLIENT_SECRET,
            callbackURL: process.env.TWITCH_CALLBACK_URL,
            scope: ["user:read:email"],
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                const twitchId = profile.id || profile._json?.id;

                const username =
                    profile.display_name ||
                    profile.username ||
                    profile.login ||
                    profile._json?.display_name ||
                    profile._json?.login;

                const profileImage =
                    profile.profile_image_url ||
                    profile._json?.profile_image_url;

                const db = await connectDatabase();

                let user = await db.get(
                    "SELECT * FROM users WHERE twitch_id = ?",
                    [twitchId]
                );

                if (!user) {
                    await db.run(
                        "INSERT INTO users (twitch_id, username, profile_image) VALUES (?, ?, ?)",
                        [twitchId, username, profileImage]
                    );
                } else {
                    await db.run(
                        "UPDATE users SET username = ?, profile_image = ? WHERE twitch_id = ?",
                        [username, profileImage, twitchId]
                    );
                }

                user = await db.get(
                    "SELECT * FROM users WHERE twitch_id = ?",
                    [twitchId]
                );

                return done(null, user);
            } catch (error) {
                return done(error, null);
            }
        }
    )
);

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const db = await connectDatabase();

        const user = await db.get(
            "SELECT * FROM users WHERE id = ?",
            [id]
        );

        done(null, user);
    } catch (error) {
        done(error, null);
    }
});

module.exports = passport;