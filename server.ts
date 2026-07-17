import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

// Define Interfaces
interface ProjectTask {
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

interface CacheState {
  data: ProjectTask[] | null;
  lastUpdated: number;
}

// Memory Cache State (5 minutes TTL)
const CACHE_TTL_MS = 5 * 60 * 1000;
const cache: CacheState = {
  data: null,
  lastUpdated: 0,
};

// CSV Parser Helper
function parseCSV(csvText: string): string[][] {
  const lines: string[][] = [];
  let currentLine: string[] = [];
  let currentField = "";
  let inQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentField += '"';
        i++; // skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      currentLine.push(currentField.trim());
      currentField = "";
    } else if ((char === "\r" || char === "\n") && !inQuotes) {
      if (char === "\r" && nextChar === "\n") {
        i++;
      }
      currentLine.push(currentField.trim());
      if (currentLine.length > 0 && currentLine.some((cell) => cell !== "")) {
        lines.push(currentLine);
      }
      currentLine = [];
      currentField = "";
    } else {
      currentField += char;
    }
  }
  if (currentField || currentLine.length > 0) {
    currentLine.push(currentField.trim());
    lines.push(currentLine);
  }
  return lines;
}

// Convert parsed CSV rows into ProjectTask objects
function mapCsvToTasks(rows: string[][]): ProjectTask[] {
  if (rows.length < 2) return [];

  const headers = rows[0].map(h => h.trim().toLowerCase());
  const tasks: ProjectTask[] = [];

  // Match columns safely
  const colIndex = {
    projectId: headers.indexOf("project id"),
    projectName: headers.indexOf("project name"),
    projectType: headers.indexOf("project type"),
    location: headers.indexOf("location"),
    startDate: headers.indexOf("start date"),
    endDate: headers.indexOf("end date"),
    projectStatus: headers.indexOf("project status"),
    priority: headers.indexOf("priority"),
    taskId: headers.indexOf("task id"),
    taskName: headers.indexOf("task name"),
    taskStatus: headers.indexOf("task status"),
    assignedTo: headers.indexOf("assigned to"),
    hoursSpent: headers.indexOf("hours spent"),
    budget: headers.indexOf("budget"),
    actualCost: headers.indexOf("actual cost"),
    progress: headers.indexOf("progress"),
  };

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (row.length < headers.length) continue;

    const getValue = (idx: number) => (idx !== -1 && row[idx] ? row[idx] : "");
    const getFloat = (idx: number) => {
      if (idx === -1 || !row[idx]) return 0;
      const parsed = parseFloat(row[idx].replace(/,/g, ""));
      return isNaN(parsed) ? 0 : parsed;
    };

    tasks.push({
      projectId: getValue(colIndex.projectId),
      projectName: getValue(colIndex.projectName),
      projectType: getValue(colIndex.projectType),
      location: getValue(colIndex.location),
      startDate: getValue(colIndex.startDate),
      endDate: getValue(colIndex.endDate),
      projectStatus: getValue(colIndex.projectStatus),
      priority: getValue(colIndex.priority),
      taskId: getValue(colIndex.taskId),
      taskName: getValue(colIndex.taskName),
      taskStatus: getValue(colIndex.taskStatus),
      assignedTo: getValue(colIndex.assignedTo),
      hoursSpent: getFloat(colIndex.hoursSpent),
      budget: getFloat(colIndex.budget),
      actualCost: getFloat(colIndex.actualCost),
      progress: getFloat(colIndex.progress),
    });
  }

  return tasks;
}

// Fetch Google Sheet data with Retry logic and Exponential Backoff
async function fetchSheetDataWithRetry(url: string, retries = 3, delay = 1000): Promise<string> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        if (response.status === 429 || response.status === 503) {
          console.warn(`[API Warning] Google API returned status ${response.status}. Attempt ${attempt}/${retries}. Retrying in ${delay}ms...`);
          if (attempt === retries) throw new Error(`Failed to fetch after ${retries} attempts. Status: ${response.status}`);
          await new Promise((res) => setTimeout(res, delay));
          delay *= 2; // Exponential Backoff
          continue;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.text();
    } catch (error) {
      if (attempt === retries) {
        console.error("[API Error] Final attempt failed fetching Google Sheets data:", error);
        throw error;
      }
      await new Promise((res) => setTimeout(res, delay));
      delay *= 2;
    }
  }
  throw new Error("Failed to fetch sheet data due to retry exhaustion");
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON middleware
  app.use(express.json());

  // API Route: Get project data with proxying & caching
  app.get("/api/projects", async (req, res) => {
    try {
      const now = Date.now();
      const sheetUrl = "https://docs.google.com/spreadsheets/d/1Rfsv4rmmPu_rZYlgkjr85fucY2s1CUWDWudG4RPlk7U/export?format=csv&gid=0";

      const forceRefresh = req.query.refresh === "true";

      // Serve from cache if valid and not force-refreshing
      if (cache.data && (now - cache.lastUpdated < CACHE_TTL_MS) && !forceRefresh) {
        return res.json({
          tasks: cache.data,
          lastUpdated: cache.lastUpdated,
          cached: true,
        });
      }

      console.log("[API Cache] Cache expired or empty. Fetching fresh data from Google Sheets...");
      const csvText = await fetchSheetDataWithRetry(sheetUrl);
      const parsedCsv = parseCSV(csvText);
      const tasks = mapCsvToTasks(parsedCsv);

      // Save to memory cache
      cache.data = tasks;
      cache.lastUpdated = now;

      return res.json({
        tasks,
        lastUpdated: now,
        cached: false,
      });
    } catch (error: any) {
      console.error("[API Server Error] Error in /api/projects endpoint:", error);
      
      // Serve stale cache as fallback if server is down, else error
      if (cache.data) {
        console.log("[API Warning] Serving stale cached data as fallback...");
        return res.json({
          tasks: cache.data,
          lastUpdated: cache.lastUpdated,
          cached: true,
          fallback: true,
          error: error.message,
        });
      }

      return res.status(500).json({
        error: "Failed to load project dashboard data from Google Sheets.",
        details: error.message,
      });
    }
  });

  // Vite development middleware setup
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
