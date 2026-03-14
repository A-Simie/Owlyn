import { usePersonaCustomization } from "./hooks/usePersonaCustomization";
import { PersonaHeader } from "./components/PersonaHeader";
import { PersonaLibrary } from "./components/PersonaLibrary";
import { PersonaIdentity } from "./components/PersonaIdentity";
import { PersonaKnowledgeBase } from "./components/PersonaKnowledgeBase";
import { PersonaMatrix } from "./components/PersonaMatrix";
import { PersonaVoiceAccent } from "./components/PersonaVoiceAccent";
import { PersonaSkillDomains } from "./components/PersonaSkillDomains";

export default function AgentCustomizationPage() {
  const {
    personas,
    selectedPersona,
    isSaving,
    status,
    form,
    actions
  } = usePersonaCustomization();

  const handleToggleDomain = (label: string) => {
    if (form.selectedDomains.includes(label)) {
      form.setSelectedDomains(form.selectedDomains.filter((d) => d !== label));
    } else {
      form.setSelectedDomains([...form.selectedDomains, label]);
    }
  };

  const handleAddCustomDomain = (label: string) => {
    if (!form.selectedDomains.includes(label)) {
      form.setSelectedDomains([...form.selectedDomains, label]);
    }
  };

  return (
    <div className="text-slate-900 dark:text-slate-100 min-h-screen flex flex-col overflow-hidden font-sans">
      <PersonaHeader 
        status={status}
        isSaving={isSaving}
        isEditMode={!!selectedPersona}
        onReset={actions.resetForm}
        onSave={actions.handleSave}
      />

      <main className="flex-1 overflow-y-auto custom-scrollbar p-8">
        <div className="max-w-6xl mx-auto space-y-12">
          
          <PersonaLibrary 
            personas={personas}
            selectedId={selectedPersona?.id}
            onEdit={actions.handleEdit}
            onDelete={actions.handleDelete}
          />

          <div className="space-y-10 pb-20">
            <PersonaIdentity 
              name={form.name}
              setName={form.setName}
              language={form.selectedLanguage}
              setLanguage={form.setSelectedLanguage}
              isAdaptive={form.isAdaptive}
              setIsAdaptive={form.setIsAdaptive}
            />

            <PersonaKnowledgeBase 
              files={form.contextFiles}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) form.setContextFiles([file]);
              }}
              hasExistingKnowledge={selectedPersona?.hasKnowledgeBase}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              <div className="lg:col-span-2">
                <PersonaMatrix 
                  sliders={form.sliders}
                  onChange={(key, val) => form.setSliders(prev => ({ ...prev, [key]: val }))}
                />
              </div>
              <div className="lg:col-span-1">
                <PersonaVoiceAccent 
                  selectedTone={form.selectedTone}
                  onSelect={form.setSelectedTone}
                />
              </div>
            </div>

            <PersonaSkillDomains 
              selectedDomains={form.selectedDomains}
              onToggle={handleToggleDomain}
              onAddCustom={handleAddCustomDomain}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
