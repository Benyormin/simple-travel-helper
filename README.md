# simple-travel-helper



This project is a **Cloudflare Worker + Firebase Firestore** application that generates detailed travel itineraries using the **Google Gemini model**.  
It supports asynchronous processing — meaning you can start a job, then retrieve the generated itinerary later.

---

## Features
- **Generate travel itineraries** with AI (Gemini).
- **Async job processing** with unique job IDs.
- **Firestore integration** for storing job status and results.
- **Two test endpoints**: `/helloGPT` and `/helloGemini`.
- Fully deployable on **Cloudflare Workers**.

---

## Tech Stack
- **Cloudflare Workers** (serverless execution)
- **Google Gemini API**
- **Firebase Firestore** (database)
- **JavaScript**

---

