# SellSense AI voice commands

The voice assistant can now recognize a combined add-items-and-bill command such as “Add one tea and one milk then make the bill” when every named product exists in inventory and has enough stock.

- The assistant matches spoken product names against inventory.
- It checks requested quantities against available stock before changing the cart.
- If a product is missing from inventory, it does not change the cart or create a bill; add that product with its price and stock first.
- When asked to create a bill, it records the sale with payment status `PENDING` until the payment is actually verified.
- Voice commands cannot make pending payments successful without an authorized payment-provider verification.

Voice recognition currently uses the browser SpeechRecognition API. Sarvam speech-to-text and text-to-speech still require their own integration and API credentials.
