import React, { useMemo, useState } from "react";
import { ProjectTask } from "../types";
import { MapPin, DollarSign, BarChart2, Compass, Layers } from "lucide-react";
import { motion } from "motion/react";

interface GeographicalDistributionProps {
  tasks: ProjectTask[];
}

interface LocationSummary {
  location: string;
  budget: number;
  actualCost: number;
  hoursSpent: number;
  projectCount: number;
  taskCount: number;
  avgProgress: number;
}

export default function GeographicalDistribution({ tasks }: GeographicalDistributionProps) {
  const [selectedLoc, setSelectedLoc] = useState<string | null>(null);

  // Group and aggregate data by Location
  const locationStats = useMemo((): LocationSummary[] => {
    const map = new Map<string, { budget: number; cost: number; hours: number; projects: Set<string>; tasksCount: number; progSum: number }>();

    tasks.forEach((t) => {
      const loc = t.location || "Other";
      const existing = map.get(loc) || {
        budget: 0,
        cost: 0,
        hours: 0,
        projects: new Set<string>(),
        tasksCount: 0,
        progSum: 0,
      };

      existing.budget += t.budget;
      existing.cost += t.actualCost;
      existing.hours += t.hoursSpent;
      existing.projects.add(t.projectId);
      existing.tasksCount += 1;
      existing.progSum += t.progress;

      map.set(loc, existing);
    });

    return Array.from(map.entries()).map(([loc, val]) => ({
      location: loc,
      budget: val.budget,
      actualCost: val.cost,
      hoursSpent: val.hours,
      projectCount: val.projects.size,
      taskCount: val.tasksCount,
      avgProgress: val.tasksCount > 0 ? (val.progSum / val.tasksCount) * 100 : 0,
    })).sort((a, b) => b.budget - a.budget); // Sort by highest budget
  }, [tasks]);

  // Find maximum budget among locations for scaling
  const maxLocBudget = useMemo(() => {
    return locationStats.reduce((max, curr) => (curr.budget > max ? curr.budget : max), 1);
  }, [locationStats]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB", maximumFractionDigits: 0 }).format(val);
  };

  const selectedLocData = locationStats.find((l) => l.location === selectedLoc);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Location Rankings List */}
      <div id="geographical-rankings-card" className="lg:col-span-2 bg-white rounded-xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 bg-indigo-50 rounded-lg text-indigo-600">
              <MapPin size={18} />
            </div>
            <h3 className="text-base font-bold text-slate-800">
              การกระจายตัวตามพื้นที่โครงการ (Geographical Budget Allocation)
            </h3>
          </div>
          <p className="text-xs text-slate-400 font-medium mb-6">
            จัดอันดับพื้นที่ปฏิบัติงานโครงการที่มีสัดส่วนงบประมาณสูงสุด (เรียงลำดับจากสูงสุดไปต่ำสุด)
          </p>

          <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
            {locationStats.map((loc, idx) => {
              const fillPercent = (loc.budget / maxLocBudget) * 100;
              const isSelected = selectedLoc === loc.location;

              return (
                <div
                  key={loc.location}
                  className={`p-3 rounded-lg border transition-all cursor-pointer ${
                    isSelected
                      ? "bg-indigo-50/70 border-indigo-200 shadow-xs"
                      : "bg-white border-slate-100 hover:border-slate-200"
                  }`}
                  onClick={() => setSelectedLoc(isSelected ? null : loc.location)}
                >
                  <div className="flex justify-between items-center mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-400 w-5">
                        #{idx + 1}
                      </span>
                      <span className="text-xs font-bold text-slate-800 font-sans">
                        {loc.location}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-sm">
                        {loc.projectCount} โครงการ
                      </span>
                    </div>
                    <span className="text-xs font-bold text-slate-900 font-mono">
                      {formatCurrency(loc.budget)}
                    </span>
                  </div>

                  {/* Horizontal Bar Visualizer */}
                  <div className="w-full bg-slate-100 h-1.5 rounded-xs overflow-hidden mb-1">
                    <motion.div
                      className="h-full bg-indigo-500 rounded-xs"
                      initial={{ width: 0 }}
                      animate={{ width: `${fillPercent}%` }}
                      transition={{ duration: 0.5, delay: idx * 0.05 }}
                    ></motion.div>
                  </div>

                  <div className="flex justify-between text-[10px] text-slate-400 font-semibold pl-7">
                    <span>ใช้จ่ายไปแล้ว: {formatCurrency(loc.actualCost)}</span>
                    <span className="text-indigo-600">ความคืบหน้า: {loc.avgProgress.toFixed(0)}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="text-[11px] text-slate-400 font-medium italic mt-4 pl-2">
          💡 คลิกที่การ์ดเขตพื้นที่เพื่อแสดงข้อมูลวิเคราะห์รายละเอียดเชิงลึกทางขวามือ
        </div>
      </div>

      {/* Geographical Detail Sidebar */}
      <div id="geographical-detail-card" className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 bg-indigo-50 rounded-lg text-indigo-600">
              <Compass size={18} />
            </div>
            <h3 className="text-base font-bold text-slate-800">
              ข้อมูลวิเคราะห์รายพื้นที่
            </h3>
          </div>
          <p className="text-xs text-slate-400 font-medium mb-4">
            {selectedLoc ? `พื้นที่วิเคราะห์: ${selectedLoc}` : "กรุณาเลือกพื้นที่การดำเนินงานเพื่อวิเคราะห์"}
          </p>

          {selectedLocData ? (
            <div className="space-y-4">
              {/* Stat block: Budget usage efficiency */}
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-100">
                <div className="text-xs text-slate-400 font-bold uppercase tracking-wide mb-1">
                  งบประมาณรวมในพื้นที่
                </div>
                <div className="text-lg font-extrabold text-slate-800 font-mono">
                  {formatCurrency(selectedLocData.budget)}
                </div>
                <div className="w-full bg-slate-200 h-1 rounded-xs mt-2.5 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500"
                    style={{ width: `${Math.min((selectedLocData.actualCost / (selectedLocData.budget || 1)) * 100, 100)}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-semibold">
                  <span>เบิกจ่ายไปแล้ว</span>
                  <span>{((selectedLocData.actualCost / (selectedLocData.budget || 1)) * 100).toFixed(1)}%</span>
                </div>
              </div>

              {/* Sub items: Count breakdown */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold block mb-1 uppercase tracking-wider">
                    จำนวนโครงการ
                  </span>
                  <div className="flex items-center gap-1.5">
                    <Layers size={14} className="text-indigo-500" />
                    <span className="text-base font-bold text-slate-700 font-mono">
                      {selectedLocData.projectCount}
                    </span>
                  </div>
                </div>
                <div className="p-3 rounded-lg border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold block mb-1 uppercase tracking-wider">
                    งานย่อยสะสม
                  </span>
                  <div className="flex items-center gap-1.5">
                    <BarChart2 size={14} className="text-indigo-500" />
                    <span className="text-base font-bold text-slate-700 font-mono">
                      {selectedLocData.taskCount}
                    </span>
                  </div>
                </div>
              </div>

              {/* Work Hours and Budget Status */}
              <div className="space-y-2.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-medium">ชั่วโมงทำงานสะสมในเขต:</span>
                  <span className="font-bold text-slate-700 font-mono">{selectedLocData.hoursSpent.toLocaleString()} ชม.</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-medium">ความคืบหน้าเฉลี่ย:</span>
                  <span className="font-bold text-slate-700 font-mono">{selectedLocData.avgProgress.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between items-center text-xs border-t border-dashed border-slate-150 pt-2.5">
                  <span className="text-slate-500 font-medium">งบประมาณคงเหลือในเขต:</span>
                  <span className={`font-bold font-mono ${selectedLocData.budget - selectedLocData.actualCost >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                    {formatCurrency(selectedLocData.budget - selectedLocData.actualCost)}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-slate-300">
              <MapPin size={48} className="stroke-1 mb-3 text-slate-200" />
              <p className="text-xs text-slate-400 font-medium text-center px-4 leading-relaxed">
                คลิกเลือกพื้นที่โครงการเพื่อเข้าดูสถิติค่าใช้จ่าย ประสิทธิภาพ และสัดส่วนความคืบหน้าของพื้นที่นั้นๆ
              </p>
            </div>
          )}
        </div>

        <div className="border-t border-slate-100 pt-4 mt-6">
          <div className="flex justify-between text-[11px] text-slate-500 font-semibold">
            <span>พื้นที่ปฏิบัติการครอบคลุม:</span>
            <span>{locationStats.length} รัฐ / เขตพื้นที่</span>
          </div>
        </div>
      </div>
    </div>
  );
}
