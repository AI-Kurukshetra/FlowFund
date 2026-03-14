import { ReactNode, SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function BaseIcon({ children, ...props }: IconProps & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export function OverviewIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M3 13h8V3H3z" />
      <path d="M13 21h8v-6h-8z" />
      <path d="M13 11h8V3h-8z" />
      <path d="M3 21h8v-6H3z" />
    </BaseIcon>
  );
}

export function BuildingIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M4 21h16" />
      <path d="M6 21V5l6-2 6 2v16" />
      <path d="M10 9h.01" />
      <path d="M14 9h.01" />
      <path d="M10 13h.01" />
      <path d="M14 13h.01" />
    </BaseIcon>
  );
}

export function ApplicationIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M7 3h7l5 5v13H7z" />
      <path d="M14 3v5h5" />
      <path d="M10 13h6" />
      <path d="M10 17h6" />
    </BaseIcon>
  );
}

export function LoanIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <path d="M3 10h18" />
      <path d="M8 14h.01" />
      <path d="M12 14h.01" />
    </BaseIcon>
  );
}

export function PaymentIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M12 3v18" />
      <path d="M17 7c0-2-2.2-3-5-3s-5 1-5 3 2.2 3 5 3 5 1 5 3-2.2 3-5 3-5-1-5-3" />
    </BaseIcon>
  );
}

export function CreditLimitIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M3 7h18v10H3z" />
      <path d="M3 11h18" />
      <path d="M8 15h4" />
    </BaseIcon>
  );
}

export function BalanceIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M3 7h18v10H3z" />
      <circle cx="12" cy="12" r="2.5" />
      <path d="M17 12h.01" />
    </BaseIcon>
  );
}

export function CalendarIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M8 3v4" />
      <path d="M16 3v4" />
      <path d="M3 10h18" />
    </BaseIcon>
  );
}

export function ActiveLoanIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M4 12a8 8 0 1 0 8-8" />
      <path d="M12 4v8l4 2" />
    </BaseIcon>
  );
}

export function LogoutIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5" />
      <path d="M21 12H9" />
    </BaseIcon>
  );
}
