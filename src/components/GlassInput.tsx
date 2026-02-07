import './GlassInput.css';

interface GlassInputProps extends React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement> {
  label?: string;
  error?: string;
  multiline?: boolean;
  rows?: number;
}

export default function GlassInput({ 
  label, 
  error, 
  multiline = false,
  rows = 3,
  className = '',
  ...props 
}: GlassInputProps) {
  const InputElement = multiline ? 'textarea' : 'input';
  
  return (
    <div className={`glass-input-wrapper ${className}`}>
      {label && <label className="glass-input-label">{label}</label>}
      <InputElement 
        className={`glass-input-field ${error ? 'has-error' : ''}`}
        rows={multiline ? rows : undefined}
        {...props as any}
      />
      {error && <span className="glass-input-error">{error}</span>}
    </div>
  );
}
