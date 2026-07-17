export interface ProjectTask {
  projectId: string;
  projectName: string;
  projectType: string;
  location: string;
  startDate: string;
  endDate: string;
  projectStatus: string;
  priority: string;
  taskId: string;
  taskName: string;
  taskStatus: string;
  assignedTo: string;
  hoursSpent: number;
  budget: number;
  actualCost: number;
  progress: number;
}

export interface DashboardData {
  tasks: ProjectTask[];
  lastUpdated: number;
  cached: boolean;
  fallback?: boolean;
  error?: string;
}
