import { useState, useRef, useEffect, useCallback } from 'react';
import api from '../services/api';
import { PaperAirplaneIcon, SparklesIcon } from '@heroicons/react/24/outline';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: number;
}

interface SecurityOption {
  symbol: string;
  name: string;
}

interface CompanyAnalysis {
  symbol: string;
  analysis: string;
}

type ActiveTab = 'chat' | 'company' | 'news';

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const PREDEFINED_QUESTIONS = [
  'What is P/E ratio?',
  'Explain EPS and how to use it',
  'What does market cap mean?',
  'How to analyze a company\'s financial health?',
  'What\'s the difference between stocks and bonds?',
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

let messageCounter = 0;
const createMessage = (role: 'user' | 'assistant', text: string): Message => ({
  id: `msg-${Date.now()}-${++messageCounter}`,
  role,
  text,
  timestamp: Date.now(),
});

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

const AIAssistantPage = () => {
  /* ------ state ------ */
  const [activeTab, setActiveTab] = useState<ActiveTab>('chat');
  const [messages, setMessages] = useState<Message[]>([
    createMessage(
      'assistant',
      'Hello! I am your AI investment assistant. Ask me anything about investing, or use the tools below to analyze companies and summarize news.',
    ),
  ]);
  const [input, setInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  // Securities for the company analysis dropdown
  const [securities, setSecurities] = useState<SecurityOption[]>([]);
  const [selectedSymbol, setSelectedSymbol] = useState('');
  const [securitiesLoading, setSecuritiesLoading] = useState(false);

  // Company analysis
  const [companyAnalysis, setCompanyAnalysis] = useState<CompanyAnalysis | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);

  // News summary
  const [newsSummary, setNewsSummary] = useState<string | null>(null);
  const [newsLoading, setNewsLoading] = useState(false);

  /* ------ refs ------ */
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  /* ------ auto-scroll chat ------ */
  const scrollToBottom = useCallback(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  /* ------ fetch securities on mount ------ */
  useEffect(() => {
    const fetchSecurities = async () => {
      setSecuritiesLoading(true);
      try {
        const { data: resp } = await api.get('/securities');
        const list: SecurityOption[] = (resp?.data ?? resp ?? []).map(
          (s: Record<string, any>) => ({
            symbol: s.symbol ?? '',
            name: s.name ?? s.symbol ?? '',
          }),
        );
        setSecurities(list);
        if (list.length > 0) {
          setSelectedSymbol(list[0].symbol);
        }
      } catch {
        // Silently fail; dropdown will remain empty
      } finally {
        setSecuritiesLoading(false);
      }
    };
    fetchSecurities();
  }, []);

  /* ------ send chat message ------ */
  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || chatLoading) return;

      setInput('');
      const userMsg = createMessage('user', trimmed);
      setMessages((prev) => [...prev, userMsg]);
      setChatLoading(true);

      try {
        const { data: resp } = await api.post('/ai/ask', {
          question: trimmed,
        });

        const reply =
          resp?.data?.answer ?? resp?.answer ?? resp?.message ?? 'No response received.';
        setMessages((prev) => [...prev, createMessage('assistant', reply)]);
      } catch (err: any) {
        const detail =
          err?.response?.data?.detail ??
          err?.response?.data?.message ??
          err?.message ??
          'Something went wrong. Please try again.';
        setMessages((prev) => [...prev, createMessage('assistant', `Error: ${detail}`)]);
      } finally {
        setChatLoading(false);
        inputRef.current?.focus();
      }
    },
    [chatLoading],
  );

  /* ------ handle form submit ------ */
  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      sendMessage(input);
    },
    [input, sendMessage],
  );

  /* ------ handle predefined question click ------ */
  const handlePredefinedClick = useCallback(
    (question: string) => {
      sendMessage(question);
    },
    [sendMessage],
  );

  /* ------ analyze company ------ */
  const handleAnalyzeCompany = useCallback(async () => {
    if (!selectedSymbol || analysisLoading) return;

    setAnalysisLoading(true);
    setCompanyAnalysis(null);

    try {
      const { data: resp } = await api.post('/ai/analyze-company', {
        symbol: selectedSymbol,
      });

      const analysisText =
        resp?.data?.analysis ?? resp?.analysis ?? resp?.message ?? 'No analysis available.';
      setCompanyAnalysis({ symbol: selectedSymbol, analysis: analysisText });
    } catch (err: any) {
      const detail =
        err?.response?.data?.detail ??
        err?.response?.data?.message ??
        err?.message ??
        'Failed to analyze company.';
      setCompanyAnalysis({ symbol: selectedSymbol, analysis: `Error: ${detail}` });
    } finally {
      setAnalysisLoading(false);
    }
  }, [selectedSymbol, analysisLoading]);

  /* ------ summarize news ------ */
  const handleSummarizeNews = useCallback(async () => {
    if (newsLoading) return;

    setNewsLoading(true);
    setNewsSummary(null);

    try {
      const { data: resp } = await api.post('/ai/summarize-news');

      const summaryText =
        resp?.data?.summary ?? resp?.summary ?? resp?.message ?? 'No summary available.';
      setNewsSummary(summaryText);
    } catch (err: any) {
      const detail =
        err?.response?.data?.detail ??
        err?.response?.data?.message ??
        err?.message ??
        'Failed to summarize news.';
      setNewsSummary(`Error: ${detail}`);
    } finally {
      setNewsLoading(false);
    }
  }, [newsLoading]);

  /* ------ textarea auto-resize ------ */
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    // Reset height then set to scrollHeight so it grows
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  }, []);

  /* ------ key bindings: Ctrl+Enter to send ------ */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        sendMessage(input);
      }
    },
    [input, sendMessage],
  );

  /* ------------------------------------------------------------------ */
  /*  Tab header                                                         */
  /* ------------------------------------------------------------------ */

  const tabs: { key: ActiveTab; label: string }[] = [
    { key: 'chat', label: 'Chat' },
    { key: 'company', label: 'Company Analysis' },
    { key: 'news', label: 'News Summary' },
  ];

  /* ------------------------------------------------------------------ */
  /*  Render: Chat Tab                                                   */
  /* ------------------------------------------------------------------ */

  const renderChatTab = () => (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto space-y-4 px-4 py-4 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent"
      >
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-br-md'
                  : 'bg-gray-800 text-gray-100 rounded-bl-md'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {chatLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-800 text-gray-100 rounded-2xl rounded-bl-md px-4 py-3 text-sm">
              <div className="flex items-center gap-2">
                <SparklesIcon className="w-4 h-4 text-blue-400 animate-pulse" />
                <span className="text-gray-400">AI is thinking...</span>
                <span className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </span>
              </div>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Predefined questions */}
      <div className="px-4 py-3 border-t border-gray-800">
        <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wider">Quick Questions</p>
        <div className="flex flex-wrap gap-2">
          {PREDEFINED_QUESTIONS.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => handlePredefinedClick(q)}
              disabled={chatLoading}
              className="px-3 py-1.5 text-xs font-medium bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-full border border-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Input area */}
      <div className="border-t border-gray-800 px-4 py-3">
        <form onSubmit={handleSubmit} className="flex items-end gap-3">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything about investing..."
              rows={1}
              disabled={chatLoading}
              className="w-full bg-gray-800 text-white placeholder-gray-500 rounded-xl px-4 py-3 pr-12 text-sm resize-none outline-none border border-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors disabled:opacity-50"
              style={{ minHeight: '44px', maxHeight: '120px' }}
            />
          </div>
          <button
            type="submit"
            disabled={!input.trim() || chatLoading}
            className="flex-shrink-0 w-11 h-11 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
          >
            <PaperAirplaneIcon className="w-5 h-5 text-white -rotate-45" />
          </button>
        </form>
        <p className="text-[10px] text-gray-600 mt-1.5">Ctrl+Enter to send</p>
      </div>
    </div>
  );

  /* ------------------------------------------------------------------ */
  /*  Render: Company Analysis Tab                                       */
  /* ------------------------------------------------------------------ */

  const renderCompanyTab = () => (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-white">Company Analysis</h2>
        <p className="text-sm text-gray-400 mt-1">
          Select a security and run a fundamental analysis powered by AI.
        </p>
      </div>

      {/* Selector */}
      <div className="flex items-end gap-4 flex-wrap">
        <div className="w-64">
          <label htmlFor="security-select" className="block text-xs font-medium text-gray-400 mb-1.5">
            Select Security
          </label>
          <select
            id="security-select"
            value={selectedSymbol}
            onChange={(e) => setSelectedSymbol(e.target.value)}
            disabled={securitiesLoading || analysisLoading}
            className="w-full bg-gray-800 text-white rounded-lg px-3 py-2.5 text-sm border border-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none disabled:opacity-50"
          >
            {securities.length === 0 && (
              <option value="">{securitiesLoading ? 'Loading...' : 'No securities available'}</option>
            )}
            {securities.map((s) => (
              <option key={s.symbol} value={s.symbol}>
                {s.symbol} — {s.name}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={handleAnalyzeCompany}
          disabled={!selectedSymbol || analysisLoading || securitiesLoading}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
        >
          {analysisLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <SparklesIcon className="w-4 h-4" />
              Analyze
            </>
          )}
        </button>
      </div>

      {/* Result */}
      {companyAnalysis && (
        <div className="bg-gray-800/80 border border-gray-700 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <SparklesIcon className="w-5 h-5 text-blue-400" />
            <h3 className="text-sm font-semibold text-white">
              Analysis: {companyAnalysis.symbol}
            </h3>
          </div>
          <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
            {companyAnalysis.analysis}
          </div>
        </div>
      )}
    </div>
  );

  /* ------------------------------------------------------------------ */
  /*  Render: News Summary Tab                                           */
  /* ------------------------------------------------------------------ */

  const renderNewsTab = () => (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-white">News Summary</h2>
        <p className="text-sm text-gray-400 mt-1">
          Get an AI-generated summary of the latest market news.
        </p>
      </div>

      <button
        type="button"
        onClick={handleSummarizeNews}
        disabled={newsLoading}
        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
      >
        {newsLoading ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Summarizing...
          </>
        ) : (
          <>
            <SparklesIcon className="w-4 h-4" />
            Summarize Latest News
          </>
        )}
      </button>

      {/* Initial state */}
      {!newsSummary && !newsLoading && (
        <div className="bg-gray-800/40 border border-dashed border-gray-700 rounded-xl p-8 text-center">
          <SparklesIcon className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <p className="text-sm text-gray-500">
            Click the button above to generate a summary of the latest financial news.
          </p>
        </div>
      )}

      {/* Result */}
      {newsSummary && (
        <div className="bg-gray-800/80 border border-gray-700 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <SparklesIcon className="w-5 h-5 text-blue-400" />
            <h3 className="text-sm font-semibold text-white">Latest News Summary</h3>
          </div>
          <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
            {newsSummary}
          </div>
        </div>
      )}
    </div>
  );

  /* ------------------------------------------------------------------ */
  /*  Main Render                                                        */
  /* ------------------------------------------------------------------ */

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      {/* Page header */}
      <div className="flex-shrink-0 px-6 pt-4 pb-0">
        <h1 className="text-2xl font-bold text-white">AI Assistant</h1>
        <p className="text-sm text-gray-400 mt-1">
          Ask questions, analyze companies, and summarize market news.
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex-shrink-0 flex gap-1 px-6 mt-4 border-b border-gray-800">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors relative ${
              activeTab === tab.key
                ? 'text-blue-400 bg-gray-900'
                : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/50'
            }`}
          >
            {tab.label}
            {activeTab === tab.key && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 bg-gray-900 overflow-hidden rounded-b-xl">
        {activeTab === 'chat' && renderChatTab()}
        {activeTab === 'company' && renderCompanyTab()}
        {activeTab === 'news' && renderNewsTab()}
      </div>
    </div>
  );
};

export default AIAssistantPage;
