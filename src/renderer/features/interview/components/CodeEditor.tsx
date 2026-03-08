import Editor, { OnMount } from "@monaco-editor/react";
import { useState, useRef } from "react";

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: string;
}

export default function CodeEditor({
  value,
  onChange,
  language = "javascript",
}: CodeEditorProps) {
  const [theme] = useState<"vs-dark" | "light">("vs-dark");
  const monacoRef = useRef<any>(null);

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    monacoRef.current = monaco;

    // Phase 4.2: Register Inline Completions Provider (Ghost Text)
    monaco.languages.registerInlineCompletionsProvider(language, {
      provideInlineCompletions: async (model: any, position: any) => {
        // This will eventually be powered by the Agent 3 WebSocket feed in Phase 5
        const lineContent = model.getLineContent(position.lineNumber);

        // Mock suggestion logic for demo
        if (lineContent.includes("function") && !lineContent.includes("{")) {
          return {
            items: [
              {
                insertText:
                  " main() {\n  console.log('Owlyn AI Engine linked');\n}",
                range: new monaco.Range(
                  position.lineNumber,
                  position.column,
                  position.lineNumber,
                  position.column,
                ),
              },
            ],
          };
        }
        return { items: [] };
      },
      freeInlineCompletions: () => {},
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
