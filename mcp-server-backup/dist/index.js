#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema, } from "@modelcontextprotocol/sdk/types.js";
import axios from "axios";
import { z } from "zod";
// Configuration
const API_BASE_URL = process.env.SYNAPTIK_API_URL || "http://localhost:8080/api";
// Task types and schemas
const TaskSchema = z.object({
    id: z.string(),
    title: z.string(),
    description: z.string().optional(),
    status: z.enum(['pending', 'waiting', 'active', 'completed', 'deleted']),
    priority: z.enum(['H', 'M', 'L', '']),
    urgency: z.number().optional(),
    project: z.string().optional(),
    assignee: z.string().optional(),
    dueDate: z.string().optional(),
    scheduledDate: z.string().optional(),
    waitUntil: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    tags: z.array(z.string()),
    annotations: z.array(z.object({
        timestamp: z.string(),
        description: z.string()
    })),
    depends: z.array(z.string()),
    entry: z.string(),
    modified: z.string(),
    createdAt: z.string(),
    updatedAt: z.string()
});
const CreateTaskSchema = z.object({
    title: z.string(),
    description: z.string().optional(),
    status: z.enum(['pending', 'waiting', 'active', 'completed']).default('pending'),
    priority: z.enum(['H', 'M', 'L', '']).default(''),
    project: z.string().optional(),
    assignee: z.string().optional(),
    dueDate: z.string().optional(),
    scheduledDate: z.string().optional(),
    waitUntil: z.string().optional(),
    tags: z.array(z.string()).default([]),
    depends: z.array(z.string()).default([])
});
const UpdateTaskSchema = z.object({
    id: z.string(),
    title: z.string().optional(),
    description: z.string().optional(),
    status: z.enum(['pending', 'waiting', 'active', 'completed', 'deleted']).optional(),
    priority: z.enum(['H', 'M', 'L', '']).optional(),
    project: z.string().optional(),
    assignee: z.string().optional(),
    dueDate: z.string().optional(),
    scheduledDate: z.string().optional(),
    waitUntil: z.string().optional(),
    tags: z.array(z.string()).optional(),
    depends: z.array(z.string()).optional()
});
const TaskFilterSchema = z.object({
    status: z.string().optional(),
    priority: z.string().optional(),
    project: z.string().optional(),
    assignee: z.string().optional(),
    tags: z.string().optional(),
    dueBefore: z.string().optional(),
    dueAfter: z.string().optional(),
    limit: z.number().optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional()
});
const QuickCaptureSchema = z.object({
    input: z.string().describe("TaskWarrior-style task input string")
});
// API client
class SynaptikAPI {
    baseURL;
    constructor(baseURL) {
        this.baseURL = baseURL;
    }
    async request(method, endpoint, data) {
        try {
            const response = await axios({
                method,
                url: `${this.baseURL}${endpoint}`,
                data,
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            return response.data;
        }
        catch (error) {
            if (axios.isAxiosError(error)) {
                throw new Error(`API Error: ${error.response?.status} ${error.response?.statusText} - ${JSON.stringify(error.response?.data)}`);
            }
            throw error;
        }
    }
    async getTasks(filters = {}) {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                params.append(key, String(value));
            }
        });
        const queryString = params.toString();
        const endpoint = queryString ? `/tasks?${queryString}` : '/tasks';
        return this.request('GET', endpoint);
    }
    async getTask(id) {
        return this.request('GET', `/tasks/${id}`);
    }
    async createTask(task) {
        return this.request('POST', '/tasks', task);
    }
    async updateTask(id, updates) {
        return this.request('PUT', `/tasks/${id}`, updates);
    }
    async deleteTask(id) {
        return this.request('DELETE', `/tasks/${id}`);
    }
    async markTaskDone(id) {
        return this.request('POST', `/tasks/${id}/done`);
    }
    async markTaskUndone(id) {
        return this.request('POST', `/tasks/${id}/undone`);
    }
    async startTask(id) {
        return this.request('POST', `/tasks/${id}/start`);
    }
    async stopTask(id) {
        return this.request('POST', `/tasks/${id}/stop`);
    }
    async quickCapture(input) {
        return this.request('POST', '/tasks/capture', { input });
    }
    async getPendingTasks() {
        return this.request('GET', '/tasks/pending');
    }
    async getActiveTasks() {
        return this.request('GET', '/tasks/active');
    }
    async getCompletedTasks() {
        return this.request('GET', '/tasks/completed');
    }
    async getOverdueTasks() {
        return this.request('GET', '/tasks/overdue');
    }
    async getTodayTasks() {
        return this.request('GET', '/tasks/today');
    }
    async getProjects() {
        return this.request('GET', '/projects');
    }
    async createProject(project) {
        return this.request('POST', '/projects', project);
    }
    async getMindmaps() {
        return this.request('GET', '/mindmaps');
    }
}
// Create API instance
const api = new SynaptikAPI(API_BASE_URL);
// Define MCP tools
const tools = [
    {
        name: "get_tasks",
        description: "Get all tasks with optional filtering",
        inputSchema: {
            type: "object",
            properties: {
                status: { type: "string", description: "Filter by task status (pending, active, completed, etc.)" },
                priority: { type: "string", description: "Filter by priority (H, M, L)" },
                project: { type: "string", description: "Filter by project name" },
                assignee: { type: "string", description: "Filter by assignee name" },
                tags: { type: "string", description: "Filter by tags (comma-separated)" },
                dueBefore: { type: "string", description: "Filter tasks due before this date (ISO format)" },
                dueAfter: { type: "string", description: "Filter tasks due after this date (ISO format)" },
                limit: { type: "number", description: "Limit number of results" },
                sortBy: { type: "string", description: "Sort by field (title, dueDate, priority, etc.)" },
                sortOrder: { type: "string", enum: ["asc", "desc"], description: "Sort order" }
            }
        }
    },
    {
        name: "get_task",
        description: "Get a specific task by ID",
        inputSchema: {
            type: "object",
            properties: {
                id: { type: "string", description: "Task ID" }
            },
            required: ["id"]
        }
    },
    {
        name: "create_task",
        description: "Create a new task",
        inputSchema: {
            type: "object",
            properties: {
                title: { type: "string", description: "Task title" },
                description: { type: "string", description: "Task description" },
                status: { type: "string", enum: ["pending", "waiting", "active", "completed"], description: "Task status" },
                priority: { type: "string", enum: ["H", "M", "L", ""], description: "Task priority" },
                project: { type: "string", description: "Project name" },
                assignee: { type: "string", description: "Assignee name" },
                dueDate: { type: "string", description: "Due date (ISO format)" },
                scheduledDate: { type: "string", description: "Scheduled date (ISO format)" },
                waitUntil: { type: "string", description: "Wait until date (ISO format)" },
                tags: { type: "array", items: { type: "string" }, description: "Task tags" },
                depends: { type: "array", items: { type: "string" }, description: "Task dependencies (task IDs)" }
            },
            required: ["title"]
        }
    },
    {
        name: "update_task",
        description: "Update an existing task",
        inputSchema: {
            type: "object",
            properties: {
                id: { type: "string", description: "Task ID" },
                title: { type: "string", description: "Task title" },
                description: { type: "string", description: "Task description" },
                status: { type: "string", enum: ["pending", "waiting", "active", "completed", "deleted"], description: "Task status" },
                priority: { type: "string", enum: ["H", "M", "L", ""], description: "Task priority" },
                project: { type: "string", description: "Project name" },
                assignee: { type: "string", description: "Assignee name" },
                dueDate: { type: "string", description: "Due date (ISO format)" },
                scheduledDate: { type: "string", description: "Scheduled date (ISO format)" },
                waitUntil: { type: "string", description: "Wait until date (ISO format)" },
                tags: { type: "array", items: { type: "string" }, description: "Task tags" },
                depends: { type: "array", items: { type: "string" }, description: "Task dependencies (task IDs)" }
            },
            required: ["id"]
        }
    },
    {
        name: "delete_task",
        description: "Delete a task",
        inputSchema: {
            type: "object",
            properties: {
                id: { type: "string", description: "Task ID" }
            },
            required: ["id"]
        }
    },
    {
        name: "mark_task_done",
        description: "Mark a task as completed",
        inputSchema: {
            type: "object",
            properties: {
                id: { type: "string", description: "Task ID" }
            },
            required: ["id"]
        }
    },
    {
        name: "mark_task_undone",
        description: "Mark a completed task as pending",
        inputSchema: {
            type: "object",
            properties: {
                id: { type: "string", description: "Task ID" }
            },
            required: ["id"]
        }
    },
    {
        name: "start_task",
        description: "Start a task (set status to active)",
        inputSchema: {
            type: "object",
            properties: {
                id: { type: "string", description: "Task ID" }
            },
            required: ["id"]
        }
    },
    {
        name: "stop_task",
        description: "Stop an active task (set status to pending)",
        inputSchema: {
            type: "object",
            properties: {
                id: { type: "string", description: "Task ID" }
            },
            required: ["id"]
        }
    },
    {
        name: "quick_capture",
        description: "Create a task using TaskWarrior-style quick capture syntax",
        inputSchema: {
            type: "object",
            properties: {
                input: {
                    type: "string",
                    description: "TaskWarrior-style task input (e.g., 'Buy groceries due:tomorrow +shopping priority:H')"
                }
            },
            required: ["input"]
        }
    },
    {
        name: "get_pending_tasks",
        description: "Get all pending tasks",
        inputSchema: {
            type: "object",
            properties: {}
        }
    },
    {
        name: "get_active_tasks",
        description: "Get all active tasks",
        inputSchema: {
            type: "object",
            properties: {}
        }
    },
    {
        name: "get_completed_tasks",
        description: "Get all completed tasks",
        inputSchema: {
            type: "object",
            properties: {}
        }
    },
    {
        name: "get_overdue_tasks",
        description: "Get all overdue tasks",
        inputSchema: {
            type: "object",
            properties: {}
        }
    },
    {
        name: "get_today_tasks",
        description: "Get tasks due today",
        inputSchema: {
            type: "object",
            properties: {}
        }
    },
    {
        name: "get_projects",
        description: "Get all projects",
        inputSchema: {
            type: "object",
            properties: {}
        }
    },
    {
        name: "create_project",
        description: "Create a new project",
        inputSchema: {
            type: "object",
            properties: {
                name: { type: "string", description: "Project name" },
                description: { type: "string", description: "Project description" },
                color: { type: "string", description: "Project color" }
            },
            required: ["name"]
        }
    },
    {
        name: "get_mindmaps",
        description: "Get all mindmaps",
        inputSchema: {
            type: "object",
            properties: {}
        }
    }
];
// Create and configure server
const server = new Server({
    name: "synaptik-mcp-server",
    version: "1.0.0",
}, {
    capabilities: {
        tools: {},
    },
});
// Handle tool listing
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools,
    };
});
// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    try {
        switch (name) {
            case "get_tasks":
                const filters = TaskFilterSchema.parse(args || {});
                const tasks = await api.getTasks(filters);
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify(tasks, null, 2),
                        },
                    ],
                };
            case "get_task":
                if (!args?.id || typeof args.id !== 'string')
                    throw new Error("Task ID is required");
                const task = await api.getTask(args.id);
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify(task, null, 2),
                        },
                    ],
                };
            case "create_task":
                const newTask = CreateTaskSchema.parse(args);
                const createdTask = await api.createTask(newTask);
                return {
                    content: [
                        {
                            type: "text",
                            text: `Task created successfully: ${JSON.stringify(createdTask, null, 2)}`,
                        },
                    ],
                };
            case "update_task":
                const updates = UpdateTaskSchema.parse(args);
                const { id, ...updateData } = updates;
                const updatedTask = await api.updateTask(id, updateData);
                return {
                    content: [
                        {
                            type: "text",
                            text: `Task updated successfully: ${JSON.stringify(updatedTask, null, 2)}`,
                        },
                    ],
                };
            case "delete_task":
                if (!args?.id || typeof args.id !== 'string')
                    throw new Error("Task ID is required");
                const deleteResult = await api.deleteTask(args.id);
                return {
                    content: [
                        {
                            type: "text",
                            text: `Task deleted successfully: ${JSON.stringify(deleteResult, null, 2)}`,
                        },
                    ],
                };
            case "mark_task_done":
                if (!args?.id || typeof args.id !== 'string')
                    throw new Error("Task ID is required");
                const doneResult = await api.markTaskDone(args.id);
                return {
                    content: [
                        {
                            type: "text",
                            text: `Task marked as done: ${JSON.stringify(doneResult, null, 2)}`,
                        },
                    ],
                };
            case "mark_task_undone":
                if (!args?.id || typeof args.id !== 'string')
                    throw new Error("Task ID is required");
                const undoneResult = await api.markTaskUndone(args.id);
                return {
                    content: [
                        {
                            type: "text",
                            text: `Task marked as undone: ${JSON.stringify(undoneResult, null, 2)}`,
                        },
                    ],
                };
            case "start_task":
                if (!args?.id || typeof args.id !== 'string')
                    throw new Error("Task ID is required");
                const startResult = await api.startTask(args.id);
                return {
                    content: [
                        {
                            type: "text",
                            text: `Task started: ${JSON.stringify(startResult, null, 2)}`,
                        },
                    ],
                };
            case "stop_task":
                if (!args?.id || typeof args.id !== 'string')
                    throw new Error("Task ID is required");
                const stopResult = await api.stopTask(args.id);
                return {
                    content: [
                        {
                            type: "text",
                            text: `Task stopped: ${JSON.stringify(stopResult, null, 2)}`,
                        },
                    ],
                };
            case "quick_capture":
                const { input } = QuickCaptureSchema.parse(args);
                const captureResult = await api.quickCapture(input);
                return {
                    content: [
                        {
                            type: "text",
                            text: `Task captured: ${JSON.stringify(captureResult, null, 2)}`,
                        },
                    ],
                };
            case "get_pending_tasks":
                const pendingTasks = await api.getPendingTasks();
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify(pendingTasks, null, 2),
                        },
                    ],
                };
            case "get_active_tasks":
                const activeTasks = await api.getActiveTasks();
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify(activeTasks, null, 2),
                        },
                    ],
                };
            case "get_completed_tasks":
                const completedTasks = await api.getCompletedTasks();
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify(completedTasks, null, 2),
                        },
                    ],
                };
            case "get_overdue_tasks":
                const overdueTasks = await api.getOverdueTasks();
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify(overdueTasks, null, 2),
                        },
                    ],
                };
            case "get_today_tasks":
                const todayTasks = await api.getTodayTasks();
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify(todayTasks, null, 2),
                        },
                    ],
                };
            case "get_projects":
                const projects = await api.getProjects();
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify(projects, null, 2),
                        },
                    ],
                };
            case "create_project":
                if (!args?.name)
                    throw new Error("Project name is required");
                const newProject = await api.createProject(args);
                return {
                    content: [
                        {
                            type: "text",
                            text: `Project created: ${JSON.stringify(newProject, null, 2)}`,
                        },
                    ],
                };
            case "get_mindmaps":
                const mindmaps = await api.getMindmaps();
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify(mindmaps, null, 2),
                        },
                    ],
                };
            default:
                throw new Error(`Unknown tool: ${name}`);
        }
    }
    catch (error) {
        return {
            content: [
                {
                    type: "text",
                    text: `Error: ${error instanceof Error ? error.message : String(error)}`,
                },
            ],
            isError: true,
        };
    }
});
// Start server
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Synaptik MCP server running on stdio");
}
main().catch((error) => {
    console.error("Fatal error in main():", error);
    process.exit(1);
});
