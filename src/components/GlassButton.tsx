import './GlassButton.css';

interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export default function GlassButton({ 
  variant = 'primary', 
  size = 'md', 
  children, 
  className = '',
  ...props 
}: GlassButtonProps) {
  const sizeClasses = {
    sm: 'glass-btn-sm',
    md: 'glass-btn-md',
    lg: 'glass-btn-lg',
  };

  return (
    <button 
      className={`glass-button glass-button-${variant} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      <span className="glass-button-bg" />
      <span className="glass-button-content">{children}</span>
    </button>
  );
}
