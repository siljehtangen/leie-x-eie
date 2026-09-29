import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, Link2 } from 'lucide-react'
import { buildShareUrl } from '../utils/shareUrl'
import type { Scenario } from '../utils/scenarioStorage'

const COPIED_RESET_MS = 2500

export default function ShareButton({ scenario }: { scenario: Scenario }) {
  const { t } = useTranslation()
  const [copied, setCopied] = useState(false)
  const [failedUrl, setFailedUrl] = useState<string | null>(null)
  const url = buildShareUrl(scenario, window.location)

  useEffect(() => {
    if (!copied) return
    const id = setTimeout(() => setCopied(false), COPIED_RESET_MS)
    return () => clearTimeout(id)
  }, [copied])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setFailedUrl(null)
      setCopied(true)
    } catch {
      setFailedUrl(url)
    }
  }

  return (
    <div className="share">
      <button type="button" className="secondary-btn" onClick={handleCopy}>
        {copied ? <Check size={15} aria-hidden /> : <Link2 size={15} aria-hidden />}
        {copied ? t('share.copied') : t('share.copy')}
      </button>
      <span className="visually-hidden" role="status">
        {copied ? t('share.copied') : ''}
      </span>
      {failedUrl === url && (
        <label className="share-fallback">
          <span>{t('share.failed')}</span>
          <input type="text" readOnly value={url} onFocus={e => e.target.select()} />
        </label>
      )}
    </div>
  )
}
