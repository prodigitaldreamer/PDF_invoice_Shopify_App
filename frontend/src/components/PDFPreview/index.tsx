import { createRoot } from 'react-dom/client';
import PDFPreview from './PDFPreview.tsx';

// Initialize the PDFPreview component when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('pdf_invoice_preview');
  if (container) {
    const root = createRoot(container);
    root.render(<PDFPreview />);
  }
});

export default PDFPreview;
///  git  