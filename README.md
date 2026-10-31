# SellSense AI — Merchant Growth Assistant

SellSense AI is a voice-first merchant assistant for the Paytm Build for India hackathon. It combines a Paytm-inspired merchant dashboard, camera barcode scanning, checkout, stock tracking, and store-data analysis.

## Main features

- Paytm-inspired white, navy, and cyan interface.
- Mobile rear-camera live barcode scanning powered by ZXing Browser 0.1.5 and ZXing Library 0.21.3, phone camera photo scanning, plus USB barcode scanner and manual barcode entry.
- A scanned product is matched against the inventory barcode and added to the current bill.
- If a barcode is new, the shopkeeper can register the product and barcode once; the product is then added to the open bill.
- Checkout records every product line under one order, calculates the bill total, deducts inventory, and refreshes sales analysis.
- Sales analysis includes day/week/month revenue, order count, units sold, average order value, payment-method totals, top products, category performance, peak sales hour and weekday, products often bought together, stock cover, reorder suggestions, and slow-moving inventory.
- Floating voice assistant stays available throughout the app, supports spoken questions and spoken replies, and can navigate to Scan & Sell or Inventory and add a known product to the bill by voice.
- The assistant analyzes current store records, supports contextual follow-up questions, and suggests useful next questions. Add a Gemini API key to enable natural-language AI reasoning grounded in the store snapshot; without a key, the built-in analytics assistant remains available.
- Store records are saved in a local JSON file by default. MongoDB can be enabled with an environment variable.

## Requirements

- Node.js 18.11 or newer
- npm
- A modern browser
- For live camera access on a phone, use an HTTPS address. A plain HTTP LAN address may load the app but browsers can block camera access. `localhost` is also allowed for local development on the same device.

## Setup

From the main project folder (`SellSense_AI_Full_Project`), run:

```bash
npm install
npm run install:all
npm run dev
```

This starts both services together: the API on port 5000 and the website on port 5173. Keep this terminal window open. The website forwards `/api` requests to the API through Vite, so the phone does not need to connect directly to port 5000.

To start the services separately, use two terminals:

Terminal 1, from the main project folder:

```bash
npm run dev --prefix server
```

Terminal 2, from the main project folder:

```bash
npm run dev --prefix client
```

Open the website address printed by Vite. On a phone connected to the same Wi-Fi, use the computer's LAN IP address with port 5173 (for example, `http://192.168.1.10:5173`), not `localhost`. Allow Node.js through the computer's firewall if the phone cannot open that address. The Vite API proxy forwards requests to port 5000 on the computer.

Copy `server/.env.example` to `server/.env`. Set `GEMINI_API_KEY` to a key from [Google AI Studio](https://aistudio.google.com/apikey) to enable Gemini-powered conversational analysis. The key stays on the backend and is never sent to the browser. The assistant sends a store metrics snapshot and recent conversation to Gemini using the Interactions API with `store: false`; without a key, local data-grounded analytics answers are used. Set `MONGODB_URI` to enable MongoDB; otherwise the app uses local JSON persistence. In production, set `CLIENT_ORIGIN` to your frontend origin(s), separated by commas.

## Mobile barcode scanning

1. Run the app on a host that has HTTPS enabled, or use `localhost` while testing on the same device.
2. Open **Scan & Sell** on the phone.
3. Tap **Start live camera** and allow camera permission. The rear camera is requested where available.
4. Keep the complete barcode inside the blue scan frame. A matched item is added to the bill.
5. When live camera access is blocked, tap **Take barcode photo**. The phone camera opens and SellSense reads the barcode from the photo. To scan the same physical barcode again, move it out of view briefly and present it again.
6. When a barcode is not registered, choose **Add this barcode to inventory**, enter the product name, category, selling price, and available stock. The new item is added to the current bill.
7. Complete the sale. The bill lines are stored under one order, inventory is reduced, and revenue/product analysis refreshes.

The starter catalog contains synthetic EAN-13 test codes with valid check digits (they are for scanner testing, not registered retail GTINs): Masala Chips `8901000000019`, Milk 1L `8901000000026`, Basmati Rice 1kg `8901000000033`, Soap `8901000000040`, and Tea 250g `8901000000057`. Use matching printed labels when testing; a scanner returns the barcode physically printed on the product, not the sample code shown in the app.

If live camera permission is blocked, check the browser's site settings. Continuous camera access is restricted on ordinary HTTP pages that are not localhost; use an HTTPS deployment or secure tunnel for live scanning on a phone. The photo-capture option may still be available through the phone's file input. USB barcode scanners that type into a keyboard field and manual entry are also supported. The development frontend uses a same-origin `/api` route proxied by Vite to the local API server. For a separate production deployment, set `VITE_API_URL` to the full API base URL, including `/api`.

## Voice assistant

Use the floating SellSense panel on any page. Select English, Hindi, or Hinglish and tap the microphone to start continuous voice conversation. Browser speech recognition support and microphone permission are required.

Example questions:

- How much did I sell today?
- Compare today with yesterday.
- Which product earned the most?
- How is Milk 1L performing?
- What should I restock?
- Which products are slow moving?
- What is my average bill value?
- Which hour is busiest?
- Which day of the week is strongest?
- Which products are often bought together?
- Why are sales down?
- Compare this week with last week.
- What can I expect tomorrow?
- How much is my current inventory worth?
- Show my UPI, cash, and card collections.

Voice actions include **open Scan & Sell**, **open Inventory**, **add 2 Milk 1L to bill**, and **clear bill**. The product must already exist in Inventory for voice adding to work.

## Payment integration note

The checkout records the payment method and the payment status selected by the shopkeeper. A status entered in SellSense is a store record, not independent bank confirmation. Live Paytm payment initiation and verification require authorized merchant API credentials and an approved integration; no credentials are included in this source package.

## Important calculations

- Sales revenue includes records marked paid and excludes pending or failed records.
- Average order value is paid revenue divided by the number of unique orders.
- Product movement uses paid sale lines from the most recent 30 calendar days.
- Stock cover is estimated from average daily units sold over those 30 days.
- Suggested reorder quantity targets about seven days of stock cover; review supplier lead time, expiry, and local demand before ordering.
- Profit is not calculated because purchase cost and operating expenses are not included by default. Repeat-customer patterns are not calculated because customer identifiers are not collected.

## Sarvam AI voice assistant setup

The backend now includes a Sarvam chat endpoint and a first-call test script. The API key stays on the server and must never be placed in the React client.

1. Copy `server/.env.example` to `server/.env`.
2. Set `SARVAM_API_KEY` to your key from the Sarvam dashboard. Keep the key private.
3. From the project root, run `npm run install:all`.
4. Test the first API call with `npm run sarvam:test --prefix server`.
5. Start the app with `npm run dev`.
6. Check configuration at `GET /api/sarvam/status` and send a question to `POST /api/sarvam/chat` with JSON `{ "question": "Give me one tip to manage shop stock." }`.

The chat endpoint is the first integration step. Audio capture/transcription and generated speech still need to be wired into the existing React voice controls before the entire voice pipeline is complete. The authenticated live call cannot be tested until you add your own API key and have available Sarvam credits.

## Offline-first voice commands

The assistant now includes deterministic local handlers for common store queries and cart actions, so these do not require a Sarvam/Gemini/other AI API key. Examples include adding tea and biscuit packets, making a bill, checking today's recorded sales, listing products and prices, checking tea stock, viewing low-stock products, viewing pending transactions, finding the top-selling product, and calculating last-7-day revenue. The assistant also provides a list of ready-to-use commands in the UI.

Voice input uses the browser's Web Speech Recognition implementation and the selected language locale (English, Hindi/Hinglish, Kannada, Tamil, Telugu, Bengali, Marathi, Gujarati, Punjabi). This browser feature is not available in every browser/device, and recognition quality/language availability depends on the browser and device. The local command parser has English and common Hindi/Hinglish aliases; it does not guarantee understanding of every language or every phrasing. Unrecognized analytics questions may still use the configured backend AI endpoint. Microphone access requires a supported browser and a secure context (HTTPS or localhost).

Starter inventory now includes Tea 250g, Tea Cup, Biscuit Packet, and 10 other common products. Use Reset store data if an existing local JSON database does not show the new starter products; reset will erase existing local sales and inventory changes.
