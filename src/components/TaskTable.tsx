import React, { useState, useMemo } from "react";
import { ProjectTask } from "../types";
import { Search, RotateCcw, Download, ChevronLeft, ChevronRight, Filter, AlertCircle } from "lucide-react";
import { motion } from "motion/react";

interface TaskTableProps {
  tasks: ProjectTask[];
}

export default function TaskTable({ tasks }: TaskTableProps) {
  // Filters & Search State
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [selectedTaskStatus, setSelectedTaskStatus] = useState("");
  const [selectedProjectStatus, setSelectedProjectStatus] = useState("");
  const [selectedPriority, setSelectedPriority] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [selectedAssignee, setSelectedAssignee] = useState("");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Extract unique options for filter dropdowns
  const filterOptions = useMemo(() => {
    const locations = new Set<string>();
    const taskStatuses = new Set<string>();
    const projectStatuses = new Set<string>();
    const priorities = new Set<string>();
    const types = new Set<string>();
    const assignees = new Set<string>();

    tasks.forEach((t) => {
      if (t.location) locations.add(t.location);
      if (t.taskStatus) taskStatuses.add(t.taskStatus);
      if (t.projectStatus) projectStatuses.add(t.projectStatus);
      if (t.priority) priorities.add(t.priority);
      if (t.projectType) types.add(t.projectType);
      if (t.assignedTo) assignees.add(t.assignedTo);
    });

    return {
      locations: Array.from(locations).sort(),
      taskStatuses: Array.from(taskStatuses).sort(),
      projectStatuses: Array.from(projectStatuses).sort(),
      priorities: Array.from(priorities).sort(),
      types: Array.from(types).sort(),
      assignees: Array.from(assignees).sort(),
    };
  }, [tasks]);

  // Handle filter resets
  const handleResetFilters = () => {
    setSearchTerm("");
    setSelectedLocation("");
    setSelectedTaskStatus("");
    setSelectedProjectStatus("");
    setSelectedPriority("");
    setSelectedType("");
    setSelectedAssignee("");
    setCurrentPage(1);
  };

  // Perform search and filter logic
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      // 1. Text Search matching
      const term = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !term ||
        t.projectId.toLowerCase().includes(term) ||
        t.projectName.toLowerCase().includes(term) ||
        t.taskName.toLowerCase().includes(term) ||
        t.location.toLowerCase().includes(term) ||
        t.assignedTo.toLowerCase().includes(term) ||
        t.projectType.toLowerCase().includes(term);

      // 2. Dropdown Filter matching
      const matchesLocation = !selectedLocation || t.location === selectedLocation;
      const matchesTaskStatus = !selectedTaskStatus || t.taskStatus === selectedTaskStatus;
      const matchesProjectStatus = !selectedProjectStatus || t.projectStatus === selectedProjectStatus;
      const matchesPriority = !selectedPriority || t.priority === selectedPriority;
      const matchesType = !selectedType || t.projectType === selectedType;
      const matchesAssignee = !selectedAssignee || t.assignedTo === selectedAssignee;

      return (
        matchesSearch &&
        matchesLocation &&
        matchesTaskStatus &&
        matchesProjectStatus &&
        matchesPriority &&
        matchesType &&
        matchesAssignee
      );
    });
  }, [
    tasks,
    searchTerm,
    selectedLocation,
    selectedTaskStatus,
    selectedProjectStatus,
    selectedPriority,
    selectedType,
    selectedAssignee,
  ]);

  // Paginated chunk
  const paginatedTasks = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredTasks.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredTasks, currentPage]);

  const totalPages = Math.ceil(filteredTasks.length / itemsPerPage) || 1;

  // Change page handler
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Export filtered tasks as CSV
  const handleExportCSV = () => {
    if (filteredTasks.length === 0) return;

    const headers = [
      "Project ID",
      "Project Name",
      "Project Type",
      "Location",
      "Start Date",
      "End Date",
      "Project Status",
      "Priority",
      "Task ID",
      "Task Name",
      "Task Status",
      "Assigned To",
      "Hours Spent",
      "Budget",
      "Actual Cost",
      "Progress",
    ];

    const csvContent = [
      headers.join(","),
      ...filteredTasks.map((t) =>
        [
          `"${t.projectId}"`,
          `"${t.projectName.replace(/"/g, '""')}"`,
          `"${t.projectType}"`,
          `"${t.location}"`,
          `"${t.startDate}"`,
          `"${t.endDate}"`,
          `"${t.projectStatus}"`,
          `"${t.priority}"`,
          `"${t.taskId}"`,
          `"${t.taskName.replace(/"/g, '""')}"`,
          `"${t.taskStatus}"`,
          `"${t.assignedTo}"`,
          t.hoursSpent,
          t.budget,
          t.actualCost,
          t.progress,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `project_tasks_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Badges color styles mapping
  const getTaskStatusStyles = (status: string) => {
    const s = status.toLowerCase();
    if (s === "completed") return "bg-emerald-100 text-emerald-800 border-emerald-200";
    if (s === "in progress") return "bg-amber-100 text-amber-800 border-amber-200";
    if (s === "pending") return "bg-indigo-100 text-indigo-800 border-indigo-200";
    return "bg-slate-100 text-slate-800 border-slate-200";
  };

  const getPriorityStyles = (priority: string) => {
    const p = priority.toLowerCase();
    if (p === "high") return "bg-rose-100 text-rose-800 border-rose-200";
    if (p === "medium") return "bg-amber-100 text-amber-800 border-amber-200";
    return "bg-slate-100 text-slate-800 border-slate-200";
  };

  const getProjectStatusStyles = (status: string) => {
    const s = status.toLowerCase();
    if (s === "on track") return "bg-emerald-100 text-emerald-800 border-emerald-200";
    if (s === "behind") return "bg-rose-100 text-rose-800 border-rose-200";
    return "bg-slate-100 text-slate-800 border-slate-200";
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB", maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-6">
      {/* Search and Filters Header */}
      <div>
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-slate-150 pb-5">
          <div>
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Filter size={18} className="text-indigo-500" />
              ตัวกรองข้อมูลและค้นหาโครงการย่อย (Interactive Search & Filters)
            </h3>
            <p className="text-xs text-slate-400 font-medium">
              ค้นหาด้วยคำสำคัญ หรือใช้ตัวกรองด้านล่างเพื่อคัดแยกข้อมูลตามพื้นที่ สถานะงาน หรือผู้รับผิดชอบ
            </p>
          </div>
          {/* Action buttons */}
          <div className="flex items-center gap-2 self-stretch lg:self-auto">
            <button
              onClick={handleResetFilters}
              className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-500 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              <RotateCcw size={14} />
              ล้างตัวกรองทั้งหมด
            </button>
            <button
              onClick={handleExportCSV}
              disabled={filteredTasks.length === 0}
              className="flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 rounded-lg transition-colors cursor-pointer shadow-xs"
            >
              <Download size={14} />
              ส่งออกเป็น CSV
            </button>
          </div>
        </div>

        {/* Filters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mt-5">
          {/* Main search bar */}
          <div className="sm:col-span-2 relative">
            <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-wider">
              ค้นหาโครงการ หรือชื่องาน
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="ค้นหาชื่อโครงการ, ชื่องาน, ผู้รับผิดชอบ..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-9 pr-3 py-2 text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-medium"
              />
              <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
            </div>
          </div>

          {/* Location filter */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-wider">
              พื้นที่โครงการ (Location)
            </label>
            <select
              value={selectedLocation}
              onChange={(e) => {
                setSelectedLocation(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-2.5 py-2 text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-semibold"
            >
              <option value="">ทั้งหมด (All Locations)</option>
              {filterOptions.locations.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>

          {/* Task Status filter */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-wider">
              สถานะงาน (Task Status)
            </label>
            <select
              value={selectedTaskStatus}
              onChange={(e) => {
                setSelectedTaskStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-2.5 py-2 text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-semibold"
            >
              <option value="">ทั้งหมด (All Statuses)</option>
              {filterOptions.taskStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          {/* Project Status filter */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-wider">
              สุขภาพโครงการ (Project Status)
            </label>
            <select
              value={selectedProjectStatus}
              onChange={(e) => {
                setSelectedProjectStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-2.5 py-2 text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-semibold"
            >
              <option value="">ทั้งหมด (All Health)</option>
              {filterOptions.projectStatuses.map((pStat) => (
                <option key={pStat} value={pStat}>
                  {pStat}
                </option>
              ))}
            </select>
          </div>

          {/* Priority filter */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-wider">
              ระดับความสำคัญ (Priority)
            </label>
            <select
              value={selectedPriority}
              onChange={(e) => {
                setSelectedPriority(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-2.5 py-2 text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-semibold"
            >
              <option value="">ทั้งหมด (All Priorities)</option>
              {filterOptions.priorities.map((prio) => (
                <option key={prio} value={prio}>
                  {prio}
                </option>
              ))}
            </select>
          </div>

          {/* Assigned To filter */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-wider">
              ผู้รับผิดชอบ (Assigned To)
            </label>
            <select
              value={selectedAssignee}
              onChange={(e) => {
                setSelectedAssignee(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-2.5 py-2 text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-semibold"
            >
              <option value="">ทั้งหมด (All Staff)</option>
              {filterOptions.assignees.map((assignee) => (
                <option key={assignee} value={assignee}>
                  {assignee}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Showing Result Stats */}
      <div className="flex justify-between items-center text-xs font-semibold text-slate-500 bg-slate-50 p-2.5 px-4 rounded-lg border border-slate-200">
        <span>พบข้อมูลทั้งหมด: <strong className="text-indigo-600 font-mono">{filteredTasks.length}</strong> รายงานย่อย (จากต้นฉบับ {tasks.length} รายงานย่อย)</span>
        <span>หน้าย่อย: {currentPage} / {totalPages}</span>
      </div>

      {/* Responsive Table Container */}
      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full text-left border-collapse min-w-[1000px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
              <th className="p-4 w-16">ID โครงการ</th>
              <th className="p-4 w-52">ชื่อโครงการ</th>
              <th className="p-4 w-32">ประเภท & พื้นที่</th>
              <th className="p-4 w-32">สุขภาพโครงการ</th>
              <th className="p-4 w-36">ชื่องานย่อย</th>
              <th className="p-4 w-28">สถานะงาน</th>
              <th className="p-4 w-20">ความสำคัญ</th>
              <th className="p-4 w-28">ผู้รับผิดชอบ</th>
              <th className="p-4 w-28 text-right">งบประมาณ / จ่ายจริง</th>
              <th className="p-4 w-24 text-right">คืบหน้า (%)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-xs text-slate-700">
            {paginatedTasks.length === 0 ? (
              <tr>
                <td colSpan={10} className="p-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <AlertCircle size={28} className="text-slate-300" />
                    <span>ไม่พบงานโครงการใด ๆ ตรงตามตัวกรองที่ระบุ</span>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedTasks.map((task, index) => {
                const costOver = task.actualCost > task.budget;
                return (
                  <tr key={`${task.taskId}-${task.projectId}-${index}`} className="hover:bg-slate-50/50 transition-colors">
                    {/* Project ID */}
                    <td className="p-4 font-bold text-indigo-600 font-mono">
                      {task.projectId}
                    </td>

                    {/* Project Name */}
                    <td className="p-4 font-bold text-slate-800 leading-snug">
                      {task.projectName}
                    </td>

                    {/* Type & Location */}
                    <td className="p-4 leading-normal">
                      <p className="font-semibold text-slate-700">{task.projectType}</p>
                      <p className="text-[10px] text-slate-400 flex items-center gap-0.5 mt-0.5">
                        📍 {task.location}
                      </p>
                    </td>

                    {/* Project Status */}
                    <td className="p-4">
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-xs border ${getProjectStatusStyles(task.projectStatus)}`}>
                        {task.projectStatus}
                      </span>
                    </td>

                    {/* Task Name */}
                    <td className="p-4 font-medium text-slate-600 max-w-xs truncate">
                      {task.taskName}
                    </td>

                    {/* Task Status */}
                    <td className="p-4">
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-xs border ${getTaskStatusStyles(task.taskStatus)}`}>
                        {task.taskStatus}
                      </span>
                    </td>

                    {/* Priority */}
                    <td className="p-4">
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-xs border ${getPriorityStyles(task.priority)}`}>
                        {task.priority}
                      </span>
                    </td>

                    {/* Assigned To */}
                    <td className="p-4 font-semibold text-slate-600">
                      {task.assignedTo}
                      <p className="text-[9px] text-slate-400 font-mono mt-0.5">⏱️ {task.hoursSpent} ชม.</p>
                    </td>

                    {/* Budget & Cost */}
                    <td className="p-4 text-right leading-normal font-mono">
                      <p className="font-bold text-slate-700">{formatCurrency(task.budget)}</p>
                      <p className={`text-[10px] font-semibold mt-0.5 ${costOver ? "text-rose-600 font-bold" : "text-emerald-600"}`}>
                        {task.actualCost > 0 ? formatCurrency(task.actualCost) : "ยังไม่เบิกจ่าย"}
                      </p>
                    </td>

                    {/* Progress */}
                    <td className="p-4 text-right">
                      <div className="flex flex-col items-end">
                        <span className="font-bold font-mono text-slate-800">
                          {(task.progress * 100).toFixed(0)}%
                        </span>
                        {/* Progress mini indicator */}
                        <div className="w-16 bg-slate-100 h-1 rounded-xs mt-1.5 overflow-hidden">
                          <div
                            className={`h-full ${task.progress >= 1 ? "bg-emerald-500" : "bg-indigo-500"}`}
                            style={{ width: `${task.progress * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center border-t border-slate-200 pt-5">
          <span className="text-xs text-slate-400 font-medium">
            แสดง {Math.min(filteredTasks.length, (currentPage - 1) * itemsPerPage + 1)}-
            {Math.min(filteredTasks.length, currentPage * itemsPerPage)} จาก {filteredTasks.length} รายการ
          </span>
          <div className="flex gap-1.5">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-1.5 bg-white text-slate-500 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: totalPages }).map((_, idx) => {
              const p = idx + 1;
              const isCurrent = p === currentPage;
              return (
                <button
                  key={p}
                  onClick={() => handlePageChange(p)}
                  className={`w-8 h-8 rounded-lg text-xs font-bold font-mono border cursor-pointer transition-all ${
                    isCurrent
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {p}
                </button>
              );
            })}
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-1.5 bg-white text-slate-500 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white cursor-pointer"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
