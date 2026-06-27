import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '10mb' }));

// Initialize the GoogleGenAI client lazily or with a fallback check
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is required. Please set it in the Secrets panel.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

// Retry helper for handling model rate limits, high demand spikes (503), or transient network errors
const executeWithRetry = async <T>(fn: () => Promise<T>, retries = 3, delay = 1500): Promise<T> => {
  try {
    return await fn();
  } catch (error: any) {
    const errorStr = JSON.stringify(error) || String(error) || '';
    const errorMessage = error.message || '';
    
    const isRetryable = 
      errorStr.includes('503') || 
      errorStr.includes('429') || 
      errorStr.includes('UNAVAILABLE') || 
      errorStr.toLowerCase().includes('high demand') ||
      errorMessage.includes('503') || 
      errorMessage.includes('429') || 
      errorMessage.includes('UNAVAILABLE') || 
      errorMessage.toLowerCase().includes('high demand');

    if (isRetryable && retries > 0) {
      console.warn(`Gemini API returned retryable error (503/429/UNAVAILABLE). Retrying in ${delay}ms... (${retries} attempts left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return executeWithRetry(fn, retries - 1, delay * 2);
    }
    throw error;
  }
};

// API Endpoint to check if Gemini key is set up
app.get('/api/status', (req, res) => {
  const isKeySet = !!process.env.GEMINI_API_KEY;
  res.json({ status: isKeySet ? 'configured' : 'missing' });
});

// Main endpoint for general text and chat generations
app.post('/api/gemini/generate', async (req, res) => {
  try {
    const { prompt, systemInstruction, model, temperature, topP } = req.body;
    const ai = getGeminiClient();

    const selectedModel = model || 'gemini-3.5-flash';
    
    // Create config object
    const config: any = {};
    if (systemInstruction) {
      config.systemInstruction = systemInstruction;
    }
    if (typeof temperature === 'number') {
      config.temperature = temperature;
    }
    if (typeof topP === 'number') {
      config.topP = topP;
    }

    const response = await executeWithRetry(() => 
      ai.models.generateContent({
        model: selectedModel,
        contents: prompt,
        config,
      })
    );

    res.json({ text: response.text || '' });
  } catch (error: any) {
    console.error('Gemini API Error:', error);
    res.status(500).json({ error: error.message || 'An error occurred while generating content' });
  }
});

// Endpoint for generating structured JSON schemas
app.post('/api/gemini/schema', async (req, res) => {
  try {
    const { prompt, schemaType, properties, arrayItemType, model } = req.body;
    const ai = getGeminiClient();

    const selectedModel = model || 'gemini-3.5-flash';

    // Construct the responseSchema dynamically based on the requested format
    let responseSchema: any = {};

    if (schemaType === 'ARRAY') {
      const itemsProperties: any = {};
      if (properties && Array.isArray(properties)) {
        properties.forEach((prop: any) => {
          itemsProperties[prop.name] = {
            type: Type.STRING,
            description: prop.description || '',
          };
        });
      }

      responseSchema = {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: itemsProperties,
          required: properties ? properties.map((p: any) => p.name) : [],
        },
      };
    } else {
      // Single Object schema
      const objectProperties: any = {};
      if (properties && Array.isArray(properties)) {
        properties.forEach((prop: any) => {
          objectProperties[prop.name] = {
            type: Type.STRING,
            description: prop.description || '',
          };
        });
      }

      responseSchema = {
        type: Type.OBJECT,
        properties: objectProperties,
        required: properties ? properties.map((p: any) => p.name) : [],
      };
    }

    const response = await executeWithRetry(() => 
      ai.models.generateContent({
        model: selectedModel,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema,
          temperature: 0.2, // Lower temperature for more consistent structured outputs
        },
      })
    );

    res.json({ text: response.text || '' });
  } catch (error: any) {
    console.error('Gemini Schema API Error:', error);
    res.status(500).json({ error: error.message || 'An error occurred during structured generation' });
  }
});

// Serve frontend
const isProd = process.env.NODE_ENV === 'production';
if (!isProd) {
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'custom',
  });
  app.use(vite.middlewares);

  app.get('*', async (req, res, next) => {
    if (req.originalUrl.startsWith('/api/')) {
      return next();
    }
    try {
      const fs = await import('fs');
      let template = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8');
      template = await vite.transformIndexHtml(req.originalUrl, template);
      res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
} else {
  // In production, serve built assets
  app.use(express.static(path.join(__dirname, 'dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

const PORT = 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on http://0.0.0.0:${PORT}`);
});
