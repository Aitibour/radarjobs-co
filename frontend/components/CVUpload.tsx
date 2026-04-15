'use client'
import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'

interface CVUploadProps {
  onTextExtracted: (text: string) => void
  className?: string
}

export default function CVUpload({ onTextExtracted, className }: CVUploadProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)
  const [charCount, setCharCount] = useState<number>(0)
  const [previewText, setPreviewText] = useState<string>('')
  const [error, setError] = useState<string | null>(null)

  const processFile = useCallback(
    async (file: File) => {
      setIsProcessing(true)
      setError(null)
      setFileName(null)
      setPreviewText('')

      try {
        let text = ''

        if (file.type === 'application/pdf') {
          // Dynamically import pdfjs-dist to avoid SSR issues
          const pdfjsLib = await import('pdfjs-dist')
          pdfjsLib.GlobalWorkerOptions.workerSrc =
            'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs'

          const arrayBuffer = await file.arrayBuffer()
          const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise

          const pageTexts: string[] = []
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i)
            const content = await page.getTextContent()

            // Group text items by Y-position to reconstruct real lines.
            // pdfjs items each have a transform[5] = Y coordinate (PDF space, bottom-up).
            // Items within ~3pt of each other are on the same line.
            type TextItem = { str: string; transform: number[] }
            const items = content.items.filter(
              (it): it is TextItem => 'str' in it && (it as TextItem).str.trim() !== ''
            )

            // Sort top-to-bottom (higher Y = higher on page in PDF space)
            items.sort((a, b) => b.transform[5] - a.transform[5])

            const lines: string[] = []
            let currentLine = ''
            let lastY: number | null = null

            for (const item of items) {
              const y = item.transform[5]
              if (lastY === null || Math.abs(y - lastY) > 3) {
                if (currentLine.trim()) lines.push(currentLine.trim())
                currentLine = item.str
              } else {
                currentLine += ' ' + item.str
              }
              lastY = y
            }
            if (currentLine.trim()) lines.push(currentLine.trim())

            pageTexts.push(lines.join('\n'))
          }
          text = pageTexts.join('\n\n')
        } else {
          // Plain text
          text = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = (e) => resolve(e.target?.result as string)
            reader.onerror = () => reject(new Error('Failed to read file'))
            reader.readAsText(file)
          })
        }

        if (!text.trim()) {
          throw new Error('No text could be extracted from this file.')
        }

        setFileName(file.name)
        setCharCount(text.length)
        setPreviewText(text.slice(0, 200))
        onTextExtracted(text)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to process file.')
      } finally {
        setIsProcessing(false)
      }
    },
    [onTextExtracted]
  )

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        processFile(acceptedFiles[0])
      }
    },
    [processFile]
  )

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: 'application/pdf, text/plain',
    maxSize: 10 * 1024 * 1024, // 10 MB
    multiple: false,
  })

  const hasRejections = fileRejections.length > 0
  const isSuccess = !!fileName && !isProcessing && !error

  return (
    <div className={className}>
      <div
        {...getRootProps()}
        className={[
          'relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-10 cursor-pointer select-none transition-all duration-200',
          isDragActive
            ? 'border-teal-accent bg-teal-light scale-[1.02]'
            : isSuccess
            ? 'border-green-400 bg-green-50'
            : error || hasRejections
            ? 'border-red-400 bg-red-50'
            : 'border-teal-accent bg-white hover:bg-teal-light/40',
        ].join(' ')}
      >
        <input {...getInputProps()} />

        {isProcessing ? (
          <>
            {/* Spinner */}
            <svg
              className="h-10 w-10 animate-spin text-teal-mid"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8H4z"
              />
            </svg>
            <p className="text-sm font-medium text-teal-mid">Extracting text…</p>
          </>
        ) : isSuccess ? (
          <>
            {/* Success checkmark */}
            <svg
              className="h-10 w-10 text-green-500"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-sm font-semibold text-green-700 text-center">
              {fileName}
            </p>
            <p className="text-xs text-green-600">{charCount.toLocaleString()} characters extracted</p>
            <p className="text-xs text-gray-400">Click or drop a new file to replace</p>
          </>
        ) : (
          <>
            {/* Upload cloud icon */}
            <svg
              className="h-12 w-12 text-teal-mid"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 16.5V9.75m0 0l-3 3m3-3l3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.338-2.32A4.5 4.5 0 0117.25 19.5H6.75z"
              />
            </svg>
            <div className="text-center">
              <p className="text-sm font-semibold text-teal-dark">
                {isDragActive ? 'Drop your CV here' : 'Drop your CV here or click to browse'}
              </p>
              <p className="mt-1 text-xs text-gray-400">PDF or TXT · Max 10 MB</p>
            </div>
          </>
        )}

        {(error || hasRejections) && (
          <p className="mt-1 text-xs font-medium text-red-600 text-center">
            {error ??
              (hasRejections
                ? 'Invalid file. Please upload a PDF or TXT under 10 MB.'
                : null)}
          </p>
        )}
      </div>

      {/* Text preview */}
      {isSuccess && previewText && (
        <div className="mt-3 rounded-lg bg-gray-50 border border-gray-200 p-3 max-h-24 overflow-y-auto">
          <p className="text-xs text-gray-500 font-medium mb-1">Preview</p>
          <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap break-words">
            {previewText}
            {charCount > 200 && (
              <span className="text-gray-400"> …({charCount - 200} more characters)</span>
            )}
          </p>
        </div>
      )}
    </div>
  )
}
