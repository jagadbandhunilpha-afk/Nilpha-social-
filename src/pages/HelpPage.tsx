import React, { useState } from 'react';
import {
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Mail,
  AlertCircle,
  ShieldCheck,
  Send,
  CheckCircle2,
  Settings,
} from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { DemoNotice } from '../components/common/DemoNotice';
import { useLanguage } from '../context/LanguageContext';
import { useNotice } from '../context/NoticeContext';

interface FAQItem {
  questionBn: string;
  questionEn: string;
  answerBn: string;
  answerEn: string;
}

const FAQS: FAQItem[] = [
  {
    questionBn: 'নিলফা সোশ্যাল কী এবং এর লক্ষ্য কী?',
    questionEn: 'What is Nilpha Social and what is its goal?',
    answerBn:
      'নিলফা সোশ্যাল হলো বাংলাদেশের ব্যবহারকারীদের জন্য নকশাকৃত একটি আধুনিক, গতিশীল এবং নিরাপদ সামাজিক যোগাযোগ প্ল্যাটফর্ম। এটি বাংলা ভাষা ও সংস্কৃতিকে অগ্রাধিকার দিয়ে কমিউনিটি সংযোগ সৃষ্টি করে।',
    answerEn:
      'Nilpha Social is a modern, fast, and secure social networking platform designed for Bangladesh, prioritizing Bengali language and cultural context.',
  },
  {
    questionBn: 'পার্ট ১ সংস্করণে কোন কোন ফিচার অন্তর্ভুক্ত রয়েছে?',
    questionEn: 'What features are included in Part 1?',
    answerBn:
      'পার্ট ১-এ অন্তর্ভুক্ত রয়েছে সম্পূর্ণ প্রিমিয়াম রেস্পন্সিভ নেভিগেশন কাঠামো, দ্বিভাষিক (বাংলা ও ইংরেজি) ইউআই, হালকা ও ডার্ক মোড, ফিড ও পোস্ট কম্পোজার ইন্টারফেস, গেম ডিসকভারি শেল এবং প্রতিটি প্রধান সেকশনের খসড়া লেআউট।',
    answerEn:
      'Part 1 delivers the full responsive navigation foundation, bilingual UI (Bengali & English), light and dark theme switching, feed composer layouts, game discovery, and visual architectural shells.',
  },
  {
    questionBn: 'আমার ডেটা ও নিরাপত্তা কীভাবে সংরক্ষিত হবে?',
    questionEn: 'How will my data and privacy be protected?',
    answerBn:
      'পরবর্তী ডেভেলপমেন্ট ধাপে শক্তিশালী এন্ড-টু-এন্ড এনক্রিপশন, টু-ফ্যাক্টর অথেনটিকেশন এবং কঠোর প্রাইভেসি নীতিমালা প্রয়োগ করা হবে। পার্ট ১-এ কোনো ব্যক্তিগত তথ্য ডাটাবেজে সংরক্ষণ করা হয় না।',
    answerEn:
      'Subsequent phases will implement end-to-end encryption, two-factor authentication, and strict privacy controls. Part 1 does not store personal data in a database.',
  },
  {
    questionBn: 'গেম জোনের সেভেন আপ ও অন্যান্য গেমে কি আসল টাকা বা বাজি ধরা যায়?',
    questionEn: 'Can real money or bets be placed in the games?',
    answerBn:
      'না! নিলফা সোশ্যালে সকল গেম সম্পূর্ণ অ-আর্থিক ও নিখাদ বিনোদনমূলক ডেমো। এখানে কোনো নগদ অর্থ, জুয়া বা আর্থিক লেনদেনের সুযোগ কোনো অবস্থাতেই থাকবে না।',
    answerEn:
      'No! All games on Nilpha Social are strictly non-cash and for casual entertainment. Real-money wagers or cash betting are strictly prohibited.',
  },
];

export const HelpPage: React.FC = () => {
  const { t, language } = useLanguage();
  const { showToast } = useNotice();
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [reportSubject, setReportSubject] = useState('');
  const [reportDesc, setReportDesc] = useState('');
  const [reportSubmitted, setReportSubmitted] = useState(false);

  const toggleFaq = (idx: number) => {
    setOpenFaqIndex(openFaqIndex === idx ? null : idx);
  };

  const handleReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportSubject.trim() || !reportDesc.trim()) return;
    setReportSubmitted(true);
    showToast('রিপোর্ট গৃহীত হয়েছে (লোকাল ডেমো)');
  };

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader
        title={t('helpTitle')}
        subtitle={t('helpSubtitle')}
        kicker="সাপোর্ট ও গাইডলাইন"
      />

      <DemoNotice
        className="mb-6"
        message="সাহায্য ও সাপোর্ট কেন্দ্র পার্ট ১ ডেমো মোডে চলছে। যোগাযোগ বিবরণী পরবর্তীতে কনফিগার করা হবে।"
      />

      <div className="space-y-6">
        {/* FAQ Section */}
        <section className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#151D2C] border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center gap-2.5 mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
            <HelpCircle className="w-5 h-5 text-[#155EEF]" />
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              {t('faqHeading')}
            </h2>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {FAQS.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div key={idx} className="py-3.5">
                  <button
                    onClick={() => toggleFaq(idx)}
                    className="w-full flex items-center justify-between text-left font-semibold text-sm sm:text-base text-slate-800 dark:text-slate-200 hover:text-[#155EEF] dark:hover:text-[#38BDF8] transition-colors"
                  >
                    <span>
                      {language === 'bn' ? faq.questionBn : faq.questionEn}
                    </span>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
                    )}
                  </button>

                  {isOpen && (
                    <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed pr-6 animate-in fade-in duration-150">
                      {language === 'bn' ? faq.answerBn : faq.answerEn}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Contact Support Placeholder */}
        <section className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#151D2C] border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center gap-2.5 mb-3">
            <Mail className="w-5 h-5 text-[#06B6D4]" />
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              {t('contactHeading')}
            </h2>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 mb-3">
            <div className="flex items-start gap-3">
              <Settings className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {t('contactNotice')}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  অফিসিয়াল হেল্পডেস্ক ইমেইল, হটলাইন নম্বর ও সাপোর্ট টিকেট সিস্টেম ভবিষ্যৎ রিলিজের সময় সেটআপ করা হবে।
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Report a Problem Form */}
        <section className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#151D2C] border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center gap-2.5 mb-2">
            <AlertCircle className="w-5 h-5 text-[#DC2626]" />
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              {t('reportHeading')}
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-4">
            ইউআই বা কোনো ত্রুটি লক্ষ্য করলে বিস্তারিত লিখে আমাদের অবহিত করুন।
          </p>

          {reportSubmitted ? (
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div className="text-xs sm:text-sm">
                <p className="font-bold">রিপোর্ট সফলভাবে প্রাপ্ত হয়েছে!</p>
                <p className="text-xs opacity-90 mt-0.5">
                  লোকাল সেশনে খসড়া রেকর্ড গ্রহণ করা হয়েছে। ধন্যবাদ!
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleReportSubmit} className="space-y-3">
              <div>
                <input
                  type="text"
                  value={reportSubject}
                  onChange={(e) => setReportSubject(e.target.value)}
                  placeholder={t('reportSubjectPlaceholder')}
                  className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:border-[#155EEF]"
                />
              </div>
              <div>
                <textarea
                  rows={3}
                  value={reportDesc}
                  onChange={(e) => setReportDesc(e.target.value)}
                  placeholder={t('reportDescPlaceholder')}
                  className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:border-[#155EEF] resize-none"
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!reportSubject.trim() || !reportDesc.trim()}
                  className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-[#155EEF] hover:bg-[#1048C6] text-white transition-colors disabled:opacity-50 flex items-center gap-1.5 shadow-2xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{t('submitReport')}</span>
                </button>
              </div>
            </form>
          )}
        </section>

        {/* Community Guidelines Placeholder */}
        <section className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#151D2C] border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center gap-2.5 mb-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              {t('guidelinesHeading')}
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            {t('guidelinesSummary')}
          </p>
          <div className="mt-3 text-xs text-slate-400">
            পূর্ণাঙ্গ আচরণবিধি পার্ট ২-এ বিস্তারিত প্রকাশ করা হবে।
          </div>
        </section>
      </div>
    </div>
  );
};
