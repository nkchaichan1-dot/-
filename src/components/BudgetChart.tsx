import React, { useState, useMemo } from "react";
import { ProjectTask } from "../types";
import { TrendingUp, AlertCircle, CheckCircle, Info } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface BudgetChartProps {
  tasks: ProjectTask[];
}

interface ProjectSummary {
  projectId: string;
  projectName: string;
  budget: number;
  actualCost: number;
  hoursSpent: number;
  averageProgress: number;
  tasksCount: number;
}

export default function BudgetChart({ tasks }: BudgetChartProps) {
  const [hoveredProject, setHoveredProject] = useState<string | null>(null);

  // Group and aggregate data by Project
  const projectSummaries = useMemo((): ProjectSummary[] => {
    const map = new Map<string, { name: string; budget: number; cost: number; hours: number; progSum: number; count: number }>();

    tasks.forEach((t) => {
      const existing = map.get(t.projectId) || {
        name: t.projectName,
        budget: 0,
        cost: 0,
        hours: 0,
        progSum: 0,
        count: 0,
      };

      existing.budget += t.budget;
      existing.cost += t.actualCost;
      existing.hours += t.hoursSpent;
      existing.progSum += t.progress;
      existing.count += 1;

      map.set(t.projectId, existing);
    });

    return Array.from(map.entries()).map(([id, val]) => ({
      projectId: id,
      projectName: val.name,
      budget: val.budget,
      actualCost: val.cost,
      hoursSpent: val.hours,
      averageProgress: val.count > 0 ? (val.progSum / val.count) * 100 : 0,
      tasksCount: val.count,
    }));
  }, [tasks]);

  // Find maximum budget to scale the chart
  const maxVal = useMemo(() => {
    let max = 0;
    projectSummaries.forEach((p) => {
      if (p.budget > max) max = p.budget;
      if (p.actualCost > max) max = p.actualCost;
    });
    return max > 0 ? max * 1.1 : 10000; // Add 10% padding
  }, [projectSummaries]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB", maximumFractionDigits: 0 }).format(val);
  };

  // Identify budget status
  const overBudgetProjects = projectSummaries.filter((p) => p.actualCost > p.budget);
  const normalBudgetProjects = projectSummaries.filter((p) => p.actualCost <= p.budget);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Visual Chart Card */}
      <div id="budget-comparison-chart-card" className="lg:col-span-2 bg-white rounded-xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <TrendingUp size={18} className="text-emerald-500" />
                เปรียบเทียบงบประมาณและค่าใช้จ่ายจริงรายโครงการ
              </h3>
              <p className="text-xs text-slate-400 font-medium">
                กราฟเปรียบเทียบงบประมาณตั้งต้น (Budget) กับค่าใช้จ่ายจริง (Actual Cost) หน่วย: บาท
              </p>
            </div>
            <div className="flex gap-4 text-xs font-semibold">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 bg-indigo-500 rounded-xs"></div>
                <span className="text-slate-500">งบประมาณ</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 bg-rose-400 rounded-sm"></div>
                <span className="text-slate-500">จ่ายจริง</span>
              </div>
            </div>
          </div>

          {/* SVG Chart */}
          <div className="relative h-72 w-full mt-4 flex items-end border-b border-l border-slate-200 pb-1 pl-2">
            {projectSummaries.length === 0 ? (
              <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-sm">
                ไม่มีข้อมูลโครงการสำหรับตัวกรองนี้
              </div>
            ) : (
              <div className="flex justify-around items-end w-full h-full pt-6 relative">
                {/* Horizontal grid lines */}
                {[0, 0.25, 0.5, 0.75, 1].map((ratio, gridIdx) => (
                  <div
                    key={gridIdx}
                    className="absolute left-0 right-0 border-t border-dashed border-slate-100 pointer-events-none text-[9px] font-semibold text-slate-300 flex justify-end pr-1"
                    style={{ bottom: `${ratio * 100}%` }}
                  >
                    <span>{formatCurrency(maxVal * ratio)}</span>
                  </div>
                ))}

                {projectSummaries.map((proj) => {
                  const budgetHeight = (proj.budget / maxVal) * 100;
                  const costHeight = (proj.actualCost / maxVal) * 100;
                  const isHovered = hoveredProject === proj.projectId;

                  return (
                    <div
                      key={proj.projectId}
                      className="flex flex-col items-center group relative px-1 flex-1 max-w-[80px]"
                      onMouseEnter={() => setHoveredProject(proj.projectId)}
                      onMouseLeave={() => setHoveredProject(null)}
                    >
                      {/* Hover Tooltip Overlay */}
                      <AnimatePresence>
                        {isHovered && (
                          <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: -8, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            transition={{ duration: 0.15 }}
                            className="absolute bottom-full mb-2 bg-slate-900/95 backdrop-blur-xs text-white text-xs p-3 rounded-xl shadow-lg z-30 min-w-[200px] pointer-events-none border border-slate-800"
                          >
                            <p className="font-bold border-b border-slate-800 pb-1 mb-1.5 text-indigo-200">
                              {proj.projectName}
                            </p>
                            <div className="space-y-1 font-mono">
                              <div className="flex justify-between gap-4">
                                <span className="text-slate-400">ID:</span>
                                <span>{proj.projectId}</span>
                              </div>
                              <div className="flex justify-between gap-4">
                                <span className="text-slate-400">งบตั้งต้น:</span>
                                <span>{formatCurrency(proj.budget)}</span>
                              </div>
                              <div className="flex justify-between gap-4">
                                <span className="text-slate-400">จ่ายจริง:</span>
                                <span className={proj.actualCost > proj.budget ? "text-rose-400 font-bold" : "text-emerald-400"}>
                                  {formatCurrency(proj.actualCost)}
                                </span>
                              </div>
                              <div className="flex justify-between gap-4 border-t border-slate-800 pt-1 mt-1 font-sans text-[11px]">
                                <span className="text-slate-400">ความคืบหน้าเฉลี่ย:</span>
                                <span className="text-amber-400 font-bold">{proj.averageProgress.toFixed(1)}%</span>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Bar Group container */}
                      <div className="flex items-end gap-1.5 h-48 w-full justify-center relative">
                        {/* Budget Bar */}
                        <div
                          className="w-4 bg-indigo-500 rounded-t-xs hover:bg-indigo-600 transition-colors cursor-pointer relative"
                          style={{ height: `${Math.max(budgetHeight, 2)}%` }}
                        ></div>
                        {/* Actual Cost Bar */}
                        <div
                          className={`w-4 rounded-t-xs transition-colors cursor-pointer relative ${
                            proj.actualCost > proj.budget ? "bg-rose-400 hover:bg-rose-500" : "bg-emerald-400 hover:bg-emerald-500"
                          }`}
                          style={{ height: `${Math.max(costHeight, 2)}%` }}
                        ></div>
                      </div>

                      {/* Label */}
                      <span className="text-[10px] font-bold text-slate-500 mt-2 truncate w-full text-center">
                        {proj.projectId}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 p-3 bg-slate-50 rounded-xl flex items-start gap-2.5 border border-slate-100">
          <Info size={16} className="text-indigo-500 mt-0.5 shrink-0" />
          <p className="text-xs text-slate-500 leading-relaxed">
            <strong>คำแนะนำ:</strong> ชี้เมาส์ไปที่เสาของแต่ละโครงการเพื่อดูรายละเอียดงบประมาณ เปรียบเทียบกับค่าใช้จ่ายจริง และระดับความคืบหน้าของงานสะสมในแต่ละโครงการย่อย
          </p>
        </div>
      </div>

      {/* Budget Insights Sidebar */}
      <div id="budget-insights-sidebar" className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2 mb-1">
            <AlertCircle size={18} className="text-rose-500" />
            วิเคราะห์สถานะงบประมาณ
          </h3>
          <p className="text-xs text-slate-400 font-medium mb-4">
            ตรวจสอบรายชื่อโครงการที่คุ้มค่าหรืองบประมาณบานปลาย
          </p>

          <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
            {/* Over budget */}
            <div>
              <div className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-1.5 rounded-lg flex items-center gap-1 mb-2">
                <AlertCircle size={14} />
                <span>งบประมาณบานปลาย ({overBudgetProjects.length})</span>
              </div>
              {overBudgetProjects.length === 0 ? (
                <p className="text-xs text-slate-400 italic pl-2">ไม่มีโครงการที่งบประมาณบานปลาย</p>
              ) : (
                <div className="space-y-2">
                  {overBudgetProjects.map((p) => (
                    <div key={p.projectId} className="p-2.5 rounded-xl border border-rose-100 hover:bg-rose-50/30 transition-colors">
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-xs font-bold text-slate-700 truncate max-w-[150px]">
                          {p.projectName}
                        </span>
                        <span className="text-[10px] font-bold bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded-sm font-mono">
                          {p.projectId}
                        </span>
                      </div>
                      <div className="flex justify-between text-[11px] text-slate-500 font-mono">
                        <span>เกินงบไป:</span>
                        <span className="text-rose-600 font-bold">
                          {formatCurrency(p.actualCost - p.budget)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Within budget */}
            <div>
              <div className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1.5 rounded-lg flex items-center gap-1 mb-2">
                <CheckCircle size={14} />
                <span>อยู่ภายใต้งบประมาณ ({normalBudgetProjects.length})</span>
              </div>
              {normalBudgetProjects.length === 0 ? (
                <p className="text-xs text-slate-400 italic pl-2">ไม่มีโครงการที่อยู่ในงบประมาณ</p>
              ) : (
                <div className="space-y-1.5">
                  {normalBudgetProjects.slice(0, 3).map((p) => (
                    <div key={p.projectId} className="flex justify-between items-center p-2 rounded-xl border border-slate-50 text-xs">
                      <div className="truncate max-w-[160px]">
                        <p className="font-bold text-slate-700 truncate">{p.projectName}</p>
                        <p className="text-[10px] text-slate-400">เหลือ: {formatCurrency(p.budget - p.actualCost)}</p>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100/50 px-1.5 py-0.5 rounded-sm font-mono">
                        {( (p.actualCost / (p.budget || 1)) * 100 ).toFixed(0)}%
                      </span>
                    </div>
                  ))}
                  {normalBudgetProjects.length > 3 && (
                    <p className="text-[10px] text-slate-400 text-center italic mt-1">
                      และโครงการอื่นๆ อีก {normalBudgetProjects.length - 3} โครงการ
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-4 mt-4">
          <div className="flex justify-between text-xs text-slate-500">
            <span>ประสิทธิภาพการคุมงบรวม:</span>
            <span className={`font-bold ${overBudgetProjects.length > 0 ? "text-amber-600" : "text-emerald-600"}`}>
              {(((projectSummaries.length - overBudgetProjects.length) / (projectSummaries.length || 1)) * 100).toFixed(0)}% ลุล่วง
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
