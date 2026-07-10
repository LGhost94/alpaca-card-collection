const express = require("express");
const multer = require("multer");
const path = require("path");

const cardsController = require("../controllers/cardsController");

const router = express.Router();

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "public/cards");
    },
    filename: (req, file, cb) => {
        const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1E9);
        cb(null, uniqueName + path.extname(file.originalname));
    }
});

const upload = multer({ storage });

router.get("/", cardsController.getCards);

router.post("/", upload.single("image"), cardsController.createCard);

router.put("/:id", upload.single("image"), cardsController.updateCard);

router.delete("/:id", cardsController.deleteCard);

router.post("/open-pack", cardsController.openPack);

module.exports = router;