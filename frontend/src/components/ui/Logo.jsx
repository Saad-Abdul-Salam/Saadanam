import saadanamLogo from '../../images/saadanam-logo.png'

/**
 * Brand logo lockup. The PNG has a transparent background with dark
 * green/black artwork, so on dark surfaces it needs a light chip to stay
 * readable. chip="always" forces the chip (used on the always-dark sidebar);
 * chip="none" never shows it; the default adds it only in dark mode.
 */
export default function Logo({ className = '', chip = 'auto' }) {
    const chipClass =
        chip === 'always'
            ? 'bg-white/95 rounded-xl p-1.5'
            : chip === 'none'
                ? ''
                : 'dark:bg-white/95 dark:rounded-xl dark:p-1.5'

    return (
        <img
            src={saadanamLogo}
            alt="Saadanam"
            className={`h-9 w-auto select-none ${chipClass} ${className}`}
        />
    )
}
