const { chromium } = require('playwright');
const config = require('./config');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

class BrowserManager {
  constructor() {
    this.sessions = new Map(); // sessionId -> { context, page, profilePath }
    this.profilesDir = path.resolve(process.cwd(), 'profiles');
    if (!fs.existsSync(this.profilesDir)) fs.mkdirSync(this.profilesDir, { recursive: true });
  }

  _emailToId(email) {
    return crypto.createHash('sha256').update(email).digest('hex').slice(0, 16);
  }

  _profilePathForId(id) {
    return path.join(this.profilesDir, id);
  }

  // create or return existing persistent context for given email
  async createSession({ email, userAgent, viewport } = {}) {
    if (!email || typeof email !== 'string') throw new Error('email is required and must be a string');
    const sessionId = this._emailToId(email);
    if (this.sessions.has(sessionId)) return sessionId;

    const profilePath = this._profilePathForId(sessionId);
    if (!fs.existsSync(profilePath)) fs.mkdirSync(profilePath, { recursive: true });

    const persistentOptions = Object.assign({}, config.browser, config.context);

    if (userAgent) persistentOptions.userAgent = userAgent;
    if (viewport) persistentOptions.viewport = viewport;

    const context = await chromium.launchPersistentContext(profilePath, persistentOptions);
    let page = context.pages().length ? context.pages()[0] : await context.newPage();

    this.sessions.set(sessionId, { context, page, profilePath });
    return sessionId;
  }

  _get(sessionId) {
    const s = this.sessions.get(sessionId);
    if (!s) {
      const err = new Error('Invalid session ID');
      err.code = 'INVALID_SESSION';
      throw err;
    }
    return s;
  }

  async goto(sessionId, url, options = {}) {
    const { page } = this._get(sessionId);
    if (typeof url !== 'string' || !/^https?:\/\//i.test(url)) {
      throw new Error('Invalid URL. Use http(s) URL.');
    }
    await page.goto(url, Object.assign({ waitUntil: 'domcontentloaded', timeout: 30000 }, options));
  }

  async getContent(sessionId) {
    const { page } = this._get(sessionId);
    return await page.content();
  }

  async takeScreenshot(sessionId, options = {}) {
    const { page } = this._get(sessionId);
    return await page.screenshot(Object.assign({ type: 'png', fullPage: true }, options));
  }

  async click(sessionId, selector, options = {}) {
    const { page } = this._get(sessionId);
    if (!selector) throw new Error('Selector is required for click');
    if (options.wait !== false) await page.waitForSelector(selector, { timeout: options.timeout ?? 5000 });
    await page.click(selector, options);
  }

  async type(sessionId, selector, text, options = {}) {
    const { page } = this._get(sessionId);
    if (!selector) throw new Error('Selector is required for type');
    if (options.wait !== false) await page.waitForSelector(selector, { timeout: options.timeout ?? 5000 });
    await page.fill(selector, text, options);
  }

  async getText(sessionId, selector) {
    const { page } = this._get(sessionId);
    if (!selector) throw new Error('Selector is required for getText');
    await page.waitForSelector(selector, { timeout: 5000 });
    return await page.textContent(selector);
  }

  async evaluate(sessionId, script) {
    const { page } = this._get(sessionId);
    if (typeof script !== 'string') throw new Error('Script must be a string');
    return await page.evaluate((s) => eval(s), script);
  }

  async back(sessionId) { const { page } = this._get(sessionId); await page.goBack(); }
  async forward(sessionId) { const { page } = this._get(sessionId); await page.goForward(); }
  async reload(sessionId) { const { page } = this._get(sessionId); await page.reload(); }

  async setExtraHTTPHeaders(sessionId, headers) {
    const { context } = this._get(sessionId);
    await context.setExtraHTTPHeaders(headers || {});
  }

  async getCookies(sessionId) {
    const { context } = this._get(sessionId);
    return await context.cookies();
  }

  async setCookies(sessionId, cookies) {
    const { context } = this._get(sessionId);
    if (!Array.isArray(cookies)) throw new Error('cookies must be an array');
    await context.addCookies(cookies);
  }

  // close context (profile dir remains on disk so login persists)
  async closeSession(sessionId) {
    const s = this.sessions.get(sessionId);
    if (!s) return;
    try { await s.context.close(); } catch (e) {}
    this.sessions.delete(sessionId);
  }

  async closeAllSessions() {
    const ids = Array.from(this.sessions.keys());
    await Promise.all(ids.map(id => this.closeSession(id)));
  }

  getSessionCount() { return this.sessions.size; }
}

module.exports = BrowserManager;