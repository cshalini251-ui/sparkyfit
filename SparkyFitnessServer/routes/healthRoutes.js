const express = require("express");
const router = express.Router();

router.use(express.json());

router.get("/", async (req, res,) => {
  return res.json({
    status: "UP",
  });
});

module.exports = router;
