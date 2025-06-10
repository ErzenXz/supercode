import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import * as path from "path";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// File extension utilities
export function getFileExtension(filePath: string): string {
  return path.extname(filePath).toLowerCase();
}

export function getLanguageFromExtension(extension: string): string {
  const languageMap: Record<string, string> = {
    ".js": "javascript",
    ".jsx": "javascript",
    ".ts": "typescript",
    ".tsx": "typescript",
    ".py": "python",
    ".java": "java",
    ".cpp": "cpp",
    ".c": "c",
    ".cs": "csharp",
    ".php": "php",
    ".rb": "ruby",
    ".go": "go",
    ".rs": "rust",
    ".swift": "swift",
    ".kt": "kotlin",
    ".scala": "scala",
    ".sh": "bash",
    ".sql": "sql",
    ".html": "html",
    ".css": "css",
    ".scss": "scss",
    ".sass": "sass",
    ".less": "less",
    ".vue": "vue",
    ".svelte": "svelte",
    ".md": "markdown",
    ".json": "json",
    ".xml": "xml",
    ".yaml": "yaml",
    ".yml": "yaml",
    ".toml": "toml",
    ".ini": "ini",
    ".cfg": "ini",
    ".conf": "ini",
  };

  return languageMap[extension] || "text";
}

// File filtering
const SKIP_EXTENSIONS = [
  // Images
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".svg",
  ".ico",
  ".webp",
  ".bmp",
  ".tiff",
  // Documents
  ".pdf",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".ppt",
  ".pptx",
  // Archives
  ".zip",
  ".tar",
  ".gz",
  ".rar",
  ".7z",
  ".bz2",
  ".xz",
  // Media
  ".mp3",
  ".mp4",
  ".avi",
  ".mov",
  ".wmv",
  ".flv",
  ".mkv",
  ".wav",
  ".ogg",
  // Executables
  ".exe",
  ".dll",
  ".so",
  ".dylib",
  ".app",
  ".deb",
  ".rpm",
  ".msi",
  // Temporary/Cache
  ".log",
  ".tmp",
  ".cache",
  ".lock",
  ".pid",
  ".swp",
  ".swo",
  ".bak",
  // Font files
  ".ttf",
  ".otf",
  ".woff",
  ".woff2",
  ".eot",
  // Database files
  ".db",
  ".sqlite",
  ".sqlite3",
];

const SKIP_PATTERNS = [
  // Dependencies
  "node_modules",
  "vendor",
  "__pycache__",
  ".pytest_cache",
  // Version control
  ".git",
  ".svn",
  ".hg",
  // Build outputs
  ".next",
  ".nuxt",
  "dist",
  "build",
  "out",
  "target",
  "bin",
  "obj",
  // IDE/Editor
  ".vscode",
  ".idea",
  ".vs",
  ".sublime-project",
  ".sublime-workspace",
  // Testing/Coverage
  "coverage",
  ".nyc_output",
  ".coverage",
  "htmlcov",
  // Lock files
  "package-lock.json",
  "yarn.lock",
  "pnpm-lock.yaml",
  "composer.lock",
  "Pipfile.lock",
  // Environment files
  ".env",
  ".env.local",
  ".env.development",
  ".env.production",
  ".env.staging",
  // OS files
  ".DS_Store",
  "Thumbs.db",
  "desktop.ini",
  // Logs
  "logs",
  "*.log",
  // Cache directories
  ".cache",
  ".parcel-cache",
  ".webpack",
  ".rollup.cache",
];

const SKIP_FILENAMES = [
  // Lock files (exact matches)
  "package-lock.json",
  "yarn.lock",
  "pnpm-lock.yaml",
  "composer.lock",
  "Pipfile.lock",
  // Environment files
  ".env",
  ".env.local",
  ".env.development",
  ".env.production",
  ".env.staging",
  // OS files
  ".DS_Store",
  "Thumbs.db",
  "desktop.ini",
  // IDE files
  ".gitignore",
  ".gitattributes",
  ".editorconfig",
];

const CODE_EXTENSIONS = [
  // Web technologies
  ".js",
  ".jsx",
  ".ts",
  ".tsx",
  ".vue",
  ".svelte",
  ".astro",
  ".html",
  ".htm",
  ".css",
  ".scss",
  ".sass",
  ".less",
  ".stylus",
  // Programming languages
  ".py",
  ".java",
  ".cpp",
  ".c",
  ".cs",
  ".php",
  ".rb",
  ".go",
  ".rs",
  ".swift",
  ".kt",
  ".scala",
  ".clj",
  ".cljs",
  ".hs",
  ".elm",
  ".dart",
  ".lua",
  ".perl",
  ".r",
  ".matlab",
  ".julia",
  ".f90",
  ".f95",
  // Shell/Scripts
  ".sh",
  ".bash",
  ".zsh",
  ".fish",
  ".ps1",
  ".bat",
  ".cmd",
  // Data/Config
  ".json",
  ".xml",
  ".yaml",
  ".yml",
  ".toml",
  ".ini",
  ".cfg",
  ".conf",
  ".properties",
  ".env.example",
  ".env.template",
  // Database
  ".sql",
  ".graphql",
  ".gql",
  // Documentation
  ".md",
  ".mdx",
  ".txt",
  ".rst",
  ".adoc",
  // Other
  ".dockerfile",
  ".gitignore",
  ".gitattributes",
  ".editorconfig",
];

function shouldSkipPath(filePath: string): boolean {
  const normalizedPath = filePath.replace(/\\/g, "/");
  const pathParts = normalizedPath.split("/");

  // Check if any part of the path matches skip patterns
  for (const part of pathParts) {
    for (const pattern of SKIP_PATTERNS) {
      if (part === pattern || part.includes(pattern)) {
        return true;
      }
    }
  }

  return false;
}

export function shouldUploadFile(filePath: string): boolean {
  const extension = getFileExtension(filePath);
  const fileName = path.basename(filePath);

  // Skip files with unwanted extensions
  if (SKIP_EXTENSIONS.includes(extension)) {
    return false;
  }

  // Skip specific filenames
  if (SKIP_FILENAMES.includes(fileName)) {
    return false;
  }

  // Skip paths containing unwanted patterns
  if (shouldSkipPath(filePath)) {
    return false;
  }

  // Only allow files with code extensions or common project files
  return (
    CODE_EXTENSIONS.includes(extension) ||
    fileName.toLowerCase().includes("readme") ||
    fileName.toLowerCase().includes("license") ||
    fileName.toLowerCase().includes("changelog") ||
    fileName.toLowerCase().includes("makefile") ||
    fileName === "Dockerfile" ||
    fileName === "docker-compose.yml" ||
    fileName === "docker-compose.yaml"
  );
}

export function shouldIndexFile(filePath: string): boolean {
  // Use the same logic as shouldUploadFile for consistency
  return shouldUploadFile(filePath);
}

// Code chunking
export function chunkCode(
  content: string,
  maxChunkSize: number = 1000
): string[] {
  const lines = content.split("\n");
  const chunks: string[] = [];
  let currentChunk = "";

  for (const line of lines) {
    if (
      currentChunk.length + line.length + 1 > maxChunkSize &&
      currentChunk.length > 0
    ) {
      chunks.push(currentChunk.trim());
      currentChunk = line;
    } else {
      currentChunk += (currentChunk ? "\n" : "") + line;
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks.filter((chunk) => chunk.length > 0);
}

// Code symbol extraction
export function extractCodeSymbols(
  content: string,
  language: string
): string[] {
  const symbols: string[] = [];

  try {
    switch (language) {
      case "javascript":
      case "typescript":
        // Extract function names, class names, etc.
        const jsPatterns = [
          /function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g,
          /class\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g,
          /const\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=/g,
          /let\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=/g,
          /var\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=/g,
          /([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:\s*function/g,
          /([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=>\s*/g,
        ];

        for (const pattern of jsPatterns) {
          let match;
          while ((match = pattern.exec(content)) !== null) {
            symbols.push(match[1]);
          }
        }
        break;

      case "python":
        // Extract Python function and class names
        const pyPatterns = [
          /def\s+([a-zA-Z_][a-zA-Z0-9_]*)/g,
          /class\s+([a-zA-Z_][a-zA-Z0-9_]*)/g,
        ];

        for (const pattern of pyPatterns) {
          let match;
          while ((match = pattern.exec(content)) !== null) {
            symbols.push(match[1]);
          }
        }
        break;

      case "java":
        // Extract Java method and class names
        const javaPatterns = [
          /class\s+([a-zA-Z_][a-zA-Z0-9_]*)/g,
          /interface\s+([a-zA-Z_][a-zA-Z0-9_]*)/g,
          /public\s+\w+\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g,
          /private\s+\w+\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g,
          /protected\s+\w+\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g,
        ];

        for (const pattern of javaPatterns) {
          let match;
          while ((match = pattern.exec(content)) !== null) {
            symbols.push(match[1]);
          }
        }
        break;
    }
  } catch (error) {
    console.error("Error extracting symbols:", error);
  }

  return [...new Set(symbols)]; // Remove duplicates
}

// File size formatting
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}
