import { createClient } from '@supabase/supabase-js';

// Helper to validate if a string is a valid HTTP/HTTPS URL
function isValidUrl(urlStr: string): boolean {
  try {
    const url = new URL(urlStr);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (_) {
    return false;
  }
}

// Helper to get a valid environment variable or fallback
function getEnvVar(key: string, fallback: string): string {
  try {
    const value = (import.meta as any).env?.[key];
    if (value && typeof value === 'string' && value !== 'undefined' && value !== 'null' && value.trim() !== '') {
      return value;
    }
  } catch (e) {
    // Ignore error
  }
  return fallback;
}

const rawUrl = getEnvVar('VITE_SUPABASE_URL', 'https://yaatfuqzemvdwrtrqtxa.supabase.co');
const supabaseUrl = isValidUrl(rawUrl) ? rawUrl : 'https://yaatfuqzemvdwrtrqtxa.supabase.co';

const rawKey = getEnvVar('VITE_SUPABASE_ANON_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlhYXRmdXF6ZW12ZHdydHJxdHhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI2NzcxMTMsImV4cCI6MjA5ODI1MzExM30.CoY06zigDcnth8nj0yABBH_lEF83Qo_CMehx8eMYmYA');
const supabaseAnonKey = (rawKey && rawKey.length > 20) ? rawKey : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlhYXRmdXF6ZW12ZHdydHJxdHhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI2NzcxMTMsImV4cCI6MjA5ODI1MzExM30.CoY06zigDcnth8nj0yABBH_lEF83Qo_CMehx8eMYmYA';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

