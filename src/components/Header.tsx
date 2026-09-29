import { useTranslation } from 'react-i18next'
import { APP_NAME } from '../constants/app'
import { COLORS } from '../constants/theme'
import type { Lang } from '../types'

interface HeaderProps {
  lang: Lang
  onLangChange: (lang: Lang) => void
}

export default function Header({ lang, onLangChange }: HeaderProps) {
  const { t } = useTranslation()
  const [logoPrefix, logoSuffix] = APP_NAME.split('X')

  return (
    <header className="header">
      <div className="header-bg-shapes">
        <div className="shape shape-1" />
        <div className="shape shape-2" />
        <div className="shape shape-3" />
      </div>

      <div className="header-inner">
        <div className="logo">
          <div className="logo-icon">LXE</div>
          <span className="logo-text">
            {logoPrefix}<span>X</span>{logoSuffix}
          </span>
        </div>

        <div className="lang-switcher" role="group" aria-label={t('header.langGroupLabel')}>
          <button
            type="button"
            lang="nb"
            className={`lang-btn ${lang === 'no' ? 'active' : ''}`}
            onClick={() => onLangChange('no')}
            aria-pressed={lang === 'no'}
            aria-label={t('a11y.langNorwegian')}
          >
            {t('language.no')}
          </button>
          <button
            type="button"
            lang="en"
            className={`lang-btn ${lang === 'en' ? 'active' : ''}`}
            onClick={() => onLangChange('en')}
            aria-pressed={lang === 'en'}
            aria-label={t('a11y.langEnglish')}
          >
            {t('language.en')}
          </button>
        </div>
      </div>

      <div className="header-hero">
        <div className="header-eyebrow">
          <span className="header-eyebrow-dot" />
          {t('header.eyebrow')}
        </div>
        <h1 className="header-title">
          {t('header.heroLine1')} <span className="highlight">{t('header.heroHighlight')}</span>
        </h1>
        <p className="header-tagline">{t('header.tagline')}</p>
      </div>

      <svg
        className="header-wave"
        viewBox="0 0 1440 60"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M0,30 C360,60 1080,0 1440,30 L1440,60 L0,60 Z" fill={COLORS.bg} />
      </svg>
    </header>
  )
}
