import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

// Load environment variables immediately
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

app.post('/api/search-grocery', async (req, res) => {
  try {
    const { items } = req.body;
    if (!items) {
      return res.status(400).json({ error: 'Item list is required.' });
    }

    // Verify key exists before initializing
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('GEMINI_API_KEY is missing from environment variables.');
      return res.status(500).json({ error: 'Server configuration error: API key missing.' });
    }

    // Instantiate inside the handler so process.env is guaranteed to be loaded
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
      You are a local shopping assistant.
      The starting location is fixed at FIU Modesto A. Maidique Campus (11200 SW 8th St, Miami, FL 33199).
      
      The user is searching for these products: "${items}".
      
      Find real or highly representative nearby grocery stores (e.g., Publix, Target, Aldi, Sedano's, Walmart) relative to FIU MMC.
      Estimate driving distance in miles from FIU MMC, estimate product availability, and provide individual/total estimated costs.
      
      Return strictly valid JSON with no markdown block formatting using this structure:
      {
        "results": [
          {
            "storeName": "Store Name",
            "distanceMiles": 1.2,
            "estimatedTotalCost": "$12.50",
            "products": [
              { "name": "Item Name", "estimatedPrice": "$3.50", "inStock": true }
            ]
          }
        ]
      }
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });

    const data = JSON.parse(response.text);
    res.json(data);
  } catch (err) {
    console.error('Error fetching Gemini response:', err);
    res.status(500).json({ error: 'Failed to process request.' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));