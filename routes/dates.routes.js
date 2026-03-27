const router = require("express").Router()

const carController = require("../controllers/car.controller")


router.get("/", async (req, res) => {
  try {
    const today = new Date();

    const dates = [];

    for (let i = 0; i < 10; i++) {
      const d = new Date();
      d.setDate(today.getDate() + i);

      const price = 900 + Math.floor(Math.random() * 500);

      dates.push({
        day: d.toLocaleDateString("en-US", { weekday: "short" }),
        date: d.getDate(),
        month: d.toLocaleDateString("en-US", { month: "short" }),
        price,
        tag: i === 0 ? "TODAY" : price < 1000 ? "Low" : price > 1300 ? "HIGH" : ""
      });
    }

    res.json(dates);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;