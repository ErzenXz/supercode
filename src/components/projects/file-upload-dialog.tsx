'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog'
import { Upload, File, Folder, X, CheckCircle, AlertCircle, Loader2, Info } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { shouldUploadFile } from '@/lib/utils'

interface FileUploadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  onUploadComplete: () => void
}

interface UploadFile {
  file: File
  path: string
  status: 'pending' | 'uploading' | 'completed' | 'error'
  progress: number
  error?: string
}

export function FileUploadDialog({ open, onOpenChange, projectId, onUploadComplete }: FileUploadDialogProps) {
  const [files, setFiles] = useState<UploadFile[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [filteredCount, setFilteredCount] = useState(0)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const items = Array.from(e.dataTransfer.items)
    processDroppedItems(items)
  }, [])

  const processDroppedItems = async (items: DataTransferItem[]) => {
    const newFiles: UploadFile[] = []
    let filtered = 0

    for (const item of items) {
      if (item.kind === 'file') {
        const entry = item.webkitGetAsEntry()
        if (entry) {
          await processEntry(entry, '', newFiles, (count) => { filtered += count })
        }
      }
    }

    setFiles(prev => [...prev, ...newFiles])
    setFilteredCount(prev => prev + filtered)
  }

  const processEntry = async (entry: any, path: string, fileList: UploadFile[], onFiltered?: (count: number) => void) => {
    if (entry.isFile) {
      entry.file((file: File) => {
        const fullPath = path ? `${path}/${file.name}` : file.name

        // Apply filtering
        if (shouldUploadFile(fullPath)) {
          fileList.push({
            file,
            path: fullPath,
            status: 'pending',
            progress: 0
          })
        } else {
          // Count filtered files
          onFiltered?.(1)
        }
      })
    } else if (entry.isDirectory) {
      const reader = entry.createReader()
      const entries = await new Promise<any[]>((resolve) => {
        reader.readEntries(resolve)
      })

      for (const childEntry of entries) {
        const newPath = path ? `${path}/${entry.name}` : entry.name
        await processEntry(childEntry, newPath, fileList, onFiltered)
      }
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    let filtered = 0

    const newFiles: UploadFile[] = selectedFiles
      .filter(file => {
        if (shouldUploadFile(file.name)) {
          return true
        } else {
          filtered++
          return false
        }
      })
      .map(file => ({
        file,
        path: file.name,
        status: 'pending',
        progress: 0
      }))

    setFiles(prev => [...prev, ...newFiles])
    setFilteredCount(prev => prev + filtered)
  }

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const uploadFiles = async () => {
    if (files.length === 0) return
    
    setIsUploading(true)
    setUploadProgress(0)
    
    try {
      const formData = new FormData()
      
      files.forEach((uploadFile, index) => {
        formData.append('files', uploadFile.file)
        formData.append('paths', uploadFile.path)
      })
      
      const response = await fetch(`/api/projects/${projectId}/upload`, {
        method: 'POST',
        body: formData,
      })
      
      if (response.ok) {
        const result = await response.json()
        
        // Update file statuses
        setFiles(prev => prev.map(file => ({
          ...file,
          status: 'completed',
          progress: 100
        })))
        
        // Start indexing
        await fetch(`/api/projects/${projectId}/index`, {
          method: 'POST',
        })
        
        onUploadComplete()
        
        // Close dialog after a short delay
        setTimeout(() => {
          onOpenChange(false)
          setFiles([])
        }, 1500)
      } else {
        throw new Error('Upload failed')
      }
    } catch (error) {
      console.error('Upload error:', error)
      setFiles(prev => prev.map(file => ({
        ...file,
        status: 'error',
        error: 'Upload failed'
      })))
    } finally {
      setIsUploading(false)
    }
  }

  const getStatusIcon = (status: UploadFile['status']) => {
    switch (status) {
      case 'pending':
        return <File className="w-4 h-4 text-slate-400" />
      case 'uploading':
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />
    }
  }

  const getStatusColor = (status: UploadFile['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-slate-100 text-slate-700'
      case 'uploading':
        return 'bg-blue-100 text-blue-700'
      case 'completed':
        return 'bg-green-100 text-green-700'
      case 'error':
        return 'bg-red-100 text-red-700'
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Upload className="w-6 h-6 text-white" />
          </div>
          <DialogTitle className="text-2xl text-center">Upload Files</DialogTitle>
          <DialogDescription className="text-center">
            Add new files or update existing ones in your project.<br />
            <span className="text-xs text-slate-500">
              Files like node_modules, build outputs, and lock files are automatically filtered out.
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Drop Zone */}
          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
              isDragOver 
                ? 'border-blue-400 bg-blue-50 dark:bg-blue-950/20' 
                : 'border-slate-300 dark:border-slate-600'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Drop files or folders here</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              Or click to select files manually
            </p>
            <input
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
            />
            <div className="flex gap-2 justify-center">
              <Button
                variant="outline"
                onClick={() => document.getElementById('file-upload')?.click()}
              >
                <File className="w-4 h-4 mr-2" />
                Select Files
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  const input = document.createElement('input')
                  input.type = 'file'
                  input.multiple = true
                  ;(input as any).webkitdirectory = true
                  input.onchange = (e) => {
                    const files = Array.from((e.target as HTMLInputElement).files || [])
                    let filtered = 0

                    const newFiles: UploadFile[] = files
                      .filter(file => {
                        const filePath = file.webkitRelativePath || file.name
                        if (shouldUploadFile(filePath)) {
                          return true
                        } else {
                          filtered++
                          return false
                        }
                      })
                      .map(file => ({
                        file,
                        path: file.webkitRelativePath || file.name,
                        status: 'pending',
                        progress: 0
                      }))

                    setFiles(prev => [...prev, ...newFiles])
                    setFilteredCount(prev => prev + filtered)
                  }
                  input.click()
                }}
              >
                <Folder className="w-4 h-4 mr-2" />
                Select Folder
              </Button>
            </div>
          </div>

          {/* Filtered Files Info */}
          {filteredCount > 0 && (
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
                <Info className="w-4 h-4" />
                <span>
                  {filteredCount} file{filteredCount !== 1 ? 's' : ''} filtered out (node_modules, build files, etc.)
                </span>
              </div>
            </div>
          )}

          {/* File List */}
          {files.length > 0 && (
            <div className="mt-6 flex-1 overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold">Files to Upload ({files.length})</h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFiles([])
                    setFilteredCount(0)
                  }}
                  disabled={isUploading}
                >
                  Clear All
                </Button>
              </div>
              
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {files.map((uploadFile, index) => (
                  <Card key={index} className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {getStatusIcon(uploadFile.status)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{uploadFile.path}</p>
                          <p className="text-xs text-slate-500">
                            {(uploadFile.file.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                        <Badge variant="secondary" className={getStatusColor(uploadFile.status)}>
                          {uploadFile.status}
                        </Badge>
                      </div>
                      {!isUploading && uploadFile.status === 'pending' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    {uploadFile.error && (
                      <p className="text-xs text-red-500 mt-1">{uploadFile.error}</p>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isUploading}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={uploadFiles}
            disabled={files.length === 0 || isUploading}
            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Upload & Index
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
