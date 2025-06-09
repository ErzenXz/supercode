import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatFileSize(bytes: number): string {
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  if (bytes === 0) return '0 Bytes'
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
}

export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || ''
}

export function getLanguageFromExtension(extension: string): string {
  const languageMap: Record<string, string> = {
    'js': 'javascript',
    'jsx': 'javascript',
    'ts': 'typescript',
    'tsx': 'typescript',
    'py': 'python',
    'java': 'java',
    'cpp': 'cpp',
    'c': 'c',
    'cs': 'csharp',
    'php': 'php',
    'rb': 'ruby',
    'go': 'go',
    'rs': 'rust',
    'swift': 'swift',
    'kt': 'kotlin',
    'scala': 'scala',
    'html': 'html',
    'css': 'css',
    'scss': 'scss',
    'sass': 'sass',
    'less': 'less',
    'json': 'json',
    'xml': 'xml',
    'yaml': 'yaml',
    'yml': 'yaml',
    'md': 'markdown',
    'sql': 'sql',
    'sh': 'bash',
    'bash': 'bash',
    'zsh': 'zsh',
    'fish': 'fish',
  }
  
  return languageMap[extension] || 'text'
}

export function shouldIndexFile(filename: string): boolean {
  const extension = getFileExtension(filename)
  const indexableExtensions = [
    'js', 'jsx', 'ts', 'tsx', 'py', 'java', 'cpp', 'c', 'cs', 'php', 'rb', 'go', 'rs',
    'swift', 'kt', 'scala', 'html', 'css', 'scss', 'sass', 'less', 'json', 'xml',
    'yaml', 'yml', 'md', 'sql', 'sh', 'bash', 'zsh', 'fish', 'vue', 'svelte'
  ]
  
  const excludePatterns = [
    'node_modules',
    '.git',
    'dist',
    'build',
    '.next',
    'coverage',
    '.nyc_output',
    'vendor',
    '__pycache__',
    '.pytest_cache',
    'target',
    'bin',
    'obj',
  ]
  
  // Check if file should be excluded
  for (const pattern of excludePatterns) {
    if (filename.includes(pattern)) {
      return false
    }
  }
  
  return indexableExtensions.includes(extension)
}

export function chunkCode(content: string, maxChunkSize: number = 1000): Array<{
  content: string
  startLine: number
  endLine: number
}> {
  const lines = content.split('\n')
  const chunks: Array<{ content: string; startLine: number; endLine: number }> = []
  
  let currentChunk = ''
  let startLine = 1
  let currentLine = 1
  
  for (const line of lines) {
    if (currentChunk.length + line.length > maxChunkSize && currentChunk.length > 0) {
      chunks.push({
        content: currentChunk.trim(),
        startLine,
        endLine: currentLine - 1,
      })
      currentChunk = line + '\n'
      startLine = currentLine
    } else {
      currentChunk += line + '\n'
    }
    currentLine++
  }
  
  if (currentChunk.trim()) {
    chunks.push({
      content: currentChunk.trim(),
      startLine,
      endLine: currentLine - 1,
    })
  }
  
  return chunks
}

export function extractCodeSymbols(content: string, language: string): string[] {
  const symbols: string[] = []
  
  // Simple regex patterns for different languages
  const patterns: Record<string, RegExp[]> = {
    javascript: [
      /function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g,
      /class\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g,
      /const\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g,
      /let\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g,
      /var\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g,
    ],
    typescript: [
      /function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g,
      /class\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g,
      /interface\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g,
      /type\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g,
      /const\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g,
    ],
    python: [
      /def\s+([a-zA-Z_][a-zA-Z0-9_]*)/g,
      /class\s+([a-zA-Z_][a-zA-Z0-9_]*)/g,
    ],
  }
  
  const languagePatterns = patterns[language] || patterns.javascript
  
  for (const pattern of languagePatterns) {
    let match
    while ((match = pattern.exec(content)) !== null) {
      symbols.push(match[1])
    }
  }
  
  return [...new Set(symbols)] // Remove duplicates
}
