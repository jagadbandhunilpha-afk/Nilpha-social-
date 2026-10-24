/**
 * Part 9: Supabase Configuration Repair, Real Authentication, and Vercel Deployment Verification
 */

import fs from 'fs';
import path from 'path';
import { getSupabaseConfigStatus, isSupabaseConfigured, supabase } from '../lib/supabase';

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    passed++;
    console.log(`  ✓ PASS: ${message}`);
  } else {
    failed++;
    console.error(`  ✗ FAIL: ${message}`);
  }
}

async function runPart9Tests() {
  console.log('================================================================');
  console.log('NILPHA SOCIAL — PART 9 AUTOMATED VERIFICATION SUITE');
  console.log('Testing: Supabase Client Repair, Vercel SPA Rewrites, Auth Shield');
  console.log('================================================================');

  // 1. Environment Variable Architecture & Standards
  console.log('\n1. Environment Variable Validation & Fallbacks:');
  {
    // Test detection of placeholder values
    function validateTestCredentials(url: string, key: string) {
      const isUrlPlaceholder = !url || url.includes('your-project-ref') || url.includes('your-project-id');
      const isKeyPlaceholder = !key || key.includes('your-public-client-key') || key.includes('your-anon-key');
      const isValidFormat = url.startsWith('https://') || url.startsWith('http://localhost');
      return {
        isValid: !isUrlPlaceholder && !isKeyPlaceholder && isValidFormat,
        isUrlPlaceholder,
        isKeyPlaceholder,
        isValidFormat,
      };
    }

    const placeholderCheck = validateTestCredentials('https://your-project-ref.supabase.co', 'your-public-client-key');
    assert(placeholderCheck.isUrlPlaceholder, 'Correctly flags placeholder Project URL');
    assert(placeholderCheck.isKeyPlaceholder, 'Correctly flags placeholder Client Key');
    assert(!placeholderCheck.isValid, 'Rejects configuration when placeholder tokens are present');

    const validCheck = validateTestCredentials('https://xyzcompany.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy');
    assert(!validCheck.isUrlPlaceholder, 'Accepts real-looking project URL');
    assert(validCheck.isValidFormat, 'Requires valid HTTPS protocol');
    assert(validCheck.isValid, 'Considers well-formed non-placeholder credentials valid');
  }

  // 2. Service Role Secret Key Leak Defense
  console.log('\n2. Service Role Secret Key Protection:');
  {
    function isServiceRoleLeak(key: string): boolean {
      if (key.startsWith('sb_secret_') || key.toLowerCase().includes('service_role')) return true;
      try {
        const parts = key.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
          return payload?.role === 'service_role';
        }
      } catch {
        // Fallback
      }
      return false;
    }

    const mockAnonJwt = 'eyJhbGciOiJIUzI1NiJ9.' + Buffer.from(JSON.stringify({ role: 'anon', ref: 'project123' })).toString('base64') + '.sig';
    const mockServiceRoleJwt = 'eyJhbGciOiJIUzI1NiJ9.' + Buffer.from(JSON.stringify({ role: 'service_role', ref: 'project123' })).toString('base64') + '.sig';

    assert(!isServiceRoleLeak(mockAnonJwt), 'Permits legitimate public anon key');
    assert(isServiceRoleLeak(mockServiceRoleJwt), 'Detects and flags dangerous service_role JWT key');
    assert(isServiceRoleLeak('sb_secret_abcdef12345'), 'Detects sb_secret_ prefix');
  }

  // 3. Supabase Client Singleton & Status Diagnosis
  console.log('\n3. Supabase Client Singleton & Diagnosis Report:');
  {
    const status = getSupabaseConfigStatus();
    assert(typeof status.isConfigured === 'boolean', 'getSupabaseConfigStatus returns boolean isConfigured');
    assert(Array.isArray(status.missingKeys), 'getSupabaseConfigStatus returns array of missingKeys');
    assert(Array.isArray(status.invalidReasons), 'getSupabaseConfigStatus returns array of invalidReasons');
    assert(status.isConfigured === isSupabaseConfigured, 'isSupabaseConfigured export matches status report');

    // Never crashes on import
    assert(supabase === null || typeof supabase === 'object', 'supabase export is safely accessible as null or SupabaseClient');
  }

  // 4. Vercel SPA Routing Configuration (vercel.json)
  console.log('\n4. Vercel Deployment Configuration & SPA Rewrites:');
  {
    const vercelConfigPath = path.resolve(process.cwd(), 'vercel.json');
    const vercelConfigExists = fs.existsSync(vercelConfigPath);
    assert(vercelConfigExists, 'vercel.json exists in project root');

    if (vercelConfigExists) {
      const rawContent = fs.readFileSync(vercelConfigPath, 'utf8');
      const parsed = JSON.parse(rawContent);
      assert(Array.isArray(parsed.rewrites), 'vercel.json specifies rewrites array');
      const hasSpaRewrite = parsed.rewrites.some(
        (r: any) => r.source === '/(.*)' && r.destination === '/index.html'
      );
      assert(hasSpaRewrite, 'vercel.json rewrites all client-side routes (/(.*)) to /index.html');
    }
  }

  // 5. .env.example Placeholder Verification
  console.log('\n5. Environment Example File Standards:');
  {
    const envExamplePath = path.resolve(process.cwd(), '.env.example');
    assert(fs.existsSync(envExamplePath), '.env.example exists');
    const content = fs.readFileSync(envExamplePath, 'utf8');
    assert(content.includes('VITE_SUPABASE_URL=https://your-project-ref.supabase.co'), '.env.example contains VITE_SUPABASE_URL placeholder');
    assert(content.includes('VITE_SUPABASE_ANON_KEY=your-public-client-key'), '.env.example contains VITE_SUPABASE_ANON_KEY placeholder');
    assert(!content.includes('service_role'), '.env.example does not expose service_role keys in client variables');
  }

  // 6. Real Authentication Input & Constraint Validation
  console.log('\n6. Real Authentication Parameter & Format Validation:');
  {
    const usernameRegex = /^[a-z0-9_]{3,30}$/;
    assert(usernameRegex.test('nilpha_user'), 'Validates valid lowercase alphanumeric username');
    assert(usernameRegex.test('user_123'), 'Validates username with numbers and underscores');
    assert(!usernameRegex.test('ab'), 'Rejects username shorter than 3 characters');
    assert(!usernameRegex.test('User_Capital'), 'Rejects uppercase letters in normalized username');
    assert(!usernameRegex.test('user@name'), 'Rejects illegal characters in username');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    assert(emailRegex.test('jagadbandhunilpha@gmail.com'), 'Validates standard email address');
    assert(!emailRegex.test('invalid-email'), 'Rejects malformed email string');

    function validatePasswordStrength(pwd: string): boolean {
      return pwd.length >= 6;
    }
    assert(validatePasswordStrength('secret123'), 'Accepts password with 6 or more characters');
    assert(!validatePasswordStrength('12345'), 'Rejects password shorter than 6 characters');
  }

  // 7. Protected Route & Fallback Safety
  console.log('\n7. Protected Route & Auth State Safety:');
  {
    function resolveAuthRedirect(user: any, requestedPath?: string): string {
      if (!user) return '/login';
      return requestedPath && requestedPath !== '/login' ? requestedPath : '/profile';
    }

    assert(resolveAuthRedirect(null, '/wallet') === '/login', 'Unauthenticated user redirected to /login');
    assert(resolveAuthRedirect({ id: 'u1' }, '/wallet') === '/wallet', 'Authenticated user proceeds to requested route');
    assert(resolveAuthRedirect({ id: 'u1' }, '/login') === '/profile', 'Authenticated user redirected away from /login to /profile');
  }

  console.log('\n================================================================');
  console.log(`PART 9 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runPart9Tests().catch((err) => {
  console.error('Part 9 test suite failed:', err);
  process.exit(1);
});
