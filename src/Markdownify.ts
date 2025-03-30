import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs";
import os from "os";
import { fileURLToPath } from "url";

const execAsync = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export type MarkdownResult = {
  path: string;
  text: string;
};

export class Markdownify {
  private static async _convertPdfToMarkdown(
    filePath: string,
    projectRoot: string,
  ): Promise<string> {
    const pythonScript = path.join(projectRoot, "pdf_to_md.py");
    const pythonPath = path.join(projectRoot, ".venv", "Scripts", "python.exe");

    try {
      console.log('Converting PDF using script:', pythonScript);
      console.log('Python path:', pythonPath);
      console.log('Input file:', filePath);

      const { stdout, stderr } = await execAsync(
        `"${pythonPath}" "${pythonScript}" "${filePath}"`,
      );

      if (stderr) {
        console.error('PDF conversion stderr:', stderr);
      }

      if (!stdout) {
        throw new Error('No output from PDF conversion');
      }

      console.log('PDF conversion stdout:', stdout);
      return stdout;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to convert PDF: ${error.message}`);
      }
      throw error;
    }
  }

  private static async saveToTempFile(content: string): Promise<string> {
    const tempOutputPath = path.join(
      os.tmpdir(),
      `markdown_output_${Date.now()}.md`,
    );
    await fs.promises.writeFile(tempOutputPath, content, 'utf-8');
    return tempOutputPath;
  }

  static async toMarkdown({
    filePath,
    url,
    projectRoot = path.resolve(__dirname, ".."),
  }: {
    filePath?: string;
    url?: string;
    projectRoot?: string;
  }): Promise<MarkdownResult> {
    try {
      console.log('toMarkdown called with:', { filePath, url, projectRoot });
      
      let inputPath: string;
      let isTemporary = false;

      if (url) {
        const response = await fetch(url);
        const content = await response.text();
        inputPath = await this.saveToTempFile(content);
        isTemporary = true;
      } else if (filePath) {
        console.log('Using filePath:', filePath);
        if (!fs.existsSync(filePath)) {
          throw new Error(`Input file not found: ${filePath}`);
        }
        inputPath = filePath;
      } else {
        throw new Error("Either filePath or url must be provided");
      }

      console.log('Converting file:', inputPath);
      console.log('Project root:', projectRoot);

      const text = await this._convertPdfToMarkdown(inputPath, projectRoot);
      const outputPath = await this.saveToTempFile(text);

      if (isTemporary) {
        await fs.promises.unlink(inputPath);
      }

      return { path: outputPath, text };
    } catch (e: unknown) {
      console.error('Conversion error:', e);
      if (e instanceof Error) {
        throw new Error(`Error processing to Markdown: ${e.message}`);
      } else {
        throw new Error("Error processing to Markdown: Unknown error occurred");
      }
    }
  }

  static async get({
    filePath,
  }: {
    filePath: string;
  }): Promise<MarkdownResult> {
    if (!fs.existsSync(filePath)) {
      throw new Error("File does not exist");
    }

    const text = await fs.promises.readFile(filePath, "utf-8");

    return {
      path: filePath,
      text: text,
    };
  }
}
