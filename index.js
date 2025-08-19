import express from "express";
import bodyParser from "body-parser";
import axios from "axios";

const app = express();
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("✈️ Flight Status Webhook running with Flightradar24 ✅");
});

app.post("/webhook", async (req, res) => {
  try {
    const flightNumber = req.body.queryResult?.parameters["flight-number"]?.toUpperCase();

    if (!flightNumber) {
      return res.json({ fulfillmentText: "Please provide a valid flight number ✈️" });
    }

    // Fetch live flights
    const response = await axios.get("https://data-live.flightradar24.com/zones/fcgi/feed.js?bounds=90,-90,-180,180");
    const flights = response.data;

    let found = null;

    for (const key in flights) {
      const flight = flights[key];
      if (Array.isArray(flight) && flight[16] === flightNumber) {
        found = flight;
        break;
      }
    }

    if (found) {
      const callsign = found[16]; // Flight number
      const lat = found[1];
      const lon = found[2];
      const altitude = `${found[4]} m`;
      const speed = `${found[5]} km/h`;

      return res.json({
        fulfillmentText: `✈️ Flight ${callsign} is live:  
        📍 Position: ${lat}, ${lon}  
        🛫 Altitude: ${altitude}  
        💨 Speed: ${speed}`
      });
    } else {
      return res.json({ fulfillmentText: `Sorry, flight ${flightNumber} not found in Flightradar24 data.` });
    }
  } catch (err) {
    console.error(err.message);
    return res.json({ fulfillmentText: "Error fetching flight status ❌" });
  }
});

app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
