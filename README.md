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
## Setup & Deployment

Follow these steps to run this project in your own environment.


### 1. Clone the Repository


git clone https://github.com/<your-username>/<your-repo>.git
cd <your-repo>
### 2. Install Dependencies

This project uses Node.js.
Make sure you have Node.js v18+ installed.

```npm install```

### 3. Create a Firebase Project & Firestore Database
- Go to the Firebase Console

- Create a new Firebase project (or select an existing one)

- In Build → Firestore Database, create a new database in Production mode

- Copy your Project ID (you will use it in Wrangler config later)

### 4. Configure Firestore Security Rules
In the Firebase console, open Firestore → Rules and set something like:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /itineraries/{document=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```
### 5. Create a Google Cloud Service Account & Key


### 6. Set Up Cloudflare Worker
- Install Wrangler (Cloudflare CLI):


``` npm install -g wrangler```
- Login to Cloudflare:

``` wrangler login ```

### 7. Configure Wrangler Secrets
We store sensitive values in Wrangler secrets.

Run:

``` wrangler secret put FIREBASE_PROJECT_ID```
``` wrangler secret put FIREBASE_CLIENT_EMAIL```
``` wrangler secret put FIREBASE_PRIVATE_KEY```
FIREBASE_PROJECT_ID → from Firebase setting

FIREBASE_CLIENT_EMAIL → from your service account JSON

FIREBASE_PRIVATE_KEY → from your service account JSON (wrap in quotes and escape \n if needed)

### 8. Deploy the Worker

``` wrangler publish```
After deployment, Wrangler will give you a public URL, for example:

https://your-worker-name.your-subdomain.workers.dev

### 9. Test the API
Example request to create an itinerary:

curl -X POST https://your-worker-url/generate-itinerary \
-H "Content-Type: application/json" \
-d '{"destination": "Tokyo", "durationDays": 3}'
