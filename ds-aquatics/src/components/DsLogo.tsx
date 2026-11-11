import React from 'react';

interface DsLogoProps {
  className?: string;
  size?: number;
  customLogoUrl?: string;
  showText?: boolean;
}

export const DsLogo: React.FC<DsLogoProps> = ({
  className = '',
  size = 48,
  customLogoUrl,
  showText = false,
}) => {
  const [hasError, setHasError] = React.useState(false);
  const activeLogo = customLogoUrl && customLogoUrl.trim() !== '' ? customLogoUrl : '/logo.png';

  if (activeLogo && !hasError) {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <img
          src={activeLogo}
          alt="DS AQUATICS Logo"
          onError={() => setHasError(true)}
          className="rounded-full object-cover drop-shadow-md border border-amber-400/40 bg-slate-900"
          style={{ width: size, height: size }}
          referrerPolicy="no-referrer"
        />
        {showText && (
          <div className="flex flex-col">
            <span className="font-heading font-black tracking-wider text-navy-900 text-lg leading-tight">
              DS AQUATICS
            </span>
            <span className="text-[10px] tracking-wide text-cyan-600 font-semibold uppercase">
              Learn to Swim, Learn for Life
            </span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 200 200"
        className="shrink-0 drop-shadow-md select-none transition-transform hover:scale-105 duration-300"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="goldRing" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="30%" stopColor="#eab308" />
            <stop offset="70%" stopColor="#ca8a04" />
            <stop offset="100%" stopColor="#fef08a" />
          </linearGradient>
          <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fcd34d" />
            <stop offset="50%" stopColor="#d97706" />
            <stop offset="100%" stopColor="#b45309" />
          </linearGradient>
          <linearGradient id="blueWave" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0284c7" />
            <stop offset="50%" stopColor="#0ea5e9" />
            <stop offset="100%" stopColor="#0369a1" />
          </linearGradient>
          <radialGradient id="navyBg" cx="50%" cy="50%" r="50%">
            <stop offset="60%" stopColor="#091a38" />
            <stop offset="100%" stopColor="#050e20" />
          </radialGradient>
          {/* Circular text paths */}
          <path
            id="textPathTop"
            d="M 28 100 A 72 72 0 0 1 172 100"
            fill="none"
          />
          <path
            id="textPathBottom"
            d="M 172 100 A 72 72 0 0 1 28 100"
            fill="none"
          />
        </defs>

        {/* Outer gold rim */}
        <circle cx="100" cy="100" r="98" fill="url(#goldRing)" />
        <circle cx="100" cy="100" r="94" fill="#091a38" />

        {/* Outer Navy Ring */}
        <circle cx="100" cy="100" r="92" fill="url(#navyBg)" />

        {/* Top curved text: DIPTA SHAKTI */}
        <text fill="url(#goldRing)" fontSize="14" fontWeight="800" letterSpacing="4.5">
          <textPath href="#textPathTop" startOffset="50%" textAnchor="middle">
            DIPTA SHAKTI
          </textPath>
        </text>

        {/* Dots on the side */}
        <circle cx="24" cy="100" r="3" fill="#facc15" />
        <circle cx="176" cy="100" r="3" fill="#facc15" />

        {/* Bottom curved text: DISCIPLINE • STRENGTH • EXCELLENT */}
        <text fill="url(#goldRing)" fontSize="8.5" fontWeight="700" letterSpacing="2.5">
          <textPath href="#textPathBottom" startOffset="50%" textAnchor="middle">
            DISCIPLINE • STRENGTH • EXCELLENT
          </textPath>
        </text>

        {/* Inner white medallion */}
        <circle cx="100" cy="100" r="62" fill="#ffffff" stroke="url(#goldRing)" strokeWidth="2.5" />

        {/* Stylized DS Monogram */}
        <g transform="translate(48, 52)">
          {/* D letter */}
          <path
            d="M 12 12 L 32 12 C 48 12, 54 22, 54 36 C 54 50, 48 60, 32 60 L 12 60 Z M 24 23 L 24 49 L 32 49 C 40 49, 43 43, 43 36 C 43 29, 40 23, 32 23 Z"
            fill="#0b1e42"
          />
          {/* S letter overlapping with golden accent */}
          <path
            d="M 50 14 C 44 14, 38 18, 38 25 C 38 32, 45 35, 54 38 C 66 42, 74 48, 74 58 C 74 72, 60 76, 44 76 C 36 76, 30 73, 26 69 L 32 58 C 35 62, 40 64, 46 64 C 54 64, 60 60, 60 54 C 60 48, 52 44, 43 40 C 31 36, 26 30, 26 21 C 26 9, 39 4, 52 4 C 59 4, 66 7, 70 11 L 64 21 C 60 17, 56 14, 50 14 Z"
            fill="#0f295a"
          />
          {/* Gold upper bar of S */}
          <path
            d="M 44 16 L 68 16 C 72 20, 70 26, 62 26 L 46 26 Z"
            fill="url(#goldGradient)"
          />
        </g>

        {/* Waves under DS */}
        <path
          d="M 48 128 C 60 120, 75 132, 90 126 C 105 120, 120 132, 135 125 C 145 120, 152 124, 154 126 C 148 133, 135 131, 125 135 C 110 141, 95 129, 80 135 C 65 141, 52 133, 48 128 Z"
          fill="url(#blueWave)"
        />
        <path
          d="M 52 136 C 65 130, 80 142, 95 135 C 110 128, 125 140, 140 134 C 148 131, 151 133, 152 135 C 146 141, 134 139, 122 144 C 108 150, 93 138, 78 143 C 65 148, 55 141, 52 136 Z"
          fill="#075985"
        />

        {/* Subtitle: - AQUATICS - */}
        <text
          x="100"
          y="150"
          textAnchor="middle"
          fill="#0f295a"
          fontSize="8.5"
          fontWeight="800"
          letterSpacing="4"
        >
          — AQUATICS —
        </text>
      </svg>

      {showText && (
        <div className="flex flex-col">
          <span className="font-heading font-black tracking-wide text-slate-900 text-xl leading-none">
            DS AQUATICS
          </span>
          <span className="text-[11px] tracking-wide text-cyan-600 font-semibold">
            Learn to Swim, Learn for Life.
          </span>
        </div>
      )}
    </div>
  );
};
