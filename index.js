import express from "express";
import bodyParser from "body-parser";
import axios from "axios";

const app = express();
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("✈️ Flight Status Webhook running with OpenSky ✅");
});

app.post("/webhook", async (req, res) => {
  try {
    const flightNumber = req.body.queryResult?.parameters["flight-number"]?.toUpperCase();

    if (!flightNumber) {
      return res.json({ fulfillmentText: "Please provide a valid flight number ✈️" });
    }

    const response = await axios.get("https://opensky-network.org/api/states/all");

    if (response.data && response.data.states) {
      const flights = response.data.states;

      // Match ICAO callsign
      const match = flights.find(f => f[1]?.trim() === flightNumber);

      if (match) {
        const callsign = match[1]?.trim();
        const country = match[2];
        const lat = match[6]?.toFixed(2);
        const lon = match[5]?.toFixed(2);
        const altitude = match[13] ? `${Math.round(match[13])} m` : "unknown";
        const velocity = match[9] ? `${(match[9] * 3.6).toFixed(1)} km/h` : "unknown";

        return res.json({
          fulfillmentText: `✈️ Flight ${callsign} (${country})  
          📍 Location: ${lat}, ${lon}  
          🛫 Altitude: ${altitude}  
          💨 Speed: ${velocity}`
        });
      } else {
        return res.json({ fulfillmentText: `Sorry, no live data found for flight ${flightNumber}.` });
      }
    }

    return res.json({ fulfillmentText: "No flight data available at the moment." });
  } catch (err) {
    console.error(err.message);
    return res.json({ fulfillmentText: "Error fetching flight status ❌" });
  }
});

app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
