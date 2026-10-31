::: {align="center"}
# SellSense AI

### Your shop's sales, stock, and next step --- one conversation away.

**A voice-first retail assistant built to help small shopkeepers bill
faster, track stock, and understand their business.**

**Paytm Build for India AI Hackathon · Independent project**
:::The problem we're solving
A shopkeeper's day is full of quick decisions: What should go into this
bill? Which items are running low? What is selling? What should be
restocked?

Large businesses use digital systems to answer these questions. Small
retailers often manage them while serving customers. SellSense AI
brings billing, inventory, sales records, and a conversational assistant
into one workspace.
Less time navigating screens. More clarity about the shop.

What SellSense AI does
- Scan or select products: barcode scanning, photo/manual code
  entry where supported, and Quick Add.
- Build bills with voice: supported commands can add known
  products and quantities to the current bill.
- Keep stock in sync: checkout records the sale and updates
  inventory through the checkout workflow.
- Ask questions naturally: query available inventory, recorded
  sales, and pending transaction records.
- Get practical signals: dashboard metrics and restocking guidance
  use the data recorded in the app.
- Choose how to interact: type questions or use supported browser
  speech features, with English, Hindi, and Hinglish response options.
- Choose a data setup: local JSON persistence by default, with
  optional MongoDB configuration.
- Use supported AI integrations: Gemini and Sarvam AI options are
  available for supported workflows when correctly configured.
See it in action
1. Understand the shop
The dashboard shows recorded sales, recent activity, and inventory items
that may need attention.
2. Create a bill
Open Scan & Sell and scan a product, enter a code, use photo input
where supported, or choose an item from Quick Add. Supported voice
commands can also add known products.

Example:
"Add two milk packets and one bread to the bill."

The app matches known inventory items and uses their saved prices. The
shopkeeper reviews the bill before checkout.
3. Complete checkout
Checkout saves the sale record and updates stock. Payment status is a
record selected by the merchant; it is not live confirmation from a
bank or payment provider.
4. Ask the assistant
Try questions such as:
- "Which products need restocking?"
- "Show my pending payments."
- "What are my recent sales?"
Answers depend on the data stored in the app and the features configured
for the current run.
5. Make a more informed decision
Stock and sales movement can help the shopkeeper plan the next order.
Restocking suggestions are estimates based on available records, not
guarantees about future demand.
Technology stack
  Layer                   Technologies            Role
  Frontend                React 18, Vite 6,       Dashboard, billing,
JavaScript, CSS         inventory,
transactions, assistant

  Backend                 Node.js, Express 4      API routes and
application workflows

  Data                    JSON persistence;       Product and sales
optional MongoDB and    records
Mongoose                

  Barcode                 ZXing Browser           Browser-based barcode
scanning

  Voice                   Browser MediaDevices    Camera access, speech
and Web Speech APIs     recognition, spoken
replies where supported

  AI                      Gemini Interactions     Supported
API; Sarvam AI backend  conversational and
integration             speech-related
workflows
UI                      Lucide React            Interface icons
Architecture
Shopkeeper
   │
   ├── Dashboard · Scan & Sell · Inventory · Transactions
   └── Voice / text assistant
                │
                ▼
       React 18 + Vite 6
                │  /api
                ▼
       Node.js + Express API
         │          │          │
         ▼          ▼          ▼
      Products     Sales    Assistant & Insights
         │          │          │
         └──────────┴──────────┘
                    │
                    ▼
       JSON persistence by default
          or configured MongoDB
                    │
                    ▼
       Optional Gemini / Sarvam AI
The backend keeps provider credentials out of browser code. Supported
local commands and local analytics can work without an AI provider key;
external AI requests require valid configuration and network access.
Run locally
Prerequisites
- Node.js 18.11 or newer
- npm
- A modern browser
Install and start
Run these commands from the project root, SellSense_AI_Full_Project:
npm install
npm run install:all
npm run dev
The documented development setup starts the API on port 5000 and the
Vite frontend on port 5173. Open the frontend address printed by Vite
and keep the terminal running.

You can also run each service separately:
npm run dev --prefix server
npm run dev --prefix client
These commands follow the documented project scripts. If your checkout
has different folder names or scripts, check the root and
package-level package.json files.

Environment setup
Copy the example environment file:
cp server/.env.example server/.env
On Windows Command Prompt:
copy server\.env.example server\.env
Configure only the services you plan to use:

  Variable           Purpose
  GEMINI_API_KEY   Optional Gemini conversational analysis
SARVAM_API_KEY   Sarvam AI backend integration
MONGODB_URI      Optional MongoDB connection
CLIENT_ORIGIN    Allowed frontend origin or origins
Security basics
- Never commit .env files, API keys, database credentials, or real
  store data.
- Keep secret keys on the backend; never put them in frontend code.
- Keep .env.example limited to variable names and safe placeholders.
- Rotate a key immediately if it is accidentally exposed.
Hackathon demo flow
For a clear end-to-end presentation:
1. Open the dashboard and explain the shop snapshot.
2. Open Scan & Sell and add a product using barcode scan or Quick
   Add.
3. Use a supported voice command to add known products to the bill.
4. Review the bill and complete checkout with a clearly explained demo
   payment status.
5. Open Transactions to show the recorded sale.
6. Return to Inventory and show the stock update.
7. Ask the assistant which products may need restocking.
8. Close with the technology stack and the path to supporting more
   shops.
Demo checklist - Reset demo data and rehearse the exact commands and
questions. - Keep a known barcode or Quick Add as a backup. - Mobile
camera scanning may require HTTPS; use photo input or manual entry where
supported. - Test AI features with valid credentials and internet
access. - Demo data proves the workflow---not real merchant adoption or
measured business impact.
Current scope and limitations
SellSense AI is a prototype demonstrating a practical retail workflow.
These boundaries matter:
- It is not fully offline. Supported local commands and analytics
  may work without an AI key, but external AI calls need connectivity.
- Browser speech features vary by browser and device and may rely on
  online services.
- Payment status is entered in the app; live payment-provider
  verification is not claimed.
- Insights depend on accurate and complete sales and stock records.
- Restocking guidance is an estimate, not a guaranteed demand
  forecast.
- Production use across multiple real stores would require further
  review of data separation, access control, reliability, and
  deployment.
- Profit calculation is not claimed because complete purchase-cost and
  expense records are not maintained.
Roadmap
Potential next steps as the project matures:
- Multi-store separation, user accounts, and role-based access
- Production database setup, backups, migrations, and recovery
- Verified payment-provider integrations and payment reconciliation
- More reliable multilingual speech support across devices
- More detailed sales trends and configurable stock alerts
- Automated tests, CI checks, monitoring, and deployment hardening
- Usability testing with real shopkeepers and changes based on their
  feedback
This roadmap describes possible future work, not features promised by
the current prototype.
Why it matters
Small retailers make important decisions every day, often while doing
several jobs at once. Technology should meet them where they are---not
make them learn a complicated system before it becomes useful.

SellSense AI explores a simple idea: let shopkeepers work in familiar
ways, keep store records connected, and make those records easier to
understand through conversation.

Start with one shop. Build for many.
Contributing
Contributions, issue reports, and practical feedback are welcome.
1. Fork the repository.
2. Create a feature branch.
3. Make a focused change.
4. Test the affected workflow.
5. Open a pull request with a clear description and test notes.
Do not include secrets, personal data, or real merchant records in
issues, screenshots, or pull requests.
License
No license is specified here. Add a LICENSE file before presenting the
repository as open source, and choose a license that matches your team's
intent.
Acknowledgment
Built for the Paytm Build for India AI Hackathon as an independent
project. SellSense AI is not an official Paytm product and does not
claim endorsement by Paytm.
::: {align="center"}
### SellSense AI

**A simpler way to run the shop---and understand what comes next.**
:::
