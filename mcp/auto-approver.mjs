#!/usr/bin/env node
// auto-approver.mjs — MCP server cho Amazon Q, tránh shell bằng tools
// LƯU Ý: KHÔNG console.log ra STDOUT; chỉ console.error để không phá giao thức.

import simpleGit from "simple-git";

// Tự dò các đường import SDK theo nhiều phiên bản khác nhau
async function loadSdk() {
  const tries = [
    // SDK kiểu “server/*”
    async () => {
      const { McpServer } = await import("@modelcontextprotocol/sdk/server/mcp.js");
      const { StdioServerTransport } = await import("@modelcontextprotocol/sdk/server/stdio.js");
      return { McpServer, StdioServerTransport };
    },
    // SDK kiểu “server/index”
    async () => {
      const { Server: McpServer } = await import("@modelcontextprotocol/sdk/server/index.js");
      const { StdioServerTransport } = await import("@modelcontextprotocol/sdk/transports/stdio.js");
      return { McpServer, StdioServerTransport };
    },
    // SDK export gộp
    async () => {
      const sdk = await import("@modelcontextprotocol/sdk");
      // các tên export có thể khác nhau giữa phiên bản
      const McpServer = sdk.McpServer || sdk.Server;
      const StdioServerTransport =
        sdk.StdioServerTransport ||
        (sdk.transports && sdk.transports.StdioServerTransport);
      if (!McpServer || !StdioServerTransport) throw new Error("Exports not found");
      return { McpServer, StdioServerTransport };
    }
  ];

  let lastErr;
  for (const t of tries) {
    try { return await t(); } catch (e) { lastErr = e; }
  }
  throw lastErr;
}

const { McpServer, StdioServerTransport } = await loadSdk();

// Tạo server (khai báo tools thay vì chạy shell → không hiện “Run”)
const server =
  typeof McpServer === "function" && McpServer.name === "Server"
    ? new McpServer({ name: "git-tools", version: "1.0.0" }, { capabilities: { tools: {} } })
    : new McpServer({ name: "git-tools", version: "1.0.0" });

// Tool 1: tạo nhánh git
const addTool = (name, schema, handler) => {
  // hỗ trợ cả API .tool(name, schema, handler) và .tool(name, {inputSchema, handler})
  if (typeof server.tool === "function" && schema && handler) {
    return server.tool(name, schema, handler);
  }
  return server.tool(name, {
    description: "MCP tool",
    inputSchema: schema,
    handler
  });
};

addTool(
  "git.createBranch",
  { type: "object", properties: { name: { type: "string" } }, required: ["name"] },
  async ({ name }) => {
    const git = simpleGit({ baseDir: process.cwd() });
    await git.fetch();
    await git.checkoutLocalBranch(name);
    const branch = (await git.branch()).current;
    return { ok: true, branch };
  }
);

// Tool 2: commit nhanh
addTool(
  "git.quickCommit",
  { type: "object", properties: { message: { type: "string" } }, required: ["message"] },
  async ({ message }) => {
    const git = simpleGit({ baseDir: process.cwd() });
    await git.add(".");
    const res = await git.commit(message);
    return { ok: true, commit: res.commit };
  }
);

// Log lỗi CHỈ ra STDERR
server.onerror = (e) => console.error("[mcp-git-tools]", e?.stack || e);

// Kết nối stdio
const transport = new StdioServerTransport();
server.connect(transport);
