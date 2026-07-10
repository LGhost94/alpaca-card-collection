const express = require("express");
const collectionController = require("../controllers/collectionController");

const router = express.Router();

router.get("/", collectionController.getCollection);

module.exports = router;