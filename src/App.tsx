import React, { useEffect, useState } from "react";
import { DashboardData } from "./types";
import StatsCards from "./components/StatsCards";
import BudgetChart from "./components/BudgetChart";
import StatusDistribution from "./components/StatusDistribution";
import GeographicalDistribution from "./components/GeographicalDistribution";
import TaskTable from "./components/TaskTable";
import { RefreshCw, Database, LayoutDashboard, FileSpreadsheet, ExternalLink, HelpCircle } from "lucide-react";
import { motion } from "motion/react";

export default function App() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const fetchDashboardData = async (forceRefresh = false) => {
    if (forceRefresh) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const url = `/api/projects${forceRefresh ? "?refresh=true" : ""}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`เซิร์ฟเวอร์ตอบกลับด้วยรหัสสถานะ: ${response.status}`);
      }

      const result: DashboardData = await response.json();
      setData(result);
      setError(null);
    } catch (err: any) {
      console.error("[App Error] Error loading dashboard:", err);
      setError(err.message || "ไม่สามารถเชื่อมต่อกับบริการจัดเตรียมข้อมูลได้");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Format timestamp helper
  const formatTime = (timestamp: number) => {
    return new Intl.DateTimeFormat("th-TH", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(new Date(timestamp));
  };

  return (
    <div className="flex min-h-screen w-full bg-slate-100 font-sans">
      {/* 🧭 Sidebar / Aside (Geometric Navigation Rail) */}
      <aside className="w-16 hidden md:flex flex-none bg-slate-900 flex-col items-center py-6 gap-8 border-r border-slate-800 shrink-0">
        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-extrabold tracking-wider shadow-lg">
          <LayoutDashboard size={20} />
        </div>
        <div className="flex flex-col gap-6 text-slate-400">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-slate-800 text-indigo-400 cursor-pointer shadow-xs" title="ภาพรวมโครงการ">
            <LayoutDashboard size={18} />
          </div>
          <a
            href="#data-explorer-section"
            className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-slate-800 hover:text-slate-200 transition-colors"
            title="ค้นหาและตัวกรองตาราง"
          >
            <Database size={18} />
          </a>
          <a
            href="https://docs.google.com/spreadsheets/d/1Rfsv4rmmPu_rZYlgkjr85fucY2s1CUWDWudG4RPlk7U/edit"
            target="_blank"
            rel="noreferrer"
            className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-slate-800 hover:text-emerald-400 transition-colors"
            title="สเปรดชีตต้นทาง"
          >
            <FileSpreadsheet size={18} />
          </a>
        </div>
      </aside>

      {/* 📊 Main panel content */}
      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        {/* 🚀 Header Navbar */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-600 rounded-xl text-white md:hidden">
                <LayoutDashboard size={22} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  แดชบอร์ดบริหารโครงการและติดตามงบประมาณ
                </h1>
                <p className="text-xs text-slate-500 font-semibold flex items-center gap-1 mt-0.5">
                  <Database size={13} className="text-indigo-500" />
                  สรุปผลการดำเนินงานและงบประมาณภาพรวมปี 2567 (Live Data Connector)
                </p>
              </div>
            </div>

            {/* Action and Source Links */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Sheet Link */}
              <a
                href="https://docs.google.com/spreadsheets/d/1Rfsv4rmmPu_rZYlgkjr85fucY2s1CUWDWudG4RPlk7U/edit"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-600 hover:text-indigo-600 bg-slate-50 border border-slate-200 hover:border-indigo-200 rounded-lg transition-all"
              >
                <FileSpreadsheet size={14} className="text-emerald-600" />
                <span>เปิด Google Sheet ต้นทาง</span>
                <ExternalLink size={11} />
              </a>

              {/* Refresh Trigger */}
              <button
                onClick={() => fetchDashboardData(true)}
                disabled={loading || isRefreshing}
                className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 rounded-lg transition-all cursor-pointer shadow-sm ${
                  isRefreshing ? "animate-pulse" : ""
                }`}
              >
                <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} />
                <span>{isRefreshing ? "กำลังรีเฟรช..." : "ดึงข้อมูลใหม่"}</span>
              </button>
            </div>
          </div>
        </header>

        {/* 📊 Main Scrollable Board */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          
          {/* Loading Indicator */}
          {loading && !data && (
            <div className="flex flex-col items-center justify-center py-24 space-y-4">
              <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
              <p className="text-sm text-slate-500 font-bold">กำลังเชื่อมต่อข้อมูลและจัดทำรายงานวิเคราะห์...</p>
            </div>
          )}

          {/* Error Indicator */}
          {error && (
            <div className="p-6 bg-rose-50 border border-rose-100 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-rose-800">เกิดความคลาดเคลื่อนในการดึงข้อมูล</h3>
                <p className="text-xs text-rose-700/80 font-medium leading-relaxed">
                  ไม่สามารถเชื่อมโยงข้อมูลกับไฟล์สเปรดชีตต้นทางได้: {error}. กรุณาตรวจสอบการตั้งค่าสิทธิ์การเข้าถึงไฟล์ หรือกดรีเฟรชข้อมูลอีกครั้ง
                </p>
              </div>
              <button
                onClick={() => fetchDashboardData(true)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition-colors shrink-0"
              >
                พยายามเชื่อมต่อใหม่
              </button>
            </div>
          )}

          {/* Dashboard Content */}
          {data && (
            <div className="space-y-6">
              
              {/* 💡 Information Notification banner */}
              <div className="bg-gradient-to-r from-slate-900 to-indigo-950 rounded-xl p-4 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-3 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/10 rounded-xl text-indigo-200">
                    <HelpCircle size={18} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-100">
                      ข้อมูลรายงานวิเคราะห์โครงการแบบผสมผสาน
                    </h4>
                    <p className="text-[11px] text-slate-300 font-medium">
                      ระบบได้ทำการสรุปข้อมูลและคำนวณสัดส่วนค่าใช้จ่าย รายงานความล่าช้า และจัดจำแนกตามรายพื้นที่ให้พร้อมใช้งานอัตโนมัติ
                    </p>
                  </div>
                </div>
                
                {/* Cache status details */}
                <div className="text-[10px] font-mono bg-white/5 border border-white/10 p-2 rounded-xl text-slate-300">
                  <span>อัปเดตล่าสุด: {formatTime(data.lastUpdated)}</span>
                  <span className="mx-2 text-white/20">|</span>
                  <span className={data.cached ? "text-indigo-400 font-bold" : "text-emerald-400 font-bold"}>
                    {data.cached ? "● โหลดจาก Cache เซิร์ฟเวอร์" : "● ดึงข้อมูลจาก Google Sheets สำเร็จ"}
                  </span>
                </div>
              </div>

              {/* Section 1: KPI Stats Summary Cards */}
              <StatsCards tasks={data.tasks} />

              {/* Section 2: Budget Chart vs Budget alerts */}
              <BudgetChart tasks={data.tasks} />

              {/* Section 3: Status and progress breakdown */}
              <StatusDistribution tasks={data.tasks} />

              {/* Section 4: Geographic area breakdown */}
              <GeographicalDistribution tasks={data.tasks} />

              {/* Section 5: Task Log table with deep filter and search capabilities */}
              <div id="data-explorer-section" className="scroll-mt-20">
                <TaskTable tasks={data.tasks} />
              </div>

            </div>
          )}
        </main>

        {/* 🔒 Footer */}
        <footer className="bg-white border-t border-slate-200 py-6 mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-400 font-semibold">
            <p>© 2026 ระบบแดชบอร์ดบริหารงบประมาณโครงการ (Project Dashboard Connector)</p>
            <div className="flex gap-4">
              <span>มาตรฐานความปลอดภัยสูงสุด</span>
              <span>•</span>
              <span>ป้องกัน SQL Injection & Rate-limiting Caching</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
