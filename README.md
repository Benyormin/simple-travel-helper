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
    
    // Match all itineraries
    match /itineraries/{docId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.uid;
    }
    
    // Optionally, allow create if user is authenticated and setting their own UID
    match /itineraries/{docId} {
      allow create: if request.auth != null && request.resource.data.uid == request.auth.uid;
    }
  }
}

```
### 5. Create a Google Cloud Service Account & Key
There are two ways to provide authentication to Firestore from your Cloudflare Worker:

---

#### Option A: Using a Service Account (Recommended if you have a Google Cloud project with billing enabled)

- In the [Google Cloud Console](https://console.cloud.google.com/), create a **Service Account** with Firestore access.
- Generate a **JSON key** file for that service account.
- From the JSON key, extract and set Wrangler secrets.

#### Option B: Using Application Default Credentials (For quick testing or if you don’t have billing enabled)
Make sure you have the Google Cloud SDK installed locally. [gcloud](https://cloud.google.com/sdk/docs/install)

In the Google Cloud SDK shell, run:

```gcloud auth application-default print-access-token```
Copy the printed access token and set it as a Wrangler secret:

``` wrangler secret put FIREBASE_ACCESS_TOKEN```

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
