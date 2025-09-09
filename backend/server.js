const express = require("express");
const axios = require("axios");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());

// ✅ Root route
app.get("/", (req, res) => {
  res.send("🌦️ Weather API is running. Use /weather/:city to get weather data.");
});

// ✅ Weather API route
app.get("/weather/:city", async (req, res) => {
  const city = req.params.city;
  try {
    const response = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${process.env.WEATHER_API_KEY}&units=metric`
    );
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: "City not found" });
  }
});


// 5-day forecast
app.get("/forecast/:city", async (req, res) => {
  const city = req.params.city;
  try {
    const response = await axios.get(
      `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${process.env.WEATHER_API_KEY}&units=metric`
    );
    res.json(response.data);
  } catch (error) {
    res.status(404).json({ error: "City not found" });
  }
});


app.listen(5000, () =>
  console.log("✅ Backend running on http://localhost:5000")
);
