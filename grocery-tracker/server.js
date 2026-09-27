import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Serves your static HTML files

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

app.post('/api/search-grocery', async (req, res) => {
  try {
    const { items } = req.body;
    if (!items) {
      return res.status(400).json({ error: 'Item list is required.' });
    }

    // Fixed reference point: FIU Modesto A. Maidique Campus (MMC)
    const prompt = `
      You are a local shopping assistant.
      The starting location is fixed at FIU Modesto A. Maidique Campus (11200 SW 8th St, Miami, FL 33199).

      The user is searching for these products: "${items}".

      Find real or highly representative nearby grocery stores (e.g., Publix, Target, Aldi, Trader Joe's, Walmart) relative to FIU MMC.
      Estimate driving distance in miles from FIU MMC, estimate product availability, and provide individual costs.

      Return strictly valid JSON with no markdown block formatting using this structure:
      {
        "results": [
          {
            "storeName": "Store Name (e.g. Publix at University Park)",
            "distanceMiles": 1.2,
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
