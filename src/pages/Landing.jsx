import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowRight, BedDouble, Check, CookingPot, Shirt, Users, Wifi } from "lucide-react";
import { PageFade } from "../components/ui";

export default function Landing() {
  return (
    <PageFade>
      <section className="mx-auto max-w-6xl px-4 sm:px-6 pt-12 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", bounce: 0, duration: 0.5 }}
          className="mx-auto max-w-2xl text-center"
        >
          <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm ring-1 ring-slate-200 dark:bg-white/10 dark:text-slate-200 dark:ring-white/10">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Admission open · AY 2026–27
          </span>
          <h1 className="display mt-4 text-[#0A1F44] dark:text-white">Welcome to<br />Kilala Dormitory.</h1>
          <p className="body-text mx-auto mt-3 max-w-md text-[15px] text-slate-500 dark:text-slate-300">
            Sign in to apply for a dorm room and follow your application status.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Link to="/login" className="pressable inline-flex items-center gap-2 rounded-full bg-[#FFC72C] px-6 py-3 text-sm font-bold text-[#0A1F44] shadow hover:bg-[#F5B800]">
              Choose sign in <ArrowRight size={16} />
            </Link>
            <Link to="/dashboard" className="pressable inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#0A1F44] shadow-sm ring-1 ring-[#0A1F44]/15 hover:ring-[#0A1F44]/30 dark:bg-white/10 dark:text-white dark:ring-white/15">
              My dashboard
            </Link>
          </div>
        </motion.div>
      </section>

      <section className="mx-auto max-w-5xl px-4 sm:px-6 pb-14" aria-labelledby="residence-heading">
        <div className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200 dark:bg-[#0B1E3A] dark:ring-white/10">
          <div className="grid md:grid-cols-2">
            <img
              src="/kilala-residence-hall.png"
              alt="BukSU Male Dormitory — Kilala Residence Hall information poster and photos"
              className="aspect-square w-full bg-white object-contain"
            />
            <div className="flex flex-col justify-center p-6 sm:p-8">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">BukSU Male Dormitory</p>
              <h2 id="residence-heading" className="mt-1 text-2xl font-bold tracking-tight text-[#0A1F44] dark:text-white">
                Kilala Residence Hall
              </h2>

              <div className="mt-5 rounded-2xl bg-[#FFF8E1] p-4 ring-1 ring-[#FFC72C] dark:bg-[#FFC72C]/10 dark:ring-[#FFC72C]/40">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">Monthly rate per person</p>
                <p className="mt-1 text-3xl font-extrabold text-[#0A1F44] dark:text-[#FFE9A8]">₱775</p>
                <p className="text-xs text-slate-600 dark:text-slate-300">Includes electricity, water, and Wi-Fi.</p>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-slate-50 p-3 dark:bg-white/5">
                  <p className="flex items-center gap-2 text-[13px] font-bold"><Users size={15} /> Capacity</p>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">40 students</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-3 dark:bg-white/5">
                  <p className="flex items-center gap-2 text-[13px] font-bold"><BedDouble size={15} /> Room size</p>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">10 students per room</p>
                </div>
              </div>

              <div className="mt-5">
                <h3 className="text-sm font-bold text-[#0A1F44] dark:text-white">Amenities</h3>
                <ul className="mt-2 grid gap-2 text-[13px] text-slate-600 dark:text-slate-300 sm:grid-cols-2">
                  <li className="flex items-center gap-2"><Check size={14} className="text-emerald-600" /> Individual cabinet</li>
                  <li className="flex items-center gap-2"><Check size={14} className="text-emerald-600" /> Common toilet and bath</li>
                  <li className="flex items-center gap-2"><Shirt size={14} className="text-emerald-600" /> Laundry area</li>
                  <li className="flex items-center gap-2"><CookingPot size={14} className="text-emerald-600" /> Kitchen and dining area</li>
                  <li className="flex items-center gap-2"><Wifi size={14} className="text-emerald-600" /> Free Wi-Fi</li>
                </ul>
              </div>

              <Link to="/login/student" className="pressable mt-6 inline-flex w-fit items-center gap-2 rounded-full bg-[#FFC72C] px-6 py-3 text-sm font-bold text-[#0A1F44] shadow hover:bg-[#F5B800]">
                Apply for residence <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </PageFade>
  );
}
