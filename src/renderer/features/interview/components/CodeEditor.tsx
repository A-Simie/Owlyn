import Editor from "@monaco-editor/react";
import { useState } from "react";

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
  const [theme, setTheme] = useState<"vs-dark" | "light">("vs-dark");

  return (
    <div className="h-full w-full bg-[#121212] overflow-hidden">
      <Editor
        height="100%"
        defaultLanguage={language}
        language={language}
        value={value}
        onChange={(v) => onChange(v || "")}
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
        }}
        loading={
          <div className="h-full w-full flex items-center justify-center bg-[#121212] text-primary/40 text-xs uppercase tracking-widest font-bold">
            Initializing Engine...
          </div>
        }
      />
    </div>
  );
}
