const express = require("express");
const multer = require("multer");
const path = require("path");

const settingsController =
    require("../controllers/settingsController");

const router = express.Router();

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "public/images");
    },

    filename: (req, file, cb) => {
        const uniqueName =
            Date.now() + "-" + Math.round(Math.random() * 1E9);

        cb(
            null,
            uniqueName + path.extname(file.originalname)
        );
    }
});

const upload = multer({ storage });

router.get("/", settingsController.getSettings);

router.post(
    "/",
    upload.fields([
        { name: "homeAdImage", maxCount: 1 },
        { name: "homeBackground", maxCount: 1 },
        { name: "siteLogo", maxCount: 1 },
        { name: "siteFavicon", maxCount: 1 }
    ]),
    settingsController.updateSettings
);

router.post(
    "/weekly-card",
    settingsController.updateWeeklyCard
);

module.exports = router;