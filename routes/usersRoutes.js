const express = require("express");
const usersController = require("../controllers/usersController");

const router = express.Router();

router.get("/", usersController.getUsers);

router.post("/:id/toggle-admin", usersController.toggleAdmin);

router.post("/:id/add-packs", usersController.addPacks);

module.exports = router;