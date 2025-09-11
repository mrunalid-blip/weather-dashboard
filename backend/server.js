const express = require("express");
const axios = require("axios");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());

const API_KEY = process.env.WEATHER_API_KEY; // ✅ use correct key
const BASE_URL = "https://api.openweathermap.org/data/2.5";

// Root endpoint
app.get("/", (req, res) => {
  res.send("✅ Weather API is running");
});

// Weather by city name
app.get("/weather/:city", async (req, res) => {
  try {
    const city = req.params.city;
    console.log(`🌍 Fetching weather for city: ${city}`); // debug log

    const response = await axios.get(
      `${BASE_URL}/weather?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`
    );

    res.json(response.data);
  } catch (err) {
    console.error("❌ City weather error:", err.response?.data || err.message);
    res.status(500).json({ error: err.response?.data || "Could not fetch city weather" });
  }
});

// Forecast by city name
app.get("/forecast/:city", async (req, res) => {
  try {
    const city = req.params.city;
    console.log(`📅 Fetching forecast for city: ${city}`); // debug log

    const response = await axios.get(
      `${BASE_URL}/forecast?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`
    );

    res.json(response.data);
  } catch (err) {
    console.error("❌ City forecast error:", err.response?.data || err.message);
    res.status(500).json({ error: err.response?.data || "Could not fetch city forecast" });
  }
});

// Weather by coordinates
app.get("/weather", async (req, res) => {
  try {
    const { lat, lon } = req.query;
    if (!lat || !lon) {
      return res.status(400).json({ error: "Missing lat/lon parameters" });
    }

    console.log(`📍 Fetching weather for coords: ${lat}, ${lon}`);

    const response = await axios.get(
      `${BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
    );

    res.json(response.data);
  } catch (err) {
    console.error("❌ Coords weather error:", err.response?.data || err.message);
    res.status(500).json({ error: err.response?.data || "Could not fetch weather by coordinates" });
  }
});

// Forecast by coordinates
app.get("/forecast", async (req, res) => {
  try {
    const { lat, lon } = req.query;
    if (!lat || !lon) {
      return res.status(400).json({ error: "Missing lat/lon parameters" });
    }

    console.log(`📍 Fetching forecast for coords: ${lat}, ${lon}`);

    const response = await axios.get(
      `${BASE_URL}/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
    );

    res.json(response.data);
  } catch (err) {
    console.error("❌ Coords forecast error:", err.response?.data || err.message);
    res.status(500).json({ error: err.response?.data || "Could not fetch forecast by coordinates" });
  }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
  console.log(`🔑 Using API Key: ${API_KEY ? "Loaded ✅" : "Missing ❌"}`);
});
