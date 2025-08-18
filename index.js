const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");

const app = express();
app.use(bodyParser.json());

// Replace with your actual API key
const API_KEY = "a33d5942b7ab8679b378952887217fe3";

app.post("/webhook", async (req, res) => {
  try {
    const intent = req.body.queryResult.intent.displayName;

    if (intent === "CheckFlightStatus") {
      const airline = req.body.queryResult.parameters.airline || "";
      const flightNumber = req.body.queryResult.parameters["flight-number"] || "";
      const date = req.body.queryResult.parameters.date || "";

      if (!airline || !flightNumber) {
        return res.json({
          fulfillmentText: "Please provide both airline and flight number."
        });
      }

      // Call real-time flight status API
      const response = await axios.get(
        `https://api.aviationstack.com/v1/flights?access_key=${API_KEY}&flight_iata=${airline}${flightNumber}&flight_date=${date}`
      );

      const data = response.data.data[0];

      if (!data) {
        return res.json({
          fulfillmentText: `Sorry, I could not find flight ${airline}${flightNumber} on ${date}.`
        });
      }

      const departureAirport = data.departure.airport;
      const departureTime = data.departure.estimated || data.departure.scheduled;
      const arrivalAirport = data.arrival.airport;
      const arrivalTime = data.arrival.estimated || data.arrival.scheduled;
      const status = data.flight_status;

      return res.json({
        fulfillmentText: `✈️ Flight ${airline}${flightNumber} status:\n` +
          `🛫 Departure: ${departureAirport} at ${departureTime}\n` +
          `🛬 Arrival: ${arrivalAirport} at ${arrivalTime}\n` +
          `📊 Status: ${status.toUpperCase()}`
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

app.get("/", (req, res) => {
  res.send("Flight Status Webhook is running ✅");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
