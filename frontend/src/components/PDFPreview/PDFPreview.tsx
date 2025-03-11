import React, { useState, useEffect } from "react";
import {
  AppProvider,
  Page,
  Card,
  Tabs,
  Spinner,
  Button,
  Frame,
  TextContainer,
  Layout,
} from "@shopify/polaris";
import enTranslations from '@shopify/polaris/locales/en.json';
import { ConfigData } from '../../types';

interface PreviewEmbed {
  [key: string]: string;
}

const PDFPreview: React.FC = () => {
  const [tabsSelected, setTabsSelected] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [pdf, setPdf] = useState<string>("");
  const [urlPdfs, setUrlPdfs] = useState<string[]>([]);

  // Safely access config and preview embed data
  const config = window.config as ConfigData;
  const previewEmbed = config?.preview?.embed as PreviewEmbed || {};

  // Generate tabs from config
  const getTabsOptions = () => {
    const result = [];
    for (const key in previewEmbed) {
      result.push({
        id: previewEmbed[key],
        content: uppercaseFirst(key) + " template"
      });
    }
    return result;
  };

  const uppercaseFirst = (string: string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  // Convert bulk URL to individual URLs
  const convertToFormattedUrls = (originalUrl: string): string[] => {
    const urlParams = new URLSearchParams(originalUrl);
    const urlValues = urlParams.get('url');
    
    if (!urlValues) return [];

    const urlsArray = urlValues.split(',');
    return urlsArray.map(url => 
      originalUrl.split('url=')[0] + 'url=' + encodeURIComponent(url)
    );
  };

  // Download all PDFs as separate files
  const downloadAllPDF = () => {
    urlPdfs.forEach((pdfUrl, index) => {
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = `pdf_${index + 1}.pdf`;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  };

  // Generate the full URL with PDF viewer parameters for fit to page
  const getFullUrl = (url: string): string => {
    if (!url) return '';
    return `${url}${url.includes('?') ? '&' : '?'}t=${Date.now()}#view=Fit&zoom=page-fit`;
  };

  // Set the initial PDF URL and tabs
  const tabsOptions = getTabsOptions();

  // Handle tab change
  const tabsHandleChange = (selectedTabIndex: number) => {
    if (tabsSelected !== selectedTabIndex) {
      setLoading(true);
      setError(null);
    }
    setTabsSelected(selectedTabIndex);
    
    if (tabsOptions[selectedTabIndex]) {
      setPdf(tabsOptions[selectedTabIndex].id);
    }
  };

  // Handle iframe load complete
  const handleIframeLoad = () => {
    setLoading(false);
  };

  // Handle iframe load error
  const handleIframeError = () => {
    setError('Failed to load preview. Please try again later.');
    setLoading(false);
  };
  
  // Initialize PDF URL from tabs
  useEffect(() => {
    if (tabsOptions.length > 0) {
      setPdf(tabsOptions[tabsSelected].id);
    }
  }, []);

  // Check if current PDF is for bulk operations and prepare URLs
  useEffect(() => {
    if (pdf && pdf.includes("bulk")) {
      setUrlPdfs(convertToFormattedUrls(pdf));
    } else {
      setUrlPdfs([]);
    }
  }, [pdf]);

  // Set timeout for loading based on config
  useEffect(() => {
    const timer = setTimeout(() => {
      if (loading) {
        setLoading(false);
      }
    });
    
    return () => clearTimeout(timer);
  }, [tabsSelected, loading]);

  // Handle case where no preview options are available
  if (tabsOptions.length === 0) {
    return (
      <AppProvider i18n={enTranslations}>
        <Frame>
          <Page title="Preview">
            <Card>
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <p>No preview templates available</p>
              </div>
            </Card>
          </Page>
        </Frame>
      </AppProvider>
    );
  }

  return (
    <AppProvider i18n={enTranslations}>
    <div className="template-header">
      <Page fullWidth title="Preview" />
    </div>
    <Frame>
      <Layout>
        <Layout.Section variant="oneThird" >
          <Tabs 
            tabs={tabsOptions} 
            selected={tabsSelected} 
            onSelect={tabsHandleChange}
          >
            {pdf && pdf.includes("bulk") && (
              <div style={{display: "flex", justifyContent: "flex-end", padding: "15px 15px 0 0"}}>
                <Button variant="primary" onClick={downloadAllPDF}>Download PDFs in different files</Button>
              </div>
            )}
              <div style={{height: '78vh', position: 'relative', width: '80%', margin: "30px auto 0px auto"}}>
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
                    <Spinner accessibilityLabel="Loading PDF" size="large" />
                  </div>
                )}
                
                {error && (
                  <div style={{ padding: '20px', textAlign: 'center' }}>
                    <TextContainer>
                      <p>{error}</p>
                    </TextContainer>
                  </div>
                )}

                <iframe 
                  src={getFullUrl(pdf)}
                  style={{ 
                    width: '100%', 
                    height: '100%', 
                    border: 'none',
                    display: loading && !error ? 'none' : 'block' 
                  }}
                  title="PDF Preview"
                  onLoad={handleIframeLoad}
                  onError={handleIframeError}
                />
              </div>
          </Tabs>
        </Layout.Section>
      </Layout>
      <br/>
    </Frame>
  </AppProvider>
  );
};

export default PDFPreview;