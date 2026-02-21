import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import './App.css'
import backgroundImage from './assets/background.png'
import { useAuth } from './contexts/AuthContext'
import { authService } from './services/auth'
import { studentService } from './services/students'
import { assignmentService } from './services/assignments'
import { adminService, adminPendingUploadsService } from './services/admin'
import { communicationsService } from './services/communications'
import { facultyService } from './services/faculty'
import { filesService } from './services/files'
import { apiClient } from './services/api'
import { validateFile, FileUploadError } from './utils/fileUpload'

type RoutePath =
  | '/'
  | '/student_login'
  | '/student_register'
  | '/faculty_login'
  | '/admin_login'
  | '/admin_dashboard'
  | '/admin_faculty_accounts'
  | '/admin_assign_subjects'
  | '/admin_student_accounts'
  | '/admin_circulars'
  | '/admin_enroll_students'
  | '/admin_review_uploads'
  | '/admin_student_details'
  | '/admin_faculty_details'
  | '/admin_departments'
  | '/admin_settings'
  | '/forgot_password'
  | '/reset_password'
  | '/faculty_dashboard'
  | '/faculty_verification'
  | '/faculty_textbook_upload'
  | '/faculty_create_assignment'
  | '/faculty_assignment_submissions'
  | '/faculty_grade_submission'
  | '/student_dashboard'
  | '/repository'
  | '/assignment_review'
  | '/assignment_result'
  | '/unofficial_notes'

type UploadStatus = 'verified' | 'pending' | 'rejected'

type UploadedNote = {
  id: string
  title: string
  uploadedOn: string
  fileInfo: string
  status: UploadStatus
  canDownload: boolean
  downloadUrl?: string
  fileName?: string
}

const SUPPORTED_UPLOAD_MIME_TYPES = [
  'application/pdf',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
] as const

const SUPPORTED_UPLOAD_ACCEPT = '.pdf,.ppt,.pptx,.doc,.docx,.jpg,.jpeg,.png'
const SUPPORTED_UPLOAD_LABEL = 'PDF, PPT/PPTX, DOC/DOCX, JPG/PNG'
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

function enforceSupportedUploadFile(file: File, maxSizeInBytes: number): void {
  validateFile(file, {
    maxSize: maxSizeInBytes,
    allowedTypes: [...SUPPORTED_UPLOAD_MIME_TYPES],
  })
}

type DepartmentNotice = {
  id: string
  title: string
  content: string
  createdAt: string
  author: string
  authorRole: 'admin' | 'faculty'
  urgent: boolean
}

type AcademicEventType = 'assignment' | 'test' | 'holiday' | 'event'

type AcademicEvent = {
  id: string
  title: string
  date: string
  type: AcademicEventType
  details: string
  createdBy: string
  createdByRole: 'faculty' | 'admin'
  targetAudience: 'students' | 'faculty' | 'both'
}

function noticeDtoToNotice(d: { id: string; title: string; content: string; created_at: string; author_name: string; created_by_role: 'admin' | 'faculty'; urgent: boolean }): DepartmentNotice {
  return {
    id: d.id,
    title: d.title,
    content: d.content,
    createdAt: d.created_at,
    author: d.author_name,
    authorRole: d.created_by_role,
    urgent: d.urgent,
  }
}

function eventDtoToEvent(d: { id: string; title: string; event_date: string; event_type: AcademicEventType; details: string; created_by_role: 'admin' | 'faculty'; target_audience: 'students' | 'faculty' | 'both'; created_by_name?: string }): AcademicEvent {
  return {
    id: d.id,
    title: d.title,
    date: d.event_date,
    type: d.event_type,
    details: d.details,
    createdBy: d.created_by_name ?? (d.created_by_role === 'admin' ? 'Admin' : 'Faculty'),
    createdByRole: d.created_by_role,
    targetAudience: d.target_audience,
  }
}

type PdfPreviewLine = {
  text: string
  isHeading: boolean
}

type PdfPreviewPage = {
  lines: PdfPreviewLine[]
}

type DictionaryPopupState = {
  open: boolean
  loading: boolean
  word: string
  meaning: string
  error: string | null
  top: number
  left: number
}

const defaultDepartmentNotices: DepartmentNotice[] = [
  {
    id: 'notice-1',
    title: 'Mid-Sem Exam Schedule Published',
    content: 'Exam timetable for all 4th and 6th semester students is now available in the portal.',
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    author: 'Admin Office',
    authorRole: 'admin',
    urgent: true,
  },
  {
    id: 'notice-2',
    title: 'Library Access Extended',
    content: 'Department library will remain open until 8:00 PM during project submission week.',
    createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    author: 'Library Coordinator',
    authorRole: 'admin',
    urgent: false,
  },
]

const academicHolidaySeeds = [
  { month: 0, day: 1, title: "New Year's Day", details: 'National holiday.' },
  { month: 0, day: 26, title: 'Republic Day', details: 'National holiday.' },
  { month: 7, day: 15, title: 'Independence Day', details: 'National holiday.' },
  { month: 9, day: 2, title: 'Gandhi Jayanti', details: 'National holiday.' },
  { month: 11, day: 25, title: 'Christmas Day', details: 'National holiday.' },
]

function getAcademicHolidays(year: number): AcademicEvent[] {
  return academicHolidaySeeds.map((holiday, index) => ({
    id: `event-holiday-${year}-${index + 1}`,
    title: holiday.title,
    date: new Date(year, holiday.month, holiday.day).toISOString(),
    type: 'holiday' as const,
    details: holiday.details,
    createdBy: 'Admin Office',
    createdByRole: 'admin' as const,
    targetAudience: 'both' as const,
  }))
}

function mergeCalendarEventsWithDefaults(events: AcademicEvent[]): AcademicEvent[] {
  const merged = [...events]
  const existingKeys = new Set(
    events.map((event) => `${event.type}|${event.title.toLowerCase()}|${new Date(event.date).toDateString()}`),
  )
  for (const event of defaultAcademicEvents) {
    const key = `${event.type}|${event.title.toLowerCase()}|${new Date(event.date).toDateString()}`
    if (!existingKeys.has(key)) {
      merged.push(event)
    }
  }
  return merged
}

function isEventVisibleToRole(event: AcademicEvent, role: 'student' | 'faculty'): boolean {
  if (event.targetAudience === 'both') {
    return true
  }
  return role === 'student' ? event.targetAudience === 'students' : event.targetAudience === 'faculty'
}

const defaultAcademicEvents: AcademicEvent[] = [
  {
    id: 'event-1',
    title: 'Class Test: Unit 3',
    date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
    type: 'test',
    details: 'Syllabus: Memory management and process synchronization.',
    createdBy: 'Faculty Office',
    createdByRole: 'faculty',
    targetAudience: 'both',
  },
  {
    id: 'event-2',
    title: 'Lab Evaluation',
    date: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString(),
    type: 'assignment',
    details: 'Carry records and completed lab sheets.',
    createdBy: 'Faculty Office',
    createdByRole: 'faculty',
    targetAudience: 'both',
  },
  ...getAcademicHolidays(new Date().getFullYear()),
]

function isNoticeNew(createdAt: string): boolean {
  const createdMs = new Date(createdAt).getTime()
  if (Number.isNaN(createdMs)) {
    return false
  }
  return Date.now() - createdMs <= 24 * 60 * 60 * 1000
}

const roleHomeRoute: Record<'student' | 'faculty' | 'admin', RoutePath> = {
  student: '/student_dashboard',
  faculty: '/faculty_dashboard',
  admin: '/admin_dashboard',
}

const roleLoginRoute: Record<'student' | 'faculty' | 'admin', RoutePath> = {
  student: '/student_login',
  faculty: '/faculty_login',
  admin: '/admin_login',
}

type HeaderNavItem = {
  label: string
  path: RoutePath
}

const STUDENT_NAV_ITEMS: HeaderNavItem[] = [
  { label: 'Dashboard', path: '/student_dashboard' },
  { label: 'Repository', path: '/repository' },
  { label: 'Unofficial Notes', path: '/unofficial_notes' },
]

const ADMIN_NAV_ITEMS: HeaderNavItem[] = [
  { label: 'Dashboard', path: '/admin_dashboard' },
  { label: 'Faculty Accounts', path: '/admin_faculty_accounts' },
  { label: 'Assign Subjects', path: '/admin_assign_subjects' },
  { label: 'Student Accounts', path: '/admin_student_accounts' },
  { label: 'Circulars', path: '/admin_circulars' },
  { label: 'Departments', path: '/admin_departments' },
]

const ADMIN_TITLE_BY_PATH: Partial<Record<RoutePath, string>> = {
  '/admin_dashboard': 'Admin Dashboard',
  '/admin_faculty_accounts': 'Faculty Accounts',
  '/admin_assign_subjects': 'Assign Subjects',
  '/admin_student_accounts': 'Student Accounts',
  '/admin_circulars': 'Circulars',
  '/admin_enroll_students': 'Enroll Students',
  '/admin_review_uploads': 'Review Uploads',
  '/admin_student_details': 'Student Details',
  '/admin_faculty_details': 'Faculty Details',
  '/admin_departments': 'Departments',
  '/admin_settings': 'System Settings',
}

function BrandIdentity({ small = false }: { small?: boolean }) {
  return (
    <div className={`brand-identity ${small ? 'small' : ''}`} aria-label="StudySync">
      <div className="brand-logo-shell">
        <span className="material-symbols-outlined icon-school">school</span>
      </div>
      <span>StudySync</span>
    </div>
  )
}

function CommonDashboardHeader({
  title,
  subtitle,
  navItems,
  currentPath,
  onNavigate,
  onLogout,
  containerClassName,
}: {
  title: string
  subtitle: string
  navItems: HeaderNavItem[]
  currentPath: RoutePath
  onNavigate: (path: RoutePath) => void
  onLogout: () => void
  containerClassName: string
}) {
  const { user } = useAuth()
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const profileMenuRef = useRef<HTMLDivElement>(null)
  const displayName = user?.name || user?.fullName || 'User'

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!profileMenuRef.current) {
        return
      }
      if (!profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [])

  return (
    <>
      <header className="dashboard-header common-dashboard-header">
        <div className={`${containerClassName} common-dashboard-top-row`}>
          <BrandIdentity />

          <div className="dashboard-user common-profile-wrap" ref={profileMenuRef}>
            <div className="dashboard-user-info">
              <p>{displayName}</p>
              <p>{subtitle}</p>
            </div>
            <button
              type="button"
              className="common-profile-trigger"
              onClick={() => setIsProfileMenuOpen((current) => !current)}
              aria-expanded={isProfileMenuOpen}
              aria-haspopup="menu"
              aria-label="Open profile menu"
            >
              <div className="dashboard-avatar">
                <span className="material-symbols-outlined">account_circle</span>
              </div>
            </button>
            <div className={`common-profile-menu ${isProfileMenuOpen ? 'open' : ''}`} role="menu">
              <button type="button" onClick={onLogout} className="common-dashboard-logout" role="menuitem">
                Logout
              </button>
            </div>
          </div>
        </div>
        <div className="dashboard-header-accent" />
      </header>
      <div className={`${containerClassName} common-dashboard-controls`}>
        <h1>{title}</h1>
        <nav className="common-dashboard-nav" aria-label="Dashboard sections">
          {navItems.map((item) => (
            <button
              key={item.path}
              type="button"
              className={currentPath === item.path ? 'active' : ''}
              onClick={() => {
                setIsProfileMenuOpen(false)
                onNavigate(item.path)
              }}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </div>
    </>
  )
}

function CommonDashboardFooter({ containerClassName }: { containerClassName: string }) {
  return (
    <footer className={`dashboard-footer ${containerClassName}`}>
      <div>
        <p>©  StudySync, Made by Kairos with ❤️</p>
      </div>
    </footer>
  )
}

function PdfPreviewModal({
  isOpen,
  title,
  previewUrl,
  downloadUrl,
  onClose,
}: {
  isOpen: boolean
  title: string
  previewUrl?: string | null
  downloadUrl?: string | null
  onClose: () => void
}) {
  const [pdfPages, setPdfPages] = useState<PdfPreviewPage[]>([])
  const [isPdfLoading, setIsPdfLoading] = useState(false)
  const [pdfError, setPdfError] = useState<string | null>(null)

  const sourceUrl = downloadUrl || previewUrl || null
  const readableUrl = getAiReadableFileUrl(sourceUrl)
  const isPdfFile = Boolean(sourceUrl && readableUrl && isPdfSource(title, sourceUrl))
  const extractedPreviewText = pdfPages
    .flatMap((page) => page.lines.map((line) => line.text))
    .filter(Boolean)
    .join('\n')

  useEffect(() => {
    if (!isOpen || !isPdfFile || !readableUrl) {
      const tid = setTimeout(() => {
        setPdfPages([])
        setIsPdfLoading(false)
        setPdfError(null)
      }, 0)
      return () => clearTimeout(tid)
    }

    let active = true
    const authToken = localStorage.getItem('auth_token')
    const headers = authToken ? { Authorization: `Bearer ${authToken}` } : undefined

    const tid = setTimeout(() => {
      setIsPdfLoading(true)
      setPdfError(null)
      setPdfPages([])
    }, 0)

    extractPdfPagesTextFromUrl(readableUrl, headers, 40)
      .then((pages) => {
        if (!active) return
        const nonEmptyPages = pages.filter((page) => page.lines.some((line) => line.text.trim().length > 0))
        setPdfPages(nonEmptyPages)
        if (nonEmptyPages.length === 0) {
          setPdfError('No selectable text found in this PDF.')
        }
      })
      .catch(() => {
        if (!active) return
        setPdfError('Could not render PDF text preview.')
      })
      .finally(() => {
        if (!active) return
        setIsPdfLoading(false)
      })

    return () => {
      active = false
      clearTimeout(tid)
    }
  }, [isOpen, isPdfFile, readableUrl])

  if (!isOpen) {
    return null
  }

  const handleDownload = () => {
    if (!downloadUrl || downloadUrl === '#') {
      return
    }
    window.open(downloadUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="pdf-preview-overlay" role="dialog" aria-modal="true" aria-label="PDF preview">
      <div className="pdf-preview-modal">
        <header className="pdf-preview-head">
          <div>
            <span className="material-symbols-outlined">description</span>
            <h3>{title}</h3>
          </div>
          <div>
            <button type="button" className="pdf-preview-download" onClick={handleDownload} disabled={!downloadUrl || downloadUrl === '#'}>
              <span className="material-symbols-outlined">download</span>
              Download
            </button>
            <button type="button" className="pdf-preview-close" onClick={onClose} aria-label="Close preview">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </header>
        <div className="pdf-preview-body">
          {isPdfFile ? (
            isPdfLoading ? (
              <div className="pdf-preview-page pdf-preview-empty">
                <p>Loading PDF text preview...</p>
                <h4>{title}</h4>
                <p>Preparing selectable text for dictionary and AI assistance.</p>
              </div>
            ) : pdfError ? (
              <div className="pdf-preview-page pdf-preview-empty">
                <p>Preview unavailable</p>
                <h4>{title}</h4>
                <p>{pdfError} Use Download to open original file.</p>
              </div>
            ) : (
              <div className="pdf-preview-text-pages">
                {pdfPages.map((page, index) => (
                  <article key={`page-${index + 1}`} className="pdf-preview-text-page">
                    <h4>Page {index + 1}</h4>
                    <div className="pdf-preview-text-content">
                      {page.lines.map((line, lineIndex) => (
                        <p key={`page-${index + 1}-line-${lineIndex}`} className={line.isHeading ? 'heading' : 'body'}>
                          {line.text}
                        </p>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            )
          ) : previewUrl ? (
            <div className="pdf-preview-page embed">
              <iframe src={previewUrl} title={title} className="pdf-preview-embed" allow="autoplay" />
            </div>
          ) : (
            <div className="pdf-preview-page pdf-preview-empty">
              <p>Preview unavailable</p>
              <h4>{title}</h4>
              <p>This file cannot be previewed. Use Download to open it.</p>
            </div>
          )}
        </div>
      </div>
      <StudyAssistantOverlay
        visible
        sourceDocument={{
          title,
          fileUrl: downloadUrl || previewUrl || null,
          extractedText: extractedPreviewText || undefined,
        }}
      />
    </div>
  )
}

type AssistantMode = 'summarize' | 'explain' | 'quiz'

type AssistantMessage = {
  id: string
  role: 'assistant' | 'user'
  text: string
}

type AssistantSourceDocument = {
  title: string
  fileUrl?: string | null
  extractedText?: string
}

function StudyAssistantOverlay({
  visible,
  sourceDocument,
}: {
  visible: boolean
  sourceDocument?: AssistantSourceDocument | null
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [isPreviewVisible, setIsPreviewVisible] = useState(true)
  const [mode, setMode] = useState<AssistantMode>('summarize')
  const [input, setInput] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isTtsLoading, setIsTtsLoading] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [attachedDocument, setAttachedDocument] = useState<AssistantSourceDocument | null>(null)
  const lastAutoAttachKeyRef = useRef<string | null>(null)
  const extractedTextCacheRef = useRef<Record<string, string>>({})
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [messages, setMessages] = useState<AssistantMessage[]>([
    {
      id: 'assistant-welcome',
      role: 'assistant',
      text: 'Hi, I can summarize notes, explain concepts, or generate quick quizzes from your material.',
    },
  ])

  useEffect(() => {
    if (visible) {
      return
    }
    setIsOpen(false)
    setIsPreviewVisible(false)
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      audioRef.current = null
      setIsSpeaking(false)
    }
  }, [visible])

  useEffect(() => () => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      audioRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!sourceDocument) {
      setAttachedDocument(null)
      lastAutoAttachKeyRef.current = null
      return
    }

    const key = `${sourceDocument.title}|${sourceDocument.fileUrl || ''}|${sourceDocument.extractedText ? 'with-text' : 'no-text'}`
    setAttachedDocument(sourceDocument)
    if (lastAutoAttachKeyRef.current !== key) {
      lastAutoAttachKeyRef.current = key
      setMessages((current) => [
        ...current,
        {
          id: `assistant-auto-attach-${Date.now()}`,
          role: 'assistant',
          text: `Auto-attached "${sourceDocument.title}" for this chat.`,
        },
      ])
    }
  }, [sourceDocument?.title, sourceDocument?.fileUrl, sourceDocument?.extractedText])

  const buildModeInstruction = (selectedMode: AssistantMode): string => {
    switch (selectedMode) {
      case 'summarize':
        return 'Summarize in concise bullet points with key definitions and exam-focused takeaways.'
      case 'explain':
        return 'Explain clearly in simple language with one short example.'
      case 'quiz':
        return 'Create a short 5-question quiz with answers.'
      default:
        return 'Respond helpfully and clearly.'
    }
  }

  const loadDocumentTextForAi = async (document: AssistantSourceDocument): Promise<string> => {
    if (document.extractedText?.trim()) {
      return document.extractedText.trim().slice(0, 20000)
    }

    const sourceUrl = document.fileUrl
    if (!sourceUrl) {
      return ''
    }

    const cacheKey = `${document.title}|${sourceUrl}`
    if (extractedTextCacheRef.current[cacheKey]) {
      return extractedTextCacheRef.current[cacheKey]
    }

    const readableUrl = getAiReadableFileUrl(sourceUrl)
    if (!readableUrl) {
      return ''
    }

    try {
      let extractedText = ''
      const authToken = localStorage.getItem('auth_token')
      const headers = authToken ? { Authorization: `Bearer ${authToken}` } : undefined
      if (isPdfSource(document.title, readableUrl)) {
        extractedText = await extractPdfTextFromUrl(readableUrl, headers)
      } else {
        const response = await fetch(readableUrl, { headers })
        if (response.ok) {
          extractedText = (await response.text()).trim()
        }
      }

      const normalized = extractedText.replace(/\s+/g, ' ').trim().slice(0, 14000)
      extractedTextCacheRef.current[cacheKey] = normalized
      return normalized
    } catch {
      return ''
    }
  }

  const sendMessage = async () => {
    const trimmed = input.trim()
    if (!trimmed || isGenerating) {
      return
    }

    const contextPrefix = attachedDocument ? `[File: ${attachedDocument.title}] ` : ''

    const userMessage: AssistantMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: `${contextPrefix}${trimmed}`,
    }

    setMessages((current) => [...current, userMessage])
    setInput('')
    setIsGenerating(true)

    try {
      const puterClient = window.puter
      if (!puterClient?.ai?.chat) {
        throw new Error('Puter.js is not loaded in this page.')
      }

      const modeInstruction = buildModeInstruction(mode)
      const extractedDocumentText = attachedDocument ? await loadDocumentTextForAi(attachedDocument) : ''
      const docContext = attachedDocument
        ? extractedDocumentText
          ? `Attached document title: "${attachedDocument.title}". Extracted document content:\n${extractedDocumentText}`
          : `Attached document title: "${attachedDocument.title}". The file content could not be fetched (access denied or unsupported file). Ask user to paste key excerpts.`
        : 'No document is attached. Use only the provided user text.'

      const response = await puterClient.ai.chat(
        [
          {
            role: 'system',
            content:
              `You are a study assistant for uploaded notes and PDFs. ${modeInstruction} If user asks for document-specific details without content, ask for a pasted excerpt.`,
          },
          {
            role: 'user',
            content: `${docContext}\n\nUser request: ${trimmed}`,
          },
        ],
        { model: 'gpt-5-nano' },
      )

      const content =
        (typeof response === 'string' ? response : response?.message?.content)?.trim() ||
        'No response generated. Try again.'
      setMessages((current) => [
        ...current,
        {
          id: `assistant-${Date.now() + 1}`,
          role: 'assistant',
          text: content,
        },
      ])
    } catch (error) {
      const errorText = error instanceof Error ? error.message : 'Unknown error'
      setMessages((current) => [
        ...current,
        {
          id: `assistant-${Date.now() + 1}`,
          role: 'assistant',
          text: `Unable to reach AI right now. ${errorText}`,
        },
      ])
    } finally {
      setIsGenerating(false)
    }
  }

  const stopAudio = () => {
    if (!audioRef.current) {
      setIsSpeaking(false)
      return
    }
    audioRef.current.pause()
    audioRef.current.currentTime = 0
    audioRef.current = null
    setIsSpeaking(false)
  }

  const handleListenToNotes = async () => {
    if (isGenerating || isTtsLoading) {
      return
    }

    const puterClient = window.puter
    if (!puterClient?.ai?.chat || !puterClient?.ai?.txt2speech) {
      setMessages((current) => [
        ...current,
        {
          id: `assistant-${Date.now() + 1}`,
          role: 'assistant',
          text: 'Text-to-speech is unavailable. Check Puter.js loading and try again.',
        },
      ])
      return
    }

    setIsTtsLoading(true)

    try {
      const documentText = attachedDocument ? await loadDocumentTextForAi(attachedDocument) : ''
      const latestAssistantReply = [...messages].reverse().find((message) => message.role === 'assistant')?.text || ''
      const fallbackInput = input.trim()
      const candidateText = documentText || latestAssistantReply || fallbackInput

      if (!candidateText) {
        throw new Error('No text available to read. Ask a question or attach notes first.')
      }

      let speechScript = candidateText.slice(0, 4000)
      if (mode === 'summarize' && documentText) {
        try {
          const summaryResponse = await puterClient.ai.chat(
            [
              {
                role: 'system',
                content: 'Convert study notes into a short spoken summary under 160 words for text-to-speech.',
              },
              {
                role: 'user',
                content: documentText.slice(0, 12000),
              },
            ],
            { model: 'gpt-5-nano' },
          )
          const summaryText =
            (typeof summaryResponse === 'string' ? summaryResponse : summaryResponse?.message?.content)?.trim() || ''
          if (summaryText) {
            speechScript = summaryText.slice(0, 4000)
          }
        } catch {
          // Keep original text when summary generation fails.
        }
      }

      stopAudio()
      let audio: HTMLAudioElement | null = null
      const ttsAttempts: Array<() => Promise<string | HTMLAudioElement>> = [
        () => puterClient.ai.txt2speech(speechScript, { model: 'gpt-4o-mini-tts', voice: 'alloy' }),
        () => puterClient.ai.txt2speech({ model: 'gpt-4o-mini-tts', input: speechScript, voice: 'alloy' }),
        () => puterClient.ai.txt2speech(speechScript, { voice: 'alloy' }),
        () => puterClient.ai.txt2speech(speechScript),
      ]

      for (const attempt of ttsAttempts) {
        try {
          const speechResponse = await attempt()
          if (speechResponse instanceof HTMLAudioElement) {
            audio = speechResponse
            break
          }
          if (typeof speechResponse === 'string' && speechResponse.trim()) {
            audio = new Audio(speechResponse)
            break
          }
        } catch {
          continue
        }
      }

      if (!audio) {
        if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(speechScript)
          utterance.rate = 1
          utterance.pitch = 1
          window.speechSynthesis.cancel()
          window.speechSynthesis.speak(utterance)
          setIsSpeaking(true)
          utterance.onend = () => setIsSpeaking(false)
          return
        }
        throw new Error('No playable audio returned by TTS API.')
      }

      audioRef.current = audio
      audio.onended = () => setIsSpeaking(false)
      audio.onerror = () => setIsSpeaking(false)
      await audio.play()
      setIsSpeaking(true)
    } catch (error) {
      const errorText = error instanceof Error ? error.message : 'Unknown TTS error'
      setMessages((current) => [
        ...current,
        {
          id: `assistant-${Date.now() + 1}`,
          role: 'assistant',
          text: `Unable to play text-to-speech. ${errorText}`,
        },
      ])
      setIsSpeaking(false)
    } finally {
      setIsTtsLoading(false)
    }
  }

  if (!visible) {
    return null
  }

  return (
    <div className="assistant-overlay" aria-label="Study assistant">
      {!isOpen && isPreviewVisible ? (
        <button
          type="button"
          className="assistant-preview"
          onClick={() => setIsOpen(true)}
          aria-label="Open study assistant preview"
        >
          <div className="assistant-preview-top">
            <span className="material-symbols-outlined">auto_awesome</span>
            <strong>Study Assistant</strong>
            <span
              className="material-symbols-outlined assistant-preview-close"
              onClick={(event) => {
                event.stopPropagation()
                setIsPreviewVisible(false)
              }}
            >
              close
            </span>
          </div>
          <p>Need a quick notes summary?</p>
          <small>Tap to open AI chat</small>
        </button>
      ) : null}

      <button
        type="button"
        className={`assistant-fab ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen((current) => !current)}
        aria-label={isOpen ? 'Collapse assistant' : 'Open assistant'}
      >
        <span className="material-symbols-outlined">{isOpen ? 'close' : 'chat'}</span>
      </button>

      {isOpen ? (
        <section className="assistant-panel" role="dialog" aria-modal="false" aria-label="AI study assistant">
          <header className="assistant-panel-head">
            <div>
              <h3>AI Study Assistant</h3>
              <p>Summaries, explanations, and quiz prep</p>
            </div>
          </header>

          <div className="assistant-mode-row" role="tablist" aria-label="Assistant mode">
            <button
              type="button"
              className={mode === 'summarize' ? 'active' : ''}
              onClick={() => setMode('summarize')}
            >
              Summarize
            </button>
            <button
              type="button"
              className={mode === 'explain' ? 'active' : ''}
              onClick={() => setMode('explain')}
            >
              Explain
            </button>
            <button
              type="button"
              className={mode === 'quiz' ? 'active' : ''}
              onClick={() => setMode('quiz')}
            >
              Quiz Me
            </button>
          </div>

          <div className="assistant-tts-row" aria-label="Text to speech controls">
            <button
              type="button"
              onClick={handleListenToNotes}
              disabled={isGenerating || isTtsLoading || isSpeaking}
            >
              <span className="material-symbols-outlined">volume_up</span>
              {isTtsLoading ? 'Preparing...' : isSpeaking ? 'Playing' : 'Listen to Notes'}
            </button>
            <button
              type="button"
              className="secondary"
              onClick={stopAudio}
              disabled={!isSpeaking && !isTtsLoading}
            >
              <span className="material-symbols-outlined">stop</span>
              Stop
            </button>
          </div>

          {sourceDocument ? (
            <div className="assistant-source-row">
              <div>
                <span className="material-symbols-outlined">description</span>
                <p>{sourceDocument.title}</p>
              </div>
              <span className="assistant-source-badge">Auto-attached</span>
            </div>
          ) : null}

          <div className="assistant-messages">
            {messages.map((message) => (
              <article key={message.id} className={`assistant-msg ${message.role}`}>
                <p>{message.text}</p>
              </article>
            ))}
          </div>

          <div className="assistant-input-wrap">
            <textarea
              rows={2}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              disabled={isGenerating}
              placeholder={
                attachedDocument
                  ? `Ask about ${attachedDocument.title}...`
                  : 'Paste notes or ask a question...'
              }
            />
            <button type="button" onClick={sendMessage} disabled={!input.trim() || isGenerating}>
              <span className="material-symbols-outlined">north_east</span>
            </button>
          </div>
        </section>
      ) : null}
    </div>
  )
}

function AcademicCalendarWidget({ events }: { events: Array<{ id: string; title: string; date: string; type: AcademicEventType; details: string }> }) {
  const [monthCursor, setMonthCursor] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })
  const [selectedDate, setSelectedDate] = useState(() => new Date())
  const eventsScrollerRef = useRef<HTMLDivElement>(null)

  const year = monthCursor.getFullYear()
  const month = monthCursor.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDayOffset = new Date(year, month, 1).getDay()
  const monthLabel = monthCursor.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })

  const days = Array.from({ length: daysInMonth }, (_, index) => index + 1)

  const toDateKey = (date: Date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

  const selectedKey = toDateKey(selectedDate)
  const eventsByDay = events.reduce<Record<string, Array<{ id: string; title: string; type: AcademicEventType; details: string }>>>(
    (acc, event) => {
      const eventDate = new Date(event.date)
      if (Number.isNaN(eventDate.getTime())) return acc
      const key = toDateKey(eventDate)
      if (!acc[key]) acc[key] = []
      acc[key].push({ id: event.id, title: event.title, type: event.type, details: event.details })
      return acc
    },
    {},
  )

  const selectedEvents = eventsByDay[selectedKey] ?? []

  useEffect(() => {
    const scroller = eventsScrollerRef.current
    if (!scroller) {
      return
    }

    scroller.scrollTop = 0

    if (selectedEvents.length <= 1) {
      return
    }

    const interval = window.setInterval(() => {
      const maxScroll = scroller.scrollHeight - scroller.clientHeight
      if (maxScroll <= 0) {
        return
      }

      const next = scroller.scrollTop + 1
      if (next >= maxScroll) {
        scroller.scrollTop = 0
        return
      }
      scroller.scrollTop = next
    }, 45)

    return () => window.clearInterval(interval)
  }, [selectedEvents])

  return (
    <section className="dashboard-card calendar-widget-card" aria-label="Academic calendar widget">
      <div className="dashboard-section-title">
        <span className="material-symbols-outlined">calendar_month</span>
        <h2>Academic Calendar</h2>
      </div>

      <div className="calendar-widget-head">
        <button
          type="button"
          onClick={() => setMonthCursor((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))}
          aria-label="Previous month"
        >
          <span className="material-symbols-outlined">chevron_left</span>
        </button>
        <strong>{monthLabel}</strong>
        <button
          type="button"
          onClick={() => setMonthCursor((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))}
          aria-label="Next month"
        >
          <span className="material-symbols-outlined">chevron_right</span>
        </button>
      </div>

      <div className="calendar-widget-body">
        <div className="calendar-grid-wrap">
          <div className="calendar-grid" role="grid" aria-label="Month view">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((weekday, index) => (
              <span key={`weekday-${index}-${weekday}`} className="calendar-weekday">
                {weekday}
              </span>
            ))}

            {Array.from({ length: firstDayOffset }, (_, idx) => (
              <span key={`empty-${idx}`} className="calendar-day-empty" />
            ))}

            {days.map((day) => {
              const date = new Date(year, month, day)
              const key = toDateKey(date)
              const dayEvents = eventsByDay[key] ?? []
              const hasEvents = dayEvents.length > 0
              const hasAssignment = dayEvents.some((event) => event.type === 'assignment')
              const hasTest = dayEvents.some((event) => event.type === 'test')
              const hasHoliday = dayEvents.some((event) => event.type === 'holiday')
              const isSelected = key === selectedKey
              const isToday = key === toDateKey(new Date())

              return (
                <button
                  key={day}
                  type="button"
                  className={`calendar-day ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''} ${hasAssignment ? 'has-assignment' : ''} ${hasTest ? 'has-test' : ''} ${hasHoliday ? 'has-holiday' : ''}`}
                  onClick={() => setSelectedDate(date)}
                  aria-label={`${monthLabel} ${day}`}
                >
                  <span>{day}</span>
                  {hasEvents ? <i /> : null}
                </button>
              )
            })}
          </div>
        </div>

        <div className="calendar-events" ref={eventsScrollerRef}>
          <h3>
            Events on{' '}
            {selectedDate.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
          </h3>
          {selectedEvents.length === 0 ? <p>No events scheduled.</p> : null}
          {selectedEvents.map((event) => (
            <article key={event.id} className={`calendar-event-item ${event.type}`}>
              <div>
                <strong>{event.title}</strong>
                <span>{event.type}</span>
              </div>
              <p>{event.details}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

function getRequiredRole(route: RoutePath): 'student' | 'faculty' | 'admin' | null {
  if (
    route === '/student_dashboard' ||
    route === '/repository' ||
    route === '/assignment_review' ||
    route === '/assignment_result' ||
    route === '/unofficial_notes'
  ) {
    return 'student'
  }

  if (
    route === '/faculty_dashboard' ||
    route === '/faculty_verification' ||
    route === '/faculty_textbook_upload' ||
    route === '/faculty_create_assignment' ||
    route === '/faculty_assignment_submissions' ||
    route === '/faculty_grade_submission'
  ) {
    return 'faculty'
  }

  if (
    route === '/admin_dashboard' ||
    route === '/admin_faculty_accounts' ||
    route === '/admin_assign_subjects' ||
    route === '/admin_student_accounts' ||
    route === '/admin_circulars' ||
    route === '/admin_enroll_students' ||
    route === '/admin_review_uploads' ||
    route === '/admin_student_details' ||
    route === '/admin_faculty_details' ||
    route === '/admin_departments' ||
    route === '/admin_settings'
  ) {
    return 'admin'
  }

  return null
}

function formatFileSize(sizeInBytes: number): string {
  if (sizeInBytes < 1024 * 1024) {
    return `${(sizeInBytes / 1024).toFixed(1)} KB`
  }
  return `${(sizeInBytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatUploadDate(date: Date): string {
  return `Uploaded on ${date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })}`
}

function getDriveFileId(fileUrl: string): string | null {
  const byPath = fileUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/)
  if (byPath?.[1]) {
    return byPath[1]
  }
  const byQuery = fileUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/)
  return byQuery?.[1] || null
}

function getPreviewUrl(fileUrl?: string): string | null {
  if (!fileUrl || fileUrl === '#') {
    return null
  }

  const driveFileId = getDriveFileId(fileUrl)
  if (driveFileId) {
    return `https://drive.google.com/file/d/${driveFileId}/preview`
  }

  return fileUrl
}

function getAiReadableFileUrl(fileUrl?: string | null): string | null {
  if (!fileUrl || fileUrl === '#') {
    return null
  }

  const driveFileId = getDriveFileId(fileUrl)
  if (driveFileId) {
    return `${API_BASE_URL}/files/${driveFileId}/content`
  }

  return fileUrl
}

function isPdfSource(title: string, fileUrl: string): boolean {
  const loweredTitle = title.toLowerCase()
  const loweredUrl = fileUrl.toLowerCase()
  return loweredTitle.endsWith('.pdf') || loweredUrl.includes('.pdf') || loweredUrl.includes('application/pdf')
}

async function extractPdfPagesTextFromUrl(
  fileUrl: string,
  headers?: Record<string, string>,
  maxPages = 20,
): Promise<PdfPreviewPage[]> {
  const [pdfjsLib, workerSrc] = await Promise.all([
    import('pdfjs-dist'),
    import('pdfjs-dist/build/pdf.worker.min.mjs?url'),
  ])
  pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc.default

  const loadingTask = pdfjsLib.getDocument({ url: fileUrl, httpHeaders: headers })
  const pdf = await loadingTask.promise

  const pageLimit = Math.min(pdf.numPages, maxPages)
  const pageTexts: PdfPreviewPage[] = []

  for (let pageNumber = 1; pageNumber <= pageLimit; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber)
    const textContent = await page.getTextContent()
    type RowItem = { x: number; width: number; text: string; fontSize: number; fontName: string }
    const rows = new Map<number, RowItem[]>()
    const rowKeys: number[] = []

    for (const item of textContent.items) {
      if (!('str' in item) || !Array.isArray(item.transform)) {
        continue
      }
      const text = String(item.str ?? '').replace(/\s+/g, ' ').trim()
      if (!text) {
        continue
      }

      const x = Number(item.transform[4] ?? 0)
      const y = Number(item.transform[5] ?? 0)
      const rowKey = Math.round(y)
      const fontSize = Number((item as { height?: number }).height ?? Math.abs(Number(item.transform[3] ?? 10)))
      const width = Number((item as { width?: number }).width ?? text.length * (fontSize * 0.5))
      const fontName = String((item as { fontName?: string }).fontName ?? '')

      if (!rows.has(rowKey)) {
        rows.set(rowKey, [])
        rowKeys.push(rowKey)
      }
      rows.get(rowKey)?.push({ x, width, text, fontSize, fontName })
    }

    const sortedRows = rowKeys
      .sort((a, b) => b - a)
      .map((key) => {
        const tokens = (rows.get(key) || []).sort((a, b) => a.x - b.x)
        let lineText = ''
        let previousEndX: number | null = null
        let totalFontSize = 0
        let hasBoldToken = false

        for (const token of tokens) {
          const gap = previousEndX === null ? 0 : token.x - previousEndX
          const needsSpace = lineText.length > 0 && gap > Math.max(6, token.fontSize * 0.35)
          if (needsSpace && !lineText.endsWith(' ')) {
            lineText += ' '
          }
          lineText += token.text
          previousEndX = token.x + token.width
          totalFontSize += token.fontSize
          if (/bold|black|semi/i.test(token.fontName)) {
            hasBoldToken = true
          }
        }

        return {
          text: lineText.trim(),
          avgFontSize: tokens.length > 0 ? totalFontSize / tokens.length : 0,
          hasBoldToken,
        }
      })
      .filter((row) => row.text.length > 0)

    const fontSizes = sortedRows.map((row) => row.avgFontSize).sort((a, b) => a - b)
    const medianFontSize =
      fontSizes.length === 0
        ? 0
        : fontSizes[Math.floor(fontSizes.length / 2)]

    const lines: PdfPreviewLine[] = sortedRows.map((row) => {
      const wordCount = row.text.split(/\s+/).length
      const isLikelyHeading =
        wordCount <= 14 &&
        row.text.length <= 100 &&
        (row.avgFontSize >= medianFontSize * 1.2 || row.hasBoldToken)

      return {
        text: row.text,
        isHeading: isLikelyHeading,
      }
    })

    pageTexts.push({ lines })
  }

  return pageTexts
}

async function extractPdfTextFromUrl(
  fileUrl: string,
  headers?: Record<string, string>,
): Promise<string> {
  const pages = await extractPdfPagesTextFromUrl(fileUrl, headers, 20)
  return pages
    .flatMap((page) => page.lines.map((line) => line.text))
    .filter(Boolean)
    .join('\n')
}

function normalizePath(pathname: string): RoutePath {
  const isAdminHost = /^admin\./i.test(window.location.hostname)

  if (pathname === '/student_login' || pathname === '/login') {
    return '/student_login'
  }

  if (pathname === '/student_register' || pathname === '/register') {
    return '/student_register'
  }

  if (pathname === '/faculty_login') {
    return '/faculty_login'
  }

  if (pathname === '/admin_login') {
    return '/admin_login'
  }

  if (pathname === '/admin_dashboard') {
    return '/admin_dashboard'
  }

  if (pathname === '/admin_faculty_accounts') {
    return '/admin_faculty_accounts'
  }

  if (pathname === '/admin_assign_subjects') {
    return '/admin_assign_subjects'
  }

  if (pathname === '/admin_student_accounts') {
    return '/admin_student_accounts'
  }

  if (pathname === '/admin_circulars') {
    return '/admin_circulars'
  }

  if (pathname === '/admin_enroll_students') {
    return '/admin_enroll_students'
  }

  if (pathname === '/admin_review_uploads') {
    return '/admin_review_uploads'
  }

  if (pathname === '/admin_student_details') {
    return '/admin_student_details'
  }

  if (pathname === '/admin_faculty_details') {
    return '/admin_faculty_details'
  }
  if (pathname === '/admin_departments') {
    return '/admin_departments'
  }
  if (pathname === '/admin_settings') {
    return '/admin_settings'
  }

  if (pathname === '/forgot_password' || pathname === '/forgot-password') {
    return '/forgot_password'
  }

  if (pathname === '/reset_password' || pathname === '/reset-password') {
    return '/reset_password'
  }

  if (pathname === '/faculty_dashboard') {
    return '/faculty_dashboard'
  }

  if (pathname === '/faculty_verification') {
    return '/faculty_verification'
  }

  if (pathname === '/faculty_textbook_upload') {
    return '/faculty_textbook_upload'
  }

  if (pathname === '/faculty_create_assignment') {
    return '/faculty_create_assignment'
  }

  if (pathname === '/faculty_assignment_submissions') {
    return '/faculty_assignment_submissions'
  }

  if (pathname === '/faculty_grade_submission') {
    return '/faculty_grade_submission'
  }

  if (pathname === '/student_dashboard' || pathname === '/dashboard') {
    return '/student_dashboard'
  }

  if (pathname === '/search_results' || pathname === '/search') {
    return '/repository'
  }

  if (pathname === '/repository' || pathname === '/resources') {
    return '/repository'
  }

  if (pathname === '/assignment_review') {
    return '/assignment_review'
  }

  if (pathname === '/assignment_result' || pathname === '/results') {
    return '/assignment_result'
  }

  if (pathname === '/unofficial_notes') {
    return '/unofficial_notes'
  }

  if (isAdminHost) {
    return '/admin_login'
  }

  return '/'
}

function HomeScreen({
  onStudentLogin,
  onFacultyLogin,
  onAdminLogin,
}: {
  onStudentLogin: () => void
  onFacultyLogin: () => void
  onAdminLogin: () => void
}) {
  return (
    <>
      <main className="auth-card" aria-label="Department Academic Repository login">
        <div className="top-accent" />

        <section className="card-content">
          <div className="logo-shell" aria-hidden="true">
            <span className="material-symbols-outlined icon-school">school</span>
          </div>

          <h1 className="home-title">StudySync</h1>
          <p className="subtitle">Because Knowledge should never <br/> be hard to find!</p>

          <div className="action-group">
            <button type="button" className="login-button" onClick={onStudentLogin}>
              <span className="material-symbols-outlined">person</span>
              <span>Student Login</span>
            </button>

            <button type="button" className="login-button" onClick={onFacultyLogin}>
              <span className="material-symbols-outlined">badge</span>
              <span>Faculty Login</span>
            </button>

            <button type="button" className="login-button" onClick={onAdminLogin}>
              <span className="material-symbols-outlined">admin_panel_settings</span>
              <span>Admin Login</span>
            </button>
          </div>

          <div className="utility-links">
          </div>

        </section>
      </main>

      <footer className="page-footer">
        <p>©  StudySync, Made by Kairos with ❤️</p>
      </footer>
    </>
  )
}

function StudentLoginScreen({
  onBack,
  onRegister,
  onLogin,
  onForgotPassword,
}: {
  onBack: () => void
  onRegister: () => void
  onLogin: () => void
  onForgotPassword?: () => void
}) {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      await login(email, password, 'student')
      onLogin()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <main className="student-login-card" aria-label="Student login">
        <div className="student-card-content">
          <button type="button" className="back-link" onClick={onBack}>
            <span className="material-symbols-outlined">arrow_back</span>
            <span>Back</span>
          </button>

          <div className="student-logo-wrap">
            <div className="student-logo-shell">
              <span className="material-symbols-outlined icon-school">school</span>
            </div>
          </div>

          <div className="student-heading">
            <h1 className="student-title">Student Login</h1>
            <p>Access your academic dashboard</p>
          </div>

          <div className="student-accent" />

          <form className="student-form" onSubmit={handleSubmit}>
            {error && (
              <div style={{ padding: '0.75rem', background: '#fee2e2', color: '#991b1b', borderRadius: '0.5rem', marginBottom: '1rem', fontSize: '0.875rem' }}>
                {error}
              </div>
            )}
            <div className="field-group">
              <label htmlFor="email">Educational Email</label>
              <input
                id="email"
                type="email"
                placeholder="name@college.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <div className="field-group">
              <label htmlFor="password">Password</label>
              <div className="password-wrap">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="password-toggle"
                  aria-label="Toggle password visibility"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <span className="material-symbols-outlined">{showPassword ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
              <p className="field-help">Use your official college credentials</p>
            </div>

            <div className="student-actions">
              <button type="submit" className="student-primary-btn" disabled={isLoading}>
                {isLoading ? 'Logging in...' : 'Login'}
              </button>
            </div>
          </form>

          <div className="student-register-cta">
            <p>
              Dont have an account?{' '}
              <button type="button" className="inline-link" onClick={onRegister}>
                Register now
              </button>
            </p>
          </div>

          <div className="forgot-wrap">
            <button type="button" className="inline-link forgot-link-btn" onClick={onForgotPassword}>
              Forgot Password?
            </button>
          </div>
        </div>
      </main>

      <footer className="page-footer">
        <p>©  StudySync, Made by Kairos with ❤️</p>
      </footer>
    </>
  )
}

function StudentRegisterScreen({ onLogin }: { onLogin: () => void }) {
  const { register } = useAuth()
  const [formData, setFormData] = useState({
    fullName: '',
    usn: '',
    programme: '',
    semester: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    setError(null)
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    if (!formData.fullName || !formData.usn || !formData.programme || !formData.semester || !formData.email) {
      setError('Please fill in all fields')
      return
    }

    setIsLoading(true)

    try {
      await register({
        fullName: formData.fullName,
        usn: formData.usn,
        programme: formData.programme,
        semester: formData.semester,
        email: formData.email,
        password: formData.password,
      })
      onLogin()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <main className="student-register-card" aria-label="Student registration">
        <div className="register-header">
          <div className="register-logo-wrap">
            <div className="register-logo-shell">
              <span className="material-symbols-outlined">school</span>
            </div>
          </div>
          <h1 className="register-title">Student Registration</h1>
          <p>Create your academic portal account</p>
        </div>

        <div className="register-accent" />

        <form className="register-form" onSubmit={handleSubmit}>
          {error && (
            <div style={{ padding: '0.75rem', background: '#fee2e2', color: '#991b1b', borderRadius: '0.5rem', marginBottom: '1rem', fontSize: '0.875rem' }}>
              {error}
            </div>
          )}
          <div className="field-group">
            <label htmlFor="fullName">Full Name</label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              placeholder="Enter your full name"
              value={formData.fullName}
              onChange={handleChange}
              required
              disabled={isLoading}
            />
          </div>

          <div className="field-group">
            <label htmlFor="usn">USN (Unique Student Number)</label>
            <input
              id="usn"
              name="usn"
              type="text"
              placeholder="e.g. 1US20CS001"
              value={formData.usn}
              onChange={handleChange}
              required
              disabled={isLoading}
            />
          </div>

          <div className="register-grid-two">
            <div className="field-group">
              <label htmlFor="programme">Programme</label>
              <select
                id="programme"
                name="programme"
                value={formData.programme}
                onChange={handleChange}
                required
                disabled={isLoading}
              >
                <option value="">Select Programme</option>
                <option value="BCA (Honours)">BCA (Honours)</option>
                <option value="Computer Science & Engineering">B.E. / B.Tech</option>
                <option value="M.Tech">M.Tech</option>
                <option value="MCA">MCA</option>
                <option value="MBA">MBA</option>
              </select>
            </div>

            <div className="field-group">
              <label htmlFor="semester">Semester</label>
              <select
                id="semester"
                name="semester"
                value={formData.semester}
                onChange={handleChange}
                required
                disabled={isLoading}
              >
                <option value="">Select</option>
                <option value="1">1st Sem</option>
                <option value="2">2nd Sem</option>
                <option value="3">3rd Sem</option>
                <option value="4">4th Sem</option>
                <option value="5">5th Sem</option>
                <option value="6">6th Sem</option>
                <option value="7">7th Sem</option>
                <option value="8">8th Sem</option>
              </select>
            </div>
          </div>

          <div className="field-group">
            <label htmlFor="registerEmail">Educational Email</label>
            <input
              id="registerEmail"
              name="email"
              type="email"
              placeholder="student@university.edu"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={isLoading}
            />
            <p className="register-helper">Use your official college email</p>
          </div>

          <div className="register-grid-two register-password-grid">
            <div className="field-group">
              <label htmlFor="createPassword">Create Password</label>
              <div className="password-wrap">
                <input
                  id="createPassword"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <span className="material-symbols-outlined">{showPassword ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
            </div>

            <div className="field-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <div className="password-wrap">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <span className="material-symbols-outlined">{showConfirmPassword ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
            </div>
          </div>

          <div className="register-actions">
            <button type="submit" className="student-primary-btn" disabled={isLoading}>
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </button>
          </div>

          <div className="register-login-link">
            <p>
              Already have an account?{' '}
              <button type="button" className="inline-link" onClick={onLogin}>
                Login
              </button>
            </p>
          </div>
        </form>
      </main>
    </>
  )
}

function FacultyLoginScreen({ onLogin, onForgotPassword }: { onLogin: () => void; onForgotPassword?: () => void }) {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      await login(email, password, 'faculty')
      onLogin()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <main className="student-login-card" aria-label="Faculty login">
        <div className="student-card-content">
          <div className="student-logo-wrap">
            <div className="student-logo-shell">
              <span className="material-symbols-outlined icon-faculty">account_balance</span>
            </div>
          </div>

          <div className="student-heading">
            <h1 className="student-title">Faculty Login</h1>
            <p>Authorized Faculty Access Only</p>
          </div>

          <div className="student-accent faculty-accent" />

          <form className="student-form faculty-form" noValidate onSubmit={handleSubmit}>
            {error && (
              <div style={{ padding: '0.75rem', background: '#fee2e2', color: '#991b1b', borderRadius: '0.5rem', marginBottom: '1rem', fontSize: '0.875rem' }}>
                {error}
              </div>
            )}
            <div className="field-group">
              <label htmlFor="facultyEmail">Faculty Email</label>
              <input
                id="facultyEmail"
                name="facultyEmail"
                type="email"
                placeholder="faculty@college.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <div className="field-group">
              <label htmlFor="facultyPassword">Password</label>
              <div className="password-wrap">
                <input
                  id="facultyPassword"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="password-toggle"
                  aria-label="Toggle password visibility"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <span className="material-symbols-outlined">{showPassword ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
              <p className="field-help">Contact administrator if you do not have credentials.</p>
            </div>

            <div className="student-actions">
              <button type="submit" className="student-primary-btn" disabled={isLoading}>
                {isLoading ? 'Logging in...' : 'Login'}
              </button>
            </div>
          </form>

          <div className="forgot-wrap">
            {onForgotPassword ? (
              <button type="button" className="inline-link forgot-link-btn" onClick={onForgotPassword}>
                Forgot Password?
              </button>
            ) : null}
          </div>
        </div>
      </main>
    </>
  )
}

function AdminLoginScreen({
  onLogin,
  onBack,
  onForgotPassword,
}: {
  onLogin: () => void
  onBack?: () => void
  onForgotPassword?: () => void
}) {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      await login(email, password, 'admin')
      onLogin()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <main className="student-login-card" aria-label="Admin login">
        <div className="student-card-content">
          {onBack ? (
            <button type="button" className="back-link" onClick={onBack}>
              <span className="material-symbols-outlined">arrow_back</span>
              <span>Back</span>
            </button>
          ) : null}
          <div className="student-logo-wrap">
            <div className="student-logo-shell">
              <span className="material-symbols-outlined icon-faculty">admin_panel_settings</span>
            </div>
          </div>

          <div className="student-heading">
            <h1 className="student-title">Admin Login</h1>
            <p>Global administrative access</p>
          </div>

          <div className="student-accent faculty-accent" />

          <form className="student-form faculty-form" noValidate onSubmit={handleSubmit}>
            {error && (
              <div style={{ padding: '0.75rem', background: '#fee2e2', color: '#991b1b', borderRadius: '0.5rem', marginBottom: '1rem', fontSize: '0.875rem' }}>
                {error}
              </div>
            )}
            <div className="field-group">
              <label htmlFor="adminEmail">Admin Email</label>
              <input
                id="adminEmail"
                name="adminEmail"
                type="email"
                placeholder="admin@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <div className="field-group">
              <label htmlFor="adminPassword">Password</label>
              <div className="password-wrap">
                <input
                  id="adminPassword"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="password-toggle"
                  aria-label="Toggle password visibility"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <span className="material-symbols-outlined">{showPassword ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
              <p className="field-help">Super admin credentials required.</p>
            </div>

            <div className="student-actions">
              <button type="submit" className="student-primary-btn" disabled={isLoading}>
                {isLoading ? 'Logging in...' : 'Login'}
              </button>
            </div>
          </form>

          <div className="forgot-wrap">
            {onForgotPassword ? (
              <button type="button" className="inline-link forgot-link-btn" onClick={onForgotPassword}>
                Forgot Password?
              </button>
            ) : null}
          </div>
        </div>
      </main>
    </>
  )
}

function AdminHeader({
  currentPath,
  onNavigate,
  onLogout,
}: {
  currentPath: RoutePath
  onNavigate: (path: RoutePath) => void
  onLogout: () => void
}) {
  const title = ADMIN_TITLE_BY_PATH[currentPath] ?? 'Admin'
  return (
    <CommonDashboardHeader
      title={title}
      subtitle="Super Administrator"
      navItems={ADMIN_NAV_ITEMS}
      currentPath={currentPath}
      onNavigate={onNavigate}
      onLogout={onLogout}
      containerClassName="admin-container"
    />
  )
}

function AdminFooter() {
  return (
    <footer className="admin-footer admin-container">
      <p>©  StudySync, Made by Kairos with ❤️</p>
    </footer>
  )
}

function formatRelativeTime(iso: string): string {
  const d = new Date(iso)
  const now = Date.now()
  const diff = now - d.getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins} min${mins !== 1 ? 's' : ''} ago`
  if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`
  return `${Math.floor(hours / 24)} days ago`
}

function AdminDashboardScreen({
  onAddFaculty,
  onAssignSubjects,
  onStudentAccounts,
  onEnrollStudents,
  onCirculars,
  onReviewUploads,
  currentPath,
  onNavigate,
  onLogout,
}: {
  onAddFaculty: () => void
  onAssignSubjects: () => void
  onStudentAccounts: () => void
  onEnrollStudents?: () => void
  onCirculars: () => void
  onReviewUploads: () => void
  currentPath: RoutePath
  onNavigate: (path: RoutePath) => void
  onLogout: () => void
}) {
  const [dashboardData, setDashboardData] = useState<Awaited<ReturnType<typeof adminService.getDashboard>> | null>(null)
  const [dashboardError, setDashboardError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    adminService
      .getDashboard()
      .then((data) => {
        if (active) setDashboardData(data)
      })
      .catch((err) => {
        if (active) setDashboardError(err instanceof Error ? err.message : 'Failed to load dashboard')
      })
    return () => {
      active = false
    }
  }, [])

  const stats = dashboardData?.stats
  const recentActivities = dashboardData?.recentActivities ?? []
  const activitySectionRef = useRef<HTMLElement>(null)

  return (
    <div className="admin-page" aria-label="Global admin dashboard">
      <CommonDashboardHeader
        title="Admin Dashboard"
        subtitle="Super Administrator"
        navItems={ADMIN_NAV_ITEMS}
        currentPath={currentPath}
        onNavigate={onNavigate}
        onLogout={onLogout}
        containerClassName="admin-container"
      />

      <main className="admin-container admin-main">
        {dashboardError ? (
          <div className="admin-kpi-grid" style={{ gridColumn: '1 / -1', padding: '1rem', background: '#fef2f2', color: '#991b1b', borderRadius: '8px' }}>
            {dashboardError}
          </div>
        ) : null}
        <section className="admin-kpi-grid">
          <article className="admin-kpi-card">
            <div>
              <p>Total Students</p>
              <h3>{stats != null ? stats.totalStudents.toLocaleString() : '—'}</h3>
              <small>
                <span className="material-symbols-outlined">trending_up</span>
                Active
              </small>
            </div>
            <span className="material-symbols-outlined">group</span>
          </article>
          <article className="admin-kpi-card">
            <div>
              <p>Total Faculty</p>
              <h3>{stats != null ? stats.totalFaculty.toLocaleString() : '—'}</h3>
              <small>
                <span className="material-symbols-outlined">trending_up</span>
                Active
              </small>
            </div>
            <span className="material-symbols-outlined">badge</span>
          </article>
          <article className="admin-kpi-card">
            <div>
              <p>Total Subjects</p>
              <h3>{stats != null ? stats.totalSubjects.toLocaleString() : '—'}</h3>
              <small>Active Curricula</small>
            </div>
            <span className="material-symbols-outlined">library_books</span>
          </article>
          <article className="admin-kpi-card warning">
            <div>
              <p>Pending Verifications</p>
              <h3>{stats != null ? stats.pendingVerifications.toLocaleString() : '—'}</h3>
              <small>Requires action</small>
            </div>
            <span className="material-symbols-outlined">verified_user</span>
          </article>
        </section>

        <section className="admin-quick-actions">
          <h2>
            <span className="material-symbols-outlined">bolt</span>
            Quick Actions
          </h2>
          <div>
            <button type="button" onClick={onAddFaculty}>
              <span className="material-symbols-outlined">person_add</span>
              Add Faculty
            </button>
            <button type="button" onClick={onAssignSubjects}>
              <span className="material-symbols-outlined">assignment_ind</span>
              Assign Subjects
            </button>
            <button type="button" onClick={onReviewUploads}>
              <span className="material-symbols-outlined">rule</span>
              Review Uploads
            </button>
            <button type="button" onClick={onStudentAccounts}>
              <span className="material-symbols-outlined">school</span>
              Student Accounts
            </button>
            {onEnrollStudents && (
              <button type="button" onClick={onEnrollStudents}>
                <span className="material-symbols-outlined">person_add</span>
                Enroll Students
              </button>
            )}
            <button type="button" onClick={onCirculars}>
              <span className="material-symbols-outlined">campaign</span>
              Manage Circulars
            </button>
          </div>
        </section>

        <section className="admin-content-grid">
          <article ref={activitySectionRef} className="admin-activity">
            <div className="admin-card-head">
              <h2>
                <span className="material-symbols-outlined">history</span>
                Activity Feed
              </h2>
              <button type="button" onClick={() => activitySectionRef.current?.scrollIntoView({ behavior: 'smooth' })}>
                View All
              </button>
            </div>
            <div className="admin-activity-list">
              {recentActivities.length === 0 && stats == null ? (
                <p style={{ padding: '1rem', color: 'var(--muted, #666)' }}>Loading activity…</p>
              ) : recentActivities.length === 0 ? (
                <p style={{ padding: '1rem', color: 'var(--muted, #666)' }}>No recent activity.</p>
              ) : (
                recentActivities.map((act) => (
                  <div key={act.id} className="admin-activity-item">
                    <div className="admin-activity-icon">
                      <span className="material-symbols-outlined">
                        {act.type === 'student_registered' ? 'person_add' : act.type === 'notes_verified' ? 'verified' : 'history'}
                      </span>
                    </div>
                    <div>
                      <div>
                        <h4>{act.type.replace(/_/g, ' ')}</h4>
                        <span>{formatRelativeTime(act.timestamp)}</span>
                      </div>
                      <p>{act.description}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </article>

          <aside className="admin-side-cards">
            <article className="admin-storage-card">
              <h3>Storage Usage</h3>
              <div>
                <span />
              </div>
              <p>650 GB of 1 TB used (65%)</p>
              <button type="button" onClick={() => window.alert('Storage management coming soon.')}>
                Manage Storage
              </button>
            </article>

            <article className="admin-support-card">
              <h3>Support Portal</h3>
              <p>
                Having issues with the repository system? Contact technical support or view documentation.
              </p>
              <button
                type="button"
                style={{ background: 'none', border: 'none', padding: 0, font: 'inherit', color: 'inherit', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                onClick={() => window.alert('Help center link coming soon.')}
              >
                Go to Help Center
                <span className="material-symbols-outlined">arrow_forward</span>
              </button>
            </article>
          </aside>
        </section>
      </main>

      <CommonDashboardFooter containerClassName="admin-container" />
    </div>
  )
}

function AdminCircularsScreen({
  notices,
  calendarEvents,
  onCreateNotice,
  onCreateCalendarEvent,
  onUpdateNotice,
  onDeleteNotice,
  onDeleteCalendarEvent,
  currentPath,
  onNavigate,
  onLogout,
}: {
  notices: DepartmentNotice[]
  calendarEvents: AcademicEvent[]
  onCreateNotice: (input: { title: string; content: string; urgent: boolean }) => void
  onCreateCalendarEvent: (input: {
    title: string
    date: string
    type: AcademicEventType
    details: string
    targetAudience?: 'students' | 'faculty' | 'both'
  }) => void
  onUpdateNotice?: (id: string, payload: { title: string; content: string; urgent: boolean }) => void
  onDeleteNotice: (id: string) => void
  onDeleteCalendarEvent?: (id: string) => void
  currentPath: RoutePath
  onNavigate: (path: RoutePath) => void
  onLogout: () => void
}) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [urgent, setUrgent] = useState(false)
  const [eventTitle, setEventTitle] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [eventType, setEventType] = useState<'holiday' | 'event'>('holiday')
  const [eventAudience, setEventAudience] = useState<'students' | 'faculty' | 'both'>('students')
  const [eventDetails, setEventDetails] = useState('')
  const [eventFeedback, setEventFeedback] = useState('')
  const [editingNoticeId, setEditingNoticeId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')
  const [editUrgent, setEditUrgent] = useState(false)

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!title.trim() || !content.trim()) {
      return
    }
    onCreateNotice({ title: title.trim(), content: content.trim(), urgent })
    setTitle('')
    setContent('')
    setUrgent(false)
  }

  const handleCalendarSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!eventTitle.trim() || !eventDate) {
      setEventFeedback('Enter both title and date.')
      return
    }
    onCreateCalendarEvent({
      title: eventTitle.trim(),
      date: new Date(eventDate).toISOString(),
      type: eventType,
      details: eventDetails.trim() || `${eventType === 'holiday' ? 'Holiday' : 'Department event'} posted by admin.`,
      targetAudience: eventAudience,
    })
    setEventTitle('')
    setEventDate('')
    setEventDetails('')
    setEventType('holiday')
    setEventAudience('students')
    setEventFeedback('Calendar event published.')
  }

  const adminCalendarEvents = [...calendarEvents]
    .filter((event) => event.createdByRole === 'admin')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  return (
    <div className="admin-page" aria-label="Department circulars management">
      <AdminHeader currentPath={currentPath} onNavigate={onNavigate} onLogout={onLogout} />

      <main className="admin-container admin-main">
        <section className="screen-head">
          <div>
            <h2>Department Circulars</h2>
            <p className="screen-head-subtitle">Create and publish notices for students and faculty.</p>
          </div>
        </section>

        <section className="admin-circulars-grid">
          <article className="admin-circulars-form-card">
            <h3>Publish Notice</h3>
            <form onSubmit={handleSubmit}>
              <div className="field-group">
                <label htmlFor="notice-title">Title</label>
                <input
                  id="notice-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter circular title"
                />
              </div>
              <div className="field-group">
                <label htmlFor="notice-content">Notice Content</label>
                <textarea
                  id="notice-content"
                  rows={5}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write details for students and faculty..."
                />
              </div>
              <label className="notice-urgent-toggle">
                <input
                  type="checkbox"
                  checked={urgent}
                  onChange={(event) => setUrgent(event.target.checked)}
                />
                <span>Mark as urgent (highlight for students)</span>
              </label>
              <button type="submit">
                <span className="material-symbols-outlined">campaign</span>
                Publish Circular
              </button>
            </form>
          </article>

          <article className="admin-circulars-form-card admin-calendar-form-card">
            <h3>Add Holiday / Event</h3>
            <form onSubmit={handleCalendarSubmit}>
              <div className="field-group">
                <label htmlFor="admin-event-title">Title</label>
                <input
                  id="admin-event-title"
                  type="text"
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  placeholder="Holiday name or event title"
                />
              </div>
              <div className="admin-calendar-inline-fields">
                <div className="field-group">
                  <label htmlFor="admin-event-date">Date</label>
                  <input
                    id="admin-event-date"
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                  />
                </div>
                <div className="field-group">
                  <label htmlFor="admin-event-type">Type</label>
                  <select
                    id="admin-event-type"
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value as 'holiday' | 'event')}
                  >
                    <option value="holiday">Holiday</option>
                    <option value="event">Event</option>
                  </select>
                </div>
                <div className="field-group">
                  <label htmlFor="admin-event-audience">Assign To</label>
                  <select
                    id="admin-event-audience"
                    value={eventAudience}
                    onChange={(e) => setEventAudience(e.target.value as 'students' | 'faculty' | 'both')}
                  >
                    <option value="students">Student Calendar</option>
                    <option value="faculty">Faculty Calendar</option>
                    <option value="both">Both Calendars</option>
                  </select>
                </div>
              </div>
              <div className="field-group">
                <label htmlFor="admin-event-details">Details</label>
                <textarea
                  id="admin-event-details"
                  rows={3}
                  value={eventDetails}
                  onChange={(e) => setEventDetails(e.target.value)}
                  placeholder="Optional note for students..."
                />
              </div>
              <button type="submit">
                <span className="material-symbols-outlined">event_available</span>
                Publish to Calendar
              </button>
              {eventFeedback ? <p className="admin-calendar-feedback">{eventFeedback}</p> : null}
            </form>

            <div className="admin-calendar-upcoming">
              <h4>Upcoming Admin Events</h4>
              {adminCalendarEvents.length === 0 ? <p>No admin events yet.</p> : null}
              {adminCalendarEvents.slice(0, 5).map((event) => (
                <article key={event.id} className={`admin-calendar-upcoming-item ${event.type}`}>
                  <div>
                    <strong>{event.title}</strong>
                    <span>{new Date(event.date).toLocaleDateString()} • {event.type} • {event.targetAudience}</span>
                  </div>
                  {onDeleteCalendarEvent ? (
                    <button type="button" onClick={() => onDeleteCalendarEvent(event.id)} aria-label={`Delete ${event.title}`}>
                      <span className="material-symbols-outlined">delete</span>
                    </button>
                  ) : null}
                </article>
              ))}
            </div>
          </article>

          <article className="admin-circulars-list-card">
            <div>
              <h3>Recent Notices</h3>
              <p>{notices.length} total</p>
            </div>
            <div className="admin-circulars-list">
              {notices.map((notice) => (
                <article key={notice.id} className={`admin-circular-item ${notice.urgent || isNoticeNew(notice.createdAt) ? 'highlight' : ''}`}>
                  <div>
                    <div>
                      <h4>{notice.title}</h4>
                      <div className="notice-badges">
                        {notice.urgent ? <span className="notice-badge urgent">Urgent</span> : null}
                        {isNoticeNew(notice.createdAt) ? <span className="notice-badge new">New</span> : null}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {onUpdateNotice ? (
                        <button
                          type="button"
                          className="notice-delete-btn"
                          onClick={() => {
                            setEditingNoticeId(notice.id)
                            setEditTitle(notice.title)
                            setEditContent(notice.content)
                            setEditUrgent(notice.urgent)
                          }}
                          aria-label={`Edit ${notice.title}`}
                        >
                          <span className="material-symbols-outlined">edit</span>
                        </button>
                      ) : null}
                      <button
                        type="button"
                        className="notice-delete-btn"
                        onClick={() => onDeleteNotice(notice.id)}
                        aria-label={`Delete ${notice.title}`}
                      >
                        <span className="material-symbols-outlined">delete</span>
                      </button>
                    </div>
                  </div>
                  <p>{notice.content}</p>
                  <small>
                    {new Date(notice.createdAt).toLocaleString()} • {notice.author}
                  </small>
                </article>
              ))}
            </div>
          </article>
        </section>
      </main>

      {editingNoticeId && onUpdateNotice ? (
        <div className="admin-faculty-modal-backdrop" role="dialog" aria-modal="true" onClick={() => setEditingNoticeId(null)}>
          <div className="admin-faculty-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-faculty-modal-content">
              <div className="admin-faculty-modal-head">
                <h3>Edit Notice</h3>
                <button type="button" onClick={() => setEditingNoticeId(null)} aria-label="Close">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  if (editTitle.trim() && editContent.trim()) {
                    onUpdateNotice(editingNoticeId, { title: editTitle.trim(), content: editContent.trim(), urgent: editUrgent })
                    setEditingNoticeId(null)
                  }
                }}
              >
                <div className="field-group">
                  <label>Title</label>
                  <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} required />
                </div>
                <div className="field-group">
                  <label>Content</label>
                  <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} required rows={4} />
                </div>
                <div className="field-group">
                  <label>
                    <input type="checkbox" checked={editUrgent} onChange={(e) => setEditUrgent(e.target.checked)} />
                    Urgent
                  </label>
                </div>
                <div className="admin-faculty-modal-actions">
                  <button type="button" onClick={() => setEditingNoticeId(null)}>Cancel</button>
                  <button type="submit">Save</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      ) : null}

      <AdminFooter />
    </div>
  )
}

function AdminReviewUploadsScreen({
  currentPath,
  onNavigate,
  onLogout,
}: {
  currentPath: RoutePath
  onNavigate: (path: RoutePath) => void
  onLogout: () => void
}) {
  const [uploads, setUploads] = useState<Array<{ id: string; student: string; usn: string; title: string; format: string; date: string }>>([])
  const [uploadsLoading, setUploadsLoading] = useState(true)
  const [statusById, setStatusById] = useState<Record<string, 'pending' | 'approved' | 'rejected'>>({})
  const [viewUploadId, setViewUploadId] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    adminPendingUploadsService.getPendingUploads().then((list) => {
      if (!active) return
      setUploads(list.map((u) => ({ id: u.id, student: u.student, usn: u.usn, title: u.title, format: u.format, date: u.date })))
      setStatusById(Object.fromEntries(list.map((u) => [u.id, u.status])))
    }).finally(() => { if (active) setUploadsLoading(false) })
    return () => { active = false }
  }, [])

  const [actionError, setActionError] = useState<string | null>(null)

  const handleAction = async (id: string, status: 'approved' | 'rejected') => {
    setActionError(null)
    setStatusById((current) => ({ ...current, [id]: status }))
    try {
      await facultyService.verifyNote(id, status === 'approved' ? 'approve' : 'reject')
      const list = await adminPendingUploadsService.getPendingUploads()
      setUploads(list.map((u) => ({ id: u.id, student: u.student, usn: u.usn, title: u.title, format: u.format, date: u.date })))
      setStatusById(Object.fromEntries(list.map((u) => [u.id, u.status])))
    } catch (e) {
      setStatusById((current) => ({ ...current, [id]: 'pending' }))
      setActionError(e instanceof Error ? e.message : 'Action failed')
    }
  }

  return (
    <div className="admin-page" aria-label="Admin review uploads">
      <AdminHeader currentPath={currentPath} onNavigate={onNavigate} onLogout={onLogout} />

      <main className="admin-container admin-main">
        <section className="screen-head">
          <div>
            <h2>Review Uploads</h2>
            <p className="screen-head-subtitle">Moderation queue for student-contributed resources.</p>
            {actionError && <p className="error-message" style={{ marginTop: '0.5rem' }}>{actionError}</p>}
          </div>
        </section>

        <section className="admin-review-table-card">
          <div className="dashboard-table-wrap">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>USN</th>
                  <th>Title</th>
                  <th>Format</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th className="align-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {uploadsLoading ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted, #666)' }}>
                      Loading uploads…
                    </td>
                  </tr>
                ) : (
                  uploads.map((upload) => {
                    const status = statusById[upload.id] ?? 'pending'
                    return (
                      <tr key={upload.id}>
                        <td>{upload.student}</td>
                        <td className="mono">{upload.usn}</td>
                        <td>{upload.title}</td>
                        <td>{upload.format}</td>
                        <td className="muted">{upload.date}</td>
                        <td>
                          <span className={`admin-review-status ${status}`}>{status}</span>
                        </td>
                        <td className="align-right">
                          <div className={`admin-review-actions ${status !== 'pending' ? 'disabled' : ''}`}>
                            <button type="button" className="view" onClick={() => setViewUploadId(upload.id)}>
                              <span className="material-symbols-outlined">visibility</span>
                            </button>
                          <button
                            type="button"
                            className="approve"
                            onClick={() => handleAction(upload.id, 'approved')}
                            disabled={status !== 'pending'}
                          >
                            <span className="material-symbols-outlined">check_circle</span>
                          </button>
                          <button
                            type="button"
                            className="reject"
                            onClick={() => handleAction(upload.id, 'rejected')}
                            disabled={status !== 'pending'}
                          >
                            <span className="material-symbols-outlined">block</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {viewUploadId ? (
        <div
          className="admin-faculty-modal-backdrop"
          role="dialog"
          aria-modal="true"
          onClick={() => setViewUploadId(null)}
        >
          <div className="admin-faculty-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-faculty-modal-content">
              <div className="admin-faculty-modal-head">
                <h3>Upload Preview</h3>
                <button type="button" onClick={() => setViewUploadId(null)} aria-label="Close">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <p style={{ color: 'var(--muted, #6b7280)' }}>File preview is not available. Download from repository when implemented.</p>
            </div>
          </div>
        </div>
      ) : null}

      <AdminFooter />
    </div>
  )
}

function AdminStudentAccountsScreen({
  onEnrollStudents,
  onViewStudentDetails,
  currentPath,
  onNavigate,
  onLogout,
}: {
  onEnrollStudents?: () => void
  onViewStudentDetails?: (id: string) => void
  currentPath: RoutePath
  onNavigate: (path: RoutePath) => void
  onLogout: () => void
}) {
  const [studentList, setStudentList] = useState<Awaited<ReturnType<typeof adminService.getStudents>>>([])
  const [studentError, setStudentError] = useState<string | null>(null)
  const [actionMessage, setActionMessage] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [programmeFilter, setProgrammeFilter] = useState('All Programmes')
  const [semesterFilter, setSemesterFilter] = useState('All Semesters')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const fetchStudents = (filters?: { search?: string; programme?: string; semester?: string }) => {
    adminService
      .getStudents(filters)
      .then((list) => setStudentList(list))
      .catch((err) => setStudentError(err instanceof Error ? err.message : 'Failed to load students'))
  }

  useEffect(() => {
    fetchStudents()
  }, [])

  useEffect(() => {
    if (!actionMessage) return
    const t = window.setTimeout(() => setActionMessage(null), 5000)
    return () => window.clearTimeout(t)
  }, [actionMessage])

  const applyFilters = () => {
    fetchStudents({
      search: searchQuery.trim() || undefined,
      programme: programmeFilter !== 'All Programmes' ? programmeFilter : undefined,
      semester: semesterFilter !== 'All Semesters' ? semesterFilter.replace(/\D/g, '') || undefined : undefined,
    })
  }

  const resetFilters = () => {
    setSearchQuery('')
    setProgrammeFilter('All Programmes')
    setSemesterFilter('All Semesters')
    fetchStudents()
  }

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === studentList.length) setSelectedIds(new Set())
    else setSelectedIds(new Set(studentList.map((s) => s.id)))
  }

  const exportCsv = () => {
    const headers = ['Name', 'USN', 'Programme', 'Semester', 'Email', 'Status']
    const rows = studentList.map((s) => [s.fullName, s.usn, s.programme, s.semester, s.email, s.status])
    const csv = [headers.join(','), ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'students.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="admin-page" aria-label="Student accounts management">
      <AdminHeader currentPath={currentPath} onNavigate={onNavigate} onLogout={onLogout} />

      <main className="admin-container admin-main">
        <section className="screen-head">
          <div>
            <h2>Student Accounts Management</h2>
          </div>
          {onEnrollStudents && (
            <div className="screen-head-actions">
              <button type="button" className="dashboard-btn-primary" onClick={onEnrollStudents}>
                Enroll Students
              </button>
            </div>
          )}
        </section>

        <section className="admin-students-filter-card">
          <div className="admin-students-filter-grid">
            <div className="field-group">
              <label htmlFor="student-search">Search Student</label>
              <div className="admin-students-search">
                <span className="material-symbols-outlined">search</span>
                <input id="student-search" type="text" placeholder="USN or Name..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              </div>
            </div>
            <div className="field-group">
              <label htmlFor="student-programme">Programme</label>
              <select id="student-programme" value={programmeFilter} onChange={(e) => setProgrammeFilter(e.target.value)}>
                <option>All Programmes</option>
                <option>Computer Science &amp; Engineering</option>
                <option>Information Science</option>
                <option>Electronics &amp; Communication</option>
                <option>Mechanical Engineering</option>
              </select>
            </div>
            <div className="field-group">
              <label htmlFor="student-semester">Semester</label>
              <select id="student-semester" value={semesterFilter} onChange={(e) => setSemesterFilter(e.target.value)}>
                <option>All Semesters</option>
                <option>1st Semester</option>
                <option>2nd Semester</option>
                <option>3rd Semester</option>
                <option>4th Semester</option>
                <option>5th Semester</option>
                <option>6th Semester</option>
                <option>7th Semester</option>
                <option>8th Semester</option>
              </select>
            </div>
            <div className="admin-students-filter-actions">
              <button type="button" className="apply" onClick={applyFilters}>
                <span className="material-symbols-outlined">filter_list</span>
                Apply Filters
              </button>
              <button type="button" className="reset" aria-label="Reset filters" onClick={resetFilters}>
                <span className="material-symbols-outlined">restart_alt</span>
              </button>
            </div>
          </div>
        </section>

        {studentError ? (
          <div style={{ padding: '1rem', background: '#fef2f2', color: '#991b1b', borderRadius: '8px', marginBottom: '1rem' }}>
            {studentError}
          </div>
        ) : null}
        {actionMessage ? (
          <div
            style={{
              padding: '1rem',
              background: actionMessage.startsWith('Password reset') ? '#f0fdf4' : '#fef2f2',
              color: actionMessage.startsWith('Password reset') ? '#166534' : '#991b1b',
              borderRadius: '8px',
              marginBottom: '1rem',
            }}
          >
            {actionMessage}
          </div>
        ) : null}
        <section className="admin-students-bulk">
          <div>
            <button type="button" className="deactivate" onClick={() => selectedIds.size > 0 && window.alert('Deactivate selected requires backend integration.')}>
              <span className="material-symbols-outlined">no_accounts</span>
              Deactivate Selected
            </button>
            <button type="button" className="export" onClick={exportCsv}>
              <span className="material-symbols-outlined">file_download</span>
              Export CSV
            </button>
          </div>
          <p>
            Showing <span>{studentList.length}</span> student accounts
          </p>
        </section>

        <section className="admin-students-table-card">
          <div className="dashboard-table-wrap">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th className="align-center">
                    <input type="checkbox" checked={studentList.length > 0 && selectedIds.size === studentList.length} onChange={toggleSelectAll} aria-label="Select all" />
                  </th>
                  <th>Student Name</th>
                  <th>USN</th>
                  <th>Programme</th>
                  <th>Semester</th>
                  <th className="admin-students-email-col">Email</th>
                  <th>Status</th>
                  <th className="align-right" aria-label="Actions"></th>
                </tr>
              </thead>
              <tbody>
                {studentList.length === 0 && !studentError ? (
                  <tr>
                    <td colSpan={8} style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted, #666)' }}>
                      Loading students…
                    </td>
                  </tr>
                ) : (
                  studentList.map((s) => (
                    <tr key={s.id}>
                      <td className="align-center">
                        <input type="checkbox" checked={selectedIds.has(s.id)} onChange={() => toggleSelect(s.id)} aria-label={`Select ${s.fullName}`} />
                      </td>
                      <td>
                        <div className="admin-student-person">
                          <span className="blue">{initials(s.fullName)}</span>
                          <p>{s.fullName}</p>
                        </div>
                      </td>
                      <td className="mono">{s.usn}</td>
                      <td>{s.programme}</td>
                      <td>{s.semester}</td>
                      <td className="admin-students-email-col muted">{s.email ?? '—'}</td>
                      <td>
                        <span className={`admin-student-status ${s.status === 'active' ? 'active' : 'disabled'}`}>
                          {s.status === 'active' ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td className="align-right">
                        <div className="admin-student-actions">
                          <button type="button" className="view" aria-label="View details" onClick={() => onViewStudentDetails?.(s.id)}>
                            <span className="material-symbols-outlined">visibility</span>
                          </button>
                          <button
                            type="button"
                            className="reset"
                            aria-label="Reset password"
                            onClick={async () => {
                              setActionMessage(null)
                              try {
                                await adminService.sendStudentPasswordResetEmail(s.id)
                                setActionMessage('Password reset email sent to the student.')
                              } catch (e) {
                                setActionMessage(e instanceof Error ? e.message : 'Failed to send reset email.')
                              }
                            }}
                          >
                            <span className="material-symbols-outlined">password</span>
                          </button>
                          <button type="button" className="disable" aria-label="Disable account" onClick={() => window.alert('Disable account requires backend integration.')}>
                            <span className="material-symbols-outlined">block</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="admin-students-pagination">
            <p>Showing 1 to {studentList.length} of {studentList.length} entries</p>
            <div>
              <button type="button" disabled>
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              <button type="button" className="active">
                1
              </button>
              <button type="button">
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>
          </div>
        </section>
      </main>

      <AdminFooter />
    </div>
  )
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((s) => s[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function AdminFacultyAccountsScreen({
  onViewFacultyDetails,
  currentPath,
  onNavigate,
  onLogout,
}: {
  onViewFacultyDetails?: (id: string) => void
  currentPath: RoutePath
  onNavigate: (path: RoutePath) => void
  onLogout: () => void
}) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [tempPassword, setTempPassword] = useState('UNIV-8x2K-99LP')
  const [newFacultyName, setNewFacultyName] = useState('')
  const [newFacultyEmail, setNewFacultyEmail] = useState('')
  const [newFacultyDepartment, setNewFacultyDepartment] = useState('')
  const [addFacultyError, setAddFacultyError] = useState<string | null>(null)
  const [addFacultyLoading, setAddFacultyLoading] = useState(false)
  const [facultyList, setFacultyList] = useState<Awaited<ReturnType<typeof adminService.getFaculty>>>([])
  const [facultyError, setFacultyError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    adminService
      .getFaculty()
      .then((list) => {
        if (active) setFacultyList(list)
      })
      .catch((err) => {
        if (active) setFacultyError(err instanceof Error ? err.message : 'Failed to load faculty')
      })
    return () => {
      active = false
    }
  }, [])

  const generatePassword = () => {
    const segment = () => Math.random().toString(36).slice(2, 6).toUpperCase()
    setTempPassword(`UNIV-${segment()}-${segment()}`)
  }

  const handleAddFacultySubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setAddFacultyError(null)
    if (!newFacultyName.trim() || !newFacultyEmail.trim() || !newFacultyDepartment) {
      setAddFacultyError('Please fill in name, email, and department.')
      return
    }
    setAddFacultyLoading(true)
    try {
      await adminService.createFaculty({
        name: newFacultyName.trim(),
        email: newFacultyEmail.trim(),
        department: newFacultyDepartment,
        temporaryPassword: tempPassword,
      })
      setIsAddModalOpen(false)
      setNewFacultyName('')
      setNewFacultyEmail('')
      setNewFacultyDepartment('')
      setAddFacultyError(null)
    } catch (err) {
      setAddFacultyError(err instanceof Error ? err.message : 'Failed to create faculty')
    } finally {
      setAddFacultyLoading(false)
    }
  }

  return (
    <div className="admin-page" aria-label="Faculty accounts management">
      <AdminHeader currentPath={currentPath} onNavigate={onNavigate} onLogout={onLogout} />

      <main className="admin-container admin-main">
        <section className="screen-head">
          <div>
            <h2>Faculty Accounts</h2>
          </div>
          <div className="screen-head-actions">
            <button type="button" className="dashboard-btn-primary" onClick={() => setIsAddModalOpen(true)}>
              Add Faculty
            </button>
          </div>
        </section>

        {facultyError ? (
          <div style={{ padding: '1rem', background: '#fef2f2', color: '#991b1b', borderRadius: '8px', marginBottom: '1rem' }}>
            {facultyError}
          </div>
        ) : null}
        <section className="admin-faculty-table-card">
          <div className="dashboard-table-wrap">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Faculty Name</th>
                  <th>Email</th>
                  <th>Department</th>
                  <th>Subjects</th>
                  <th>Status</th>
                  <th className="align-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {facultyList.length === 0 && !facultyError ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted, #666)' }}>
                      Loading faculty…
                    </td>
                  </tr>
                ) : (
                  facultyList.map((f) => (
                    <tr key={f.id}>
                      <td>
                        <div className="admin-faculty-person">
                          <span>{initials(f.name)}</span>
                          <p>{f.name}</p>
                        </div>
                      </td>
                      <td className="muted">{f.email}</td>
                      <td className="muted">{f.department}</td>
                      <td>
                        <span className="admin-faculty-subject-pill">{f.assignedSubjectsCount} Assigned</span>
                      </td>
                      <td>
                        <span className={`admin-faculty-status ${f.status === 'active' ? 'active' : 'inactive'}`}>
                          {f.status === 'active' ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="align-right">
                        <div className="admin-faculty-actions">
                          <button type="button" aria-label="View faculty details" onClick={() => onViewFacultyDetails?.(f.id)}>
                            <span className="material-symbols-outlined">visibility</span>
                          </button>
                          <button type="button" aria-label="Block faculty" onClick={() => window.alert('Block/activate faculty requires backend integration.')}>
                            <span className="material-symbols-outlined">block</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="admin-faculty-pagination">
            <p>Showing 1 to {facultyList.length} of {facultyList.length} entries</p>
            <div>
              <button type="button" disabled>
                Previous
              </button>
              <button type="button">Next</button>
            </div>
          </div>
        </section>
      </main>

      {isAddModalOpen ? (
        <div className="admin-faculty-modal-backdrop">
          <div className="admin-faculty-modal" role="dialog" aria-modal="true" aria-label="Add new faculty account">
            <div className="admin-faculty-modal-accent" />
            <div className="admin-faculty-modal-content">
              <div className="admin-faculty-modal-head">
                <h3>Add New Faculty Account</h3>
                <button type="button" onClick={() => setIsAddModalOpen(false)} aria-label="Close dialog">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <form
                className="admin-faculty-form"
                onSubmit={handleAddFacultySubmit}
              >
                {addFacultyError ? (
                  <div style={{ padding: '0.75rem', background: '#fef2f2', color: '#991b1b', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.875rem' }}>
                    {addFacultyError}
                  </div>
                ) : null}
                <div className="field-group">
                  <label htmlFor="new-faculty-name">Full Name</label>
                  <input id="new-faculty-name" type="text" placeholder="e.g. Dr. Jane Smith" value={newFacultyName} onChange={(e) => setNewFacultyName(e.target.value)} disabled={addFacultyLoading} />
                </div>

                <div className="field-group">
                  <label htmlFor="new-faculty-email">Institutional Email</label>
                  <input id="new-faculty-email" type="email" placeholder="j.smith@university.edu" value={newFacultyEmail} onChange={(e) => setNewFacultyEmail(e.target.value)} disabled={addFacultyLoading} />
                </div>

                <div className="field-group">
                  <label htmlFor="new-faculty-department">Department</label>
                  <select id="new-faculty-department" value={newFacultyDepartment} onChange={(e) => setNewFacultyDepartment(e.target.value)} disabled={addFacultyLoading}>
                    <option value="">
                      Select Department
                    </option>
                    <option value="Computer Science">Computer Science</option>
                    <option value="Mathematics">Mathematics</option>
                    <option value="Physics">Physics</option>
                    <option value="Engineering">Engineering</option>
                  </select>
                </div>

                <div className="admin-faculty-credentials">
                  <p>Security Credentials</p>
                  <div className="admin-faculty-credentials-row">
                    <div>
                      <span>Temporary Password</span>
                      <div>
                        <code>{tempPassword}</code>
                        <button type="button" onClick={generatePassword} aria-label="Regenerate password">
                          <span className="material-symbols-outlined">refresh</span>
                        </button>
                      </div>
                    </div>
                    <label className="admin-faculty-force-change">
                      <input type="checkbox" defaultChecked />
                      <span>Force change</span>
                    </label>
                  </div>
                </div>

                <div className="admin-faculty-modal-actions">
                  <button type="button" className="cancel" onClick={() => setIsAddModalOpen(false)} disabled={addFacultyLoading}>
                    Cancel
                  </button>
                  <button type="submit" className="create" disabled={addFacultyLoading}>
                    {addFacultyLoading ? 'Creating…' : 'Create Account'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      ) : null}

      <AdminFooter />
    </div>
  )
}

function AdminAssignSubjectsScreen({
  currentPath,
  onNavigate,
  onLogout,
}: {
  currentPath: RoutePath
  onNavigate: (path: RoutePath) => void
  onLogout: () => void
}) {
  const [subjects, setSubjects] = useState<Awaited<ReturnType<typeof adminService.getSubjects>>>([])
  const [facultyList, setFacultyList] = useState<Awaited<ReturnType<typeof adminService.getFaculty>>>([])
  const [selectedFacultyId, setSelectedFacultyId] = useState<string>('')
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([])
  const [programmeFilter, setProgrammeFilter] = useState<string>('')
  const [semesterFilter, setSemesterFilter] = useState<string>('')
  const [isAssigned, setIsAssigned] = useState(false)
  const [assignError, setAssignError] = useState<string | null>(null)
  const [assignLoading, setAssignLoading] = useState(false)

  useEffect(() => {
    let active = true
    adminService.getFaculty().then((facList) => {
      if (!active) return
      setFacultyList(facList)
      if (facList.length > 0 && !selectedFacultyId) setSelectedFacultyId(facList[0].id)
    }).catch(() => { if (active) setAssignError('Failed to load faculty') })
    return () => { active = false }
  }, [])

  useEffect(() => {
    let active = true
    adminService.getSubjects({ programme: programmeFilter || undefined, semester: semesterFilter ? String(semesterFilter).replace(/\D/g, '') || undefined : undefined }).then((subjList) => {
      if (!active) return
      setSubjects(subjList)
    }).catch(() => { if (active) setAssignError('Failed to load subjects') })
    return () => { active = false }
  }, [programmeFilter, semesterFilter])

  const selectedFaculty = facultyList.find((f) => f.id === selectedFacultyId)

  const handleAssign = async () => {
    if (!selectedFacultyId || selectedSubjectIds.length === 0) {
      setAssignError('Select a faculty and at least one subject.')
      return
    }
    setAssignError(null)
    setAssignLoading(true)
    try {
      await adminService.assignSubjectsToFaculty(selectedFacultyId, selectedSubjectIds)
      setIsAssigned(true)
      setSelectedSubjectIds([])
      setTimeout(() => setIsAssigned(false), 3000)
    } catch (err) {
      setAssignError(err instanceof Error ? err.message : 'Assign failed')
    } finally {
      setAssignLoading(false)
    }
  }

  const toggleSubject = (id: string) => {
    setSelectedSubjectIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    )
  }

  return (
    <div className="admin-page" aria-label="Assign subjects to faculty">
      <AdminHeader currentPath={currentPath} onNavigate={onNavigate} onLogout={onLogout} />

      <main className="admin-container admin-main">
        <section className="screen-head">
          <div>
            <h2>Assign Subjects to Faculty</h2>
            <p className="screen-head-subtitle">Select a faculty member and map their academic responsibilities.</p>
          </div>
        </section>

        {assignError ? (
          <div style={{ padding: '1rem', background: '#fef2f2', color: '#991b1b', borderRadius: '8px', marginBottom: '1rem' }}>
            {assignError}
          </div>
        ) : null}
        <section className="admin-assign-layout">
          <article className="admin-assign-faculty-card">
            <label htmlFor="assign-faculty-select">Select Faculty Member</label>
            <select
              id="assign-faculty-select"
              value={selectedFacultyId}
              onChange={(e) => setSelectedFacultyId(e.target.value)}
              className="admin-assign-search"
            >
              <option value="">Select faculty…</option>
              {facultyList.map((f) => (
                <option key={f.id} value={f.id}>{f.name} • {f.department}</option>
              ))}
            </select>

            {selectedFaculty ? (
              <>
                <div className="admin-assign-profile">
                  <div>
                    <span className="material-symbols-outlined">badge</span>
                  </div>
                  <div>
                    <h3>{selectedFaculty.name}</h3>
                    <p>{selectedFaculty.designation || 'Faculty'} • {selectedFaculty.department}</p>
                  </div>
                </div>
                <div className="admin-assign-meta">
                  <div>
                    <span>Currently Assigned</span>
                    <strong>{selectedFaculty.assignedSubjectsCount} Subjects</strong>
                  </div>
                  <div>
                    <span>Status</span>
                    <strong>{selectedFaculty.status === 'active' ? 'Active' : 'Inactive'}</strong>
                  </div>
                </div>
              </>
            ) : (
              <p style={{ padding: '1rem', color: 'var(--muted, #666)' }}>Select a faculty to assign subjects.</p>
            )}
          </article>

          <article className="admin-assign-subjects-card">
            <div className="admin-assign-toolbar">
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <select value={programmeFilter} onChange={(e) => setProgrammeFilter(e.target.value)} aria-label="Filter by programme">
                  <option value="">All Programmes</option>
                  <option value="B.Tech CSE">B.Tech CSE</option>
                  <option value="M.Tech AI">M.Tech AI</option>
                  <option value="B.Sc Physics">B.Sc Physics</option>
                </select>
                <select value={semesterFilter} onChange={(e) => setSemesterFilter(e.target.value)} aria-label="Filter by semester">
                  <option value="">All Semesters</option>
                  <option value="1">Semester 1</option>
                  <option value="2">Semester 2</option>
                  <option value="3">Semester 3</option>
                  <option value="4">Semester 4</option>
                </select>
              </div>
              <p>
                Showing <span>{subjects.length}</span> subjects
              </p>
            </div>

            <div className="dashboard-table-wrap">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th />
                    <th>Code</th>
                    <th>Subject Name</th>
                    <th>Programme</th>
                    <th>Semester</th>
                  </tr>
                </thead>
                <tbody>
                  {subjects.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted, #666)' }}>
                        Loading subjects…
                      </td>
                    </tr>
                  ) : (
                    subjects.map((subject) => {
                      const isSelected = selectedSubjectIds.includes(subject.id)
                      return (
                        <tr key={subject.id} className={isSelected ? 'admin-assign-row-selected' : ''}>
                          <td>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSubject(subject.id)}
                              aria-label={`Select ${subject.name}`}
                            />
                          </td>
                          <td>{subject.code}</td>
                          <td>{subject.name}</td>
                          <td>{subject.programme}</td>
                          <td>{subject.semester}</td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="admin-assign-actions">
              {isAssigned ? (
                <div style={{ padding: '0.75rem', textAlign: 'center', color: '#059669', width: '100%' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '2rem', display: 'block', marginBottom: '0.5rem' }}>check_circle</span>
                  <p style={{ margin: 0, fontWeight: '600' }}>Subjects Assigned Successfully!</p>
                </div>
              ) : (
                <>
                  <button type="button" onClick={handleAssign} disabled={assignLoading || !selectedFacultyId || selectedSubjectIds.length === 0}>
                    <span className="material-symbols-outlined">assignment_turned_in</span>
                    {assignLoading ? 'Assigning…' : `Assign Selected Subjects (${selectedSubjectIds.length})`}
                  </button>
                  <p>
                    <span className="material-symbols-outlined">info</span>
                    Faculty can manage only assigned subjects.
                  </p>
                </>
              )}
            </div>
          </article>
        </section>
      </main>

      <AdminFooter />
    </div>
  )
}

function FacultyDashboardScreen({
  onViewAllVerification,
  onUploadTextbook,
  onCreateAssignment,
  onViewAssignment,
  calendarEvents,
  onCreateCalendarEvent,
  notices,
  onCreateNotice,
  onDeleteOwnNotice,
  currentPath,
  onNavigate,
  onLogout,
}: {
  onViewAllVerification: () => void
  onUploadTextbook: () => void
  onCreateAssignment: () => void
  onViewAssignment: () => void
  calendarEvents: AcademicEvent[]
  onCreateCalendarEvent: (input: {
    title: string
    date: string
    type: AcademicEventType
    details: string
    targetAudience?: 'students' | 'faculty' | 'both'
  }) => void
  notices: DepartmentNotice[]
  onCreateNotice: (input: { title: string; content: string; urgent: boolean }) => void
  onDeleteOwnNotice: (id: string) => void
  currentPath: RoutePath
  onNavigate: (path: RoutePath) => void
  onLogout: () => void
}) {
  const { user } = useAuth()
  const displayName = user?.name || user?.fullName || 'Faculty User'
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [isDashboardLoading, setIsDashboardLoading] = useState(true)
  const [dashboardError, setDashboardError] = useState<string | null>(null)
  const [facultyDashboardData, setFacultyDashboardData] = useState<Awaited<ReturnType<typeof facultyService.getDashboard>> | null>(null)
  const [officialNoteFile, setOfficialNoteFile] = useState<File | null>(null)
  const [officialNoteTitle, setOfficialNoteTitle] = useState('')
  const [officialNoteChapter, setOfficialNoteChapter] = useState('')
  const [officialNoteSubjectId, setOfficialNoteSubjectId] = useState('')
  const [isOfficialNoteUploading, setIsOfficialNoteUploading] = useState(false)
  const [officialNoteUploadError, setOfficialNoteUploadError] = useState<string | null>(null)
  const [notificationTitle, setNotificationTitle] = useState('')
  const [notificationContent, setNotificationContent] = useState('')
  const [isUrgentNotification, setIsUrgentNotification] = useState(false)
  const [notificationError, setNotificationError] = useState<string | null>(null)
  const [notificationSuccess, setNotificationSuccess] = useState<string | null>(null)
  const [eventTitle, setEventTitle] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [eventType, setEventType] = useState<AcademicEventType>('test')
  const [eventDetails, setEventDetails] = useState('')
  const [eventFeedback, setEventFeedback] = useState<string | null>(null)
  const department = user?.department || 'Department'
  const facultyNotices = notices.filter((notice) => notice.authorRole === 'faculty' && notice.author === displayName)

  const loadFacultyDashboard = async () => {
    setIsDashboardLoading(true)
    setDashboardError(null)
    try {
      const data = await facultyService.getDashboard()
      setFacultyDashboardData(data)
      if (!officialNoteSubjectId && data.assignedSubjects.length > 0) {
        setOfficialNoteSubjectId(data.assignedSubjects[0].id)
      }
    } catch (error) {
      setDashboardError(error instanceof Error ? error.message : 'Failed to load faculty dashboard.')
    } finally {
      setIsDashboardLoading(false)
    }
  }

  useEffect(() => {
    loadFacultyDashboard().catch(() => {})
  }, [])

  const assignedSubjects = facultyDashboardData?.assignedSubjects ?? []
  const officialNotes = facultyDashboardData?.officialNotes ?? []
  const pendingNotes = facultyDashboardData?.pendingNotes ?? []
  const recentAssignments = facultyDashboardData?.recentAssignments ?? []
  const textbooks = facultyDashboardData?.textbooks ?? []
  const selectedSubject = assignedSubjects.find((item) => item.id === officialNoteSubjectId) ?? assignedSubjects[0]
  const programmeOptions = [...new Set(assignedSubjects.map((subject) => subject.programme))]
  const semesterOptions = [...new Set(assignedSubjects.map((subject) => `Semester ${subject.semester}`))]

  const handleOfficialNoteFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (!selectedFile) {
      return
    }
    try {
      enforceSupportedUploadFile(selectedFile, 25 * 1024 * 1024)
      setOfficialNoteFile(selectedFile)
      setOfficialNoteUploadError(null)
    } catch (error) {
      setOfficialNoteFile(null)
      setOfficialNoteUploadError(
        error instanceof FileUploadError
          ? `${error.message}. Allowed: ${SUPPORTED_UPLOAD_LABEL}.`
          : `Invalid file. Allowed: ${SUPPORTED_UPLOAD_LABEL}.`,
      )
    }
  }

  const closeOfficialNoteModal = () => {
    setIsUploadModalOpen(false)
    setOfficialNoteFile(null)
    setOfficialNoteTitle('')
    setOfficialNoteChapter('')
    setOfficialNoteUploadError(null)
  }

  const openOfficialNoteModal = () => {
    if (!officialNoteSubjectId && assignedSubjects.length > 0) {
      setOfficialNoteSubjectId(assignedSubjects[0].id)
    }
    setIsUploadModalOpen(true)
  }

  const handleSendNotification = (event: React.FormEvent) => {
    event.preventDefault()
    const title = notificationTitle.trim()
    const content = notificationContent.trim()
    if (!title || !content) {
      setNotificationError('Please provide both a title and message.')
      setNotificationSuccess(null)
      return
    }
    onCreateNotice({ title, content, urgent: isUrgentNotification })
    setNotificationTitle('')
    setNotificationContent('')
    setIsUrgentNotification(false)
    setNotificationError(null)
    setNotificationSuccess('Notification sent to students.')
  }

  const handleCreateCalendarEvent = (event: React.FormEvent) => {
    event.preventDefault()
    const title = eventTitle.trim()
    const details = eventDetails.trim()
    if (!title || !eventDate) {
      setEventFeedback('Please provide event title and date.')
      return
    }
    onCreateCalendarEvent({
      title,
      date: new Date(eventDate).toISOString(),
      type: eventType,
      details: details || 'Academic event scheduled.',
      targetAudience: 'both',
    })
    setEventTitle('')
    setEventDate('')
    setEventType('test')
    setEventDetails('')
    setEventFeedback('Calendar event published for students.')
  }

  return (
    <div className="faculty-page" aria-label="Faculty management dashboard">
      <CommonDashboardHeader
        title="Faculty Dashboard"
        subtitle={department}
        navItems={[
          { label: 'Dashboard', path: '/faculty_dashboard' },
          { label: 'Verification', path: '/faculty_verification' },
          { label: 'Textbooks', path: '/faculty_textbook_upload' },
          { label: 'Assignments', path: '/faculty_assignment_submissions' },
        ]}
        currentPath={currentPath}
        onNavigate={onNavigate}
        onLogout={onLogout}
        containerClassName="faculty-container"
      />

      <main className="faculty-container faculty-main">
        {dashboardError ? (
          <section className="dashboard-card">
            <p style={{ color: '#b91c1c', fontWeight: 600 }}>{dashboardError}</p>
          </section>
        ) : null}
        <section className="dashboard-card">
          <div className="dashboard-section-title">
            <span className="material-symbols-outlined">subject</span>
            <h2>Manage Subjects</h2>
          </div>
          <div className="faculty-subject-grid">
            <div className="field-group">
              <label>Programme</label>
              <select defaultValue={programmeOptions[0] || ''}>
                {programmeOptions.length === 0 ? <option>No programme</option> : null}
                {programmeOptions.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </div>
            <div className="field-group">
              <label>Semester</label>
              <select defaultValue={semesterOptions[0] || ''}>
                {semesterOptions.length === 0 ? <option>No semester</option> : null}
                {semesterOptions.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </div>
            <div className="field-group">
              <label>Subject Code</label>
              <select defaultValue={selectedSubject ? `${selectedSubject.code} - ${selectedSubject.name}` : ''}>
                {assignedSubjects.length === 0 ? <option>No assigned subject</option> : null}
                {assignedSubjects.map((subject) => (
                  <option key={subject.id}>
                    {subject.code} - {subject.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        <section className="faculty-grid-top">
          <section className="dashboard-card">
            <div className="faculty-section-head">
              <div className="dashboard-section-title">
                <span className="material-symbols-outlined">description</span>
                <h2>Official Notes</h2>
              </div>
              <button type="button" className="dashboard-upload-btn" onClick={openOfficialNoteModal}>
                <span className="material-symbols-outlined">upload</span>
                Upload New
              </button>
            </div>
            <div className="dashboard-table-wrap faculty-table-wrap">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Unit/Chapter</th>
                    <th>Date Uploaded</th>
                    <th className="align-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {officialNotes.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="muted">{isDashboardLoading ? 'Loading...' : 'No official notes yet.'}</td>
                    </tr>
                  ) : null}
                  {officialNotes.slice(0, 5).map((note) => (
                    <tr key={note.id}>
                      <td>{note.title}</td>
                      <td>{note.chapter || '-'}</td>
                      <td className="muted">{new Date(note.uploadedAt).toLocaleDateString()}</td>
                      <td className="align-right">
                        <button type="button" className="faculty-link-btn">View</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="dashboard-card">
            <div className="faculty-section-head">
              <div className="dashboard-section-title">
                <span className="material-symbols-outlined">verified_user</span>
                <h2>Verification Panel</h2>
              </div>
              <button type="button" className="faculty-outline-btn" onClick={onViewAllVerification}>
                View All
              </button>
            </div>
            <p className="faculty-subtitle">Pending Student Notes</p>
            <div className="faculty-verify-list">
              {pendingNotes.length === 0 ? (
                <article className="faculty-verify-card">
                  <div className="faculty-verify-top">
                    <div>
                      <h3>{isDashboardLoading ? 'Loading...' : 'No pending notes'}</h3>
                      <p>{isDashboardLoading ? 'Please wait' : 'Everything is verified'}</p>
                    </div>
                  </div>
                </article>
              ) : null}
              {pendingNotes.slice(0, 2).map((note) => (
                <article key={note.id} className="faculty-verify-card">
                  <div className="faculty-verify-top">
                    <div>
                      <h3>{note.student.name}</h3>
                      <p>{note.student.usn}</p>
                    </div>
                    <span className="faculty-new-tag">NEW</span>
                  </div>
                  <p className="faculty-note-title">"{note.title}"</p>
                  <div className="faculty-verify-actions">
                    <button
                      type="button"
                      className="faculty-approve-btn"
                      onClick={async () => {
                        await facultyService.verifyNote(note.id, 'approve')
                        await loadFacultyDashboard()
                      }}
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      className="faculty-reject-btn"
                      onClick={async () => {
                        await facultyService.verifyNote(note.id, 'reject')
                        await loadFacultyDashboard()
                      }}
                    >
                      Reject
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </section>

        <section className="faculty-grid-bottom">
          <section className="dashboard-card">
            <div className="faculty-section-head">
              <div className="dashboard-section-title">
                <span className="material-symbols-outlined">library_books</span>
                <h2>Textbook Management</h2>
              </div>
              <button type="button" className="faculty-outline-btn" onClick={onUploadTextbook}>
                <span className="material-symbols-outlined">add</span>
                Upload
              </button>
            </div>
            <div className="faculty-item-list">
              {textbooks.length === 0 ? (
                <div className="faculty-item-row">
                  <div>
                    <h3>{isDashboardLoading ? 'Loading...' : 'No textbooks uploaded'}</h3>
                    <p>Use Upload to add textbooks.</p>
                  </div>
                </div>
              ) : null}
              {textbooks.slice(0, 5).map((book) => (
                <div key={book.id} className="faculty-item-row">
                  <div>
                    <h3>{book.name}</h3>
                    <p>{new Date(book.createdTime).toLocaleDateString()} • {formatFileSize(Number(book.size || 0))}</p>
                  </div>
                  <a href={book.webViewLink} target="_blank" rel="noreferrer" className="faculty-icon-danger">
                    <span className="material-symbols-outlined">open_in_new</span>
                  </a>
                </div>
              ))}
            </div>
          </section>

          <section className="dashboard-card">
            <div className="faculty-section-head">
              <div className="dashboard-section-title">
                <span className="material-symbols-outlined">assignment_turned_in</span>
                <h2>Active Assignments</h2>
              </div>
              <button type="button" className="dashboard-btn-primary dashboard-btn-small" onClick={onCreateAssignment}>
                Create New
              </button>
            </div>
            <div className="faculty-item-list">
              {recentAssignments.length === 0 ? (
                <div className="faculty-item-row faculty-assignment-row">
                  <div>
                    <h3>{isDashboardLoading ? 'Loading...' : 'No active assignments'}</h3>
                    <p>Create an assignment to get started.</p>
                  </div>
                </div>
              ) : null}
              {recentAssignments.slice(0, 5).map((assignment) => (
                <div key={assignment.id} className="faculty-item-row faculty-assignment-row">
                  <div>
                    <h3>{assignment.title}</h3>
                    <p>
                      {assignment.submissionCount} Submissions • {assignment.isClosed ? 'Closed' : `Due: ${new Date(assignment.dueDate).toLocaleDateString()}`}
                    </p>
                  </div>
                  <button type="button" className="faculty-view-btn" onClick={onViewAssignment}>
                    View
                    <span className="material-symbols-outlined">arrow_forward</span>
                  </button>
                </div>
              ))}
            </div>
          </section>
        </section>

        <section className="dashboard-card faculty-calendar-editor">
          <div className="faculty-section-head">
            <div className="dashboard-section-title">
              <span className="material-symbols-outlined">event</span>
              <h2>Schedule Academic Event</h2>
            </div>
          </div>
          <form className="faculty-calendar-form" onSubmit={handleCreateCalendarEvent}>
            <div className="field-group">
              <label htmlFor="faculty-event-title">Event Title</label>
              <input
                id="faculty-event-title"
                type="text"
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
                placeholder="Class test, internal exam, seminar..."
              />
            </div>
            <div className="faculty-calendar-grid">
              <div className="field-group">
                <label htmlFor="faculty-event-date">Date</label>
                <input
                  id="faculty-event-date"
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                />
              </div>
              <div className="field-group">
                <label htmlFor="faculty-event-type">Type</label>
                <select
                  id="faculty-event-type"
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value as AcademicEventType)}
                >
                  <option value="test">Test</option>
                  <option value="assignment">Assignment</option>
                  <option value="holiday">Holiday</option>
                  <option value="event">Event</option>
                </select>
              </div>
            </div>
            <div className="field-group">
              <label htmlFor="faculty-event-details">Details</label>
              <textarea
                id="faculty-event-details"
                rows={3}
                value={eventDetails}
                onChange={(e) => setEventDetails(e.target.value)}
                placeholder="Syllabus, venue, instructions..."
              />
            </div>
            <div className="faculty-calendar-actions">
              <button type="submit" className="dashboard-btn-primary">
                <span className="material-symbols-outlined">add_task</span>
                Add to Calendar
              </button>
              {eventFeedback ? <p>{eventFeedback}</p> : null}
            </div>
          </form>

          <div className="faculty-calendar-upcoming">
            <h3>Upcoming Events</h3>
            {calendarEvents.length === 0 ? <p>No events scheduled yet.</p> : null}
            {calendarEvents.slice(0, 4).map((event) => (
              <article key={event.id}>
                <strong>{event.title}</strong>
                <span>{new Date(event.date).toLocaleDateString()} • {event.type}</span>
              </article>
            ))}
          </div>
        </section>

        <section className="dashboard-card faculty-notification-card">
          <div className="faculty-section-head">
            <div className="dashboard-section-title">
              <span className="material-symbols-outlined">campaign</span>
              <h2>Department Notifications</h2>
            </div>
          </div>

          <form className="faculty-notification-form" onSubmit={handleSendNotification}>
            <div className="field-group">
              <label htmlFor="faculty-notification-title">Title</label>
              <input
                id="faculty-notification-title"
                type="text"
                value={notificationTitle}
                onChange={(event) => setNotificationTitle(event.target.value)}
                placeholder="Exam update, class change, deadline reminder..."
              />
            </div>

            <div className="field-group">
              <label htmlFor="faculty-notification-content">Message</label>
              <textarea
                id="faculty-notification-content"
                rows={4}
                value={notificationContent}
                onChange={(event) => setNotificationContent(event.target.value)}
                placeholder="Write the department circular/notification for students..."
              />
            </div>
            <label className="notice-urgent-toggle">
              <input
                type="checkbox"
                checked={isUrgentNotification}
                onChange={(event) => setIsUrgentNotification(event.target.checked)}
              />
              <span>Mark as urgent notice</span>
            </label>

            <div className="faculty-notification-actions">
              <button type="submit" className="dashboard-btn-primary">
                <span className="material-symbols-outlined">send</span>
                Send Notification
              </button>
              <p>This appears in the non-clickable notification block on the student dashboard.</p>
            </div>
            {notificationError ? <p className="faculty-notification-error">{notificationError}</p> : null}
            {notificationSuccess ? <p className="faculty-notification-success">{notificationSuccess}</p> : null}
          </form>

          <div className="faculty-notification-history">
            <h3>Recent Sent</h3>
            {facultyNotices.length === 0 ? (
              <p className="faculty-notification-empty">No notifications sent yet.</p>
            ) : null}
            {facultyNotices.slice(0, 5).map((notice) => (
              <article key={notice.id} className={`faculty-notification-item ${notice.urgent || isNoticeNew(notice.createdAt) ? 'highlight' : ''}`}>
                <div>
                  <div>
                    <h4>{notice.title}</h4>
                    <div className="notice-badges">
                      {notice.urgent ? <span className="notice-badge urgent">Urgent</span> : null}
                      {isNoticeNew(notice.createdAt) ? <span className="notice-badge new">New</span> : null}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="notice-delete-btn"
                    onClick={() => onDeleteOwnNotice(notice.id)}
                    aria-label={`Delete ${notice.title}`}
                  >
                    <span className="material-symbols-outlined">delete</span>
                  </button>
                </div>
                <p>{notice.content}</p>
                <small>{new Date(notice.createdAt).toLocaleString()}</small>
              </article>
            ))}
          </div>
        </section>
      </main>

      {isUploadModalOpen ? (
        <div className="faculty-modal-overlay" role="dialog" aria-modal="true" aria-label="Upload official notes">
          <div className="faculty-modal-card">
            <div className="faculty-modal-head">
              <div className="faculty-modal-title-wrap">
                <div className="faculty-modal-icon">
                  <span className="material-symbols-outlined">upload_file</span>
                </div>
                <h2>Upload Official Notes</h2>
              </div>
              <button
                type="button"
                className="faculty-modal-close"
                aria-label="Close upload modal"
                onClick={closeOfficialNoteModal}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form
              className="faculty-modal-form"
              onSubmit={async (event) => {
                event.preventDefault()
                if (!officialNoteFile) {
                  setOfficialNoteUploadError(`Please choose a file. Allowed: ${SUPPORTED_UPLOAD_LABEL}.`)
                  return
                }
                if (!officialNoteSubjectId) {
                  setOfficialNoteUploadError('Please select a subject.')
                  return
                }
                if (!officialNoteChapter.trim() || !officialNoteTitle.trim()) {
                  setOfficialNoteUploadError('Please provide title and chapter.')
                  return
                }
                setIsOfficialNoteUploading(true)
                setOfficialNoteUploadError(null)
                try {
                  await facultyService.uploadOfficialNote({
                    file: officialNoteFile,
                    title: officialNoteTitle.trim(),
                    chapter: officialNoteChapter.trim(),
                    subjectId: officialNoteSubjectId,
                  })
                  await loadFacultyDashboard()
                  closeOfficialNoteModal()
                } catch (error) {
                  setOfficialNoteUploadError(error instanceof Error ? error.message : 'Upload failed.')
                } finally {
                  setIsOfficialNoteUploading(false)
                }
              }}
            >
              <div className="faculty-modal-field">
                <label>
                  <span>1</span>
                  Subject
                </label>
                <select
                  value={officialNoteSubjectId}
                  onChange={(event) => setOfficialNoteSubjectId(event.target.value)}
                  disabled={isOfficialNoteUploading}
                >
                  {assignedSubjects.length === 0 ? <option value="">No assigned subjects</option> : null}
                  {assignedSubjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.code} - {subject.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="faculty-modal-field">
                <label>
                  <span>2</span>
                  Unit / Chapter
                </label>
                <input
                  type="text"
                  placeholder="e.g., Unit 3"
                  value={officialNoteChapter}
                  onChange={(event) => setOfficialNoteChapter(event.target.value)}
                  disabled={isOfficialNoteUploading}
                />
              </div>

              <div className="faculty-modal-field">
                <label>
                  <span>3</span>
                  Note Title
                </label>
                <input
                  type="text"
                  placeholder="e.g., Detailed Guide on Paging & Segmentation"
                  value={officialNoteTitle}
                  onChange={(event) => setOfficialNoteTitle(event.target.value)}
                  disabled={isOfficialNoteUploading}
                />
              </div>

              <div className="faculty-modal-field">
                <label>
                  <span>4</span>
                  Description <em>(Optional)</em>
                </label>
                <textarea rows={3} placeholder="Provide a brief overview of the contents..." />
              </div>

              <div className="faculty-modal-field">
                <label>
                  <span>5</span>
                  Upload File
                </label>
                <label className="faculty-upload-dropzone">
                  <input type="file" accept={SUPPORTED_UPLOAD_ACCEPT} onChange={handleOfficialNoteFileChange} disabled={isOfficialNoteUploading} />
                  <div>
                    <span className="material-symbols-outlined">cloud_upload</span>
                  </div>
                  <p>Click to upload or drag and drop</p>
                  <p>{SUPPORTED_UPLOAD_LABEL} (Max 25MB)</p>
                  {officialNoteFile ? (
                    <p style={{ marginTop: '0.375rem', color: '#059669', fontWeight: 600 }}>
                      Selected: {officialNoteFile.name}
                    </p>
                  ) : null}
                  {officialNoteUploadError ? (
                    <p style={{ marginTop: '0.375rem', color: '#b91c1c', fontWeight: 600 }}>
                      {officialNoteUploadError}
                    </p>
                  ) : null}
                </label>
              </div>

              <div className="faculty-modal-submit-wrap">
                <button type="submit" className="faculty-modal-submit" disabled={isOfficialNoteUploading}>
                  {isOfficialNoteUploading ? 'Publishing...' : 'Publish Notes'}
                </button>
                <div>
                  <span className="material-symbols-outlined">info</span>
                  <p>These notes will immediately appear under Official Notes for students.</p>
                </div>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      <CommonDashboardFooter containerClassName="faculty-container" />
    </div>
  )
}

function StudentDashboardScreen({
  onViewBrief,
  onViewResult,
  onUnofficialNotes,
  onGoToRepository,
  calendarEvents,
  notices,
  currentPath,
  onNavigate,
  onLogout,
}: {
  onViewBrief: (assignmentId: string) => void
  onViewResult: () => void
  onUnofficialNotes: () => void
  onGoToRepository: () => void
  calendarEvents: AcademicEvent[]
  notices: DepartmentNotice[]
  currentPath: RoutePath
  onNavigate: (path: RoutePath) => void
  onLogout: () => void
}) {
  const { user } = useAuth()
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [previewTitle, setPreviewTitle] = useState('Document.pdf')
  const [dashboardData, setDashboardData] = useState<Awaited<ReturnType<typeof studentService.getDashboard>> | null>(null)
  const [dashboardError, setDashboardError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    studentService
      .getDashboard()
      .then((data) => {
        if (!active) return
        setDashboardData(data)
      })
      .catch((error) => {
        if (!active) return
        setDashboardError(error instanceof Error ? error.message : 'Failed to load dashboard data.')
      })

    return () => {
      active = false
    }
  }, [])

  const subjectOptions = dashboardData?.enrolledSubjects ?? []
  const notes = dashboardData?.recentNotes ?? []
  const textbooks = dashboardData?.textbooks ?? []
  const assignments = dashboardData?.assignments ?? []
  const visibleAssignments = assignments.slice(0, 3)
  const semester = dashboardData?.student.semester
    ? `Semester ${dashboardData.student.semester}`
    : user?.semester
      ? `Semester ${user.semester}`
      : 'Semester'
  const programme = dashboardData?.student.programme || user?.programme || 'Programme'

  const formatAssignmentDate = (date: string) =>
    new Date(date).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })

  const assignmentUi = (status: 'pending' | 'submitted' | 'graded', dueDate: string) => {
    if (status === 'graded') {
      return {
        icon: 'success',
        iconSymbol: 'grade',
        textClass: 'grade-text',
        text: 'Graded',
        pillClass: 'pill info',
        pillText: 'Graded',
        action: undefined,
        actionLabel: undefined,
        buttonClass: 'dashboard-btn-secondary dashboard-btn-small dashboard-assignment-action',
      }
    }

    if (status === 'submitted') {
      return {
        icon: 'info',
        iconSymbol: 'check_circle',
        textClass: 'status-success-text',
        text: 'Completed',
        pillClass: 'pill success',
        pillText: 'Submitted',
        action: onViewResult,
        actionLabel: 'View Result',
        buttonClass: 'dashboard-btn-secondary dashboard-btn-small dashboard-assignment-action',
      }
    }

    // eslint-disable-next-line react-hooks/purity -- Date.now() for "due in X days" is intentional
    const dueInDays = Math.ceil((new Date(dueDate).getTime() - Date.now()) / (24 * 60 * 60 * 1000))
    return {
      icon: 'warning',
      iconSymbol: 'warning',
      textClass: 'status-warning-text',
      text: dueInDays > 0 ? `Due in ${dueInDays} Day${dueInDays > 1 ? 's' : ''}` : 'Due date passed',
      pillClass: 'pill',
      pillText: 'Not Submitted',
      action: onViewBrief,
      actionLabel: 'View Brief',
      buttonClass: 'dashboard-btn-primary dashboard-btn-small dashboard-assignment-action',
    }
  }

  const [activeNotesTab, setActiveNotesTab] = useState<'official' | 'unofficial'>('official')
  const [selectedSubject, setSelectedSubject] = useState('')
  useEffect(() => {
    if (subjectOptions.length > 0) {
      setSelectedSubject((prev) => (prev === '' ? `${subjectOptions[0].code} - ${subjectOptions[0].name}` : prev))
    }
  }, [subjectOptions])

  const assignmentCalendarEvents: AcademicEvent[] = assignments.map((assignment) => ({
    id: `assignment-${assignment.id}`,
    title: assignment.title,
    date: assignment.dueDate,
    type: 'assignment',
    details: `${assignment.subjectCode} assignment deadline`,
    createdBy: 'Assignment',
    createdByRole: 'faculty',
    targetAudience: 'students',
  }))

  const mergedCalendarEvents = [
    ...assignmentCalendarEvents,
    ...calendarEvents.filter((event) => isEventVisibleToRole(event, 'student')),
  ]

  return (
    <div className="dashboard-page" aria-label="Student dashboard">
      <CommonDashboardHeader
        title="Student Dashboard"
        subtitle={`${semester} • ${programme}`}
        navItems={STUDENT_NAV_ITEMS}
        currentPath={currentPath}
        onNavigate={onNavigate}
        onLogout={onLogout}
        containerClassName="dashboard-container"
      />

      <main className="dashboard-container dashboard-main">
        {dashboardError ? (
          <section className="dashboard-card">
            <p style={{ color: '#b91c1c', fontWeight: 600 }}>{dashboardError}</p>
          </section>
        ) : null}
        <section className="dashboard-card">
          <div className="dashboard-section-title">
            <span className="material-symbols-outlined">notifications</span>
            <h2>Department Circulars</h2>
          </div>

          <div className="student-notification-list" aria-live="polite">
            {notices.slice(0, 4).map((notice) => (
              <article key={notice.id} className={`student-notification-item ${notice.urgent || isNoticeNew(notice.createdAt) ? 'highlight' : ''}`}>
                <div className="student-notification-head">
                  <h3>{notice.title}</h3>
                  <div className="notice-badges">
                    {notice.urgent ? <span className="notice-badge urgent">Urgent</span> : null}
                    {isNoticeNew(notice.createdAt) ? <span className="notice-badge new">New</span> : null}
                  </div>
                </div>
                <p>{notice.content}</p>
                <small>
                  {new Date(notice.createdAt).toLocaleString()} • {notice.author}
                </small>
              </article>
            ))}
          </div>
          <p className="student-notification-note">Informational only. Circulars are not clickable.</p>
        </section>

        <section className="dashboard-card">
          <div className="dashboard-section-title">
            <span className="material-symbols-outlined">filter_alt</span>
            <h2>Select Subject</h2>
          </div>

          <div className="dashboard-filter-grid">
            <div className="field-group">
              <label>Course</label>
              <div className="dashboard-static-field">{dashboardData?.student.programme || 'B.Tech Computer Science'}</div>
            </div>

            <div className="field-group">
              <label>Semester</label>
              <div className="dashboard-static-field">{dashboardData?.student.semester ? `Semester ${dashboardData.student.semester}` : 'Semester 5'}</div>
            </div>

            <div className="field-group">
              <label htmlFor="subject">Subject Code</label>
              <select
                id="subject"
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
              >
                {subjectOptions.length === 0 ? <option>No subjects found</option> : null}
                {subjectOptions.map((subject) => (
                  <option key={subject.id} value={`${subject.code} - ${subject.name}`}>
                    {subject.code} - {subject.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        <AcademicCalendarWidget events={mergedCalendarEvents} />

        <section className="dashboard-card">
          <div className="dashboard-notes-header">
            <div className="dashboard-tabs" role="tablist" aria-label="Notes type">
              <button
                type="button"
                className={`dashboard-tab ${activeNotesTab === 'official' ? 'dashboard-tab-active' : ''}`}
                onClick={() => setActiveNotesTab('official')}
              >
                Official Notes
              </button>
              <button
                type="button"
                className={`dashboard-tab ${activeNotesTab === 'unofficial' ? 'dashboard-tab-active' : ''}`}
                onClick={() => {
                  setActiveNotesTab('unofficial')
                  onUnofficialNotes()
                }}
              >
                Unofficial Notes
              </button>
            </div>

            <div className="dashboard-top-actions">
              <button type="button" className="dashboard-upload-btn" onClick={onGoToRepository}>
                <span className="material-symbols-outlined">folder_open</span>
                Open Repository
              </button>
            </div>
          </div>

          <div className="dashboard-table-wrap">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Chapter</th>
                  <th>Faculty / Author</th>
                  <th>Date</th>
                  <th className="notes-action-col">Action</th>
                </tr>
              </thead>
              <tbody>
                {notes.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="muted">No official notes found.</td>
                  </tr>
                ) : null}
                {notes.map((note) => (
                  <tr key={note.id}>
                    <td>{note.title}</td>
                    <td>{note.chapter || '-'}</td>
                    <td className="muted">{note.facultyName}</td>
                    <td className="muted">{new Date(note.uploadedAt).toLocaleDateString()}</td>
                    <td className="notes-action-col">
                      <div className="dashboard-action-icons">
                        <button
                          type="button"
                          className="dashboard-table-icon-btn"
                          aria-label="View note"
                          onClick={() => {
                            setPreviewTitle(note.title)
                            setIsPreviewOpen(true)
                          }}
                        >
                          <span className="material-symbols-outlined">visibility</span>
                        </button>
                        <a href={note.downloadUrl} target="_blank" rel="noreferrer" className="dashboard-table-icon-btn" aria-label="Download note">
                          <span className="material-symbols-outlined">download</span>
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="dashboard-card">
          <div className="dashboard-section-title">
            <span className="material-symbols-outlined">menu_book</span>
            <h2>Recommended Textbooks</h2>
          </div>

          <div className="dashboard-textbooks-grid">
            {textbooks.length === 0 ? (
              <article className="dashboard-item-row">
                <div>
                  <h3>No textbooks available</h3>
                  <p>Faculty-uploaded textbooks will appear here.</p>
                </div>
              </article>
            ) : null}
            {textbooks.map((book) => (
              <article key={book.id} className="dashboard-item-row">
                <div>
                  <h3>{book.title}</h3>
                  <p>{book.author} • {book.edition}</p>
                </div>
                <a href={book.downloadUrl} target="_blank" rel="noreferrer" className="dashboard-icon-btn" aria-label={`Download ${book.title}`}>
                  <span className="material-symbols-outlined">download</span>
                </a>
              </article>
            ))}
          </div>
        </section>

        <section className="dashboard-card">
          <div className="dashboard-section-title">
            <span className="material-symbols-outlined">assignment</span>
            <h2>Recent Assignments</h2>
          </div>

          <div className="dashboard-assignment-list">
            {visibleAssignments.length === 0 ? (
              <article className="dashboard-assignment-row">
                <div className="dashboard-assignment-left">
                  <div className="dashboard-assignment-content">
                    <h3>No assignments available</h3>
                    <p>New assignments will appear here.</p>
                  </div>
                </div>
              </article>
            ) : null}
            {visibleAssignments.map((assignment) => {
              const ui = assignmentUi(assignment.status, assignment.dueDate)
              return (
                <article key={assignment.id} className="dashboard-assignment-row">
                  <div className="dashboard-assignment-left">
                    <div className={`dashboard-assignment-icon ${ui.icon}`}>
                      <span className="material-symbols-outlined">{ui.iconSymbol}</span>
                    </div>
                    <div className="dashboard-assignment-content">
                      <h3>{assignment.title}</h3>
                      <p>Subject: {assignment.subjectCode} • {formatAssignmentDate(assignment.dueDate)}</p>
                    </div>
                  </div>
                  <div className="dashboard-assignment-right">
                    <div className="dashboard-assignment-meta">
                      <p className={ui.textClass}>{assignment.grade ? `Grade: ${assignment.grade}` : ui.text}</p>
                      <span className={ui.pillClass}>{ui.pillText}</span>
                    </div>
                    {ui.action != null && ui.actionLabel != null ? (
                      <button type="button" className={ui.buttonClass} onClick={() => ui.action?.(assignment.id)}>
                        {ui.actionLabel}
                      </button>
                    ) : null}
                  </div>
                </article>
              )
            })}
          </div>
        </section>
      </main>

      <CommonDashboardFooter containerClassName="dashboard-container" />
      <PdfPreviewModal
        isOpen={isPreviewOpen}
        title={previewTitle}
        onClose={() => setIsPreviewOpen(false)}
      />
    </div>
  )
}

function FacultyVerificationScreen({
  currentPath,
  onNavigate,
  onLogout,
}: {
  currentPath: RoutePath
  onNavigate: (path: RoutePath) => void
  onLogout: () => void
}) {
  const [notes, setNotes] = useState<Awaited<ReturnType<typeof facultyService.getPendingNotes>>>([])
  const [notesLoading, setNotesLoading] = useState(true)
  const [notesError, setNotesError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({})
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [previewTitle, setPreviewTitle] = useState('Document.pdf')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')

  const loadNotes = () => {
    setNotesLoading(true)
    setNotesError(null)
    facultyService
      .getPendingNotes()
      .then(setNotes)
      .catch((err) => setNotesError(err instanceof Error ? err.message : 'Failed to load notes'))
      .finally(() => setNotesLoading(false))
  }

  useEffect(() => {
    loadNotes()
  }, [])

  const handleApprove = async (noteId: string) => {
    setIsLoading((prev) => ({ ...prev, [noteId]: true }))
    try {
      await facultyService.verifyNote(noteId, 'approve')
      loadNotes()
    } catch (error) {
      console.error('Failed to approve note:', error)
    } finally {
      setIsLoading((prev) => ({ ...prev, [noteId]: false }))
    }
  }

  const handleReject = async (noteId: string) => {
    setIsLoading((prev) => ({ ...prev, [noteId]: true }))
    try {
      await facultyService.verifyNote(noteId, 'reject')
      loadNotes()
    } catch (error) {
      console.error('Failed to reject note:', error)
    } finally {
      setIsLoading((prev) => ({ ...prev, [noteId]: false }))
    }
  }

  const filteredNotes = notes.filter((note) => {
    const matchStatus = !statusFilter || note.status === statusFilter
    const q = searchQuery.trim().toLowerCase()
    const matchSearch = !q || note.student.name.toLowerCase().includes(q) || (note.student.usn && note.student.usn.toLowerCase().includes(q)) || note.title.toLowerCase().includes(q)
    return matchStatus && matchSearch
  })

  return (
    <div className="faculty-page" aria-label="Student notes verification panel">
      <CommonDashboardHeader
        title="Faculty Verification"
        subtitle="Verification Panel"
        navItems={[
          { label: 'Dashboard', path: '/faculty_dashboard' },
          { label: 'Verification', path: '/faculty_verification' },
          { label: 'Textbooks', path: '/faculty_textbook_upload' },
          { label: 'Assignments', path: '/faculty_assignment_submissions' },
        ]}
        currentPath={currentPath}
        onNavigate={onNavigate}
        onLogout={onLogout}
        containerClassName="faculty-container"
      />

      <main className="faculty-container faculty-main">
        <div className="faculty-verify-page-title">
          <h2>Student Notes Verification</h2>
          <div />
        </div>

        <section className="faculty-verify-filters">
          <div className="faculty-verify-search">
            <span className="material-symbols-outlined">search</span>
            <input
              type="text"
              placeholder="Search Student Name or USN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="verified">Verified</option>
            <option value="rejected">Rejected</option>
          </select>
        </section>

        {notesError ? (
          <section className="dashboard-card">
            <p style={{ color: '#b91c1c', fontWeight: 600 }}>{notesError}</p>
          </section>
        ) : null}

        <section className="dashboard-card faculty-verify-table-card">
          <div className="dashboard-table-wrap">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>USN</th>
                  <th>Note Title</th>
                  <th>Chapter</th>
                  <th>Upload Date</th>
                  <th>Status</th>
                  <th className="align-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {notesLoading ? (
                  <tr>
                    <td colSpan={7}>Loading notes…</td>
                  </tr>
                ) : filteredNotes.length === 0 ? (
                  <tr>
                    <td colSpan={7}>No notes to show.</td>
                  </tr>
                ) : (
                  filteredNotes.map((note) => (
                    <tr key={note.id}>
                      <td>{note.student.name}</td>
                      <td className="muted">{note.student.usn}</td>
                      <td>
                        <div className="faculty-note-cell">
                          <span>{note.title}</span>
                          {note.status === 'pending' ? <span className="faculty-new-tag">NEW</span> : null}
                        </div>
                      </td>
                      <td className="muted">{note.chapter || '—'}</td>
                      <td className="muted">{note.uploadedAt ? new Date(note.uploadedAt).toLocaleDateString() : '—'}</td>
                      <td>
                        <span className={`faculty-status-badge ${note.status}`}>
                          {note.status === 'verified' ? 'Verified' : note.status === 'rejected' ? 'Rejected' : 'Pending'}
                        </span>
                      </td>
                      <td className="align-right">
                        <div className={`faculty-row-actions ${note.status !== 'pending' ? 'disabled' : ''}`}>
                          <button
                            type="button"
                            className="faculty-preview-btn"
                            disabled={note.status !== 'pending'}
                            onClick={() => setPreviewTitle(`${note.title}.pdf`)}
                          >
                            Preview
                          </button>
                          <button
                            type="button"
                            className="faculty-approve-btn"
                            onClick={() => handleApprove(note.id)}
                            disabled={note.status !== 'pending' || isLoading[note.id]}
                          >
                            {isLoading[note.id] ? 'Processing...' : 'Approve'}
                          </button>
                          <button
                            type="button"
                            className="faculty-reject-btn"
                            onClick={() => handleReject(note.id)}
                            disabled={note.status !== 'pending' || isLoading[note.id]}
                          >
                            {isLoading[note.id] ? 'Processing...' : 'Reject'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      <footer className="dashboard-footer faculty-container">
        <div>
          <p>©  StudySync, Made by Kairos with ❤️</p>
        </div>
      </footer>
      <PdfPreviewModal
        isOpen={isPreviewOpen}
        title={previewTitle}
        onClose={() => setIsPreviewOpen(false)}
      />
    </div>
  )
}

function FacultyTextbookUploadScreen({
  currentPath,
  onNavigate,
  onLogout,
}: {
  currentPath: RoutePath
  onNavigate: (path: RoutePath) => void
  onLogout: () => void
}) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    edition: '',
    subjectId: '',
  })
  const [file, setFile] = useState<File | null>(null)
  const [subjects, setSubjects] = useState<Array<{ id: string; code: string; name: string }>>([])
  const [textbooks, setTextbooks] = useState<Awaited<ReturnType<typeof filesService.listFiles>>>([])
  const [textbooksLoading, setTextbooksLoading] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { user } = useAuth()

  const loadTextbooks = () => {
    setTextbooksLoading(true)
    filesService
      .listFiles({ category: 'textbook', uploadedBy: user?.id })
      .then(setTextbooks)
      .catch(() => setTextbooks([]))
      .finally(() => setTextbooksLoading(false))
  }

  useEffect(() => {
    loadTextbooks()
  }, [user?.id])

  useEffect(() => {
    let active = true
    adminService
      .getSubjects()
      .then((items) => {
        if (!active) return
        setSubjects(items.map((subject) => ({ id: subject.id, code: subject.code, name: subject.name })))
      })
      .catch((err) => {
        if (!active) return
        console.error('Failed to load subjects:', err)
      })

    return () => {
      active = false
    }
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      try {
        enforceSupportedUploadFile(selectedFile, 50 * 1024 * 1024)
        setFile(selectedFile)
        setError(null)
      } catch (err) {
        setError(err instanceof FileUploadError ? err.message : 'Invalid file')
      }
    }
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)

    if (!formData.title || !formData.author || !file) {
      setError('Please fill in all required fields and select a file')
      return
    }

    setIsLoading(true)

    try {
      await facultyService.uploadTextbook({
        file,
        title: formData.title,
        author: formData.author,
        edition: formData.edition,
        subjectId: formData.subjectId || undefined,
      })
      setIsModalOpen(false)
      setFormData({ title: '', author: '', edition: '', subjectId: '' })
      setFile(null)
      loadTextbooks()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="textbook-page" aria-label="Textbook management panel">
      {isModalOpen ? <div className="textbook-modal-overlay" /> : null}

      <CommonDashboardHeader
        title="Faculty Textbooks"
        subtitle="Textbook Management"
        navItems={[
          { label: 'Dashboard', path: '/faculty_dashboard' },
          { label: 'Verification', path: '/faculty_verification' },
          { label: 'Textbooks', path: '/faculty_textbook_upload' },
          { label: 'Assignments', path: '/faculty_assignment_submissions' },
        ]}
        currentPath={currentPath}
        onNavigate={onNavigate}
        onLogout={onLogout}
        containerClassName="faculty-container"
      />

      <main className="faculty-container textbook-main">
        <div className="textbook-title-row">
          <div>
            <h2>Textbook Management</h2>
            <div />
          </div>
          <button type="button" className="textbook-upload-btn" onClick={() => setIsModalOpen(true)}>
            <span className="material-symbols-outlined">upload_file</span>
            Upload Textbook
          </button>
        </div>

        <section className="textbook-list-card">
          <div className="textbook-list-head">
            <div>Book Details</div>
            <div>Size</div>
            <div>Upload Date</div>
            <div className="align-right">Action</div>
          </div>
          <div className="textbook-list-body">
            {textbooksLoading ? (
              <article className="textbook-list-row">
                <div className="textbook-book-cell">
                  <p>Loading textbooks…</p>
                </div>
              </article>
            ) : textbooks.length === 0 ? (
              <article className="textbook-list-row">
                <div className="textbook-book-cell">
                  <p>No textbooks uploaded yet. Use Upload Textbook to add one.</p>
                </div>
              </article>
            ) : (
              textbooks.map((book) => (
                <article key={book.id} className="textbook-list-row">
                  <div className="textbook-book-cell">
                    <div className="textbook-icon-cell">
                      <span className="material-symbols-outlined">book_2</span>
                    </div>
                    <div>
                      <h3>{book.name}</h3>
                      <p>{book.mimeType ?? '—'}</p>
                    </div>
                  </div>
                  <div>
                    <p>{book.size != null ? formatFileSize(Number(book.size)) : '—'}</p>
                  </div>
                  <div>
                    <p>{book.createdTime ? new Date(book.createdTime).toLocaleDateString() : '—'}</p>
                  </div>
                  <div className="align-right">
                    <a
                      href={book.webViewLink || book.webContentLink || '#'}
                      target="_blank"
                      rel="noreferrer"
                      className="faculty-icon-danger"
                      aria-label={`Open ${book.name}`}
                    >
                      <span className="material-symbols-outlined">open_in_new</span>
                    </a>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>

        <div className="textbook-sync-note">
          <span className="material-symbols-outlined">sync</span>
          <p>All uploaded books are automatically synced to the student dashboard.</p>
        </div>
      </main>

      {isModalOpen ? (
        <div className="textbook-modal-wrap" role="dialog" aria-modal="true" aria-label="Upload new textbook">
          <div className="textbook-modal-card">
            <div className="textbook-modal-head">
              <div>
                <h3>Upload New Textbook</h3>
                <p>Fill in the details to add a new resource to the repository.</p>
              </div>
              <button type="button" onClick={() => setIsModalOpen(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form className="textbook-modal-form" onSubmit={handleSubmit}>
              {error && (
                <div style={{ padding: '0.75rem', background: '#fee2e2', color: '#991b1b', borderRadius: '0.5rem', marginBottom: '1rem', fontSize: '0.875rem' }}>
                  {error}
                </div>
              )}
              <div>
                <label htmlFor="book-title">Book Title</label>
                <input
                  id="book-title"
                  name="title"
                  type="text"
                  placeholder="e.g. Modern Operating Systems"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="textbook-modal-grid">
                <div>
                  <label htmlFor="author">Author Name</label>
                  <input
                    id="author"
                    name="author"
                    type="text"
                    placeholder="e.g. Andrew S. Tanenbaum"
                    value={formData.author}
                    onChange={handleChange}
                    required
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <label htmlFor="edition">
                    Edition <span className="field-optional">(Optional)</span>
                  </label>
                  <select
                    id="edition"
                    name="edition"
                    value={formData.edition}
                    onChange={handleChange}
                    disabled={isLoading}
                  >
                    <option value="">Select Edition</option>
                    <option value="1st">1st Edition</option>
                    <option value="2nd">2nd Edition</option>
                    <option value="3rd">3rd Edition</option>
                    <option value="4th">4th Edition</option>
                    <option value="5th+">5th Edition or newer</option>
                  </select>
                </div>
              </div>
              <div>
                <label htmlFor="textbook-subject">Subject</label>
                <select
                  id="textbook-subject"
                  name="subjectId"
                  value={formData.subjectId}
                  onChange={handleChange}
                  disabled={isLoading}
                >
                  <option value="">Select Subject (optional)</option>
                  {subjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.code} - {subject.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label>Book Document</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={SUPPORTED_UPLOAD_ACCEPT}
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />
                <label
                  className="textbook-file-dropzone"
                  onClick={() => fileInputRef.current?.click()}
                  style={{ cursor: 'pointer' }}
                >
                  <div>
                    <span className="material-symbols-outlined">picture_as_pdf</span>
                  </div>
                  <p>Click or drag file to upload</p>
                  {file && <p style={{ color: '#059669', fontWeight: '600' }}>{file.name} ({formatFileSize(file.size)})</p>}
                  <p>Files will be encrypted and stored securely</p>
                </label>
                <p className="textbook-file-help">Maximum file size: 50MB. Supported: {SUPPORTED_UPLOAD_LABEL}.</p>
              </div>
              <div className="textbook-modal-actions">
                <button type="submit" className="textbook-publish-btn" disabled={isLoading || !file}>
                  {isLoading ? 'Uploading...' : 'Upload &amp; Publish'}
                </button>
                <button type="button" className="textbook-cancel-btn" onClick={() => setIsModalOpen(false)} disabled={isLoading}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      <footer className="dashboard-footer faculty-container">
        <div>
          <p>©  StudySync, Made by Kairos with ❤️</p>
        </div>
      </footer>
    </div>
  )
}

function FacultyCreateAssignmentScreen({
  onBackToDashboard,
}: {
  onBackToDashboard?: () => void
}) {
  const [isCreated, setIsCreated] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    subjectId: '',
    instructions: '',
    totalMarks: '',
    dueDate: '',
    allowLateSubmission: false,
  })
  const [resourceFiles, setResourceFiles] = useState<File[]>([])
  const [subjects, setSubjects] = useState<Array<{ id: string; code: string; name: string }>>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let active = true
    adminService
      .getSubjects()
      .then((items) => {
        if (!active) return
        setSubjects(items.map((subject) => ({ id: subject.id, code: subject.code, name: subject.name })))
      })
      .catch((err) => {
        if (!active) return
        setError(err instanceof Error ? err.message : 'Failed to load subjects')
      })

    return () => {
      active = false
    }
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value
    setFormData({ ...formData, [e.target.name]: value })
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
      try {
        newFiles.forEach((file) => {
          enforceSupportedUploadFile(file, 50 * 1024 * 1024)
        })
        setResourceFiles((prev) => [...prev, ...newFiles])
        setError(null)
      } catch (err) {
        setError(err instanceof FileUploadError ? err.message : 'Invalid file')
      }
    }
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)

    if (!formData.title || !formData.subjectId || !formData.instructions || !formData.totalMarks || !formData.dueDate) {
      setError('Please fill in all required fields')
      return
    }

    setIsLoading(true)

    try {
      await assignmentService.createAssignment({
        title: formData.title,
        subjectId: formData.subjectId,
        instructions: formData.instructions,
        totalMarks: parseInt(formData.totalMarks),
        dueDate: formData.dueDate,
        allowLateSubmission: formData.allowLateSubmission,
        resources: resourceFiles,
      })
      setIsCreated(true)
      setTimeout(() => {
        if (onBackToDashboard) {
          onBackToDashboard()
        }
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create assignment')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="create-assignment-page" aria-label="Create assignment">
      <header className="create-assignment-header">
        <div className="create-assignment-container create-assignment-header-row">
          <div className="create-assignment-brand">
            <div className="create-assignment-brand-icon">
              <span className="material-symbols-outlined">school</span>
            </div>
            <h1>UniRepo</h1>
          </div>
          <nav className="create-assignment-nav">
            <button type="button" onClick={onBackToDashboard} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: 'inherit', fontFamily: 'inherit' }}>
              Dashboard
            </button>
            <a href="#" className="active">
              Assignments
            </a>
            <a href="#">Subjects</a>
            <a href="#">Resources</a>
          </nav>
          <div className="create-assignment-header-right">
            <button type="button" className="create-assignment-notify">
              <span className="material-symbols-outlined">notifications</span>
            </button>
            <div className="dashboard-avatar">
              <span className="material-symbols-outlined">account_circle</span>
            </div>
          </div>
        </div>
      </header>

      <main className="create-assignment-main">
        <div className="create-assignment-title">
          <h2>Create Assignment</h2>
          <div />
        </div>

        <form className="create-assignment-form" onSubmit={handleSubmit}>
          {error && (
            <div style={{ padding: '0.75rem', background: '#fee2e2', color: '#991b1b', borderRadius: '0.5rem', marginBottom: '1rem', fontSize: '0.875rem' }}>
              {error}
            </div>
          )}
          <section className="create-assignment-card">
            <div className="create-assignment-section-title">
              <span className="material-symbols-outlined">info</span>
              <h3>General Info</h3>
            </div>
            <div className="create-assignment-fields">
              <div>
                <label htmlFor="assignment-title">Assignment Title</label>
                <input
                  id="assignment-title"
                  name="title"
                  type="text"
                  placeholder="e.g., Introduction to Algorithms"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                />
              </div>
              <div>
                <label htmlFor="assignment-subject">Subject</label>
                <select
                  id="assignment-subject"
                  name="subjectId"
                  value={formData.subjectId}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                >
                  <option value="">Select subject</option>
                  {subjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.code} - {subject.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="assignment-instructions">Instructions</label>
                <textarea
                  id="assignment-instructions"
                  name="instructions"
                  rows={6}
                  placeholder="Provide detailed steps for students..."
                  value={formData.instructions}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                />
              </div>
            </div>
          </section>

          <section className="create-assignment-card">
            <div className="create-assignment-section-title">
              <span className="material-symbols-outlined">calendar_today</span>
              <h3>Grading &amp; Timeline</h3>
            </div>
            <div className="create-assignment-grid">
              <div>
                <label htmlFor="assignment-marks">Total Marks</label>
                <div className="create-assignment-marks-wrap">
                  <input
                    id="assignment-marks"
                    name="totalMarks"
                    type="number"
                    placeholder="100"
                    value={formData.totalMarks}
                    onChange={handleChange}
                    required
                    disabled={isLoading}
                  />
                  <span>pts</span>
                </div>
              </div>
              <div>
                <label htmlFor="assignment-due">Due Date &amp; Time</label>
                <input
                  id="assignment-due"
                  name="dueDate"
                  type="datetime-local"
                  value={formData.dueDate}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                />
              </div>
            </div>
          </section>

          <section className="create-assignment-card">
            <div className="create-assignment-section-title">
              <span className="material-symbols-outlined">attach_file</span>
              <h3>Resources</h3>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept={SUPPORTED_UPLOAD_ACCEPT}
              multiple
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
            <label
              className="create-assignment-dropzone"
              onClick={() => fileInputRef.current?.click()}
              style={{ cursor: 'pointer' }}
            >
              <div>
                <span className="material-symbols-outlined">upload_file</span>
              </div>
              <p>
                <span>Click to upload</span> or drag and drop reference files
              </p>
              {resourceFiles.length > 0 && (
                <p style={{ color: '#059669', fontWeight: '600', marginTop: '0.5rem' }}>
                  {resourceFiles.length} file(s) selected
                </p>
              )}
              <p>{SUPPORTED_UPLOAD_LABEL} (max. 50MB)</p>
            </label>
          </section>

          <section className="create-assignment-card">
            <div className="create-assignment-toggle-row">
              <div>
                <h3>Allow Late Submission</h3>
                <p>Students can submit after the deadline with a penalty</p>
              </div>
              <label className="create-assignment-switch">
                <input
                  type="checkbox"
                  name="allowLateSubmission"
                  checked={formData.allowLateSubmission}
                  onChange={(e) => setFormData({ ...formData, allowLateSubmission: e.target.checked })}
                  disabled={isLoading}
                />
                <span />
              </label>
            </div>
          </section>

          <div className="create-assignment-actions">
            {error && (
              <div style={{ padding: '0.75rem', background: '#fee2e2', color: '#991b1b', borderRadius: '0.5rem', marginBottom: '1rem', fontSize: '0.875rem', width: '100%' }}>
                {error}
              </div>
            )}
            {isCreated ? (
              <div style={{ padding: '1rem', textAlign: 'center', color: '#059669', width: '100%' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '3rem' }}>check_circle</span>
                <p style={{ marginTop: '0.5rem', fontWeight: '600' }}>Assignment Created Successfully!</p>
                <p style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>Redirecting to dashboard...</p>
              </div>
            ) : (
              <>
                <button type="submit" className="create-assignment-publish" disabled={isLoading}>
                  <span className="material-symbols-outlined">publish</span>
                  {isLoading ? 'Creating...' : 'Publish Assignment'}
                </button>
                <div>
                  <span className="material-symbols-outlined">info</span>
                  <p>This assignment will be visible to students under this subject.</p>
                </div>
              </>
            )}
          </div>
        </form>
      </main>

      <footer className="create-assignment-footer">
        <p>©  StudySync, Made by Kairos with ❤️</p>
      </footer>
    </div>
  )
}

function FacultyAssignmentSubmissionsScreen({
  onGrade,
  currentPath,
  onNavigate,
  onLogout,
}: {
  onGrade: (assignmentId: string, submissionId: string) => void
  currentPath: RoutePath
  onNavigate: (path: RoutePath) => void
  onLogout: () => void
}) {
  const [assignments, setAssignments] = useState<Array<{ id: string; title: string; subjectCode: string }>>([])
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>('')
  const [submissionsData, setSubmissionsData] = useState<{
    assignment: { id: string; title: string; subjectCode: string; totalMarks: number }
    submissions: Array<{
      id: string
      student: { id: string; name: string; usn: string }
      submittedAt: string
      status: string
      isLate: boolean
      grade?: { marks: number; grade: string }
    }>
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [submissionsLoading, setSubmissionsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const tid = setTimeout(() => { if (!cancelled) setLoading(true); setError(null) }, 0)
    assignmentService
      .getAssignments()
      .then((list) => {
        if (cancelled) return
        setAssignments(list.map((a) => ({ id: a.id, title: a.title, subjectCode: a.subjectCode })))
        if (list.length > 0 && !selectedAssignmentId) setSelectedAssignmentId(list[0].id)
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load assignments')
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true; clearTimeout(tid) }
  }, [])

  useEffect(() => {
    if (!selectedAssignmentId) {
      const id = setTimeout(() => setSubmissionsData(null), 0)
      return () => clearTimeout(id)
    }
    let cancelled = false
    const tid = setTimeout(() => { if (!cancelled) setSubmissionsLoading(true) }, 0)
    assignmentService
      .getAssignmentSubmissions(selectedAssignmentId)
      .then((data) => {
        if (cancelled) return
        setSubmissionsData({
          assignment: {
            id: data.assignment.id,
            title: data.assignment.title,
            subjectCode: data.assignment.subjectCode,
            totalMarks: data.assignment.totalMarks,
          },
          submissions: data.submissions.map((s) => ({
            id: s.id,
            student: s.student,
            submittedAt: s.submittedAt,
            status: s.status,
            isLate: s.isLate,
            grade: s.grade,
          })),
        })
      })
      .catch(() => { if (!cancelled) setSubmissionsData(null) })
      .finally(() => { if (!cancelled) setSubmissionsLoading(false) })
    return () => { cancelled = true; clearTimeout(tid) }
  }, [selectedAssignmentId])

  const submittedCount = submissionsData?.submissions.filter((s) => s.status === 'submitted' || s.status === 'late').length ?? 0
  const pendingCount = submissionsData?.submissions.filter((s) => s.status === 'pending').length ?? 0
  const lateCount = submissionsData?.submissions.filter((s) => s.isLate).length ?? 0

  return (
    <div className="faculty-submissions-page" aria-label="Assignment submissions overview">
      <CommonDashboardHeader
        title="Assignment Submissions"
        subtitle="Grading and Review"
        navItems={[
          { label: 'Dashboard', path: '/faculty_dashboard' },
          { label: 'Verification', path: '/faculty_verification' },
          { label: 'Textbooks', path: '/faculty_textbook_upload' },
          { label: 'Assignments', path: '/faculty_assignment_submissions' },
        ]}
        currentPath={currentPath}
        onNavigate={onNavigate}
        onLogout={onLogout}
        containerClassName="faculty-submissions-container"
      />

      <main className="faculty-submissions-container faculty-submissions-main">
        <section className="faculty-submissions-title-block">
          <h1>Assignment Submissions</h1>
          <div className="faculty-submissions-title-accent" aria-hidden="true" />
          <div className="faculty-submissions-actions">
            <label htmlFor="faculty-assignment-select">Assignment</label>
            <select
              id="faculty-assignment-select"
              value={selectedAssignmentId}
              onChange={(e) => setSelectedAssignmentId(e.target.value)}
              disabled={loading}
            >
              <option value="">Select assignment</option>
              {assignments.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.subjectCode} – {a.title}
                </option>
              ))}
            </select>
          </div>
          {submissionsData && (
            <p>
              Review and grade student submissions for {submissionsData.assignment.title}.
            </p>
          )}
        </section>

        {error && (
          <div className="search-empty-state">
            <span className="material-symbols-outlined">error_outline</span>
            <p>{error}</p>
          </div>
        )}

        {submissionsData && (
          <>
            <section className="faculty-submissions-stats">
              <article className="faculty-submissions-stat-card">
                <div>
                  <p>Total Submissions</p>
                  <span className="material-symbols-outlined">group</span>
                </div>
                <h3>{submissionsData.submissions.length}</h3>
                <small>Enrolled</small>
              </article>
              <article className="faculty-submissions-stat-card">
                <div>
                  <p>Submitted</p>
                  <span className="material-symbols-outlined text-success">check_circle</span>
                </div>
                <h3 className="text-success">{submittedCount}</h3>
                <small className="text-success">Complete</small>
              </article>
              <article className="faculty-submissions-stat-card">
                <div>
                  <p>Pending</p>
                  <span className="material-symbols-outlined">hourglass_empty</span>
                </div>
                <h3 className="text-muted">{pendingCount}</h3>
                <small>No submission yet</small>
              </article>
              <article className="faculty-submissions-stat-card">
                <div>
                  <p>Late</p>
                  <span className="material-symbols-outlined text-warning">error</span>
                </div>
                <h3 className="text-warning">{lateCount}</h3>
                <small>After deadline</small>
              </article>
            </section>

            <section className="faculty-submissions-table-card">
              <div className="faculty-submissions-table-head">
                <h2>{submissionsData.assignment.title}</h2>
              </div>
              {submissionsLoading ? (
                <p>Loading submissions…</p>
              ) : (
                <div className="dashboard-table-wrap">
                  <table className="dashboard-table">
                    <thead>
                      <tr>
                        <th>Student Name</th>
                        <th>USN</th>
                        <th>Submission Time</th>
                        <th>Status</th>
                        <th className="align-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {submissionsData.submissions.map((sub) => {
                        const hasSubmission = sub.status === 'submitted' || sub.status === 'late'
                        const initials = sub.student.name.split(/\s+/).map((n) => n[0]).join('').toUpperCase().slice(0, 2)
                        return (
                          <tr key={sub.id}>
                            <td>
                              <div className="faculty-submissions-student">
                                <span>{initials}</span>
                                <strong>{sub.student.name}</strong>
                              </div>
                            </td>
                            <td className="muted">{sub.student.usn}</td>
                            <td className="muted">
                              {hasSubmission ? new Date(sub.submittedAt).toLocaleString() : 'No submission'}
                            </td>
                            <td>
                              <span
                                className={`faculty-submissions-badge ${
                                  sub.status === 'pending' ? 'pending' : sub.isLate ? 'late' : 'submitted'
                                }`}
                              >
                                {sub.status === 'pending' ? 'Pending' : sub.isLate ? 'Late' : 'Submitted'}
                              </span>
                            </td>
                            <td className="align-right">
                              <div className="faculty-submissions-row-actions">
                                <button type="button" className="faculty-submissions-view-btn" disabled={!hasSubmission}>
                                  View Submission
                                </button>
                                <button
                                  type="button"
                                  className="faculty-submissions-grade-btn"
                                  disabled={!hasSubmission}
                                  onClick={() => hasSubmission && onGrade(submissionsData.assignment.id, sub.id)}
                                >
                                  Grade
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}

        {!loading && !error && assignments.length === 0 && (
          <div className="search-empty-state">
            <span className="material-symbols-outlined">assignment</span>
            <p>No assignments yet. Create one from the dashboard.</p>
          </div>
        )}
      </main>

      <footer className="faculty-submissions-footer faculty-submissions-container">
        <div>
          <p>©  StudySync, Made by Kairos with ❤️</p>
        </div>
      </footer>
    </div>
  )
}

const GRADING_STORAGE_KEY = 'kairos_grading_submission'

function FacultyGradeSubmissionScreen({
  onBack,
}: {
  onBack: () => void
}) {
  const [assignmentId, setAssignmentId] = useState<string | null>(null)
  const [submissionId, setSubmissionId] = useState<string | null>(null)
  const [assignment, setAssignment] = useState<{ title: string; subjectCode: string; totalMarks: number } | null>(null)
  const [submission, setSubmission] = useState<{
    student: { name: string; usn: string }
    submittedAt: string
    files: Array<{ fileName: string; fileUrl: string; fileSize?: number }>
    grade?: { marks: number; grade: string; feedback: string }
  } | null>(null)
  const [marks, setMarks] = useState('')
  const [gradeLetter, setGradeLetter] = useState('')
  const [feedback, setFeedback] = useState('')
  const [isReleased, setIsReleased] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const tid = setTimeout(() => {
      try {
        const raw = sessionStorage.getItem(GRADING_STORAGE_KEY)
        if (raw) {
          const { assignmentId: aid, submissionId: sid } = JSON.parse(raw) as { assignmentId: string; submissionId: string }
          setAssignmentId(aid)
          setSubmissionId(sid)
        }
      } catch {
        setAssignmentId(null)
        setSubmissionId(null)
      }
    }, 0)
    return () => clearTimeout(tid)
  }, [])

  useEffect(() => {
    if (!assignmentId || !submissionId) {
      const tid = setTimeout(() => setLoading(false), 0)
      return () => clearTimeout(tid)
    }
    let cancelled = false
    const tid = setTimeout(() => { if (!cancelled) setLoading(true) }, 0)
    assignmentService
      .getAssignmentSubmissions(assignmentId)
      .then((data) => {
        if (cancelled) return
        const sub = data.submissions.find((s) => s.id === submissionId)
        if (data.assignment && sub) {
          setAssignment({
            title: data.assignment.title,
            subjectCode: data.assignment.subjectCode,
            totalMarks: data.assignment.totalMarks,
          })
          setSubmission({
            student: sub.student,
            submittedAt: sub.submittedAt,
            files: (sub.files ?? []).map((f) => ({ fileName: f.fileName, fileUrl: f.fileUrl, fileSize: f.fileSize })),
            grade: sub.grade,
          })
          if (sub.grade) {
            setMarks(String(sub.grade.marks))
            setGradeLetter(sub.grade.grade)
            setFeedback(sub.grade.feedback ?? '')
          }
        }
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true; clearTimeout(tid) }
  }, [assignmentId, submissionId])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!submissionId) return
    const numMarks = Number(marks)
    if (Number.isNaN(numMarks) || numMarks < 0) {
      setSaveError('Enter valid marks')
      return
    }
    if (assignment && numMarks > assignment.totalMarks) {
      setSaveError(`Marks cannot exceed ${assignment.totalMarks}`)
      return
    }
    setSaving(true)
    setSaveError(null)
    assignmentService
      .gradeSubmission(submissionId, {
        marks: numMarks,
        grade: gradeLetter || undefined,
        feedback: feedback || undefined,
        isReleased,
      })
      .then(() => {
        setSaveSuccess(true)
        sessionStorage.removeItem(GRADING_STORAGE_KEY)
      })
      .catch((err) => setSaveError(err instanceof Error ? err.message : 'Failed to save grade'))
      .finally(() => setSaving(false))
  }

  if (!assignmentId || !submissionId) {
    return (
      <div className="faculty-grade-page" aria-label="Faculty grading">
        <main className="faculty-grade-container faculty-grade-main">
          <div className="search-empty-state">
            <span className="material-symbols-outlined">assignment</span>
            <p>Select a submission from the Assignment Submissions list to grade.</p>
            <button type="button" className="dashboard-btn-primary" onClick={onBack}>
              Back to Submissions
            </button>
          </div>
        </main>
      </div>
    )
  }

  if (loading || !assignment || !submission) {
    return (
      <div className="faculty-grade-page">
        <main className="faculty-grade-container faculty-grade-main">
          <p>Loading…</p>
        </main>
      </div>
    )
  }

  const maxMarks = assignment.totalMarks

  return (
    <div className="faculty-grade-page" aria-label="Faculty grading and feedback">
      <header className="faculty-grade-header">
        <div className="faculty-grade-container faculty-grade-header-row">
          <div className="faculty-grade-brand">
            <div className="faculty-grade-brand-icon">
              <span className="material-symbols-outlined">school</span>
            </div>
            <h2>Institutional Grading Portal</h2>
          </div>
          <nav className="faculty-grade-nav">
            <button type="button" className="faculty-grade-nav-link" onClick={onBack}>
              Back to Submissions
            </button>
          </nav>
        </div>
      </header>

      <main className="faculty-grade-container faculty-grade-main">
        {saveSuccess && (
          <div className="faculty-grade-success">
            <span className="material-symbols-outlined">check_circle</span>
            <p>Grade saved successfully</p>
          </div>
        )}

        <section className="faculty-grade-title">
          <div className="faculty-grade-breadcrumb">
            <span>{assignment.subjectCode}</span>
            <span className="material-symbols-outlined">chevron_right</span>
            <span>{assignment.title}</span>
          </div>
          <h1>Grade Submission: {submission.student.name}</h1>
          <div className="faculty-grade-title-accent" />
        </section>

        <div className="faculty-grade-layout">
          <section className="faculty-grade-left">
            <article className="faculty-grade-card">
              <h3>
                <span className="material-symbols-outlined">person</span>
                Submission Details
              </h3>
              <div className="faculty-grade-details-grid">
                <div>
                  <p>Student Name</p>
                  <strong>{submission.student.name}</strong>
                </div>
                <div>
                  <p>USN / Student ID</p>
                  <strong>{submission.student.usn}</strong>
                </div>
                <div>
                  <p>Submitted On</p>
                  <strong>{new Date(submission.submittedAt).toLocaleString()}</strong>
                </div>
              </div>
            </article>

            <article className="faculty-grade-card">
              <h3>
                <span className="material-symbols-outlined">description</span>
                Submitted Files
              </h3>
              <div className="faculty-grade-file-list">
                {submission.files.length === 0 ? (
                  <p className="muted">No files</p>
                ) : (
                  submission.files.map((f) => (
                    <div key={f.fileName} className="faculty-grade-file-item">
                      <div className="faculty-grade-file-meta">
                        <span className="material-symbols-outlined">description</span>
                        <div>
                          <p>{f.fileName}</p>
                          <p>{f.fileSize != null ? formatFileSize(f.fileSize) : ''}</p>
                        </div>
                      </div>
                      <a
                        href={f.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="faculty-grade-download-icon-btn"
                        aria-label={`Download ${f.fileName}`}
                      >
                        <span className="material-symbols-outlined">download</span>
                      </a>
                    </div>
                  ))
                )}
              </div>
            </article>
          </section>

          <aside className="faculty-grade-right">
            <article className="faculty-grade-card faculty-grade-panel">
              <h3>Grading Panel</h3>
              <form onSubmit={handleSubmit}>
                <div className="faculty-grade-field">
                  <label htmlFor="marks-secured">Marks Secured</label>
                  <div className="faculty-grade-marks-wrap">
                    <input
                      id="marks-secured"
                      type="number"
                      step="0.5"
                      min={0}
                      max={maxMarks}
                      value={marks}
                      onChange={(e) => setMarks(e.target.value)}
                    />
                    <span>/ {maxMarks}</span>
                  </div>
                </div>
                <div className="faculty-grade-field">
                  <label htmlFor="grade-letter">Grade (optional)</label>
                  <input
                    id="grade-letter"
                    type="text"
                    placeholder="e.g. A+"
                    value={gradeLetter}
                    onChange={(e) => setGradeLetter(e.target.value)}
                  />
                </div>
                <div className="faculty-grade-field">
                  <label htmlFor="feedback">Feedback (optional)</label>
                  <textarea
                    id="feedback"
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="faculty-grade-field">
                  <label>
                    <input
                      type="checkbox"
                      checked={isReleased}
                      onChange={(e) => setIsReleased(e.target.checked)}
                    />
                    Release grade to student
                  </label>
                </div>
                {saveError && <p className="faculty-grade-error">{saveError}</p>}
                <button type="submit" className="faculty-grade-save" disabled={saving}>
                  <span className="material-symbols-outlined">save</span>
                  {saving ? 'Saving…' : 'Save Grade'}
                </button>
              </form>
            </article>
          </aside>
        </div>
      </main>

      <footer className="faculty-grade-footer">
        <p>©  StudySync, Made by Kairos with ❤️</p>
      </footer>
    </div>
  )
}

function UnofficialNotesScreen({
  currentPath,
  onNavigate,
  onLogout,
}: {
  currentPath: RoutePath
  onNavigate: (path: RoutePath) => void
  onLogout: () => void
}) {
  const { user } = useAuth()
  const [uploadedNotes, setUploadedNotes] = useState<UploadedNote[]>([])
  const [discoverNotes, setDiscoverNotes] = useState<Array<{ id: string; title: string; author: string; usn: string; fileUrl: string }>>([])
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [defaultUploadSubjectName, setDefaultUploadSubjectName] = useState('General')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const subtitle = user?.semester ? `Semester ${user.semester}` : ''
  const programme = user?.programme || ''
  const [findSearchQuery, setFindSearchQuery] = useState('')
  const [findUnit, setFindUnit] = useState('All Units')
  const [findSortBy, setFindSortBy] = useState('Most Recent')
  const [findFileType, setFindFileType] = useState<'all' | 'pdf' | 'docx' | 'images' | 'handwritten'>('all')
  const [advancedFiltersOpen, setAdvancedFiltersOpen] = useState(false)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [previewTitle, setPreviewTitle] = useState('Document.pdf')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewDownloadUrl, setPreviewDownloadUrl] = useState<string | null>(null)

  const loadUnofficialData = async (search?: string, chapter?: string) => {
    const data = await studentService.getUnofficialNotesData({
      search,
      chapter,
    })

    setDefaultUploadSubjectName(data.defaultSubjectName || 'General')
    setUploadedNotes(
      data.myUploads.map((note) => ({
        id: note.id,
        title: note.title,
        uploadedOn: formatUploadDate(new Date(note.uploadedAt)),
        fileInfo: `${note.fileName.split('.').pop()?.toUpperCase() || 'FILE'} • ${formatFileSize(note.fileSize)}`,
        status: note.status,
        canDownload: note.status === 'verified',
        downloadUrl: note.fileUrl,
        fileName: note.fileName,
      })),
    )
    setDiscoverNotes(
      data.discover.map((note) => ({
        id: note.id,
        title: note.title,
        author: note.uploader.name,
        usn: note.uploader.usn,
        fileUrl: note.fileUrl,
      })),
    )
  }

  useEffect(() => {
    const tid = setTimeout(() => {
      loadUnofficialData().catch((error) => {
        setUploadError(error instanceof Error ? error.message : 'Failed to load notes.')
      })
    }, 0)
    return () => clearTimeout(tid)
  }, [])

  useEffect(() => {
    const timeout = setTimeout(() => {
      loadUnofficialData(
        findSearchQuery || undefined,
        findUnit !== 'All Units' ? findUnit : undefined,
      ).catch(() => {})
    }, 250)

    return () => clearTimeout(timeout)
  }, [findSearchQuery, findUnit])

  const handleOpenUploadPicker = () => {
    fileInputRef.current?.click()
  }

  const handleFilesSelected = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) {
      return
    }

    setIsUploading(true)
    let rejectedCount = 0
    let uploadedCount = 0

    for (const file of Array.from(files)) {
      try {
        enforceSupportedUploadFile(file, 25 * 1024 * 1024)
        await studentService.uploadUnofficialNote({
          file,
          title: file.name,
          subjectName: defaultUploadSubjectName,
        })
        uploadedCount += 1
      } catch {
        rejectedCount += 1
      }
    }

    await loadUnofficialData().catch(() => {})
    setUploadError(
      rejectedCount > 0
        ? `${rejectedCount} file(s) rejected. Use only ${SUPPORTED_UPLOAD_LABEL} under 25MB.`
        : uploadedCount > 0
          ? null
          : 'No file was uploaded.',
    )
    setIsUploading(false)
    event.target.value = ''
  }

  const handleDownload = (note: UploadedNote) => {
    if (!note.downloadUrl || !note.canDownload) {
      return
    }

    const link = document.createElement('a')
    link.href = note.downloadUrl
    link.download = note.fileName ?? note.title
    document.body.appendChild(link)
    link.click()
    link.remove()
  }

  const filteredFindNotes = discoverNotes.filter((item) => {
    const q = findSearchQuery.trim().toLowerCase()
    const matchesQuery =
      !q ||
      item.title.toLowerCase().includes(q) ||
      item.author.toLowerCase().includes(q) ||
      item.usn.toLowerCase().includes(q)
    return matchesQuery
  })

  const handleDownloadFindNote = (note: { fileUrl: string }) => {
    if (!note.fileUrl || note.fileUrl === '#') {
      return
    }
    window.open(note.fileUrl, '_blank', 'noopener,noreferrer')
  }

  const openPreview = (title: string, fileUrl?: string) => {
    setPreviewTitle(title)
    setPreviewDownloadUrl(fileUrl || null)
    setPreviewUrl(getPreviewUrl(fileUrl))
    setIsPreviewOpen(true)
  }

  return (
    <div className="unofficial-page dashboard-page" aria-label="Student unofficial notes portal">
      <CommonDashboardHeader
        title="Unofficial Notes"
        subtitle={subtitle ? `${subtitle} • ${programme}` : programme || 'Upload & browse peer notes'}
        navItems={STUDENT_NAV_ITEMS}
        currentPath={currentPath}
        onNavigate={onNavigate}
        onLogout={onLogout}
        containerClassName="dashboard-container"
      />

      <main className="dashboard-container unofficial-main">
        <div className="common-dashboard-controls dashboard-container" style={{ marginBottom: '1rem' }}>
          <button type="button" className="dashboard-upload-btn" onClick={handleOpenUploadPicker}>
            <span className="material-symbols-outlined">cloud_upload</span>
            {isUploading ? 'Uploading...' : 'Upload Notes'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept={SUPPORTED_UPLOAD_ACCEPT}
            multiple
            className="visually-hidden-input"
            onChange={handleFilesSelected}
          />
          {uploadError ? (
            <p style={{ margin: '0.5rem 0 0', color: '#b91c1c', fontSize: '0.8125rem' }}>{uploadError}</p>
          ) : null}
        </div>
        <div className="unofficial-grid">
          <aside className="unofficial-column">
            <section className="dashboard-card">
              <div className="unofficial-card-head">
                <div className="dashboard-section-title">
                  <span className="material-symbols-outlined">folder_shared</span>
                  <h2>My Uploads</h2>
                </div>
                <span>{uploadedNotes.length} Total</span>
              </div>

              <div className="unofficial-upload-list">
                {uploadedNotes.map((note) => (
                  <article key={note.id} className="unofficial-upload-item">
                    <div className="unofficial-upload-top">
                      <div>
                        <h3>{note.title}</h3>
                        <p>{note.uploadedOn}</p>
                      </div>
                      <span className={`unofficial-badge ${note.status}`}>{note.status}</span>
                    </div>
                    <div className="unofficial-upload-bottom">
                      <span>{note.fileInfo}</span>
                      <div className="unofficial-upload-actions">
                        <button
                          type="button"
                          className="dashboard-btn-secondary dashboard-btn-small"
                          disabled={!note.canDownload}
                          onClick={() => openPreview(note.fileName || note.title, note.downloadUrl)}
                        >
                          <span className="material-symbols-outlined">visibility</span>
                          Preview
                        </button>
                        <button
                          type="button"
                          className="dashboard-btn-primary dashboard-btn-small"
                          disabled={!note.canDownload}
                          onClick={() => handleDownload(note)}
                        >
                          <span className="material-symbols-outlined">download</span>
                          Download
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </aside>

          <section className="unofficial-column unofficial-search-column">
            <section className="dashboard-card">
              <div className="dashboard-section-title">
                <span className="material-symbols-outlined">search</span>
                <h2>Find Notes</h2>
              </div>

              <div className="unofficial-searchbox">
                <span className="material-symbols-outlined">search</span>
                <input
                  type="text"
                  placeholder="Search by topic, unit, or author name..."
                  value={findSearchQuery}
                  onChange={(e) => setFindSearchQuery(e.target.value)}
                />
              </div>

              <div className="unofficial-filters">
                <button
                  type="button"
                  className="unofficial-filter-head"
                  onClick={() => setAdvancedFiltersOpen((open) => !open)}
                  aria-expanded={advancedFiltersOpen}
                >
                  <span>
                    <span className="material-symbols-outlined">tune</span>
                    Advanced Filters
                  </span>
                  <span
                    className="material-symbols-outlined"
                    style={{ transform: advancedFiltersOpen ? 'rotate(180deg)' : undefined }}
                  >
                    expand_more
                  </span>
                </button>
                {advancedFiltersOpen ? (
                  <div className="unofficial-filter-body">
                    <div className="unofficial-filter-grid">
                      <div className="field-group">
                        <label>Unit / Chapter</label>
                        <select value={findUnit} onChange={(e) => setFindUnit(e.target.value)}>
                          <option>All Units</option>
                          <option>Unit 1: Introduction</option>
                          <option>Unit 2: Processes</option>
                          <option>Unit 3: Scheduling</option>
                        </select>
                      </div>
                      <div className="field-group">
                        <label>Sort By</label>
                        <select value={findSortBy} onChange={(e) => setFindSortBy(e.target.value)}>
                          <option>Most Recent</option>
                          <option>Highest Rated</option>
                          <option>Verified First</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <p className="unofficial-label">File Type</p>
                      <div className="unofficial-chip-row">
                        <button
                          type="button"
                          className={`unofficial-chip ${findFileType === 'all' ? 'active' : ''}`}
                          onClick={() => setFindFileType('all')}
                        >
                          All
                        </button>
                        <button
                          type="button"
                          className={`unofficial-chip ${findFileType === 'pdf' ? 'active' : ''}`}
                          onClick={() => setFindFileType('pdf')}
                        >
                          PDF
                        </button>
                        <button
                          type="button"
                          className={`unofficial-chip ${findFileType === 'docx' ? 'active' : ''}`}
                          onClick={() => setFindFileType('docx')}
                        >
                          DOCX
                        </button>
                        <button
                          type="button"
                          className={`unofficial-chip ${findFileType === 'images' ? 'active' : ''}`}
                          onClick={() => setFindFileType('images')}
                        >
                          Images
                        </button>
                        <button
                          type="button"
                          className={`unofficial-chip ${findFileType === 'handwritten' ? 'active' : ''}`}
                          onClick={() => setFindFileType('handwritten')}
                        >
                          Handwritten
                        </button>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="unofficial-results">
                <h3>Results ({filteredFindNotes.length})</h3>
                <div className="unofficial-result-list">
                  {filteredFindNotes.map((item) => (
                    <article key={item.id} className="unofficial-result-item">
                      <div>
                        <div className="unofficial-doc-icon">
                          <span className="material-symbols-outlined">description</span>
                        </div>
                        <div>
                          <h4>{item.title}</h4>
                          <p>Uploaded By: {item.author} ({item.usn})</p>
                        </div>
                      </div>
                      <div className="unofficial-result-actions">
                        <button
                          type="button"
                          className="dashboard-icon-btn"
                          aria-label={`Preview ${item.title}`}
                          onClick={() => openPreview(item.title, item.fileUrl)}
                        >
                          <span className="material-symbols-outlined">visibility</span>
                        </button>
                        <button
                          type="button"
                          className="dashboard-icon-btn"
                          aria-label={`Download ${item.title}`}
                          onClick={() => handleDownloadFindNote({ fileUrl: item.fileUrl })}
                        >
                          <span className="material-symbols-outlined">download</span>
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </section>
          </section>
        </div>
      </main>

      <CommonDashboardFooter containerClassName="dashboard-container" />
      <PdfPreviewModal
        isOpen={isPreviewOpen}
        title={previewTitle}
        previewUrl={previewUrl}
        downloadUrl={previewDownloadUrl}
        onClose={() => setIsPreviewOpen(false)}
      />
    </div>
  )
}

type SearchResource = {
  id: string
  title: string
  subjectCode: string
  semester: string
  unit: string
  professor: string
  status: 'approved' | 'pending' | 'rejected'
  format: 'PDF' | 'PPTX' | 'DOCX' | 'JPG' | 'PNG'
  size: string
  uploadedAt: string
}

const searchResourceData: SearchResource[] = [
  {
    id: 'res-1',
    title: 'Memory Management Overview',
    subjectCode: 'CS501',
    semester: 'Semester 5',
    unit: 'Unit 4',
    professor: 'Dr. Robert Wilson',
    status: 'approved',
    format: 'PDF',
    size: '1.2 MB',
    uploadedAt: 'Oct 12, 2023',
  },
  {
    id: 'res-2',
    title: 'Process Synchronization Slides',
    subjectCode: 'CS501',
    semester: 'Semester 5',
    unit: 'Unit 3',
    professor: 'Dr. Robert Wilson',
    status: 'approved',
    format: 'PPTX',
    size: '3.8 MB',
    uploadedAt: 'Oct 05, 2023',
  },
  {
    id: 'res-3',
    title: 'Normalization Cheat Sheet',
    subjectCode: 'CS502',
    semester: 'Semester 5',
    unit: 'Unit 2',
    professor: 'Dr. Sarah Jenkins',
    status: 'pending',
    format: 'DOCX',
    size: '420 KB',
    uploadedAt: 'Sep 29, 2023',
  },
  {
    id: 'res-4',
    title: 'OSI Model Diagram',
    subjectCode: 'CS503',
    semester: 'Semester 5',
    unit: 'Unit 1',
    professor: 'Dr. Alan Green',
    status: 'approved',
    format: 'PNG',
    size: '760 KB',
    uploadedAt: 'Oct 08, 2023',
  },
  {
    id: 'res-5',
    title: 'Database ER Model',
    subjectCode: 'CS502',
    semester: 'Semester 5',
    unit: 'Unit 1',
    professor: 'Dr. Sarah Jenkins',
    status: 'rejected',
    format: 'JPG',
    size: '540 KB',
    uploadedAt: 'Oct 01, 2023',
  },
]

function StudentRepositoryScreen({
  currentPath,
  onNavigate,
  onLogout,
}: {
  currentPath: RoutePath
  onNavigate: (path: RoutePath) => void
  onLogout: () => void
}) {
  const { user } = useAuth()
  const [query, setQuery] = useState('')
  const [semester, setSemester] = useState('All Semesters')
  const [subjectCode, setSubjectCode] = useState('All Subjects')
  const [unit, setUnit] = useState('All Units')
  const [professor, setProfessor] = useState('All Professors')
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [previewTitle, setPreviewTitle] = useState('Document.pdf')
  const [apiFiles, setApiFiles] = useState<Array<{ id: string; name: string; mimeType?: string; size?: number; createdTime?: string; webViewLink?: string; webContentLink?: string; appProperties?: Record<string, string> }>>([])
  const [filesLoading, setFilesLoading] = useState(true)
  const [filesError, setFilesError] = useState<string | null>(null)
  const [subjects, setSubjects] = useState<Array<{ id: string; code: string; name: string }>>([])
  const [category, setCategory] = useState('All Categories')

  useEffect(() => {
    let cancelled = false
    apiClient
      .get<{ subjects: Array<{ id: string; code: string; name: string }> }>('/subjects')
      .then((res) => {
        if (!cancelled && res.data?.subjects) setSubjects(res.data.subjects)
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    let cancelled = false
    const tid = setTimeout(() => { if (!cancelled) setFilesLoading(true); setFilesError(null) }, 0)
    const params: { subjectName?: string; category?: string } = {}
    if (subjectCode !== 'All Subjects') {
      const sub = subjects.find((s) => s.code === subjectCode || s.name === subjectCode)
      params.subjectName = sub?.name ?? subjectCode
    }
    if (category !== 'All Categories') params.category = category
    filesService
      .listFiles(Object.keys(params).length ? params : undefined)
      .then((files) => {
        if (!cancelled) setApiFiles(files)
      })
      .catch((err) => {
        if (!cancelled) setFilesError(err instanceof Error ? err.message : 'Failed to load files')
      })
      .finally(() => {
        if (!cancelled) setFilesLoading(false)
      })
    return () => { cancelled = true; clearTimeout(tid) }
  }, [subjectCode, category, subjects])

  const subtitle = user?.semester ? `Semester ${user.semester}` : ''
  const programme = user?.programme || ''

  const apiResources: SearchResource[] = apiFiles.map((f) => {
    const ext = f.name.split('.').pop()?.toUpperCase() ?? 'PDF'
    const format = (['PDF', 'PPTX', 'DOCX', 'JPG', 'PNG'].includes(ext) ? ext : 'PDF') as SearchResource['format']
    return {
      id: f.id,
      title: f.name.replace(/\.[^/.]+$/, ''),
      subjectCode: f.appProperties?.subjectName ?? '-',
      semester: 'Semester',
      unit: '-',
      professor: f.appProperties?.uploadedBy ?? '-',
      status: 'approved',
      format,
      size: f.size != null ? formatFileSize(f.size) : '-',
      uploadedAt: f.createdTime ? new Date(f.createdTime).toLocaleDateString() : '-',
    }
  })
  const sourceData = apiResources.length > 0 ? apiResources : searchResourceData
  const resources = sourceData.filter((resource) => {
    if (sourceData === apiResources) return true
    if (resource.status !== 'approved') return false
    const q = query.trim().toLowerCase()
    const queryMatch =
      !q ||
      resource.title.toLowerCase().includes(q) ||
      resource.subjectCode.toLowerCase().includes(q) ||
      resource.professor.toLowerCase().includes(q)
    const semesterMatch = semester === 'All Semesters' || resource.semester === semester
    const subjectMatch = subjectCode === 'All Subjects' || resource.subjectCode === subjectCode
    const unitMatch = unit === 'All Units' || resource.unit === unit
    const professorMatch = professor === 'All Professors' || resource.professor === professor
    return queryMatch && semesterMatch && subjectMatch && unitMatch && professorMatch
  })

  const approvedResources = sourceData === apiResources ? apiResources : searchResourceData.filter((r) => r.status === 'approved')
  const professorOptions = Array.from(new Set(approvedResources.map((r) => r.professor)))

  return (
    <div className="dashboard-page" aria-label="Repository">
      <CommonDashboardHeader
        title="Repository"
        subtitle={subtitle ? `${subtitle} • ${programme}` : programme || 'Browse & search resources'}
        navItems={STUDENT_NAV_ITEMS}
        currentPath={currentPath}
        onNavigate={onNavigate}
        onLogout={onLogout}
        containerClassName="dashboard-container"
      />

      <main className="dashboard-container search-main">
        <section className="dashboard-card">
          <div className="dashboard-section-title">
            <span className="material-symbols-outlined">filter_alt</span>
            <h2>Search & filters</h2>
          </div>
          <div className="search-filter-grid" style={{ marginBottom: '1rem' }}>
            <div className="field-group">
              <label htmlFor="repo-keyword">Keyword</label>
              <input
                id="repo-keyword"
                type="text"
                placeholder="Title, subject code, or professor"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="search-filter-grid">
            <div className="field-group">
              <label htmlFor="repository-semester">Semester</label>
              <select id="repository-semester" value={semester} onChange={(e) => setSemester(e.target.value)}>
                <option>All Semesters</option>
                <option>Semester 5</option>
                <option>Semester 6</option>
              </select>
            </div>
            <div className="field-group">
              <label htmlFor="repository-subject">Subject</label>
              <select id="repository-subject" value={subjectCode} onChange={(e) => setSubjectCode(e.target.value)}>
                <option>All Subjects</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.code}>
                    {s.code} – {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field-group">
              <label htmlFor="repository-category">Category</label>
              <select id="repository-category" value={category} onChange={(e) => setCategory(e.target.value)}>
                <option>All Categories</option>
                <option value="textbook">Textbook</option>
                <option value="notes">Notes</option>
                <option value="assignment">Assignment</option>
              </select>
            </div>
            <div className="field-group">
              <label htmlFor="repository-unit">Unit</label>
              <select id="repository-unit" value={unit} onChange={(e) => setUnit(e.target.value)}>
                <option>All Units</option>
                <option>Unit 1</option>
                <option>Unit 2</option>
                <option>Unit 3</option>
                <option>Unit 4</option>
              </select>
            </div>
            <div className="field-group">
              <label htmlFor="repository-professor">Uploaded By</label>
              <select
                id="repository-professor"
                value={professor}
                onChange={(e) => setProfessor(e.target.value)}
              >
                <option>All Professors</option>
                {professorOptions.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </div>
          </div>
        </section>

        <section className="dashboard-card search-results-card">
          <div className="search-results-head">
            <div className="dashboard-section-title">
              <span className="material-symbols-outlined">folder_open</span>
              <h2>Approved Resources</h2>
            </div>
            <p>
              {filesLoading ? 'Loading...' : <><span>{resources.length}</span> approved files</>}
            </p>
          </div>
          {filesError ? (
            <div className="search-empty-state">
              <span className="material-symbols-outlined">error_outline</span>
              <p>{filesError}</p>
            </div>
          ) : resources.length === 0 ? (
            <div className="search-empty-state">
              <span className="material-symbols-outlined">search_off</span>
              <p>No matching files. Try changing your keyword or filters.</p>
            </div>
          ) : (
          <div className="search-results-grid">
            {resources.map((resource) => (
              <article key={resource.id} className="search-result-item">
                <div>
                  <h3>{resource.title}</h3>
                  <p>
                    {resource.semester} • {resource.subjectCode} • {resource.unit}
                  </p>
                </div>
                <div className="search-result-meta">
                  <span>Uploaded by: {resource.professor}</span>
                  <span>Type: {resource.format} • {resource.size}</span>
                  <span>Status: <strong>Approved</strong> • {resource.uploadedAt}</span>
                </div>
                <div className="search-result-actions">
                  <button
                    type="button"
                    className="dashboard-btn-secondary dashboard-btn-small"
                    onClick={() => {
                      setPreviewTitle(`${resource.title}.${resource.format.toLowerCase()}`)
                      setIsPreviewOpen(true)
                    }}
                  >
                    <span className="material-symbols-outlined">visibility</span>
                    View
                  </button>
                  <button type="button" className="dashboard-btn-primary dashboard-btn-small">
                    <span className="material-symbols-outlined">download</span>
                    Download
                  </button>
                </div>
              </article>
            ))}
          </div>
          )}
        </section>
      </main>
      <CommonDashboardFooter containerClassName="dashboard-container" />
      <PdfPreviewModal
        isOpen={isPreviewOpen}
        title={previewTitle}
        onClose={() => setIsPreviewOpen(false)}
      />
    </div>
  )
}

const ASSIGNMENT_REVIEW_ID_KEY = 'assignment_review_id'

function AssignmentReviewScreen({
  onBackToDashboard,
  currentPath,
  onNavigate,
  onLogout,
}: {
  onBackToDashboard?: () => void
  currentPath: RoutePath
  onNavigate: (path: RoutePath) => void
  onLogout: () => void
}) {
  const { user } = useAuth()
  const [assignment, setAssignment] = useState<Awaited<ReturnType<typeof assignmentService.getAssignment>> | null>(null)
  const [assignmentLoading, setAssignmentLoading] = useState(true)
  const [assignmentError, setAssignmentError] = useState<string | null>(null)
  const [files, setFiles] = useState<File[]>([])
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const subtitle = user?.semester ? `Semester ${user.semester}` : ''
  const programme = user?.programme || ''

  useEffect(() => {
    let cancelled = false
    const rawId = (() => {
      try {
        return sessionStorage.getItem(ASSIGNMENT_REVIEW_ID_KEY)
      } catch {
        return null
      }
    })()
    if (!rawId?.trim()) {
      setAssignmentError('No assignment selected. Go back and choose an assignment.')
      setAssignmentLoading(false)
      return
    }
    setAssignmentLoading(true)
    setAssignmentError(null)
    assignmentService
      .getAssignment(rawId.trim())
      .then((data) => {
        if (!cancelled) setAssignment(data)
      })
      .catch((err) => {
        if (!cancelled) setAssignmentError(err instanceof Error ? err.message : 'Failed to load assignment.')
      })
      .finally(() => {
        if (!cancelled) setAssignmentLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
      try {
        newFiles.forEach((file) => {
          enforceSupportedUploadFile(file, 25 * 1024 * 1024)
        })
        setFiles((prev) => [...prev, ...newFiles])
        setError(null)
      } catch (err) {
        setError(err instanceof FileUploadError ? err.message : 'Invalid file')
      }
    }
  }

  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    if (!assignment) return
    if (files.length === 0) {
      setError('Please upload at least one file')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      await assignmentService.submitAssignment(assignment.id, files)
      setIsSubmitted(true)
      setTimeout(() => {
        try {
          sessionStorage.removeItem(ASSIGNMENT_REVIEW_ID_KEY)
        } catch {
          /* ignore */
        }
        if (onBackToDashboard) {
          onBackToDashboard()
        }
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const dueDateFormatted = assignment?.dueDate
    ? new Date(assignment.dueDate).toLocaleString(undefined, { dateStyle: 'long', timeStyle: 'short' })
    : ''
  const dueInDays = assignment?.dueDate
    ? Math.ceil((new Date(assignment.dueDate).getTime() - Date.now()) / (24 * 60 * 60 * 1000))
    : 0
  const dueSoon = dueInDays >= 0 && dueInDays <= 3

  return (
    <div className="assignment-page dashboard-page" aria-label="Assignment submission details">
      <CommonDashboardHeader
        title="Submit Assignment"
        subtitle={subtitle ? `${subtitle} • ${programme}` : programme || 'Student'}
        navItems={STUDENT_NAV_ITEMS}
        currentPath={currentPath}
        onNavigate={onNavigate}
        onLogout={onLogout}
        containerClassName="dashboard-container"
      />

      <main className="dashboard-container assignment-main">
        {assignmentLoading ? (
          <section className="assignment-card">
            <p>Loading assignment…</p>
          </section>
        ) : assignmentError || !assignment ? (
          <section className="assignment-card">
            <p style={{ color: '#b91c1c', fontWeight: 600 }}>{assignmentError || 'Assignment not found.'}</p>
            {onBackToDashboard && (
              <button type="button" className="dashboard-btn-primary" style={{ marginTop: '1rem' }} onClick={onBackToDashboard}>
                Back to Dashboard
              </button>
            )}
          </section>
        ) : (
          <div className="assignment-layout">
            <section className="assignment-card assignment-details">
              <div className="assignment-badges">
                <span className="assignment-badge blue">Subject: {assignment.subjectCode}</span>
                <span className="assignment-badge green">Marks: {assignment.totalMarks}</span>
              </div>

              <div className="assignment-due-box">
                <div>
                  <p>Due Date</p>
                  <h2>{dueDateFormatted}</h2>
                </div>
                {dueSoon && dueInDays >= 0 && (
                  <span className="assignment-badge warning">
                    <span className="material-symbols-outlined">timer</span>
                    {dueInDays === 0 ? 'Due today' : dueInDays === 1 ? 'Due tomorrow' : 'Due soon'}
                  </span>
                )}
              </div>

              <div className="assignment-instructions">
                <h3>
                  <span className="material-symbols-outlined">description</span>
                  Instructions
                </h3>
                <p>{assignment.instructions || 'No additional instructions.'}</p>
              </div>

              {assignment.resources && assignment.resources.length > 0 ? (
                <div className="assignment-resources">
                  <h3>
                    <span className="material-symbols-outlined">folder_open</span>
                    Faculty Resources
                  </h3>
                  <div className="assignment-resource-list">
                    {assignment.resources.map((res) => (
                      <a
                        key={res.id}
                        href={res.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="assignment-resource-btn"
                      >
                        <span className="material-symbols-outlined">description</span>
                        {res.fileName}
                        <span className="material-symbols-outlined">download</span>
                      </a>
                    ))}
                  </div>
                </div>
              ) : null}
            </section>

          <aside className="assignment-sidebar">
            <section className="assignment-card">
              <div className="assignment-sidebar-head">
                <h2>Your Work</h2>
                <span>{isSubmitted ? 'Submitted' : 'Not Submitted'}</span>
              </div>
              {error && (
                <div style={{ padding: '0.75rem', background: '#fee2e2', color: '#991b1b', borderRadius: '0.5rem', marginBottom: '1rem', fontSize: '0.875rem' }}>
                  {error}
                </div>
              )}
              {!isSubmitted && (
                <>
                  {files.map((file, index) => (
                    <div key={index} className="assignment-uploaded-item">
                      <div>
                        <span className="material-symbols-outlined">description</span>
                        <p>{file.name} ({formatFileSize(file.size)})</p>
                      </div>
                      <button type="button" aria-label="Remove file" onClick={() => handleRemoveFile(index)}>
                        <span className="material-symbols-outlined">close</span>
                      </button>
                    </div>
                  ))}

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={SUPPORTED_UPLOAD_ACCEPT}
                    multiple
                    style={{ display: 'none' }}
                    onChange={handleFileSelect}
                  />
                  <button
                    type="button"
                    className="assignment-dropzone"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <span className="material-symbols-outlined">upload_file</span>
                    <p>Add or create</p>
                    <p>Drag and drop or click to upload ({SUPPORTED_UPLOAD_LABEL})</p>
                  </button>

                  <button
                    type="button"
                    className="assignment-submit-btn"
                    onClick={handleSubmit}
                    disabled={isLoading || files.length === 0}
                  >
                    {isLoading ? 'Submitting...' : 'Submit Assignment'}
                  </button>
                  <p className="assignment-note">Submission will be timestamped and logged.</p>
                </>
              )}
              {isSubmitted && (
                <div style={{ padding: '1rem', textAlign: 'center', color: '#059669' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '3rem' }}>check_circle</span>
                  <p style={{ marginTop: '0.5rem', fontWeight: '600' }}>Assignment Submitted Successfully!</p>
                  <p style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>Redirecting to dashboard...</p>
                </div>
              )}
            </section>
          </aside>
        </div>
        )}
      </main>

      <CommonDashboardFooter containerClassName="dashboard-container" />
    </div>
  )
}

function AssignmentResultScreen({
  onBackToDashboard,
  currentPath,
  onNavigate,
  onLogout,
}: {
  onBackToDashboard?: () => void
  currentPath: RoutePath
  onNavigate: (path: RoutePath) => void
  onLogout: () => void
}) {
  const { user } = useAuth()
  const subtitle = user?.semester ? `Semester ${user.semester}` : ''
  const programme = user?.programme || ''
  return (
    <div className="assignment-page dashboard-page" aria-label="Submission and grade status">
      <CommonDashboardHeader
        title="Assignment Result"
        subtitle={subtitle ? `${subtitle} • ${programme}` : programme || 'Student'}
        navItems={STUDENT_NAV_ITEMS}
        currentPath={currentPath}
        onNavigate={onNavigate}
        onLogout={onLogout}
        containerClassName="dashboard-container"
      />

      <main className="dashboard-container assignment-main">
        {onBackToDashboard ? (
          <p className="assignment-back-row">
            <button type="button" className="back-link" onClick={onBackToDashboard}>
              <span className="material-symbols-outlined">arrow_back</span>
              <span>Back to Dashboard</span>
            </button>
          </p>
        ) : null}
        <section className="assignment-card">
          <div className="result-status-head">
            <span className="material-symbols-outlined">info</span>
            <h2>Submission Status</h2>
            <span className="result-pill">Graded</span>
          </div>

          <div className="result-grid">
            <div className="result-left">
              <div>
                <p>Overall Grade</p>
                <h3>Grade: A+</h3>
              </div>
              <div>
                <p>Submission Date</p>
                <h4>Nov 01, 2023 • 11:45 PM</h4>
              </div>
            </div>

            <div className="result-feedback">
              <div>
                <span className="material-symbols-outlined">comment</span>
                <h3>Faculty Feedback</h3>
              </div>
              <p>
                "Excellent work on the memory mapping simulation. Your implementation of the paging mechanism was
                thorough and well-documented. The performance analysis section shows a deep understanding of TLB
                misses. Keep up the high standard of technical writing."
              </p>
              <div className="result-author">
                <span className="material-symbols-outlined">person</span>
                <span>Dr. Robert Wilson • Faculty of OS</span>
              </div>
            </div>
          </div>
        </section>

        <section className="assignment-card">
          <div className="result-files-head">
            <span className="material-symbols-outlined">folder_open</span>
            <h2>Submitted Files</h2>
          </div>

          <div className="result-files-table-wrap">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Filename</th>
                  <th>Size</th>
                  <th>Upload Date &amp; Time</th>
                  <th className="align-right">Action</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <div className="result-file-name">
                      <span className="material-symbols-outlined result-file-pdf">picture_as_pdf</span>
                      <div>
                        <p>Lab_Report_Memory_Mapping_Final.pdf</p>
                        <p>Main Document</p>
                      </div>
                    </div>
                  </td>
                  <td className="muted">2.4 MB</td>
                  <td className="muted">Nov 01, 2023 • 11:42 PM</td>
                  <td className="align-right">
                    <button type="button" className="result-view-btn">
                      <span className="material-symbols-outlined">visibility</span>
                      View File
                    </button>
                  </td>
                </tr>
                <tr>
                  <td>
                    <div className="result-file-name">
                      <span className="material-symbols-outlined">folder_zip</span>
                      <div>
                        <p>Source_Code_Simulation_v2.zip</p>
                        <p>Supporting File</p>
                      </div>
                    </div>
                  </td>
                  <td className="muted">15.8 MB</td>
                  <td className="muted">Nov 01, 2023 • 11:45 PM</td>
                  <td className="align-right">
                    <button type="button" className="result-view-btn">
                      <span className="material-symbols-outlined">visibility</span>
                      View File
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="result-note-box">
            <span className="material-symbols-outlined">warning</span>
            <p>
              Note: Files once submitted and graded can no longer be replaced or modified. If you notice any
              discrepancy in the uploaded files, please contact the faculty coordinator.
            </p>
          </div>
        </section>
      </main>

      <CommonDashboardFooter containerClassName="dashboard-container" />
    </div>
  )
}

function AdminEnrollStudentsScreen({
  onBackToAccounts,
  currentPath,
  onNavigate,
  onLogout,
}: {
  onBackToAccounts: () => void
  currentPath: RoutePath
  onNavigate: (path: RoutePath) => void
  onLogout: () => void
}) {
  const [subjects, setSubjects] = useState<Awaited<ReturnType<typeof adminService.getSubjects>>>([])
  const [studentList, setStudentList] = useState<Awaited<ReturnType<typeof adminService.getStudents>>>([])
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('')
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([])
  const [enrollSuccess, setEnrollSuccess] = useState(false)
  const [enrollError, setEnrollError] = useState<string | null>(null)
  const [enrollLoading, setEnrollLoading] = useState(false)

  useEffect(() => {
    let active = true
    Promise.all([adminService.getSubjects(), adminService.getStudents()]).then(([subjList, studList]) => {
      if (!active) return
      setSubjects(subjList)
      setStudentList(studList)
      if (subjList.length > 0 && !selectedSubjectId) setSelectedSubjectId(subjList[0].id)
    }).catch(() => { if (active) setEnrollError('Failed to load subjects or students') })
    return () => { active = false }
  }, [])

  const selectedSubject = subjects.find((s) => s.id === selectedSubjectId)

  const toggleStudent = (id: string) => {
    setSelectedStudentIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    )
  }

  const toggleAllStudents = () => {
    if (selectedStudentIds.length === studentList.length) {
      setSelectedStudentIds([])
    } else {
      setSelectedStudentIds(studentList.map((s) => s.id))
    }
  }

  const handleEnroll = async () => {
    if (!selectedSubjectId || selectedStudentIds.length === 0) {
      setEnrollError('Select a subject and at least one student.')
      return
    }
    setEnrollError(null)
    setEnrollLoading(true)
    try {
      await adminService.enrollStudentsInSubject(selectedSubjectId, selectedStudentIds)
      setEnrollSuccess(true)
      setSelectedStudentIds([])
      setTimeout(() => setEnrollSuccess(false), 3000)
    } catch (err) {
      setEnrollError(err instanceof Error ? err.message : 'Enroll failed')
    } finally {
      setEnrollLoading(false)
    }
  }

  return (
    <div className="admin-page" aria-label="Enroll students in subjects">
      <AdminHeader currentPath={currentPath} onNavigate={onNavigate} onLogout={onLogout} />

      <main className="admin-container admin-main">
        <section className="screen-head">
          <div>
            <nav className="screen-head-breadcrumb" aria-label="Breadcrumb">
              <button type="button" onClick={() => onNavigate('/admin_dashboard')} className="admin-breadcrumb-link">Dashboard</button>
              <span>/</span>
              <button type="button" onClick={onBackToAccounts} className="admin-breadcrumb-link">Student Accounts</button>
              <span>/</span>
              <span>Enroll Students</span>
            </nav>
            <h2>Enroll Students in Subjects</h2>
            <p className="screen-head-subtitle">Select a subject and enroll students.</p>
          </div>
        </section>

        {enrollError ? (
          <div style={{ padding: '1rem', background: '#fef2f2', color: '#991b1b', borderRadius: '8px', marginBottom: '1rem' }}>
            {enrollError}
          </div>
        ) : null}
        <section className="admin-assign-layout">
          <article className="admin-assign-faculty-card">
            <label htmlFor="enroll-subject-select">Select Subject</label>
            <select
              id="enroll-subject-select"
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="admin-assign-search"
            >
              <option value="">Select subject…</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>{s.code} - {s.name}</option>
              ))}
            </select>

            {selectedSubject ? (
              <div className="admin-assign-profile">
                <div>
                  <span className="material-symbols-outlined">book</span>
                </div>
                <div>
                  <h3>{selectedSubject.name}</h3>
                  <p>{selectedSubject.programme} • Sem {selectedSubject.semester}</p>
                </div>
              </div>
            ) : (
              <p style={{ padding: '1rem', color: 'var(--muted, #666)' }}>Select a subject to enroll students.</p>
            )}
          </article>

          <article className="admin-assign-subjects-card">
            <div className="admin-assign-toolbar">
              <p>
                Showing <span>{studentList.length}</span> students
              </p>
            </div>

            <div className="dashboard-table-wrap">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>
                      <input
                        type="checkbox"
                        checked={studentList.length > 0 && selectedStudentIds.length === studentList.length}
                        onChange={toggleAllStudents}
                        aria-label="Select all students"
                      />
                    </th>
                    <th>Student Name</th>
                    <th>USN</th>
                    <th>Programme</th>
                    <th>Semester</th>
                    <th>Email</th>
                  </tr>
                </thead>
                <tbody>
                  {studentList.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted, #666)' }}>
                        Loading students…
                      </td>
                    </tr>
                  ) : (
                    studentList.map((student) => {
                      const isSelected = selectedStudentIds.includes(student.id)
                      return (
                        <tr key={student.id} className={isSelected ? 'admin-assign-row-selected' : ''}>
                          <td>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleStudent(student.id)}
                              aria-label={`Select ${student.fullName}`}
                            />
                          </td>
                          <td>
                            <div className="admin-student-person">
                              <span className="gray">{initials(student.fullName)}</span>
                              <p>{student.fullName}</p>
                            </div>
                          </td>
                          <td className="mono">{student.usn}</td>
                          <td>{student.programme}</td>
                          <td>{student.semester}</td>
                          <td className="muted">{student.email}</td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="admin-assign-actions">
              {enrollSuccess ? (
                <div style={{ padding: '0.75rem', textAlign: 'center', color: '#059669', width: '100%' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '2rem', display: 'block', marginBottom: '0.5rem' }}>check_circle</span>
                  <p style={{ margin: 0, fontWeight: '600' }}>Students Enrolled Successfully!</p>
                </div>
              ) : (
                <>
                  <button type="button" onClick={handleEnroll} disabled={enrollLoading || !selectedSubjectId || selectedStudentIds.length === 0}>
                    <span className="material-symbols-outlined">person_add</span>
                    {enrollLoading ? 'Enrolling…' : `Enroll Selected Students (${selectedStudentIds.length})`}
                  </button>
                  <p>
                    <span className="material-symbols-outlined">info</span>
                    Enrolled students will have access to assignments, notes, and resources for this subject.
                  </p>
                </>
              )}
            </div>
          </article>
        </section>
      </main>

      <AdminFooter />
    </div>
  )
}

function AdminStudentDetailsScreen({
  onBack,
  currentPath,
  onNavigate,
  onLogout,
}: {
  onBack: () => void
  currentPath: RoutePath
  onNavigate: (path: RoutePath) => void
  onLogout: () => void
}) {
  const [student, setStudent] = useState<Awaited<ReturnType<typeof adminService.getStudent>>>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    const id = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('admin_selected_student_id') : null
    if (!id) {
      const tid = setTimeout(() => { if (active) setLoading(false) }, 0)
      return () => clearTimeout(tid)
    }
    adminService.getStudent(id).then((s) => {
      if (active) setStudent(s)
    }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  return (
    <div className="admin-page" aria-label="Student details">
      <AdminHeader currentPath={currentPath} onNavigate={onNavigate} onLogout={onLogout} />

      <main className="admin-container admin-main">
        <section className="screen-head">
          <div>
            <nav className="screen-head-breadcrumb" aria-label="Breadcrumb">
              <button type="button" onClick={onBack} className="admin-breadcrumb-link">Student Accounts</button>
              <span>/</span>
              <span>Student Details</span>
            </nav>
            <h2>Student Details</h2>
          </div>
        </section>

        {loading ? (
          <p style={{ padding: '2rem', color: 'var(--muted, #666)' }}>Loading…</p>
        ) : !student ? (
          <p style={{ padding: '2rem', color: 'var(--muted, #666)' }}>Student not found. Select a student from the accounts list.</p>
        ) : (
        <section className="admin-content-grid">
          <article className="dashboard-card">
            <div className="admin-assign-profile" style={{ marginBottom: '2rem' }}>
              <div style={{ width: '4rem', height: '4rem', fontSize: '1.5rem' }}>
                <span className="material-symbols-outlined">account_circle</span>
              </div>
              <div>
                <h3>{student.fullName}</h3>
                <p>USN: {student.usn}</p>
              </div>
            </div>

            <div className="dashboard-table-wrap">
              <table className="dashboard-table">
                <tbody>
                  <tr>
                    <td><strong>Full Name</strong></td>
                    <td>{student.fullName}</td>
                  </tr>
                  <tr>
                    <td><strong>USN</strong></td>
                    <td className="mono">{student.usn}</td>
                  </tr>
                  <tr>
                    <td><strong>Email</strong></td>
                    <td>{student.email}</td>
                  </tr>
                  <tr>
                    <td><strong>Programme</strong></td>
                    <td>{student.programme}</td>
                  </tr>
                  <tr>
                    <td><strong>Semester</strong></td>
                    <td>{student.semester}</td>
                  </tr>
                  <tr>
                    <td><strong>Account Status</strong></td>
                    <td><span className={`admin-student-status ${student.status === 'active' ? 'active' : 'disabled'}`}>{student.status === 'active' ? 'Active' : 'Disabled'}</span></td>
                  </tr>
                  <tr>
                    <td><strong>Registration Date</strong></td>
                    <td className="muted">{student.registeredAt ? new Date(student.registeredAt).toLocaleDateString() : '—'}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </article>

          <article className="dashboard-card">
            <div className="dashboard-section-title">
              <span className="material-symbols-outlined">book</span>
              <h2>Enrolled Subjects</h2>
            </div>
            <div className="dashboard-table-wrap">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Subject Code</th>
                    <th>Subject Name</th>
                    <th>Faculty</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>CS501</td>
                    <td>Operating Systems</td>
                    <td className="muted">Dr. Robert Wilson</td>
                    <td><span className="admin-student-status active">Active</span></td>
                  </tr>
                  <tr>
                    <td>CS502</td>
                    <td>Database Management</td>
                    <td className="muted">Dr. Sarah Jenkins</td>
                    <td><span className="admin-student-status active">Active</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </article>

          <article className="dashboard-card">
            <div className="dashboard-section-title">
              <span className="material-symbols-outlined">assignment</span>
              <h2>Assignment Submissions</h2>
            </div>
            <div className="dashboard-table-wrap">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Assignment</th>
                    <th>Subject</th>
                    <th>Status</th>
                    <th>Grade</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Memory Mapping Lab</td>
                    <td className="muted">CS501</td>
                    <td><span className="pill success">Submitted</span></td>
                    <td>A+</td>
                  </tr>
                  <tr>
                    <td>SQL Joins</td>
                    <td className="muted">CS502</td>
                    <td><span className="pill">Pending</span></td>
                    <td>-</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </article>
        </section>
        )}
      </main>

      <AdminFooter />
    </div>
  )
}

function AdminFacultyDetailsScreen({
  onBack,
  currentPath,
  onNavigate,
  onLogout,
}: {
  onBack: () => void
  currentPath: RoutePath
  onNavigate: (path: RoutePath) => void
  onLogout: () => void
}) {
  const [faculty, setFaculty] = useState<Awaited<ReturnType<typeof adminService.getFacultyById>>>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    const id = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('admin_selected_faculty_id') : null
    if (!id) {
      const tid = setTimeout(() => { if (active) setLoading(false) }, 0)
      return () => clearTimeout(tid)
    }
    adminService.getFacultyById(id).then((f) => {
      if (active) setFaculty(f)
    }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  return (
    <div className="admin-page" aria-label="Faculty details">
      <AdminHeader currentPath={currentPath} onNavigate={onNavigate} onLogout={onLogout} />

      <main className="admin-container admin-main">
        <section className="screen-head">
          <div>
            <nav className="screen-head-breadcrumb" aria-label="Breadcrumb">
              <button type="button" onClick={onBack} className="admin-breadcrumb-link">Faculty Accounts</button>
              <span>/</span>
              <span>Faculty Details</span>
            </nav>
            <h2>Faculty Details</h2>
          </div>
        </section>

        {loading ? (
          <p style={{ padding: '2rem', color: 'var(--muted, #666)' }}>Loading…</p>
        ) : !faculty ? (
          <p style={{ padding: '2rem', color: 'var(--muted, #666)' }}>Faculty not found. Select a faculty member from the accounts list.</p>
        ) : (
        <section className="admin-content-grid">
          <article className="dashboard-card">
            <div className="admin-assign-profile" style={{ marginBottom: '2rem' }}>
              <div style={{ width: '4rem', height: '4rem', fontSize: '1.5rem' }}>
                <span className="material-symbols-outlined">badge</span>
              </div>
              <div>
                <h3>{faculty.name}</h3>
                <p>{faculty.designation || 'Faculty'} • {faculty.department}</p>
              </div>
            </div>

            <div className="dashboard-table-wrap">
              <table className="dashboard-table">
                <tbody>
                  <tr>
                    <td><strong>Full Name</strong></td>
                    <td>{faculty.name}</td>
                  </tr>
                  <tr>
                    <td><strong>Email</strong></td>
                    <td>{faculty.email}</td>
                  </tr>
                  <tr>
                    <td><strong>Department</strong></td>
                    <td>{faculty.department}</td>
                  </tr>
                  <tr>
                    <td><strong>Designation</strong></td>
                    <td>{faculty.designation || '—'}</td>
                  </tr>
                  <tr>
                    <td><strong>Account Status</strong></td>
                    <td><span className={`admin-faculty-status ${faculty.status === 'active' ? 'active' : 'inactive'}`}>{faculty.status === 'active' ? 'Active' : 'Inactive'}</span></td>
                  </tr>
                  <tr>
                    <td><strong>Join Date</strong></td>
                    <td className="muted">{faculty.joinDate ? new Date(faculty.joinDate).toLocaleDateString() : '—'}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </article>

          <article className="dashboard-card">
            <div className="dashboard-section-title">
              <span className="material-symbols-outlined">book</span>
              <h2>Assigned Subjects</h2>
            </div>
            <div className="dashboard-table-wrap">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Subject Code</th>
                    <th>Subject Name</th>
                    <th>Programme</th>
                    <th>Enrolled Students</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>CS-401</td>
                    <td>Advanced Algorithms</td>
                    <td className="muted">B.Tech CSE</td>
                    <td>45</td>
                  </tr>
                  <tr>
                    <td>CS-405</td>
                    <td>Machine Learning Fundamentals</td>
                    <td className="muted">B.Tech CSE</td>
                    <td>38</td>
                  </tr>
                  <tr>
                    <td>CS-402</td>
                    <td>Distributed Systems</td>
                    <td className="muted">B.Tech CSE</td>
                    <td>42</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </article>

          <article className="dashboard-card">
            <div className="dashboard-section-title">
              <span className="material-symbols-outlined">assignment</span>
              <h2>Created Assignments</h2>
            </div>
            <div className="dashboard-table-wrap">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Assignment</th>
                    <th>Subject</th>
                    <th>Due Date</th>
                    <th>Submissions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Memory Mapping Lab</td>
                    <td className="muted">CS-401</td>
                    <td className="muted">Nov 12, 2023</td>
                    <td>45/60</td>
                  </tr>
                  <tr>
                    <td>Algorithm Analysis</td>
                    <td className="muted">CS-401</td>
                    <td className="muted">Nov 20, 2023</td>
                    <td>12/60</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </article>
        </section>
        )}
      </main>

      <AdminFooter />
    </div>
  )
}

function AdminDepartmentsScreen({
  currentPath,
  onNavigate,
  onLogout,
}: {
  currentPath: RoutePath
  onNavigate: (path: RoutePath) => void
  onLogout: () => void
}) {
  const [departments, setDepartments] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newName, setNewName] = useState('')
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    adminService
      .getFaculty()
      .then((list) => {
        if (!active) return
        const unique = [...new Set(list.map((f) => f.department).filter(Boolean))].sort()
        setDepartments(unique)
      })
      .catch((e) => {
        if (active) setError(e instanceof Error ? e.message : 'Failed to load departments')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [])

  const addDepartment = () => {
    const name = newName.trim()
    if (!name) return
    if (departments.includes(name)) {
      setMessage('Department already exists.')
      return
    }
    setDepartments((prev) => [...prev, name].sort())
    setNewName('')
    setMessage('Department added. Assign it to faculty when creating or editing accounts.')
  }

  return (
    <div className="admin-page" aria-label="Departments">
      <AdminHeader currentPath={currentPath} onNavigate={onNavigate} onLogout={onLogout} />
      <main className="admin-container admin-main">
        <section className="screen-head">
          <div>
            <h2>Departments</h2>
            <p className="screen-head-subtitle">Departments in use by faculty. Add a new name below to use when creating faculty accounts.</p>
          </div>
        </section>
        {error ? (
          <div style={{ padding: '1rem', background: '#fef2f2', color: '#991b1b', borderRadius: '8px', marginBottom: '1rem' }}>
            {error}
          </div>
        ) : null}
        {message ? (
          <div style={{ padding: '1rem', background: '#f0fdf4', color: '#166534', borderRadius: '8px', marginBottom: '1rem' }}>
            {message}
          </div>
        ) : null}
        <section className="admin-settings-card" style={{ marginBottom: '1.5rem' }}>
          <div className="field-group">
            <label htmlFor="new-department">Add department name</label>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <input
                id="new-department"
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Computer Science"
                style={{ maxWidth: '20rem', flex: 1, minWidth: '10rem' }}
              />
              <button type="button" className="dashboard-btn-primary" onClick={addDepartment}>
                Add
              </button>
            </div>
          </div>
        </section>
        <section className="admin-settings-card">
          <h3 style={{ margin: '0 0 1rem', fontSize: '1rem' }}>Current departments</h3>
          {loading ? (
            <p className="muted">Loading…</p>
          ) : departments.length === 0 ? (
            <p className="muted">No departments yet. Add one above or create a faculty account to create a department.</p>
          ) : (
            <ul style={{ margin: 0, paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              {departments.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
          )}
        </section>
      </main>
      <AdminFooter />
    </div>
  )
}

const SETTINGS_STORAGE_KEY = 'study_sync_settings'

function AdminSettingsScreen({
  currentPath,
  onNavigate,
  onLogout,
}: {
  currentPath: RoutePath
  onNavigate: (path: RoutePath) => void
  onLogout: () => void
}) {
  const [appName, setAppName] = useState('StudySync')
  const [supportEmail, setSupportEmail] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SETTINGS_STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as { appName?: string; supportEmail?: string }
        if (parsed.appName) setAppName(parsed.appName)
        if (parsed.supportEmail != null) setSupportEmail(parsed.supportEmail)
      }
    } catch {
      /* ignore */
    }
  }, [])

  const save = () => {
    try {
      localStorage.setItem(
        SETTINGS_STORAGE_KEY,
        JSON.stringify({ appName: appName.trim() || 'StudySync', supportEmail: supportEmail.trim() })
      )
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch {
      setSaved(false)
    }
  }

  return (
    <div className="admin-page" aria-label="System Settings">
      <AdminHeader currentPath={currentPath} onNavigate={onNavigate} onLogout={onLogout} />
      <main className="admin-container admin-main">
        <section className="screen-head">
          <div>
            <h2>System Settings</h2>
            <p className="screen-head-subtitle">Configure application-wide settings. Stored in your browser.</p>
          </div>
        </section>
        <section className="admin-settings-card">
          <div className="field-group" style={{ marginBottom: '1rem' }}>
            <label htmlFor="settings-app-name">Application name</label>
            <input
              id="settings-app-name"
              type="text"
              value={appName}
              onChange={(e) => setAppName(e.target.value)}
              placeholder="StudySync"
              style={{ maxWidth: '20rem' }}
            />
          </div>
          <div className="field-group" style={{ marginBottom: '1rem' }}>
            <label htmlFor="settings-support-email">Support email</label>
            <input
              id="settings-support-email"
              type="email"
              value={supportEmail}
              onChange={(e) => setSupportEmail(e.target.value)}
              placeholder="support@example.com"
              style={{ maxWidth: '20rem' }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button type="button" className="dashboard-btn-primary" onClick={save}>
              Save settings
            </button>
            {saved ? <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>Saved.</span> : null}
          </div>
        </section>
      </main>
      <AdminFooter />
    </div>
  )
}

function ForgotPasswordScreen({
  onBack,
  onResetPassword,
}: {
  onBack: () => void
  onResetPassword: () => void
}) {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      await authService.forgotPassword(email)
      setSuccess(true)
      setTimeout(() => {
        onResetPassword()
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reset link')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <main className="student-login-card" aria-label="Forgot password">
        <div className="student-card-content">
          <button type="button" className="back-link" onClick={onBack}>
            <span className="material-symbols-outlined">arrow_back</span>
            <span>Back</span>
          </button>

          <div className="student-logo-wrap">
            <div className="student-logo-shell">
              <span className="material-symbols-outlined icon-school">lock_reset</span>
            </div>
          </div>

          <div className="student-heading">
            <h1 className="student-title">Forgot Password</h1>
            <p>Enter your email to receive a password reset link</p>
          </div>

          <div className="student-accent" />

          <form className="student-form" onSubmit={handleSubmit}>
            {error && (
              <div style={{ padding: '0.75rem', background: '#fee2e2', color: '#991b1b', borderRadius: '0.5rem', marginBottom: '1rem', fontSize: '0.875rem' }}>
                {error}
              </div>
            )}
            {success && (
              <div style={{ padding: '0.75rem', background: '#d1fae5', color: '#065f46', borderRadius: '0.5rem', marginBottom: '1rem', fontSize: '0.875rem' }}>
                Reset link sent! Check your email.
              </div>
            )}
            <div className="field-group">
              <label htmlFor="resetEmail">Educational Email</label>
              <input
                id="resetEmail"
                type="email"
                placeholder="name@college.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading || success}
              />
            </div>

            <div className="student-actions">
              <button type="submit" className="student-primary-btn" disabled={isLoading || success}>
                {isLoading ? 'Sending...' : success ? 'Link Sent!' : 'Send Reset Link'}
              </button>
            </div>
          </form>

          <div className="student-register-cta">
            <p>
              Remember your password?{' '}
              <button type="button" className="inline-link" onClick={onBack}>
                Back to Login
              </button>
            </p>
          </div>
        </div>
      </main>

      <footer className="page-footer">
        <p>©  StudySync, Made by Kairos with ❤️</p>
      </footer>
    </>
  )
}

function ResetPasswordScreen({
  onBack,
  onLogin,
}: {
  onBack: () => void
  onLogin: () => void
}) {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const token = (() => {
    const hash = window.location.hash?.slice(1) || ''
    const params = new URLSearchParams(hash)
    return params.get('access_token') || params.get('token') || ''
  })()

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)

    if (!token) {
      setError('Invalid or expired reset link. Please request a new one from the Forgot Password page.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setIsLoading(true)

    try {
      await authService.resetPassword(token, password)
      setSuccess(true)
      setTimeout(() => {
        onLogin()
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset password')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <main className="student-login-card" aria-label="Reset password">
        <div className="student-card-content">
          <button type="button" className="back-link" onClick={onBack}>
            <span className="material-symbols-outlined">arrow_back</span>
            <span>Back</span>
          </button>

          <div className="student-logo-wrap">
            <div className="student-logo-shell">
              <span className="material-symbols-outlined icon-school">lock</span>
            </div>
          </div>

          <div className="student-heading">
            <h1 className="student-title">Reset Password</h1>
            <p>Enter your new password</p>
          </div>

          <div className="student-accent" />

          <form className="student-form" onSubmit={handleSubmit}>
            {!token && (
              <div style={{ padding: '0.75rem', background: '#fef3c7', color: '#92400e', borderRadius: '0.5rem', marginBottom: '1rem', fontSize: '0.875rem' }}>
                No reset token found. Use the link from your email or request a new one below.
              </div>
            )}
            {error && (
              <div style={{ padding: '0.75rem', background: '#fee2e2', color: '#991b1b', borderRadius: '0.5rem', marginBottom: '1rem', fontSize: '0.875rem' }}>
                {error}
              </div>
            )}
            {success && (
              <div style={{ padding: '0.75rem', background: '#d1fae5', color: '#065f46', borderRadius: '0.5rem', marginBottom: '1rem', fontSize: '0.875rem' }}>
                Password reset successful! Redirecting...
              </div>
            )}
            <div className="field-group">
              <label htmlFor="newPassword">New Password</label>
              <div className="password-wrap">
                <input
                  id="newPassword"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading || success || !token}
                />
                <button
                  type="button"
                  className="password-toggle"
                  aria-label="Toggle password visibility"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <span className="material-symbols-outlined">{showPassword ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
            </div>

            <div className="field-group">
              <label htmlFor="confirmNewPassword">Confirm New Password</label>
              <div className="password-wrap">
                <input
                  id="confirmNewPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={isLoading || success || !token}
                />
                <button
                  type="button"
                  className="password-toggle"
                  aria-label="Toggle password visibility"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <span className="material-symbols-outlined">{showConfirmPassword ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
            </div>

            <div className="student-actions">
              <button type="submit" className="student-primary-btn" disabled={isLoading || success || !token}>
                {isLoading ? 'Resetting...' : success ? 'Success!' : 'Reset Password'}
              </button>
            </div>
          </form>

          <div className="student-register-cta">
            <p>
              Remember your password?{' '}
              <button type="button" className="inline-link" onClick={onBack}>
                Back to Login
              </button>
            </p>
          </div>
        </div>
      </main>

      <footer className="page-footer">
        <p>©  StudySync, Made by Kairos with ❤️</p>
      </footer>
    </>
  )
}

function isEditableSelectionNode(node: Node | null): boolean {
  if (!node) {
    return false
  }

  const element = node instanceof Element ? node : node.parentElement
  if (!element) {
    return false
  }

  if (element.closest('input, textarea, [contenteditable="true"]')) {
    return true
  }

  return false
}

function extractMeaningFromDictionaryResponse(payload: unknown): string | null {
  if (!Array.isArray(payload) || payload.length === 0) {
    return null
  }

  const firstEntry = payload[0] as {
    meanings?: Array<{
      partOfSpeech?: string
      definitions?: Array<{ definition?: string }>
    }>
  }

  const firstMeaning = firstEntry.meanings?.[0]
  const firstDefinition = firstMeaning?.definitions?.[0]?.definition?.trim()
  if (!firstDefinition) {
    return null
  }

  return firstMeaning?.partOfSpeech
    ? `${firstMeaning.partOfSpeech}: ${firstDefinition}`
    : firstDefinition
}

function WordMeaningPopup() {
  const [popup, setPopup] = useState<DictionaryPopupState>({
    open: false,
    loading: false,
    word: '',
    meaning: '',
    error: null,
    top: 0,
    left: 0,
  })
  const cacheRef = useRef<Record<string, string>>({})
  const requestIdRef = useRef(0)
  const [showIframeHint, setShowIframeHint] = useState(false)

  useEffect(() => {
    const getSelectionCandidate = (): { text: string; top: number; left: number; anchorNode: Node | null } | null => {
      const pageSelection = window.getSelection()
      if (pageSelection && pageSelection.rangeCount > 0 && !pageSelection.isCollapsed) {
        const rect = pageSelection.getRangeAt(0).getBoundingClientRect()
        if (rect.width > 0 || rect.height > 0) {
          return {
            text: pageSelection.toString().trim(),
            top: Math.min(rect.bottom + 12, window.innerHeight - 20),
            left: Math.min(Math.max(rect.left + rect.width / 2, 160), window.innerWidth - 160),
            anchorNode: pageSelection.anchorNode,
          }
        }
      }

      const iframes = Array.from(document.querySelectorAll('iframe'))
      for (const iframe of iframes) {
        try {
          const iframeWindow = iframe.contentWindow
          if (!iframeWindow) continue
          const iframeSelection = iframeWindow.getSelection()
          if (!iframeSelection || iframeSelection.rangeCount === 0 || iframeSelection.isCollapsed) continue

          const iframeRect = iframe.getBoundingClientRect()
          const selectionRect = iframeSelection.getRangeAt(0).getBoundingClientRect()
          if (selectionRect.width === 0 && selectionRect.height === 0) continue

          return {
            text: iframeSelection.toString().trim(),
            top: Math.min(iframeRect.top + selectionRect.bottom + 12, window.innerHeight - 20),
            left: Math.min(
              Math.max(iframeRect.left + selectionRect.left + selectionRect.width / 2, 160),
              window.innerWidth - 160,
            ),
            anchorNode: iframeSelection.anchorNode,
          }
        } catch {
          continue
        }
      }
      return null
    }

    const showMeaningForSelection = async () => {
      const candidate = getSelectionCandidate()
      if (!candidate) {
        setPopup((current) => ({ ...current, open: false }))
        return
      }

      const selectedWord = candidate.text
        .trim()
        .replace(/^[^A-Za-z]+|[^A-Za-z'-]+$/g, '')
      if (!/^[A-Za-z][A-Za-z'-]{0,48}$/.test(selectedWord)) {
        setPopup((current) => ({ ...current, open: false }))
        return
      }

      if (isEditableSelectionNode(candidate.anchorNode)) {
        setPopup((current) => ({ ...current, open: false }))
        return
      }
      const normalizedWord = selectedWord.toLowerCase()

      const cachedMeaning = cacheRef.current[normalizedWord]
      if (cachedMeaning) {
        setPopup({
          open: true,
          loading: false,
          word: selectedWord,
          meaning: cachedMeaning,
          error: null,
          top: candidate.top,
          left: candidate.left,
        })
        return
      }

      const requestId = requestIdRef.current + 1
      requestIdRef.current = requestId
      setPopup({
        open: true,
        loading: true,
        word: selectedWord,
        meaning: '',
        error: null,
        top: candidate.top,
        left: candidate.left,
      })

      try {
        const response = await fetch(
          `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(normalizedWord)}`,
        )
        if (!response.ok) {
          throw new Error('Meaning unavailable')
        }
        const payload = (await response.json()) as unknown
        const meaning = extractMeaningFromDictionaryResponse(payload)
        if (!meaning) {
          throw new Error('Meaning unavailable')
        }

        cacheRef.current[normalizedWord] = meaning
        if (requestIdRef.current === requestId) {
          setPopup((current) => ({
            ...current,
            open: true,
            loading: false,
            meaning,
            error: null,
          }))
        }
      } catch {
        if (requestIdRef.current === requestId) {
          setPopup((current) => ({
            ...current,
            open: true,
            loading: false,
            meaning: '',
            error: `No dictionary meaning found for "${selectedWord}".`,
          }))
        }
      }
    }

    const clearPopup = () => {
      setPopup((current) => ({ ...current, open: false }))
    }

    let selectionTimer: number | null = null
    const scheduleSelectionLookup = () => {
      if (selectionTimer) {
        window.clearTimeout(selectionTimer)
      }
      selectionTimer = window.setTimeout(() => {
        void showMeaningForSelection()
      }, 120)
    }

    document.addEventListener('selectionchange', scheduleSelectionLookup)
    document.addEventListener('mouseup', scheduleSelectionLookup)
    document.addEventListener('keyup', scheduleSelectionLookup)
    document.addEventListener('touchend', scheduleSelectionLookup)
    document.addEventListener('scroll', clearPopup, true)
    window.addEventListener('resize', clearPopup)
    const iframeHintTimer = window.setTimeout(() => {
      const hasCrossOriginDriveIframe = Array.from(document.querySelectorAll('iframe')).some((iframe) => {
        const src = iframe.getAttribute('src') || ''
        return src.includes('drive.google.com/file/d/') || src.includes('docs.google.com')
      })
      setShowIframeHint(hasCrossOriginDriveIframe)
    }, 600)

    return () => {
      window.clearTimeout(iframeHintTimer)
      if (selectionTimer) {
        window.clearTimeout(selectionTimer)
      }
      document.removeEventListener('selectionchange', scheduleSelectionLookup)
      document.removeEventListener('mouseup', scheduleSelectionLookup)
      document.removeEventListener('keyup', scheduleSelectionLookup)
      document.removeEventListener('touchend', scheduleSelectionLookup)
      document.removeEventListener('scroll', clearPopup, true)
      window.removeEventListener('resize', clearPopup)
    }
  }, [])

  if (!popup.open && !showIframeHint) {
    return null
  }

  return (
    <>
      {popup.open ? (
        <div className="word-meaning-popup" style={{ top: popup.top, left: popup.left }} role="status" aria-live="polite">
          <div className="word-meaning-popup-head">
            <strong>{popup.word}</strong>
            <button type="button" onClick={() => setPopup((current) => ({ ...current, open: false }))} aria-label="Close meaning popup">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
          <p>
            {popup.loading
              ? 'Looking up meaning...'
              : popup.error || popup.meaning}
          </p>
        </div>
      ) : null}
      {showIframeHint ? (
        <div className="word-meaning-hint">
          Google Drive PDF preview blocks highlight capture. Use app text selection for dictionary popup.
        </div>
      ) : null}
    </>
  )
}

function App() {
  const { user, isAuthenticated, isLoading: isAuthLoading, logout } = useAuth()
  const [path, setPath] = useState<RoutePath>(() => normalizePath(window.location.pathname))
  const [sessionNotice, setSessionNotice] = useState<string | null>(null)
  const [notices, setNotices] = useState<DepartmentNotice[]>(() => {
    const raw = localStorage.getItem('department_notices')
    if (!raw) {
      return defaultDepartmentNotices
    }
    try {
      const parsed = JSON.parse(raw) as DepartmentNotice[]
      if (!Array.isArray(parsed) || parsed.length === 0) {
        return defaultDepartmentNotices
      }
      return parsed.map((notice) => ({
        ...notice,
        urgent: Boolean((notice as Partial<DepartmentNotice>).urgent),
        authorRole: (notice as Partial<DepartmentNotice>).authorRole === 'faculty' ? 'faculty' : 'admin',
      }))
    } catch {
      return defaultDepartmentNotices
    }
  })
  const [calendarEvents, setCalendarEvents] = useState<AcademicEvent[]>(() => {
    const raw = localStorage.getItem('academic_events')
    if (!raw) {
      return defaultAcademicEvents
    }
    try {
      const parsed = JSON.parse(raw) as AcademicEvent[]
      if (!Array.isArray(parsed)) {
        return defaultAcademicEvents
      }
      const normalizedEvents: AcademicEvent[] = parsed.map((event) => ({
        id: event.id,
        title: event.title,
        date: event.date,
        type: event.type,
        details: event.details,
        createdBy: event.createdBy,
        createdByRole: event.createdByRole === 'admin' ? 'admin' : 'faculty',
        targetAudience:
          event.targetAudience === 'students' || event.targetAudience === 'faculty'
            ? event.targetAudience
            : 'both',
      }))
      return mergeCalendarEventsWithDefaults(normalizedEvents)
    } catch {
      return defaultAcademicEvents
    }
  })

  useEffect(() => {
    const normalized = normalizePath(window.location.pathname)
    if (window.location.pathname !== normalized) {
      window.history.replaceState({}, '', normalized)
    }

    const onPopState = () => setPath(normalizePath(window.location.pathname))
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  useEffect(() => {
    localStorage.setItem('department_notices', JSON.stringify(notices))
  }, [notices])

  useEffect(() => {
    localStorage.setItem('academic_events', JSON.stringify(calendarEvents))
  }, [calendarEvents])

  useEffect(() => {
    if (!isAuthenticated) return
    const fetchComms = async () => {
      try {
        const [noticeList, eventList] = await Promise.all([
          communicationsService.getNotices(),
          communicationsService.getAcademicEvents(),
        ])
        setNotices(noticeList.map(noticeDtoToNotice))
        setCalendarEvents(eventList.map(eventDtoToEvent))
      } catch {
        // keep existing state on fetch error
      }
    }
    fetchComms()
    const interval = window.setInterval(fetchComms, 50000)
    return () => window.clearInterval(interval)
  }, [isAuthenticated])

  useEffect(() => {
    if (!sessionNotice) {
      return
    }
    const timer = window.setTimeout(() => setSessionNotice(null), 4500)
    return () => window.clearTimeout(timer)
  }, [sessionNotice])

  const navigate = (nextPath: RoutePath) => {
    window.history.pushState({}, '', nextPath)
    setPath(nextPath)
  }

  const createNotice = async ({ title, content, urgent = false }: { title: string; content: string; urgent?: boolean }) => {
    try {
      const dto = await communicationsService.createNotice({ title, content, urgent })
      setNotices((current) => [noticeDtoToNotice(dto), ...current])
      setSessionNotice('Notice published.')
    } catch (e) {
      setSessionNotice(e instanceof Error ? e.message : 'Failed to publish notice')
    }
  }

  const createCalendarEvent = async ({
    title,
    date,
    type,
    details,
    targetAudience,
  }: {
    title: string
    date: string
    type: AcademicEventType
    details: string
    targetAudience?: 'students' | 'faculty' | 'both'
  }) => {
    try {
      const dto = await communicationsService.createAcademicEvent({
        title,
        date,
        type,
        details,
        targetAudience: targetAudience || (user?.role === 'admin' ? 'students' : 'both'),
      })
      setCalendarEvents((current) => [eventDtoToEvent(dto), ...current])
      setSessionNotice('Event added.')
    } catch (e) {
      setSessionNotice(e instanceof Error ? e.message : 'Failed to add event')
    }
  }

  const deleteNoticeAsAdmin = async (id: string) => {
    try {
      await communicationsService.deleteNotice(id)
      setNotices((current) => current.filter((notice) => notice.id !== id))
      setSessionNotice('Notice removed.')
    } catch (e) {
      setSessionNotice(e instanceof Error ? e.message : 'Failed to delete notice')
    }
  }

  const updateNotice = (id: string, payload: { title: string; content: string; urgent: boolean }) => {
    setNotices((current) =>
      current.map((n) => (n.id === id ? { ...n, ...payload, createdAt: n.createdAt } : n))
    )
  }

  const deleteCalendarEvent = async (id: string) => {
    try {
      await communicationsService.deleteAcademicEvent(id)
      setCalendarEvents((current) => current.filter((e) => e.id !== id))
      setSessionNotice('Event removed.')
    } catch (e) {
      setSessionNotice(e instanceof Error ? e.message : 'Failed to delete event')
    }
  }

  const deleteNoticeAsFaculty = async (id: string) => {
    const currentFacultyName = user?.name || user?.fullName || 'Faculty User'
    const notice = notices.find((n) => n.id === id && n.authorRole === 'faculty' && n.author === currentFacultyName)
    if (!notice) return
    try {
      await communicationsService.deleteNotice(id)
      setNotices((current) => current.filter((n) => n.id !== id))
      setSessionNotice('Notice removed.')
    } catch (e) {
      setSessionNotice(e instanceof Error ? e.message : 'Failed to delete notice')
    }
  }

  useEffect(() => {
    if (isAuthLoading) {
      return
    }

    const requiredRole = getRequiredRole(path)
    let nextPath: RoutePath | null = null
    let shouldShowExpiredNotice = false

    if (requiredRole && (!isAuthenticated || !user)) {
      const token = localStorage.getItem('auth_token')
      const expiresAt = Number(localStorage.getItem('auth_expires_at') ?? '0')
      if (token && expiresAt > 0 && Date.now() > expiresAt) {
        shouldShowExpiredNotice = true
      }
      nextPath = roleLoginRoute[requiredRole]
    }

    if (!nextPath && requiredRole && user && user.role !== requiredRole) {
      nextPath = roleHomeRoute[user.role]
    }

    // Only redirect to dashboard when user is on their own role's login page (so faculty on Student Login stays there)
    if (
      !nextPath &&
      isAuthenticated &&
      user &&
      ((path === '/student_login' && user.role === 'student') ||
        (path === '/faculty_login' && user.role === 'faculty') ||
        (path === '/admin_login' && user.role === 'admin'))
    ) {
      nextPath = roleHomeRoute[user.role]
    }

    if (nextPath && path !== nextPath) {
      if (shouldShowExpiredNotice) {
        window.setTimeout(() => {
          setSessionNotice('Session expired. Please login again.')
        }, 0)
      }
      window.history.replaceState({}, '', nextPath)
      window.dispatchEvent(new PopStateEvent('popstate'))
    }
  }, [path, isAuthenticated, user, isAuthLoading])

  const isAuthRoute =
    path === '/' ||
    path === '/student_login' ||
    path === '/student_register' ||
    path === '/faculty_login' ||
    path === '/admin_login' ||
    path === '/forgot_password' ||
    path === '/reset_password'

  return (
    <div className={isAuthRoute ? 'app-shell auth-shell' : 'app-shell'}>
      {isAuthRoute ? (
        <div
          className="auth-backdrop"
          aria-hidden="true"
          style={{ backgroundImage: `url(${backgroundImage})` }}
        />
      ) : null}

      {sessionNotice ? (
        <div className="app-session-notice" role="alert">
          <span className="material-symbols-outlined">info</span>
          <p>{sessionNotice}</p>
        </div>
      ) : null}

      {isAuthRoute ? (
        <div className="background-pattern" aria-hidden="true">
          <div className="orb orb-top" />
          <div className="orb orb-bottom" />
        </div>
      ) : null}

      {path === '/student_login' ? (
        <StudentLoginScreen
          onBack={() => navigate('/')}
          onRegister={() => navigate('/student_register')}
          onLogin={() => navigate('/student_dashboard')}
          onForgotPassword={() => navigate('/forgot_password')}
        />
      ) : null}

      {path === '/student_register' ? <StudentRegisterScreen onLogin={() => navigate('/student_login')} /> : null}

      {path === '/faculty_login' ? (
        <FacultyLoginScreen
          onLogin={() => navigate('/faculty_dashboard')}
          onForgotPassword={() => navigate('/forgot_password')}
        />
      ) : null}

      {path === '/admin_login' ? (
        <AdminLoginScreen
          onLogin={() => navigate('/admin_dashboard')}
          onBack={() => navigate('/')}
          onForgotPassword={() => navigate('/forgot_password')}
        />
      ) : null}

      {path === '/admin_dashboard' ? (
        <AdminDashboardScreen
          onAddFaculty={() => navigate('/admin_faculty_accounts')}
          onAssignSubjects={() => navigate('/admin_assign_subjects')}
          onStudentAccounts={() => navigate('/admin_student_accounts')}
          onEnrollStudents={() => navigate('/admin_enroll_students')}
          onCirculars={() => navigate('/admin_circulars')}
          onReviewUploads={() => navigate('/admin_review_uploads')}
          currentPath={path}
          onNavigate={navigate}
          onLogout={async () => {
            await logout()
            navigate('/')
          }}
        />
      ) : null}

      {path === '/admin_faculty_accounts' ? (
        <AdminFacultyAccountsScreen
          onViewFacultyDetails={(id) => {
            try { if (id) sessionStorage.setItem('admin_selected_faculty_id', id) } catch { /* ignore */ }
            navigate('/admin_faculty_details')
          }}
          currentPath={path}
          onNavigate={navigate}
          onLogout={async () => { await logout(); navigate('/') }}
        />
      ) : null}

      {path === '/admin_assign_subjects' ? (
        <AdminAssignSubjectsScreen
          currentPath={path}
          onNavigate={navigate}
          onLogout={async () => { await logout(); navigate('/') }}
        />
      ) : null}

      {path === '/admin_student_accounts' ? (
        <AdminStudentAccountsScreen
          onEnrollStudents={() => navigate('/admin_enroll_students')}
          onViewStudentDetails={(id?: string) => {
            try { if (id) sessionStorage.setItem('admin_selected_student_id', id) } catch { /* ignore */ }
            navigate('/admin_student_details')
          }}
          currentPath={path}
          onNavigate={navigate}
          onLogout={async () => { await logout(); navigate('/') }}
        />
      ) : null}

      {path === '/admin_circulars' ? (
        <AdminCircularsScreen
          notices={notices}
          calendarEvents={calendarEvents}
          onCreateNotice={createNotice}
          onCreateCalendarEvent={createCalendarEvent}
          onUpdateNotice={updateNotice}
          onDeleteNotice={deleteNoticeAsAdmin}
          onDeleteCalendarEvent={deleteCalendarEvent}
          currentPath={path}
          onNavigate={navigate}
          onLogout={async () => { await logout(); navigate('/') }}
        />
      ) : null}

      {path === '/admin_enroll_students' ? (
        <AdminEnrollStudentsScreen
          onBackToAccounts={() => navigate('/admin_student_accounts')}
          currentPath={path}
          onNavigate={navigate}
          onLogout={async () => { await logout(); navigate('/') }}
        />
      ) : null}

      {path === '/admin_review_uploads' ? (
        <AdminReviewUploadsScreen
          currentPath={path}
          onNavigate={navigate}
          onLogout={async () => { await logout(); navigate('/') }}
        />
      ) : null}

      {path === '/admin_student_details' ? (
        <AdminStudentDetailsScreen
          onBack={() => navigate('/admin_student_accounts')}
          currentPath={path}
          onNavigate={navigate}
          onLogout={async () => { await logout(); navigate('/') }}
        />
      ) : null}

      {path === '/admin_faculty_details' ? (
        <AdminFacultyDetailsScreen
          onBack={() => navigate('/admin_faculty_accounts')}
          currentPath={path}
          onNavigate={navigate}
          onLogout={async () => { await logout(); navigate('/') }}
        />
      ) : null}

      {path === '/admin_departments' ? (
        <AdminDepartmentsScreen
          currentPath={path}
          onNavigate={navigate}
          onLogout={async () => { await logout(); navigate('/') }}
        />
      ) : null}

      {path === '/admin_settings' ? (
        <AdminSettingsScreen
          currentPath={path}
          onNavigate={navigate}
          onLogout={async () => { await logout(); navigate('/') }}
        />
      ) : null}

      {path === '/forgot_password' ? (
        <ForgotPasswordScreen
          onBack={() => navigate('/student_login')}
          onResetPassword={() => navigate('/reset_password')}
        />
      ) : null}

      {path === '/reset_password' ? (
        <ResetPasswordScreen
          onBack={() => navigate('/forgot_password')}
          onLogin={() => navigate('/student_login')}
        />
      ) : null}

      {path === '/faculty_dashboard' ? (
        <FacultyDashboardScreen
          onViewAllVerification={() => navigate('/faculty_verification')}
          onUploadTextbook={() => navigate('/faculty_textbook_upload')}
          onCreateAssignment={() => navigate('/faculty_create_assignment')}
          onViewAssignment={() => navigate('/faculty_assignment_submissions')}
          calendarEvents={calendarEvents.filter((event) => isEventVisibleToRole(event, 'faculty'))}
          onCreateCalendarEvent={createCalendarEvent}
          notices={notices}
          onCreateNotice={createNotice}
          onDeleteOwnNotice={deleteNoticeAsFaculty}
          currentPath={path}
          onNavigate={navigate}
          onLogout={async () => {
            await logout()
            navigate('/')
          }}
        />
      ) : null}

      {path === '/faculty_verification' ? (
        <FacultyVerificationScreen
          currentPath={path}
          onNavigate={navigate}
          onLogout={async () => {
            await logout()
            navigate('/')
          }}
        />
      ) : null}

      {path === '/faculty_textbook_upload' ? (
        <FacultyTextbookUploadScreen
          currentPath={path}
          onNavigate={navigate}
          onLogout={async () => {
            await logout()
            navigate('/')
          }}
        />
      ) : null}

      {path === '/faculty_create_assignment' ? (
        <FacultyCreateAssignmentScreen onBackToDashboard={() => navigate('/faculty_dashboard')} />
      ) : null}

      {path === '/faculty_assignment_submissions' ? (
        <FacultyAssignmentSubmissionsScreen
          onGrade={(assignmentId, submissionId) => {
            sessionStorage.setItem(GRADING_STORAGE_KEY, JSON.stringify({ assignmentId, submissionId }))
            navigate('/faculty_grade_submission')
          }}
          currentPath={path}
          onNavigate={navigate}
          onLogout={async () => {
            await logout()
            navigate('/')
          }}
        />
      ) : null}

      {path === '/faculty_grade_submission' ? (
        <FacultyGradeSubmissionScreen onBack={() => navigate('/faculty_assignment_submissions')} />
      ) : null}

      {path === '/student_dashboard' ? (
        <StudentDashboardScreen
          onViewBrief={(assignmentId) => {
            try {
              sessionStorage.setItem('assignment_review_id', assignmentId)
            } catch {
              /* ignore */
            }
            navigate('/assignment_review')
          }}
          onViewResult={() => navigate('/assignment_result')}
          onUnofficialNotes={() => navigate('/unofficial_notes')}
          onGoToRepository={() => navigate('/repository')}
          calendarEvents={calendarEvents}
          notices={notices}
          currentPath={path}
          onNavigate={navigate}
          onLogout={async () => {
            await logout()
            navigate('/')
          }}
        />
      ) : null}

      {path === '/repository' ? (
        <StudentRepositoryScreen
          currentPath={path}
          onNavigate={navigate}
          onLogout={async () => {
            await logout()
            navigate('/')
          }}
        />
      ) : null}

      {path === '/assignment_review' ? (
        <AssignmentReviewScreen
          onBackToDashboard={() => navigate('/student_dashboard')}
          currentPath={path}
          onNavigate={navigate}
          onLogout={async () => {
            await logout()
            navigate('/')
          }}
        />
      ) : null}

      {path === '/assignment_result' ? (
        <AssignmentResultScreen
          onBackToDashboard={() => navigate('/student_dashboard')}
          currentPath={path}
          onNavigate={navigate}
          onLogout={async () => {
            await logout()
            navigate('/')
          }}
        />
      ) : null}

      {path === '/unofficial_notes' ? (
        <UnofficialNotesScreen
          currentPath={path}
          onNavigate={navigate}
          onLogout={async () => {
            await logout()
            navigate('/')
          }}
        />
      ) : null}

      {path === '/' ? (
        <HomeScreen
          onStudentLogin={() => navigate('/student_login')}
          onFacultyLogin={() => navigate('/faculty_login')}
          onAdminLogin={() => navigate('/admin_login')}
        />
      ) : null}

      <WordMeaningPopup />
    </div>
  )
}

export default App
