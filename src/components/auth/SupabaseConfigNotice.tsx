import React, { useState } from 'react';
import {
  AlertTriangle,
  Database,
  ExternalLink,
  KeyRound,
  RefreshCw,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  HelpCircle,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { getSupabaseConfigStatus } from '../../lib/supabase';

interface SupabaseConfigNoticeProps {
  className?: string;
}

export const SupabaseConfigNotice: React.FC<SupabaseConfigNoticeProps> = ({ className = '' }) => {
  const { language } = useLanguage();
  const status = getSupabaseConfigStatus();
  const [showVercelGuide, setShowVercelGuide] = useState(false);

  if (status.isConfigured) return null;

  const isBn = language === 'bn';

  return (
    <div
      role="alert"
      className={`p-4 sm:p-5 rounded-2xl ${
        status.isServiceRoleKey
          ? 'bg-red-50/95 dark:bg-red-950/50 border border-red-300 dark:border-red-800 text-red-950 dark:text-red-200'
          : 'bg-amber-50/95 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-950 dark:text-amber-200'
      } shadow-2xs transition-all ${className}`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`w-9 h-9 rounded-xl ${
            status.isServiceRoleKey
              ? 'bg-red-100 dark:bg-red-900/60 text-red-600 dark:text-red-400'
              : 'bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400'
          } flex items-center justify-center shrink-0 mt-0.5`}
        >
          {status.isServiceRoleKey ? <ShieldAlert className="w-5 h-5" /> : <Database className="w-5 h-5" />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>
                {status.isServiceRoleKey
                  ? isBn
                    ? 'নিরাপত্তা ঝুঁকি: Service-Role কি সনাক্ত হয়েছে!'
                    : 'Security Warning: Service-Role Key Detected!'
                  : isBn
                  ? 'সুপাবেস (Supabase) সংযোগ কনফিগারেশন প্রয়োজন'
                  : 'Supabase Configuration Required'}
              </span>
            </h4>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300">
              Vercel / Vite
            </span>
          </div>

          <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed mb-3">
            {isBn
              ? 'বাস্তব প্রমাণীকরণ (Real Authentication) ও ডেটাবেস ব্যবহারের জন্য সঠিক সুপাবেস এনভায়রনমেন্ট ভেরিয়েবল সেট করতে হবে।'
              : 'Real Supabase authentication and database persistence require valid environment variables.'}
          </p>

          {/* Missing Keys Box */}
          {status.missingKeys.length > 0 && (
            <div className="p-3 rounded-xl bg-white/90 dark:bg-slate-900/70 border border-amber-200/80 dark:border-amber-800/40 text-xs font-mono mb-3 space-y-1.5">
              <div className="text-[11px] font-sans font-semibold text-amber-900 dark:text-amber-200 mb-1">
                {isBn ? 'অনুপস্থিত ভেরিয়েবলসমূহ:' : 'Missing Required Variables:'}
              </div>
              {status.missingKeys.map((key) => (
                <div key={key} className="flex items-center gap-1.5 text-amber-800 dark:text-amber-300 font-semibold">
                  <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                  <span>{key}</span>
                  {key === 'VITE_SUPABASE_ANON_KEY' && (
                    <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400">
                      (বা VITE_SUPABASE_PUBLISHABLE_KEY)
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Invalid reasons / Placeholders */}
          {status.invalidReasons.length > 0 && (
            <div className="p-3 rounded-xl bg-red-50/80 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300 mb-3 space-y-1">
              {status.invalidReasons.map((reason, i) => (
                <div key={i} className="flex items-start gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-red-500" />
                  <span>{reason}</span>
                </div>
              ))}
            </div>
          )}

          {/* Vercel Redeployment Notice */}
          <div className="p-3 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-xs text-blue-900 dark:text-blue-200 mb-3 flex items-start gap-2">
            <RefreshCw className="w-4 h-4 shrink-0 mt-0.5 text-blue-600 dark:text-blue-400" />
            <div>
              <span className="font-semibold block mb-0.5">
                {isBn ? '⚠️ Vercel ব্যবহারকারীদের জন্য বিশেষ দ্রষ্টব্য:' : '⚠️ Important for Vercel Users:'}
              </span>
              <span>
                {isBn
                  ? 'Vite প্রজেক্টে এনভায়রনমেন্ট ভেরিয়েবলগুলো বিল্ড টাইমে ইনলাইন হয়। তাই Vercel Dashboard-এ ভ্যারিয়েবল সেভ করার পর অবশ্যই একবার "Redeploy" দিতে হবে।'
                  : 'Vite embeds "VITE_*" variables at build time. After saving variables in Vercel Settings, you MUST trigger a "Redeploy" for changes to take effect.'}
              </span>
            </div>
          </div>

          {/* Toggleable Vercel Step-by-Step Guide */}
          <button
            type="button"
            onClick={() => setShowVercelGuide(!showVercelGuide)}
            className="w-full py-2 px-3 rounded-xl bg-white/70 dark:bg-slate-800/60 hover:bg-white dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center justify-between transition-colors mb-2"
          >
            <div className="flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-[#155EEF]" />
              <span>{isBn ? 'কীভাবে Vercel-এ কনফিগার করবেন? (ধাপগুলো দেখুন)' : 'How to configure in Vercel (Step-by-step)'}</span>
            </div>
            {showVercelGuide ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showVercelGuide && (
            <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 space-y-2 mb-3 animate-in fade-in">
              <ol className="list-decimal list-inside space-y-1.5 leading-relaxed font-sans">
                <li>
                  <strong>Supabase Dashboard</strong> (<a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" className="text-[#155EEF] underline">supabase.com</a>) এ গিয়ে আপনার প্রজেক্ট খুলুন।
                </li>
                <li>
                  <strong>Project Settings (⚙️) → API</strong> সেকশনে গিয়ে <code>Project URL</code> এবং <code>anon public key</code> কপি করুন।
                </li>
                <li>
                  <strong>Vercel Dashboard</strong> (<a href="https://vercel.com" target="_blank" rel="noreferrer" className="text-[#155EEF] underline">vercel.com</a>) এ গিয়ে <code>nilpha-social</code> প্রজেক্ট সিলেক্ট করুন।
                </li>
                <li>
                  <strong>Settings → Environment Variables</strong> এ যান।
                </li>
                <li>
                  নিচের দুটি ভেরিয়েবল যোগ করুন (Production, Preview, Development সবগুলোতে টিক দিন):
                  <div className="mt-1 p-2 bg-slate-100 dark:bg-slate-800 rounded-lg font-mono text-[11px] space-y-1">
                    <div><strong>Key:</strong> VITE_SUPABASE_URL</div>
                    <div><strong>Value:</strong> https://your-project-id.supabase.co</div>
                    <div className="pt-1"><strong>Key:</strong> VITE_SUPABASE_ANON_KEY</div>
                    <div><strong>Value:</strong> your-anon-public-key</div>
                  </div>
                </li>
                <li>
                  <strong>Save</strong> বাটনে ক্লিক করে ভ্যারিয়েবল সংরক্ষণ করুন।
                </li>
                <li>
                  <strong>বাধ্যতামূলক শেষ ধাপ:</strong> Vercel এর <strong>Deployments</strong> ট্যাবে যান, সর্বশেষ ডিপ্লয়মেন্টের পাশে থাকা <strong>"..."</strong> মেনু থেকে <strong>"Redeploy"</strong> নির্বাচন করুন।
                </li>
              </ol>
            </div>
          )}

          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 font-medium">
            <span>{isBn ? 'বিস্তারিত গাইডের জন্য দেখুন:' : 'For detailed guide see:'}</span>
            <span className="font-mono bg-slate-200/70 dark:bg-slate-800 px-2 py-0.5 rounded-md text-[11px] text-slate-800 dark:text-slate-200">
              VERCEL_DEPLOYMENT_GUIDE.md
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
