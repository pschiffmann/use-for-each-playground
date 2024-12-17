export interface IconProps {
  className?: string;
}

export function AddIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      width="24px"
      height="24px"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <line x1="12" x2="12" y1="4" y2="20" strokeWidth="2" />
      <line x1="4" x2="20" y1="12" y2="12" strokeWidth="2" />
    </svg>
  );
}

export function DragIndicatorIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      width="24px"
      height="24px"
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <circle cx="9" cy="6" r="2.2" />
      <circle cx="15" cy="6" r="2.2" />
      <circle cx="9" cy="12" r="2.2" />
      <circle cx="15" cy="12" r="2.2" />
      <circle cx="9" cy="18" r="2.2" />
      <circle cx="15" cy="18" r="2.2" />
    </svg>
  );
}

export function CloseIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      width="24px"
      height="24px"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <line x1="4" x2="20" y1="4" y2="20" strokeWidth="2" />
      <line x1="20" x2="4" y1="4" y2="20" strokeWidth="2" />
    </svg>
  );
}
