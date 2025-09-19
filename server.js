const express = require('express');
const cors = require('cors');
const BrowserManager = require('./browser');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const browserManager = new BrowserManager();

// health
app.get('/health', (req, res) => {
  res.json({ status: 'ok', sessions: browserManager.getSessionCount() });
});

// create or get session for email
app.post('/browser', async (req, res) => {
  try {
    const { email, userAgent, viewport } = req.body || {};
    if (!email) return res.status(400).json({ error: 'email is required' });
    const sessionId = await browserManager.createSession({ email, userAgent, viewport });
    res.json({ sessionId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// goto
app.post('/browser/:sessionId/goto', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { url, options } = req.body || {};
    await browserManager.goto(sessionId, url, options);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// content
app.get('/browser/:sessionId/content', async (req, res) => {
  try {
    const content = await browserManager.getContent(req.params.sessionId);
    res.json({ content });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// screenshot
app.get('/browser/:sessionId/screenshot', async (req, res) => {
  try {
    const img = await browserManager.takeScreenshot(req.params.sessionId);
    res.type('image/png').send(img);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// click
app.post('/browser/:sessionId/click', async (req, res) => {
  try {
    const { selector, options } = req.body || {};
    await browserManager.click(req.params.sessionId, selector, options);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// type
app.post('/browser/:sessionId/type', async (req, res) => {
  try {
    const { selector, text, options } = req.body || {};
    await browserManager.type(req.params.sessionId, selector, text, options);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// text
app.post('/browser/:sessionId/text', async (req, res) => {
  try {
    const { selector } = req.body || {};
    const text = await browserManager.getText(req.params.sessionId, selector);
    res.json({ text });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// eval
app.post('/browser/:sessionId/eval', async (req, res) => {
  try {
    const { script } = req.body || {};
    const result = await browserManager.evaluate(req.params.sessionId, script);
    res.json({ result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// cookies / headers / nav / close
app.post('/browser/:sessionId/headers', async (req, res) => {
  try { await browserManager.setExtraHTTPHeaders(req.params.sessionId, req.body || {}); res.json({ success: true }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});
app.get('/browser/:sessionId/cookies', async (req, res) => {
  try { const cookies = await browserManager.getCookies(req.params.sessionId); res.json({ cookies }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});
app.post('/browser/:sessionId/cookies', async (req, res) => {
  try { await browserManager.setCookies(req.params.sessionId, req.body || []); res.json({ success: true }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});
app.post('/browser/:sessionId/back', async (req, res) => { try { await browserManager.back(req.params.sessionId); res.json({ success: true }); } catch (e) { res.status(500).json({ error: e.message }); }});
app.post('/browser/:sessionId/forward', async (req, res) => { try { await browserManager.forward(req.params.sessionId); res.json({ success: true }); } catch (e) { res.status(500).json({ error: e.message }); }});
app.post('/browser/:sessionId/reload', async (req, res) => { try { await browserManager.reload(req.params.sessionId); res.json({ success: true }); } catch (e) { res.status(500).json({ error: e.message }); }});

app.delete('/browser/:sessionId', async (req, res) => {
  try {
    await browserManager.closeSession(req.params.sessionId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// graceful shutdown: close open contexts (profiles remain on disk)
const shutdown = async () => {
  console.log('Shutting down, closing browser contexts...');
  server.close();
  await browserManager.closeAllSessions();
  process.exit(0);
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);