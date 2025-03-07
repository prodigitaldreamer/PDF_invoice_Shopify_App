import React, { useState } from 'react';
import { Spinner, TextContainer } from '@shopify/polaris';

interface TemplatePreviewProps {
  previewUrl: string;
  shop: string;
}

const TemplatePreview: React.FC<TemplatePreviewProps> = ({ previewUrl, shop }) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Generate the full URL with shop parameter and PDF viewer parameters for fit to page
  const fullUrl = `${previewUrl}${previewUrl.includes('?') ? '&' : '?'}shop=${encodeURIComponent(shop)}&t=${Date.now()}#view=Fit&zoom=page-fit`;

  const handleIframeLoad = () => {
    setLoading(false);
  };

  const handleIframeError = () => {
    setError('Failed to load preview. Please try again later.');
    setLoading(false);
  };

  return (
    <div style={{ height: '80vh', position: 'relative' }}>
      {loading && (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1
        }}>
          <Spinner accessibilityLabel="Loading preview" size="large" />
        </div>
      )}
      
      {error && (
        <TextContainer>
          <p>{error}</p>
        </TextContainer>
      )}

      <iframe 
        src={fullUrl}
        style={{ 
          width: '100%', 
          height: '100%', 
          border: 'none',
          display: loading ? 'none' : 'block'
        }}
        title="PDF Preview"
        onLoad={handleIframeLoad}
        onError={handleIframeError}
      />
    </div>
  );
};

export default TemplatePreview;
