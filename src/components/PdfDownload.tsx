import type { ComponentProps } from 'react'
import { useTranslation } from 'react-i18next'
import { Download } from 'lucide-react'
import { PDFDownloadLink } from '@react-pdf/renderer'
import CalculationPDF from './CalculationPDF'

type PdfDownloadProps = Omit<ComponentProps<typeof CalculationPDF>, 't' | 'title'>

export default function PdfDownload(props: PdfDownloadProps) {
  const { t } = useTranslation()
  return (
    <PDFDownloadLink
      document={<CalculationPDF {...props} title={t('breakdown.pdfDocTitle')} t={t} />}
      fileName={t('breakdown.pdfFileName')}
      className="breakdown-download-btn"
    >
      {({ loading }) => (
        <>
          <Download size={13} />
          <span>{loading ? t('breakdown.generating') : t('breakdown.download')}</span>
        </>
      )}
    </PDFDownloadLink>
  )
}
