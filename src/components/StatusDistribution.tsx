import React, { useMemo } from "react";
import { ProjectTask } from "../types";
import { PieChart, ListTodo, Activity, CheckCircle, FileSpreadsheet } from "lucide-react";
import { motion } from "motion/react";

interface StatusDistributionProps {
  tasks: ProjectTask[];
}

export default function StatusDistribution({ tasks }: StatusDistributionProps) {
  // Aggregate Task Statuses
  const taskStatusStats = useMemo(() => {
    const counts: Record<string, { count: number; hours: number; budget: number }> = {};
    tasks.forEach((t) => {
      const status = t.taskStatus || "Unknown";
      if (!counts[status]) {
        counts[status] = { count: 0, hours: 0, budget: 0 };
      }
      counts[status].count += 1;
      counts[status].hours += t.hoursSpent;
      counts[status].budget += t.budget;
    });

    const total = tasks.length;
    return Object.entries(counts).map(([name, val]) => ({
      name,
      count: val.count,
      percentage: total > 0 ? (val.count / total) * 100 : 0,
      hours: val.hours,
      budget: val.budget,
    })).sort((a, b) => b.count - a.count);
  }, [tasks]);

  // Aggregate Project Health Status (Project Status)
  // Since Project Status is assigned at the project level, let's look at unique projects and their status
  const projectStatusStats = useMemo(() => {
    const projectMap = new Map<string, { status: string; budget: number }>();
    tasks.forEach((t) => {
      if (!projectMap.has(t.projectId)) {
        projectMap.set(t.projectId, { status: t.projectStatus, budget: 0 });
      }
      // Sum budgets per project
      const entry = projectMap.get(t.projectId)!;
      entry.budget += t.budget;
    });

    const counts: Record<string, { count: number; totalBudget: number }> = {};
    projectMap.forEach((val) => {
      const status = val.status || "Unknown";
      if (!counts[status]) {
        counts[status] = { count: 0, totalBudget: 0 };
      }
      counts[status].count += 1;
      counts[status].totalBudget += val.budget;
    });

    const totalProjects = projectMap.size;
    return Object.entries(counts).map(([name, val]) => ({
      name,
      count: val.count,
      percentage: totalProjects > 0 ? (val.count / totalProjects) * 100 : 0,
      totalBudget: val.totalBudget,
    })).sort((a, b) => b.count - a.count);
  }, [tasks]);

  // Styles for different statuses to keep the design highly professional and meaningful
  const getStatusColor = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes("complete")) return { bg: "bg-emerald-500", text: "text-emerald-700", border: "border-emerald-100", lightBg: "bg-emerald-50" };
    if (s.includes("progress")) return { bg: "bg-amber-500", text: "text-amber-700", border: "border-amber-100", lightBg: "bg-amber-50" };
    if (s.includes("pending")) return { bg: "bg-indigo-400", text: "text-indigo-700", border: "border-indigo-100", lightBg: "bg-indigo-50" };
    if (s.includes("track")) return { bg: "bg-emerald-500", text: "text-emerald-700", border: "border-emerald-100", lightBg: "bg-emerald-50" };
    if (s.includes("behind")) return { bg: "bg-rose-500", text: "text-rose-700", border: "border-rose-100", lightBg: "bg-rose-50" };
    return { bg: "bg-slate-400", text: "text-slate-700", border: "border-slate-100", lightBg: "bg-slate-50" };
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB", maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* 1. Task Status Distribution */}
      <div id="task-status-distribution-card" className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 bg-indigo-50 rounded-lg text-indigo-600">
              <ListTodo size={18} />
            </div>
            <h3 className="text-base font-bold text-slate-800">
              สถานะการดำเนินงานย่อย (Task Status Distribution)
            </h3>
          </div>
          <p className="text-xs text-slate-400 font-medium mb-6">
            แบ่งตามสถานะของงานย่อยทั้งหมดในระบบ พร้อมสัดส่วนชั่วโมงทำงานที่สะสม
          </p>

          <div className="space-y-4">
            {taskStatusStats.map((stat) => {
              const colors = getStatusColor(stat.name);
              return (
                <div key={stat.name} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-xs ${colors.bg}`}></span>
                      <span className="text-slate-700">{stat.name}</span>
                    </div>
                    <div className="text-slate-500 font-mono flex items-center gap-1.5">
                      <span>{stat.count} งาน</span>
                      <span className="text-slate-300">|</span>
                      <span>{stat.percentage.toFixed(1)}%</span>
                    </div>
                  </div>
                  {/* Custom animated progress bar */}
                  <div className="w-full bg-slate-100 h-2 rounded-xs overflow-hidden">
                    <motion.div
                      className={`h-full ${colors.bg}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${stat.percentage}%` }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                    ></motion.div>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400 font-medium pl-4">
                    <span>ชั่วโมงสะสม: {stat.hours.toLocaleString()} ชม.</span>
                    <span>งบประมาณที่ผูกมัด: {formatCurrency(stat.budget)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Small summarized footer */}
        <div className="border-t border-slate-150 pt-4 mt-6 flex justify-around text-center">
          <div>
            <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wide">
              งานเสร็จสิ้นแล้ว
            </span>
            <span className="text-lg font-extrabold text-slate-800 font-mono">
              {tasks.filter(t => t.taskStatus.toLowerCase() === "completed").length}
            </span>
          </div>
          <div className="border-r border-slate-150"></div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wide">
              งานที่กำลังดำเนินอยู่
            </span>
            <span className="text-lg font-extrabold text-slate-800 font-mono">
              {tasks.filter(t => t.taskStatus.toLowerCase() === "in progress").length}
            </span>
          </div>
          <div className="border-r border-slate-150"></div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wide">
              งานรอดำเนินการ
            </span>
            <span className="text-lg font-extrabold text-slate-800 font-mono">
              {tasks.filter(t => t.taskStatus.toLowerCase() === "pending").length}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Project Health Status (Project Status) */}
      <div id="project-status-distribution-card" className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 bg-indigo-50 rounded-lg text-indigo-600">
              <Activity size={18} />
            </div>
            <h3 className="text-base font-bold text-slate-800">
              สถานะภาพรวมโครงการ (Project Status Health)
            </h3>
          </div>
          <p className="text-xs text-slate-400 font-medium mb-6">
            แบ่งตามสุขภาพภาพรวมของโครงการทั้งหมด (เช่น ล่าช้ากว่าแผน หรือ เป็นไปตามแผน)
          </p>

          <div className="space-y-4">
            {projectStatusStats.map((stat) => {
              const colors = getStatusColor(stat.name);
              return (
                <div key={stat.name} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-xs ${colors.bg}`}></span>
                      <span className="text-slate-700">{stat.name}</span>
                    </div>
                    <div className="text-slate-500 font-mono flex items-center gap-1.5">
                      <span>{stat.count} โครงการ</span>
                      <span className="text-slate-300">|</span>
                      <span>{stat.percentage.toFixed(1)}%</span>
                    </div>
                  </div>
                  {/* Custom progress bar */}
                  <div className="w-full bg-slate-100 h-2 rounded-xs overflow-hidden">
                    <motion.div
                      className={`h-full ${colors.bg}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${stat.percentage}%` }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                    ></motion.div>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400 font-medium pl-4">
                    <span>สัดส่วนงบประมาณโครงการรวม:</span>
                    <span className="font-mono">{formatCurrency(stat.totalBudget)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Informative alert box inside status card */}
        <div className={`p-3.5 rounded-lg border mt-6 flex gap-2.5 ${getStatusColor("Behind").lightBg} ${getStatusColor("Behind").border}`}>
          <CheckCircle className="text-rose-500 mt-0.5 shrink-0" size={16} />
          <div className="text-xs">
            <strong className="text-rose-900 block mb-0.5">ข้อควรสังเกตด้านความล่าช้า</strong>
            <span className="text-rose-700/90 leading-relaxed">
              โครงการที่มีสถานะ <span className="font-bold">Behind</span> ผูกมัดอยู่กับงบประมาณรวมจำนวนมาก กรุณาเข้าตรวจสอบสถานะของงานย่อยที่มีระดับความล่าช้าเพื่อเร่งการส่งมอบงาน
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
