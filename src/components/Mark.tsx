/** Shared Sckoll layered-chevron mark. Matches the homepage + ProductPage logo. */
export default function Mark({ small = false }: { small?: boolean }) {
  return (
    <span className={`sckoll-mark ${small ? "sckoll-mark-small" : ""}`} aria-hidden="true">
      <svg viewBox="0 0 32 32" fill="none">
        <path
          d="M6 11.5 16 18l10-6.5M6 19.5 16 26l10-6.5"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M6 4.5 16 11l10-6.5"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity=".38"
        />
      </svg>
    </span>
  );
}
