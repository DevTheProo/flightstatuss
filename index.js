import express from "express";
import bodyParser from "body-parser";
import axios from "axios";

const app = express();
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;

// Root route
app.get("/", (req, res) => {
  res.send("✈️ Flight Status Webhook is running with OpenSky ✅");
});

// Webhook endpoint
app.post("/webhook", async (req, res) => {
  try {
    const flightNumber = req.body.queryResult?.parameters["flight-number"];

    if (!flightNumber) {
      return res.json({
        fulfillmentText: "Please provide a valid flight number ✈️"
      });
    }

    // OpenSky API (returns all live aircraft states)
    const response = await axios.get("https://opensky-network.org/api/states/all");

    if (response.data && response.data.states) {
      const flights = response.data.states;
      // OpenSky gives ICAO24 + callsign instead of IATA flight no.
      const match = flights.find(f => f[1]?.trim() === flightNumber);

      if (match) {
        const callsign = match[1]?.trim();
        const originCountry = match[2];
        const velocity = match[9] ? `${(match[9] * 3.6).toFixed(1)} km/h` : "unknown speed";
        const altitude = match[13] ? `${Math.round(match[13])} m` : "unknown altitude";

        return res.json({
          fulfillmentText: `Flight ${callsign} from ${originCountry} is currently flying at ${altitude} with speed ${velocity}.`
        });
      } else {
        return res.json({
          fulfillmentText: `Sorry, I could not find the status for flight ${flightNumber}.`
        });
      }
    } else {
      return res.json({
        fulfillmentText: "No flight data available at the moment."
      });
    }
  } catch (error) {
    console.error("Error fetching flight data:", error.message);
    return res.json({
      fulfillmentText: "Oops! Something went wrong fetching the flight status."
    });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
