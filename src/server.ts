import { z } from "zod";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { Markdownify } from "./Markdownify.js";
import * as tools from "./tools.js";
import { CallToolRequest } from "@modelcontextprotocol/sdk/types.js";
import express from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import http from "http";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const RequestPayloadSchema = z.object({
  filepath: z.string().optional(),
  url: z.string().optional(),
  projectRoot: z.string().optional(),
});

// 配置文件上传
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../uploads"));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const upload = multer({ storage: storage });

export type ServerInstance = {
  mcpServer: Server;
  httpServer: http.Server;
  app: express.Application;
};

export function createServer(): ServerInstance {
  // 创建Express应用
  const app = express();
  const httpServer = http.createServer(app);

  // 创建MCP服务器
  const mcpServer = new Server(
    {
      name: "mcp-markdownify-server",
      version: "0.1.0",
    },
    {
      capabilities: {
        tools: {},
      },
    },
  );

  // 静态文件服务
  app.use(express.static(path.join(__dirname, "../test-page")));
  app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

  // 文件上传处理
  app.post("/upload", upload.single("file"), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    // 返回相对路径
    const relativePath = path.relative(path.join(__dirname, ".."), req.file.path);
    res.json({ filepath: relativePath });
  });

  // API路由处理
  app.post("/api/tools/pdf-to-markdown", express.json(), async (req, res) => {
    try {
      console.log('Received request body:', req.body);
      console.log('Received request with filepath:', req.body.filepath);
      
      if (!req.body.filepath) {
        throw new Error('filepath is required');
      }

      // 构建完整的文件路径
      const fullPath = path.join(__dirname, "..", req.body.filepath);
      console.log('Full file path:', fullPath);
      
      // 检查文件是否存在
      if (!fs.existsSync(fullPath)) {
        throw new Error(`File not found: ${fullPath}`);
      }
      
      // 确保文件路径是绝对路径
      const absolutePath = path.resolve(fullPath);
      console.log('Absolute file path:', absolutePath);
      
      const result = await Markdownify.toMarkdown({
        filePath: absolutePath,
        projectRoot: path.join(__dirname, ".."),
      });
      
      // 根据请求的格式返回不同的结果
      const format = req.body.format || 'markdown';
      const text = format === 'text' ? result.text.replace(/[#*`]/g, '') : result.text;
      
      res.json({
        text: text
      });
    } catch (error) {
      console.error('Error converting PDF:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : "Unknown error occurred"
      });
    }
  });

  // MCP服务器处理程序
  mcpServer.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: Object.values(tools),
    };
  });

  mcpServer.setRequestHandler(
    CallToolRequestSchema,
    async (request: CallToolRequest) => {
      const { name, arguments: args } = request.params;
      const validatedArgs = RequestPayloadSchema.parse(args);

      try {
        let result;
        switch (name) {
          case tools.YouTubeToMarkdownTool.name:
          case tools.BingSearchResultToMarkdownTool.name:
          case tools.WebpageToMarkdownTool.name:
            if (!validatedArgs.url) {
              throw new Error("URL is required for this tool");
            }
            result = await Markdownify.toMarkdown({
              url: validatedArgs.url,
              projectRoot: validatedArgs.projectRoot,
            });
            break;

          case tools.PDFToMarkdownTool.name:
          case tools.ImageToMarkdownTool.name:
          case tools.AudioToMarkdownTool.name:
          case tools.DocxToMarkdownTool.name:
          case tools.XlsxToMarkdownTool.name:
          case tools.PptxToMarkdownTool.name:
            if (!validatedArgs.filepath) {
              throw new Error("File path is required for this tool");
            }
            result = await Markdownify.toMarkdown({
              filePath: validatedArgs.filepath,
              projectRoot: validatedArgs.projectRoot,
            });
            break;

          case tools.GetMarkdownFileTool.name:
            if (!validatedArgs.filepath) {
              throw new Error("File path is required for this tool");
            }
            result = await Markdownify.get({
              filePath: validatedArgs.filepath,
            });
            break;

          default:
            throw new Error("Tool not found");
        }

        return {
          content: [
            { type: "text", text: `Output file: ${result.path}` },
            { type: "text", text: `Converted content:` },
            { type: "text", text: result.text },
          ],
          isError: false,
        };
      } catch (e) {
        if (e instanceof Error) {
          return {
            content: [{ type: "text", text: `Error: ${e.message}` }],
            isError: true,
          };
        } else {
          console.error(e);
          return {
            content: [{ type: "text", text: `Error: Unknown error occurred` }],
            isError: true,
          };
        }
      }
    },
  );

  // 启动服务器
  const PORT = process.env.PORT || 3000;
  httpServer.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });

  return { mcpServer, httpServer, app };
}
