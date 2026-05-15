import React from 'react';

export default function StorefrontIcon({
  size = 24,
  color = '#16a34a',
  accent = '#22c55e',
  title = 'Shop',
  style,
}) {
  const stroke = color;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      role="img"
      aria-label={title}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
    >
      <title>{title}</title>
      <path
        d="M5 11l2.2-4.4A2 2 0 0 1 9 5.5h14a2 2 0 0 1 1.8 1.1L27 11"
        fill="none"
        stroke={stroke}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5 11h22v2.2a3.3 3.3 0 0 1-3.3 3.3 3.3 3.3 0 0 1-3.3-3.3 3.3 3.3 0 0 1-3.4 3.3 3.3 3.3 0 0 1-3.3-3.3 3.3 3.3 0 0 1-3.4 3.3A3.3 3.3 0 0 1 8.3 16.5 3.3 3.3 0 0 1 5 13.2V11z"
        fill={accent}
        fillOpacity="0.18"
        stroke={stroke}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M7 16.5V25a1.5 1.5 0 0 0 1.5 1.5h15A1.5 1.5 0 0 0 25 25v-8.5"
        fill="none"
        stroke={stroke}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M13 26.5V20a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v6.5"
        fill={accent}
        fillOpacity="0.25"
        stroke={stroke}
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}
