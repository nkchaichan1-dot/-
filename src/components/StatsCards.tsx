import React from "react";
import { ProjectTask } from "../types";
import { DollarSign, Percent, CheckCircle2, Clock, Landmark, AlertTriangle } from "lucide-react";
import { motion } from "motion/react";

interface StatsCardsProps {
  tasks: ProjectTask[];
}

export default function StatsCards({ tasks }: StatsCardsProps) {
  // Aggregate unique projects
  const uniqueProjects = Array.from(new Set(tasks.map((t) => t.projectId)));
  const totalProjects = uniqueProjects.length;

  // Calculate distinct project budget & cost.
  // Note: The sheet contains tasks. Each task has a budget and actual cost. 
  // Let's look at the data: for P001, we have 3 tasks with budgets: 9621, 7814, 1028.
  // Are these budgets at the task level or project level?
  // Let's check: "Task 001 of Project 001, budget 9621. Task 002 of Project 001, budget 7814."
  // Since budgets differ per task in the same project, budget is task-level or row-level budget!
  // So we sum them up to get the total budget for the scope of these tasks.
  const totalBudget = tasks.reduce((sum, t) => sum + t.budget, 0);
  const totalActualCost = tasks.reduce((sum, t) => sum + t.actualCost, 0);
  const remainingBudget = totalBudget - totalActualCost;
  const budgetUsagePercent = totalBudget > 0 ? (totalActualCost / totalBudget) * 100 : 0;

  // Calculate task status counts
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.taskStatus.toLowerCase() === "completed").length;
  const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  // Average progress
  const averageProgress = totalTasks > 0 ? (tasks.reduce((sum, t) => sum + t.progress, 0) / totalTasks) * 100 : 0;

  // Total hours spent
  const totalHours = tasks.reduce((sum, t) => sum + t.hoursSpent, 0);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB", maximumFractionDigits: 0 }).format(val);
  };

  const stats = [
    {
      id: "stat-budget",
      title: "งบประมาณโครงการรวม (Total Budget)",
      value: formatCurrency(totalBudget),
      icon: DollarSign,
      color: "text-emerald-600 bg-emerald-50 border-emerald-100",
      description: `จาก ${totalProjects} โครงการ (${totalTasks} งานย่อย)`,
    },
    {
      id: "stat-actual",
      title: "ค่าใช้จ่ายที่เกิดขึ้นจริง (Actual Cost)",
      value: formatCurrency(totalActualCost),
      icon: Landmark,
      color: "text-blue-600 bg-blue-50 border-blue-100",
      description: `ใช้ไปแล้ว ${budgetUsagePercent.toFixed(1)}% ของงบประมาณ`,
    },
    {
      id: "stat-remaining",
      title: "งบประมาณคงเหลือ (Remaining)",
      value: formatCurrency(remainingBudget),
      icon: remainingBudget >= 0 ? DollarSign : AlertTriangle,
      color: remainingBudget >= 0 
        ? "text-teal-600 bg-teal-50 border-teal-100" 
        : "text-rose-600 bg-rose-50 border-rose-100",
      description: remainingBudget >= 0 ? "อยู่ในกรอบงบประมาณ" : "งบประมาณเกินกำหนด",
    },
    {
      id: "stat-progress",
      title: "ความคืบหน้าเฉลี่ย (Avg. Progress)",
      value: `${averageProgress.toFixed(1)}%`,
      icon: Percent,
      color: "text-indigo-600 bg-indigo-50 border-indigo-100",
      description: "คำนวณถ่วงน้ำหนักตามงานย่อย",
    },
    {
      id: "stat-completed",
      title: "งานที่เสร็จสิ้นแล้ว (Completed Tasks)",
      value: `${completedTasks} / ${totalTasks}`,
      icon: CheckCircle2,
      color: "text-purple-600 bg-purple-50 border-purple-100",
      description: `คิดเป็น ${completionRate.toFixed(1)}% ของงานทั้งหมด`,
    },
    {
      id: "stat-hours",
      title: "ชั่วโมงปฏิบัติงานสะสม (Hours Spent)",
      value: `${totalHours.toLocaleString()} ชม.`,
      icon: Clock,
      color: "text-amber-600 bg-amber-50 border-amber-100",
      description: "เวลารวมที่ใช้ไปในการดำเนินงาน",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {stats.map((stat, idx) => {
        const Icon = stat.icon;
        return (
          <motion.div
            id={stat.id}
            key={stat.title}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: idx * 0.05 }}
            className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between"
          >
            <div className="flex justify-between items-start mb-3">
              <span className="text-xs font-semibold text-slate-500 tracking-wide leading-tight">
                {stat.title}
              </span>
              <div className={`p-2 rounded-lg border ${stat.color}`}>
                <Icon size={18} />
              </div>
            </div>
            <div>
              <div className="text-xl font-bold text-slate-900 tracking-tight mb-1 font-mono">
                {stat.value}
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                {stat.description}
              </p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
