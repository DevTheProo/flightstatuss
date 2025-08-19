const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");

const app = express();
app.use(bodyParser.json());

// Replace with your actual API key OR use process.env.API_KEY if set in Render
const API_KEY = "a33d5942b7ab8679b378952887217fe3";

app.post("/webhook", async (req, res) => {
  try {
    const intent = req.body.queryResult.intent.displayName;

    // Match with your Dialogflow intent name (from your screenshot)
    if (intent === "CheckFlightDetails") {
      const flightNumber = req.body.queryResult.parameters["flight-number"] || "";
      const date = req.body.queryResult.parameters.date || "";

      if (!flightNumber) {
        return res.json({
          fulfillmentText: "Please provide a flight number."
        });
      }

      // Build API URL (works with or without date)
      const apiUrl =
        `https://api.aviationstack.com/v1/flights?access_key=${API_KEY}&flight_iata=${flightNumber}` +
        (date ? `&flight_date=${date}` : "");

      // Call AviationStack API
      const response = await axios.get(apiUrl);
      const results = response.data.data;

      // Handle no flight data
      if (!results || results.length === 0) {
        return res.json({
          fulfillmentText: `Sorry, I could not find flight ${flightNumber}${date ? " on " + date : ""}.`
        });
      }

      // Get first result
      const data = results[0];

      const departureAirport = data.departure.airport;
      const departureTime = data.departure.estimated || data.departure.scheduled;
      const arrivalAirport = data.arrival.airport;
      const arrivalTime = data.arrival.estimated || data.arrival.scheduled;
      const status = data.flight_status;

      return res.json({
        fulfillmentText:
          `✈️ Flight ${flightNumber} status:\n` +
          `🛫 Departure: ${departureAirport} at ${departureTime}\n` +
          `🛬 Arrival: ${arrivalAirport} at ${arrivalTime}\n` +
          `📊 Status: ${status ? status.toUpperCase() : "UNKNOWN"}`
      });
    } else {
      return res.json({
        fulfillmentText: "Sorry, I can only check flight status right now."
      });
    }
  } catch (error) {
    console.error(error);
    return res.json({
      fulfillmentText: "There was an error fetching the flight status. Please try again."
    });
  }
});

// Default GET route to check if server is live
app.get("/", (req, res) => {
  res.send("Flight Status Webhook is running ✅");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
