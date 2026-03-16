import { useRef, useState, useEffect } from "react";

interface WorkspaceProfileProps {
  workspace: any;
  onUpdate: (name: string, logo: File | null) => Promise<void>;
  updating: boolean;
}

export function WorkspaceProfile({ workspace, onUpdate, updating }: WorkspaceProfileProps) {
  const [wsName, setWsName] = useState("");
  const [wsLogoFile, setWsLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (workspace) {
      setWsName(workspace.name);
      setLogoPreview(workspace.logoUrl || null);
    }
  }, [workspace]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 7 * 1024 * 1024) {
        alert("File size must be less than 7MB");
        return;
      }
      setWsLogoFile(file);
      setImageError(false);
      const reader = new FileReader();
      reader.onloadend = () => setLogoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const getInitials = (name: string) => name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="bg-[#0d0d0d] border border-primary/15 rounded-xl p-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4">
        <button
          onClick={() => onUpdate(wsName, wsLogoFile)}
          disabled={updating || (wsName === workspace?.name && !wsLogoFile)}
          className="px-6 py-2 bg-primary text-black font-black text-[10px] uppercase tracking-widest rounded-lg hover:brightness-110 disabled:opacity-20 transition-all flex items-center gap-2"
        >
          {updating ? (
            <div className="size-3 border-2 border-black/30 border-t-black rounded-full animate-spin" />
          ) : (
            <span className="material-symbols-outlined text-sm">save</span>
          )}
          Save Changes
        </button>
      </div>

      <h3 className="text-sm font-semibold text-white mb-6">Workspace Profile</h3>
      
      <div className="flex gap-8 items-start">
        <div className="flex flex-col items-center gap-3">
          <div className="size-24 rounded-2xl bg-white/5 border border-primary/10 flex items-center justify-center overflow-hidden shrink-0 shadow-2xl relative">
            {logoPreview && !imageError ? (
              <img src={logoPreview} alt="Logo" onError={() => setImageError(true)} className="w-full h-full object-cover" />
            ) : (
              <div className="flex flex-col items-center justify-center bg-primary/10 w-full h-full">
                <span className="text-3xl font-black text-primary tracking-tighter">{wsName ? getInitials(wsName) : "OW"}</span>
              </div>
            )}
          </div>
          <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 text-[9px] font-black text-primary uppercase tracking-[0.2em] hover:text-white transition-colors">
            <span className="material-symbols-outlined text-sm">upload</span>
            Change Logo
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        </div>

        <div className="flex-1 space-y-6 pt-1">
          <div className="max-w-md">
            <label className="block text-[10px] font-black text-primary/60 uppercase tracking-[0.2em] mb-2 ml-1">Workspace Name</label>
            <input
              type="text"
              value={wsName}
              onChange={(e) => setWsName(e.target.value)}
              className="w-full bg-white/[0.03] border border-white/5 rounded-xl text-white text-sm py-3 px-4 focus:border-primary/40 outline-none transition-all"
              placeholder="Enter company name"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
