const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");

const app = express();
app.use(bodyParser.json());

// Replace with your AviationStack API key
const API_KEY = "a33d5942b7ab8679b378952887217fe";

app.post("/webhook", async (req, res) => {
  try {
    const intent = req.body.queryResult.intent.displayName;

    if (intent === "CheckFlightStatus") {
      const flightNumber = req.body.queryResult.parameters["flight-number"];

      if (!flightNumber) {
        return res.json({
          fulfillmentText: "Please provide a valid flight number."
        });
      }

      // Call AviationStack API
      const response = await axios.get("http://api.aviationstack.com/v1/flights", {
        params: {
          access_key: API_KEY,
          flight_iata: flightNumber
        }
      });

      const data = response.data.data[0];

      if (!data) {
        return res.json({
          fulfillmentText: `I couldn’t find details for flight ${flightNumber}.`
        });
      }

      // Extract details
      const dep = data.departure;
      const arr = data.arrival;

      const responseText =
        `✈️ Flight ${flightNumber}\n` +
        `From: ${dep.airport} (${dep.iata})\n` +
        `To: ${arr.airport} (${arr.iata})\n` +
        `Departure: ${dep.scheduled || "N/A"} (Scheduled) → ${dep.estimated || "N/A"} (Estimated)\n` +
        `Arrival: ${arr.scheduled || "N/A"} (Scheduled) → ${arr.estimated || "N/A"} (Estimated)\n` +
        `Status: ${data.flight_status.toUpperCase()}`;

      return res.json({ fulfillmentText: responseText });
    }

    // Default fallback
    return res.json({
      fulfillmentText: "I couldn’t process that request."
    });

  } catch (error) {
    console.error("Error:", error.message);
    res.json({
      fulfillmentText: "There was an error fetching the flight status. Please try again."
    });
  }
});

app.listen(3000, () => {
  console.log("Flight status webhook is running on port 3000");
});
