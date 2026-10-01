import { useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { askGroq } from './lib/groq'
import {
  Bell, BookOpen, CalendarDays, Check, ChevronDown, ChevronLeft, Clock3, Copy, FileText, Filter,
  FolderKanban, HelpCircle, Highlighter, LayoutGrid, ListFilter, MoreHorizontal, Plug,
  Play, Plus, Search, Settings, Share2, ShieldCheck, Sparkles, SquareArrowOutUpRight, Tag, Users, Video, X,
} from 'lucide-react'

type Meeting = {
  id: number
  title: string
  kind: string
  date: string
  time: string
  duration: string
  people: string[]
  accent: string
  initials: string
  summary: string
  tags: string[]
  highlights: { time: string; text: string }[]
  transcript: { time: string; speaker: string; text: string; avatar: string }[]
  actions: { label: string; owner: string; due: string; done?: boolean }[]
}

const meetings: Meeting[] = [
  {
    id: 1, title: 'Q3 Product strategy sync', kind: 'Internal', date: 'Today', time: '10:30 AM', duration: '48 min', people: ['Maya Chen', 'Theo Jones', 'Ari Malik', 'You'], accent: 'mint', initials: 'QC',
    summary: 'The team aligned on a tighter activation loop for Q3: ship the collaborative workspace in July, then use customer evidence to prioritize the automation layer. The biggest open question is how much of the recording experience needs to be live in v1.', tags: ['Product', 'Q3 planning', 'Decision'],
    highlights: [{ time: '08:42', text: '“We should optimize for the moment right after the call, not the recording itself.”' }, { time: '26:14', text: 'Decision: the shared workspace is the July launch target.' }, { time: '41:08', text: 'Open question: do we need bot-free capture for the first release?' }],
    transcript: [
      { time: '00:04', speaker: 'Maya Chen', text: 'Thanks for making the time. I want to leave this call with one clear Q3 bet, not a list of twelve nice-to-haves.', avatar: 'MC' },
      { time: '01:18', speaker: 'Theo Jones', text: 'The signal from onboarding is pretty consistent: people love the summary, but they do not know where to take the next step.', avatar: 'TJ' },
      { time: '08:42', speaker: 'Ari Malik', text: 'We should optimize for the moment right after the call, not the recording itself. That is where the work either continues or disappears.', avatar: 'AM' },
      { time: '12:07', speaker: 'You', text: 'So the workspace becomes the product surface, and the capture layer can stay intentionally quiet underneath it?', avatar: 'YU' },
      { time: '26:14', speaker: 'Maya Chen', text: 'Yes. Shared workspace in July. Automation comes after we have enough behavioral evidence.', avatar: 'MC' },
    ],
    actions: [
      { label: 'Draft the July workspace launch brief', owner: 'You', due: 'Due Fri' },
      { label: 'Pull activation drop-off examples from support', owner: 'Theo', due: 'Due Thu' },
      { label: 'Add bot-free capture to v1 discovery', owner: 'Ari', due: 'Due Jul 12', done: true },
    ],
  },
  {
    id: 2, title: 'Redwood <> Rally kickoff', kind: 'Customer', date: 'Yesterday', time: '2:00 PM', duration: '34 min', people: ['Lena Ortiz', 'Maya Chen', 'You'], accent: 'orange', initials: 'RK',
    summary: 'Redwood wants a cleaner way to turn customer calls into a weekly operating rhythm. They are most interested in shareable clips for leadership and action items that map to their existing project tracker.', tags: ['Customer', 'Expansion'],
    highlights: [{ time: '04:31', text: '“The shareable moment is what gets the rest of the team bought in.”' }, { time: '19:50', text: 'Redwood will pilot with the revenue operations team.' }],
    transcript: [{ time: '00:02', speaker: 'Lena Ortiz', text: 'We have notes everywhere. The hard part is getting the one useful moment into the room where decisions happen.', avatar: 'LO' }, { time: '04:31', speaker: 'You', text: 'That sounds like a clip problem as much as a notes problem.', avatar: 'YU' }],
    actions: [{ label: 'Send Redwood the pilot workspace', owner: 'You', due: 'Due Today' }, { label: 'Confirm Salesforce field mapping', owner: 'Lena', due: 'Due Mon' }],
  },
  {
    id: 3, title: 'Design critique · Capture', kind: 'Internal', date: 'Mon, Jun 24', time: '11:00 AM', duration: '57 min', people: ['Ari Malik', 'Noah Kim', 'You'], accent: 'blue', initials: 'DC',
    summary: 'A critique of the capture experience focused on trust, consent, and how to make the bot feel present without becoming the subject of the meeting.', tags: ['Design', 'Capture'],
    highlights: [{ time: '13:20', text: 'Consent should feel like a clear doorway, not a legal speed bump.' }],
    transcript: [{ time: '00:11', speaker: 'Noah Kim', text: 'If the first thing people see is a bot joining, we have already made the meeting about the bot.', avatar: 'NK' }],
    actions: [{ label: 'Test the new consent language', owner: 'You', due: 'Due Jul 03' }],
  },
]

const navItems = [
  { label: 'Home', icon: LayoutGrid }, { label: 'My meetings', icon: Video, count: '24' }, { label: 'Team library', icon: FolderKanban },
]

type WorkspaceView = 'home' | 'meetings' | 'library' | 'collection' | 'settings'

function WorkspacePage({ view, onAction }: { view: WorkspaceView; onAction: (message: string) => void }) {
  if (view === 'settings') return <SettingsPage onAction={onAction} />
  if (view === 'collection') return <CollectionPage onAction={onAction} />
  if (view === 'library') return <LibraryPage onAction={onAction} />
  return <HomePage view={view} onAction={onAction} />
}

function HomePage({ view, onAction }: { view: WorkspaceView; onAction: (message: string) => void }) {
  const isHome = view === 'home'
  return <div className="workspace-page"><div className="page-intro"><div><p className="eyebrow">{isHome ? 'Tuesday, June 25' : 'Workspace'}</p><h1>{isHome ? 'Good morning, Yuna' : 'My meetings'}</h1><p className="page-subtitle">{isHome ? 'A clear view of the conversations moving work forward.' : 'Every conversation, searchable and ready to use.'}</p></div><button className="outline-button" onClick={() => onAction('Calendar connection opened')}><CalendarDays size={16} /> Connect calendar</button></div>{isHome && <div className="stat-grid"><div className="stat-card stat-green"><span>Meetings this week</span><strong>12</strong><small><span className="trend-up">↗ 18%</span> from last week</small></div><div className="stat-card"><span>Action items open</span><strong>08</strong><small>3 due today</small></div><div className="stat-card stat-coral"><span>Minutes captured</span><strong>6h 42m</strong><small>Across 24 meetings</small></div></div>}<div className="page-columns"><section className="page-section"><div className="page-section-head"><h2>{isHome ? 'Continue where you left off' : 'Recent meetings'}</h2><button className="subtle-button" onClick={() => onAction('Showing all meetings')}>View all <ArrowMark /></button></div>{meetings.slice(0, 3).map((meeting) => <button className="wide-meeting-card" key={meeting.id} onClick={() => onAction(`Opening ${meeting.title}`)}><div className={`meeting-icon ${meeting.accent}`}>{meeting.initials}</div><div><strong>{meeting.title}</strong><span>{meeting.kind} · {meeting.date} · {meeting.duration}</span><p>{meeting.summary.slice(0, 112)}...</p></div><ArrowMark /></button>)}</section><aside className="page-section right-section"><div className="page-section-head"><h2>Today’s focus</h2><button className="subtle-button" onClick={() => onAction('Focus list refreshed')}>Refresh</button></div><div className="focus-card"><div className="focus-icon"><Check size={16} /></div><div><strong>3 action items due today</strong><p>Keep the momentum from your customer calls.</p></div><ArrowMark /></div><div className="focus-card"><div className="focus-icon peach"><Sparkles size={16} /></div><div><strong>Ask Rally anything</strong><p>Find decisions across your entire library.</p></div><ArrowMark /></div><div className="capture-card"><div className="capture-orbit"><div><Video size={22} /></div></div><div><strong>Your next call is ready</strong><p>Rally will capture the conversation and send your notes here.</p></div><button onClick={() => onAction('Capture setup opened')}>Set up capture</button></div></aside></div></div>
}

function ArrowMark() { return <span className="arrow-mark">↗</span> }

function LibraryPage({ onAction }: { onAction: (message: string) => void }) { return <div className="workspace-page"><div className="page-intro"><div><p className="eyebrow">Shared workspace</p><h1>Team library</h1><p className="page-subtitle">The team’s shared memory, organized around the work.</p></div><button className="new-meeting library-add" onClick={() => onAction('Collection created')}><Plus size={17} /> New collection</button></div><div className="library-grid">{[{ title: 'Customer calls', count: '9 meetings', color: 'coral', icon: Users }, { title: 'Product rituals', count: '7 meetings', color: 'yellow', icon: Sparkles }, { title: 'Hiring', count: '4 meetings', color: 'green', icon: ShieldCheck }].map(({ title, count, color, icon: Icon }) => <button className="library-card" key={title} onClick={() => onAction(`Opening ${title}`)}><div className={`library-card-icon ${color}`}><Icon size={19} /></div><strong>{title}</strong><span>{count}</span><small>Shared with your team <ArrowMark /></small></button>)}<button className="library-card add-card" onClick={() => onAction('Collection created')}><Plus size={21} /><strong>Create a collection</strong><span>Group meetings by the work</span></button></div><div className="library-table"><div className="page-section-head"><h2>Recently added to library</h2><button className="subtle-button" onClick={() => onAction('Library filters opened')}><Filter size={14} /> Filter</button></div>{meetings.map((meeting) => <button className="library-row" key={meeting.id} onClick={() => onAction(`Opening ${meeting.title}`)}><span className={`meeting-icon ${meeting.accent}`}>{meeting.initials}</span><span><strong>{meeting.title}</strong><small>{meeting.kind} · added by Yuna</small></span><span className="library-row-date">{meeting.date}</span><ArrowMark /></button>)}</div></div> }

function CollectionPage({ onAction }: { onAction: (message: string) => void }) { return <div className="workspace-page"><div className="page-intro"><div><p className="eyebrow">Collections / Customer calls</p><h1>Customer calls</h1><p className="page-subtitle">The moments where customer signal becomes team action.</p></div><button className="outline-button" onClick={() => onAction('Collection sharing opened')}><Share2 size={15} /> Share collection</button></div><div className="collection-banner"><div className="collection-banner-icon"><Users size={22} /></div><div><strong>9 conversations</strong><span>Shared with 6 teammates · Last updated today</span></div><button onClick={() => onAction('Collection settings opened')}><Settings size={17} /></button></div><div className="library-table collection-table"><div className="page-section-head"><h2>All customer conversations</h2><button className="subtle-button" onClick={() => onAction('Collection filters opened')}><ListFilter size={14} /> Sort latest</button></div>{[meetings[1], meetings[0], meetings[2]].map((meeting) => <button className="library-row" key={meeting.id} onClick={() => onAction(`Opening ${meeting.title}`)}><span className={`meeting-icon ${meeting.accent}`}>{meeting.initials}</span><span><strong>{meeting.title}</strong><small>{meeting.summary.slice(0, 94)}...</small></span><span className="status-pill customer">{meeting.kind}</span><ArrowMark /></button>)}</div></div> }

function SettingsPage({ onAction }: { onAction: (message: string) => void }) { const [settingsTab, setSettingsTab] = useState('Workspace'); return <div className="workspace-page settings-page"><div className="page-intro"><div><p className="eyebrow">Workspace / Settings</p><h1>Settings</h1><p className="page-subtitle">Shape how Rally fits into your team’s workflow.</p></div></div><div className="settings-layout"><nav className="settings-nav">{['Workspace', 'Capture', 'Integrations', 'Notifications', 'Billing'].map((tab) => <button className={settingsTab === tab ? 'active' : ''} key={tab} onClick={() => setSettingsTab(tab)}>{tab}</button>)}</nav><section className="settings-content"><div className="settings-title"><div><h2>{settingsTab}</h2><p>Manage your {settingsTab.toLowerCase()} preferences.</p></div><button className="new-meeting" onClick={() => onAction('Settings saved')}><Check size={15} /> Save changes</button></div>{settingsTab === 'Workspace' && <><label className="field-label">Workspace name<input defaultValue="Fanthom team" /></label><label className="field-label">Default summary template<select defaultValue="Executive summary"><option>Executive summary</option><option>Decision log</option><option>Customer follow-up</option></select></label><div className="setting-toggle"><div><strong>Ask Rally across the workspace</strong><span>Let teammates search and ask questions across shared conversations.</span></div><button className="toggle on" onClick={() => onAction('Workspace search toggled')}><span /></button></div></>}{settingsTab === 'Capture' && <><div className="integration-row"><div className="integration-icon capture"><Video size={19} /></div><div><strong>Bot-free capture</strong><span>Capture locally without inviting a bot to your call.</span></div><span className="connected-pill">Available</span></div><div className="integration-row"><div className="integration-icon"><CalendarDays size={19} /></div><div><strong>Calendar sync</strong><span>Connect a calendar to automatically prepare your meetings.</span></div><button className="outline-button" onClick={() => onAction('Google Calendar connection started')}>Connect</button></div></>}{settingsTab === 'Integrations' && <><Integration name="Google Calendar" icon={<CalendarDays size={19} />} action="Connected" /><Integration name="Slack" icon={<MessageIcon />} action="Connect" /><Integration name="HubSpot" icon={<Users size={19} />} action="Connect" /></>}{(settingsTab === 'Notifications' || settingsTab === 'Billing') && <div className="empty-settings"><Sparkles size={22} /><strong>{settingsTab} are ready to configure</strong><p>This surface is wired for the next team preference you want to add.</p><button className="outline-button" onClick={() => onAction(`${settingsTab} opened`)}>Open preferences</button></div>}</section></div></div> }

function Integration({ name, icon, action }: { name: string; icon: ReactNode; action: string }) { return <div className="integration-row"><div className="integration-icon">{icon}</div><div><strong>{name}</strong><span>Keep your work in sync with Rally.</span></div><span className={action === 'Connected' ? 'connected-pill' : 'outline-button'}>{action}</span></div> }
function MessageIcon() { return <span className="message-icon">#</span> }

function App() {
  const [view, setView] = useState<WorkspaceView>('meetings')
  const [selectedId, setSelectedId] = useState(1)
  const [query, setQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'overview' | 'transcript'>('overview')
  const [playing, setPlaying] = useState(false)
  const [template, setTemplate] = useState('Executive summary')
  const [toast, setToast] = useState('')
  const [checked, setChecked] = useState<Record<string, boolean>>({})
  const [mobileNav, setMobileNav] = useState(false)
  const [captureOpen, setCaptureOpen] = useState(false)
  const [question, setQuestion] = useState('')
  const [rallyAnswer, setRallyAnswer] = useState('')
  const [askingRally, setAskingRally] = useState(false)
  const [recording, setRecording] = useState(false)
  const [transcribing, setTranscribing] = useState(false)
  const [capturedText, setCapturedText] = useState('')
  const recorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const visibleMeetings = useMemo(() => meetings.filter((meeting) => `${meeting.title} ${meeting.kind} ${meeting.tags.join(' ')}`.toLowerCase().includes(query.toLowerCase())), [query])
  const selected = meetings.find((meeting) => meeting.id === selectedId) ?? meetings[0]

  const showToast = (message: string) => {
    setToast(message)
    window.setTimeout(() => setToast(''), 2600)
  }

  const askRally = async () => {
    if (!question.trim() || askingRally) return
    setAskingRally(true)
    setRallyAnswer('')
    try {
      const context = `${selected.title}\nSummary: ${selected.summary}\nHighlights: ${selected.highlights.map((item) => item.text).join(' | ')}\nTranscript: ${selected.transcript.map((line) => `${line.speaker}: ${line.text}`).join(' ')}`
      setRallyAnswer(await askGroq(question, context))
    } catch (error) {
      setRallyAnswer(error instanceof Error ? error.message : 'Add GROQ_API_KEY to .env to enable Ask Rally.')
    } finally {
      setAskingRally(false)
    }
  }

  const startCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      const chunks: Blob[] = []
      streamRef.current = stream
      recorderRef.current = recorder
      recorder.ondataavailable = (event) => { if (event.data.size > 0) chunks.push(event.data) }
      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop())
        setTranscribing(true)
        try {
          const response = await fetch('/api/transcribe', { method: 'POST', headers: { 'Content-Type': recorder.mimeType || 'audio/webm' }, body: new Blob(chunks, { type: recorder.mimeType || 'audio/webm' }) })
          const data = await response.json() as { text?: string; error?: string }
          setCapturedText(data.text || data.error || 'No speech was detected in this recording.')
        } catch {
          setCapturedText('Transcription is unavailable. Add GROQ_API_KEY to .env and try again.')
        } finally {
          setTranscribing(false)
        }
      }
      recorder.start()
      setRecording(true)
    } catch {
      showToast('Microphone permission is required for capture')
    }
  }

  const stopCapture = () => {
    recorderRef.current?.stop()
    streamRef.current?.getTracks().forEach((track) => track.stop())
    setRecording(false)
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileNav ? 'sidebar-open' : ''}`}>
        <div className="brand"><div className="brand-mark"><span /></div><span>rally</span><button className="mobile-close" onClick={() => setMobileNav(false)}><X size={18} /></button></div>
        <div className="workspace-switcher"><div className="workspace-dot">F</div><div><strong>Fanthom team</strong><small>Personal workspace</small></div><ChevronDown size={15} /></div>
        <button className="new-meeting" onClick={() => setCaptureOpen(true)}><Plus size={17} /> New meeting</button>
        <nav className="primary-nav">{navItems.map(({ label, icon: Icon, count }) => <button key={label} className={(label === 'Home' && view === 'home') || (label === 'My meetings' && view === 'meetings') || (label === 'Team library' && view === 'library') ? 'active' : ''} onClick={() => { setView(label === 'Home' ? 'home' : label === 'My meetings' ? 'meetings' : 'library'); setMobileNav(false) }}><Icon size={18} /><span>{label}</span>{count && <em>{count}</em>}</button>)}</nav>
        <div className="sidebar-label">Collections <button onClick={() => showToast('Create a collection')}><Plus size={14} /></button></div>
        <nav className="collection-nav"><button className={view === 'collection' ? 'active' : ''} onClick={() => { setView('collection'); setMobileNav(false) }}><span className="collection-dot coral" />Customer calls <em>9</em></button><button onClick={() => showToast('Product rituals collection opened')}><span className="collection-dot yellow" />Product rituals <em>7</em></button><button onClick={() => showToast('Hiring collection opened')}><span className="collection-dot green" />Hiring <em>4</em></button></nav>
        <div className="sidebar-bottom"><button onClick={() => showToast('Help center opened')}><HelpCircle size={17} />Help center</button><button onClick={() => showToast('No new notifications')}><Bell size={17} />Notifications <span className="notification-dot" /></button><button className="profile" onClick={() => setView('settings')}><div className="avatar you">YU</div><div><strong>Yuna Park</strong><small>Free plan</small></div><MoreHorizontal size={17} /></button></div>
      </aside>
      {mobileNav && <button className="scrim" onClick={() => setMobileNav(false)} />}
      <main className="main-content">
        <header className="topbar"><button className="mobile-menu" onClick={() => setMobileNav(true)}><ListFilter size={20} /></button><div className="breadcrumbs"><span>{view === 'meetings' ? 'My meetings' : 'Workspace'}</span><ChevronLeft size={14} /><strong>{view === 'meetings' ? selected.title : view === 'collection' ? 'Customer calls' : view[0].toUpperCase() + view.slice(1)}</strong></div><div className="top-actions"><div className="global-search"><Search size={17} /><input aria-label="Search meetings" placeholder="Search meetings" value={query} onChange={(e) => setQuery(e.target.value)} /><kbd>⌘ K</kbd></div><button className="icon-button" onClick={() => showToast('No new notifications')} aria-label="Notifications"><Bell size={18} /></button><div className="avatar you">YU</div></div></header>
        {view !== 'meetings' ? <WorkspacePage view={view} onAction={showToast} /> : <section className="content-area">
          <div className="meeting-list-panel"><div className="list-heading"><div><p className="eyebrow">Workspace / June 2024</p><h1>Your meetings</h1></div><button className="filter-button" onClick={() => showToast('Filters opened')}><Filter size={16} /> Filter</button></div><div className="list-toolbar"><span>{visibleMeetings.length} recent meetings</span><button onClick={() => showToast('Sorted by latest')}><Clock3 size={15} /> Latest <ChevronDown size={14} /></button></div><div className="meeting-list">{visibleMeetings.map((meeting) => <button className={`meeting-row ${meeting.id === selectedId ? 'selected' : ''}`} key={meeting.id} onClick={() => { setSelectedId(meeting.id); setActiveTab('overview') }}><div className={`meeting-icon ${meeting.accent}`}>{meeting.initials}</div><div className="meeting-row-copy"><strong>{meeting.title}</strong><span>{meeting.kind} · {meeting.date} · {meeting.duration}</span><div className="mini-people">{meeting.people.slice(0, 3).map((person, index) => <span key={person} className={`avatar tiny avatar-${index}`}>{person.split(' ').map((name) => name[0]).join('')}</span>)}{meeting.people.length > 3 && <span className="people-more">+{meeting.people.length - 3}</span>}</div></div><ChevronDown className="row-chevron" size={16} /></button>)}{visibleMeetings.length === 0 && <div className="empty-results"><Search size={25} /><strong>No meetings found</strong><span>Try a different title, tag, or person.</span></div>}</div><button className="load-more" onClick={() => showToast('You are caught up')}>Load more meetings</button></div>
          <div className="detail-panel"><div className="detail-header"><div><div className="detail-meta"><span className={`status-pill ${selected.kind.toLowerCase()}`}>{selected.kind}</span><span>{selected.date} · {selected.time}</span><span>· {selected.duration}</span></div><h2>{selected.title}</h2><div className="detail-people">{selected.people.map((person, index) => <span key={person}><span className={`avatar tiny avatar-${index}`}>{person.split(' ').map((name) => name[0]).join('')}</span>{person}</span>)}</div></div><div className="detail-actions"><button className="outline-button" onClick={() => showToast('Share link copied')}><Share2 size={16} /> Share</button><button className="icon-button bordered" onClick={() => showToast('More actions')}><MoreHorizontal size={18} /></button></div></div>
            <div className="player"><button className="play-button" onClick={() => setPlaying(!playing)}>{playing ? <span className="pause-bars" /> : <Play size={18} fill="currentColor" />}</button><div className="player-track"><div className={`track-progress ${playing ? 'running' : ''}`} /><div className="track-mark mark-one" /><div className="track-mark mark-two" /></div><span className="player-time">{playing ? '08:43' : '00:00'} / {selected.duration}</span><button className="icon-button light" onClick={() => showToast('Playback speed: 1x')}><span className="speed-label">1x</span></button><button className="icon-button light" onClick={() => showToast('Clip link copied')}><Copy size={16} /></button></div>
            <div className="detail-tabs"><button className={activeTab === 'overview' ? 'active' : ''} onClick={() => setActiveTab('overview')}><Sparkles size={15} /> Overview</button><button className={activeTab === 'transcript' ? 'active' : ''} onClick={() => setActiveTab('transcript')}><FileText size={15} /> Transcript</button><button onClick={() => showToast('Highlights are ready')}><Highlighter size={15} /> Highlights <span className="tab-count">{selected.highlights.length}</span></button><button onClick={() => showToast('Notes are ready')}><BookOpen size={15} /> Notes</button></div>
            {activeTab === 'overview' ? <div className="overview-grid"><section className="summary-section"><div className="section-title"><h3>AI summary</h3><button className="template-select" onClick={() => setTemplate(template === 'Executive summary' ? 'Decision log' : 'Executive summary')}>{template}<ChevronDown size={14} /></button></div><p className="summary-copy">{selected.summary}</p><div className="summary-tags">{selected.tags.map((tag) => <span key={tag}><Tag size={12} />{tag}</span>)}</div><div className="section-title actions-title"><h3>Action items <span>{selected.actions.length}</span></h3><button className="subtle-button" onClick={() => showToast('Action item added')}><Plus size={15} /> Add item</button></div><div className="action-list">{selected.actions.map((action) => { const key = `${selected.id}-${action.label}`; const isDone = action.done || checked[key]; return <div className={`action-item ${isDone ? 'done' : ''}`} key={action.label}><button className="check-button" onClick={() => setChecked({ ...checked, [key]: !isDone })}>{isDone && <Check size={13} />}</button><span className="action-label">{action.label}</span><span className="action-owner">{action.owner}</span><span className="action-due">{action.due}</span></div> })}</div></section><aside className="highlights-section"><div className="section-title"><h3>Key moments</h3><button className="subtle-button" onClick={() => showToast('Highlight added')}><Plus size={15} /> Add</button></div>{selected.highlights.map((highlight) => <button className="highlight-card" key={highlight.time} onClick={() => { setPlaying(true); showToast(`Jumped to ${highlight.time}`) }}><span className="highlight-time">{highlight.time}</span><p>{highlight.text}</p><span className="highlight-arrow">↗</span></button>)}<div className="share-card"><div className="share-icon"><SquareArrowOutUpRight size={17} /></div><div><strong>Share a moment</strong><p>Send a clip without sending the whole meeting.</p></div><button onClick={() => showToast('Clip link copied')}><Copy size={15} /></button></div></aside></div> : <div className="transcript-view"><div className="transcript-head"><div><h3>Transcript</h3><span>Searchable conversation · {selected.duration}</span></div><button className="outline-button" onClick={() => showToast('Transcript copied')}><Copy size={15} /> Copy</button></div>{selected.transcript.map((line) => <div className="transcript-line" key={line.time}><span className="transcript-time">{line.time}</span><div className="avatar tiny avatar-1">{line.avatar}</div><div><strong>{line.speaker}</strong><p>{line.text}</p></div></div>)}<button className="load-more transcript-more" onClick={() => showToast('Full transcript loaded')}>Show full transcript</button></div>}
            <div className="ask-bar"><Sparkles size={17} /><input aria-label="Ask Rally" placeholder="Ask anything about this meeting..." value={question} onChange={(event) => setQuestion(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') void askRally() }} /><button onClick={() => void askRally()}>{askingRally ? 'Thinking...' : 'Ask Rally'}</button></div>{rallyAnswer && <div className="rally-answer"><Sparkles size={16} /><p>{rallyAnswer}</p></div>}
          </div>
        </section>}
      </main>
      {toast && <div className="toast"><Check size={16} />{toast}</div>}
      {captureOpen && <div className="modal-backdrop" onClick={() => !recording && setCaptureOpen(false)}><div className="capture-modal" onClick={(event) => event.stopPropagation()}><button className="modal-close" onClick={() => !recording && setCaptureOpen(false)}><X size={17} /></button><div className="modal-icon"><Video size={22} /></div><p className="eyebrow">Capture setup</p><h2>{recording ? 'Rally is listening' : transcribing ? 'Turning speech into notes' : 'Bring Rally to your next call'}</h2><p>{recording ? 'Speak naturally for a moment, then stop the capture to transcribe it with Groq Whisper.' : transcribing ? 'Your recording is being sent through the secure server proxy.' : 'Connect your calendar or test bot-free capture directly from your browser.'}</p>{capturedText && <div className="captured-transcript"><FileText size={16} /><p>{capturedText}</p></div>}<div className="capture-options">{recording ? <button className="stop-recording" onClick={stopCapture}><span className="recording-dot" /><span><strong>Stop and transcribe</strong><small>Send this short recording to Groq Whisper</small></span><Check size={16} /></button> : <><button onClick={() => { setCaptureOpen(false); showToast('Google Calendar connection started') }}><CalendarDays size={17} /><span><strong>Connect Google Calendar</strong><small>Recommended for automatic meeting prep</small></span><ChevronLeft size={16} /></button><button onClick={() => void startCapture()} disabled={transcribing}><Video size={17} /><span><strong>{transcribing ? 'Transcribing...' : 'Start browser capture'}</strong><small>Use your microphone for a quick test</small></span><ChevronLeft size={16} /></button></>}</div><div className="modal-foot"><ShieldCheck size={15} /> You control what gets captured and shared.</div></div></div>}
    </div>
  )
}

export default App
