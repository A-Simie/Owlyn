import Editor, { OnMount } from "@monaco-editor/react";
import { useState, useRef, useEffect } from "react";
import { candidateApi } from "@/api/candidate.api";

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: string;
  highlightedLine?: number | null;
}

export default function CodeEditor({
  value,
  onChange,
  language = "javascript",
  highlightedLine = null,
}: CodeEditorProps) {
  const [theme] = useState<"vs-dark" | "light">("vs-dark");
  const monacoRef = useRef<any>(null);
  const editorRef = useRef<any>(null);
  const decorationsRef = useRef<string[]>([]);

  useEffect(() => {
    if (!editorRef.current || !monacoRef.current) return;

    if (highlightedLine) {
      decorationsRef.current = editorRef.current.deltaDecorations(decorationsRef.current, [
        {
          range: new monacoRef.current.Range(highlightedLine, 1, highlightedLine, 1),
          options: {
            isWholeLine: true,
            className: "bg-primary/20 border-l-4 border-primary",
            glyphMarginClassName: "material-symbols-outlined text-primary text-xs",
          },
        },
      ]);
      editorRef.current.revealLineInCenter(highlightedLine);
    } else {
      decorationsRef.current = editorRef.current.deltaDecorations(decorationsRef.current, []);
    }
  }, [highlightedLine]);

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    monacoRef.current = monaco;
    editorRef.current = editor;

    let lastCallId = 0;

    monaco.languages.registerInlineCompletionsProvider(language, {
      provideInlineCompletions: async (model: any, position: any, _context: any, token: any) => {
        const callId = ++lastCallId;
        
        // Wait for 1.5s pause in typing
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // If a new request came in or it was cancelled, abort
        if (callId !== lastCallId || token.isCancellationRequested) {
          return { items: [] };
        }

        const code = model.getValue();
        const cursorPosition = model.getOffsetAt(position);

        try {
          const { suggestion } = await candidateApi.getCopilotSuggestion(
            code,
            language,
            cursorPosition,
          );

          if (!suggestion || callId !== lastCallId || token.isCancellationRequested) {
            return { items: [] };
          }

          return {
            items: [
              {
                insertText: suggestion,
                range: new monaco.Range(
                  position.lineNumber,
                  position.column,
                  position.lineNumber,
                  position.column,
                ),
              },
            ],
          };
        } catch (err) {
          console.error("Copilot failure:", err);
          return { items: [] };
        }
      },
      disposeInlineCompletions: () => {},
    });
  };

  return (
    <div className="h-full w-full bg-[#121212] overflow-hidden">
      <Editor
        height="100%"
        defaultLanguage={language}
        language={language}
        value={value}
        onChange={(v) => onChange(v || "")}
        onMount={handleEditorDidMount}
        theme={theme}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbers: "on",
          roundedSelection: true,
          scrollBeyondLastLine: false,
          readOnly: false,
          automaticLayout: true,
          padding: { top: 20, bottom: 20 },
          fontFamily: "'Fira Code', 'JetBrains Mono', monospace",
          cursorStyle: "block",
          cursorBlinking: "smooth",
          renderLineHighlight: "all",
          inlineSuggest: { enabled: true, showToolbar: "always" },
        }}
        loading={
          <div className="h-full w-full flex items-center justify-center bg-[#121212] text-primary/40 text-[10px] uppercase tracking-[0.2em] font-black">
            Initializing Engine...
          </div>
        }
      />
    </div>
  );
}
