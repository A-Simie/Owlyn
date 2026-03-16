import OtpInput from "./OtpInput";

interface SignupOtpVerificationProps {
  onBack: () => void;
  onVerify: (otp: string) => void;
  loading: boolean;
  error: string | null;
}

export function SignupOtpVerification({ onBack, onVerify, loading, error }: SignupOtpVerificationProps) {
  return (
    <div className="space-y-8">
      <OtpInput onComplete={onVerify} disabled={loading} error={error} />
      {loading && (
        <div className="flex items-center justify-center gap-2 text-sm text-muted">
          <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          Creating your account...
        </div>
      )}
      <button type="button" onClick={onBack} className="w-full text-sm text-subtle hover:text-primary transition-colors">
        ← Back to signup
      </button>
    </div>
  );
}
