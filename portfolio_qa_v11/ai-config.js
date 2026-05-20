/**
 * ai-config.js - QA Portfolio AI Configuration
 *
 * Public visitors do not enter or receive a Gemini API key.
 * The chatbot calls a same-origin serverless API endpoint:
 * - Vercel: /api/chat
 * - Netlify: /.netlify/functions/chat
 *
 * Configure the secret in your hosting dashboard:
 *   GEMINI_API_KEY=your_gemini_key
 *
 * The key must not be placed in HTML, client-side JavaScript, localStorage,
 * browser console snippets, or any public network response.
 */

const AI_CONFIG_VERSION = '2.0';
const AI_CONTEXT_MODE = 'portfolio-only';
const AI_PUBLIC_ENDPOINTS = ['/api/chat', '/.netlify/functions/chat'];
