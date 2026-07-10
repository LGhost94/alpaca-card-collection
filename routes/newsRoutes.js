const express = require("express");
const newsController = require("../controllers/newsController");

const router = express.Router();

router.get("/", newsController.getNews);
router.post("/", newsController.createNews);
router.delete("/:id", newsController.deleteNews);

module.exports = router;