import React, { useEffect, useRef, useState } from 'react';
import {
  Frame,
  Page,
  LegacyCard,
  Text,
  Toast,
  Spinner,
  Modal
} from '@shopify/polaris';

interface TemplateEditProps {
  templateId?: string;
  templateHtml?: string;
  onSave?: (html: string, design: any) => void;
  onClose?: () => void;
}

// Define the Unlayer interface
interface Unlayer {
  init: (config: any) => void;
  loadDesign: (design: any) => void;
  exportHtml: (callback: (data: { html: string, design: any }) => void) => void;
  saveDesign: (callback: (design: any) => void) => void;
  addEventListener: (event: string, callback: (...args: any) => void) => void;
  registerCallback: (key: string, callback: (...args: any) => void) => void;
  destroy: () => void;
}

declare global {
  interface Window { 
    unlayer: Unlayer;
  }
}

const TemplateEdit: React.FC<TemplateEditProps> = ({ 
  templateId, 
  templateHtml = '', 
  onSave, 
  onClose 
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isEditorLoaded, setIsEditorLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastError, setToastError] = useState(false);
  const [showExitConfirmation, setShowExitConfirmation] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // Initial design object - use this to load a template
  const initialDesign = useRef<any>({
    body: {
      rows: [
        {
          cells: [1],
          columns: [
            {
              contents: [],
            }
          ]
        }
      ]
    },
    schemaVersion: 6
  });

  // Load the Unlayer script once when component mounts
  useEffect(() => {
    // Check if unlayer is already loaded
    if (window.unlayer) {
      setIsEditorLoaded(true);
      return;
    }

    const unlayerScript = document.createElement('script');
    unlayerScript.src = 'https://editor.unlayer.com/embed.js';
    unlayerScript.async = true;
    unlayerScript.onload = () => {
      setIsEditorLoaded(true);
    };
    document.body.appendChild(unlayerScript);

    return () => {
      // Cleanup
      if (window.unlayer) {
        try {
          window.unlayer.destroy();
        } catch (e) {
          console.error("Error destroying editor:", e);
        }
      }
      // Only remove the script if we added it
      if (document.body.contains(unlayerScript)) {
        document.body.removeChild(unlayerScript);
      }
    };
  }, []);

  // Initialize the editor once the script is loaded
  useEffect(() => {
    if (isEditorLoaded && editorRef.current) {
      setTimeout(() => {
        initEditor();
      }, 500); // Increased delay to ensure DOM is ready
    }
  }, [isEditorLoaded]);

  // Initialize the Unlayer editor
  const initEditor = () => {
    if (!window.unlayer) {
      console.error("Unlayer not available");
      return;
    }

    try {
      // First initialize the editor
      window.unlayer.init({
        id: 'editor-container', 
        projectId: 267669,
        displayMode: "email",
        appearance: {
          theme: 'light',
          panels: {
            tools: {
              dock: 'left'
            }
          }
        },
        // Using the API key securely through your server is recommended
        user: {
          id: "user_" + (templateId || "new"),
          apiKey: "JPBrsLeyjlaeE1YaNUorAT1LVjcvZpaiShtmZOhfYptBPDYtLlKNCXty7tjX97V6"
        },
        designJson: true,
        tools: {
          // You can configure specific tools here
        }
      });

      // After editor is initialized, load template content
      setTimeout(() => {
        loadTemplateContent();
      }, 500);

      // Register change detection
      window.unlayer.addEventListener('design:updated', () => {
        setHasUnsavedChanges(true);
      });
    } catch (error) {
      console.error("Error initializing unlayer:", error);
    }
  };

  // Separate function to load template content
  const loadTemplateContent = () => {
    if (!window.unlayer) return;

    try {
      if (templateHtml && templateHtml.trim() !== '') {
        try {
          // First try to parse it as design JSON
          const design = JSON.parse(templateHtml);
          window.unlayer.loadDesign(design);
        } catch (e) {
          console.log("Not valid JSON, creating a new design with the HTML content");
          
          // Create a minimal design structure with the HTML content
          const htmlDesign = {
            body: {
              rows: [
                {
                  cells: [1],
                  columns: [
                    {
                      contents: [
                        {
                          type: "html",
                          values: {
                            html: templateHtml
                          }
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          };
          
          window.unlayer.loadDesign(htmlDesign);
        }
      } else {
        // Load a default template structure
        window.unlayer.loadDesign(initialDesign.current);
      }
    } catch (error) {
      console.error("Error loading template content:", error);
      // If all else fails, load an empty design
      window.unlayer.loadDesign(initialDesign.current);
    }
  };

  // Save the template
  const handleSave = async () => {
    if (!window.unlayer) return;

    setIsSaving(true);
    try {
      window.unlayer.exportHtml((data) => {
        console.log("Saving template:", { html: data.html, design: data.design });
        if (onSave) {
          // Send the design object as a string for storage
          onSave(data.html, JSON.stringify(data.design));
        }
        setHasUnsavedChanges(false);
        setToastError(false);
        setToastMessage('Template saved successfully');
        setShowToast(true);
      });
    } catch (error) {
      console.error("Error saving template:", error);
      setToastError(true);
      setToastMessage('Failed to save template');
      setShowToast(true);
    } finally {
      setIsSaving(false);
    }
  };

  // Export the template as HTML
  const handleExport = () => {
    if (!window.unlayer) return;

    setIsExporting(true);
    try {
      window.unlayer.exportHtml((data) => {
        // Create a blob and download it
        const blob = new Blob([data.html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        
        // Create a download link and click it
        const downloadLink = document.createElement('a');
        downloadLink.href = url;
        downloadLink.download = `template-${templateId || 'new'}.html`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        
        // Clean up
        URL.revokeObjectURL(url);
        
        setToastError(false);
        setToastMessage('Template exported successfully');
        setShowToast(true);
      });
    } catch (error) {
      console.error("Error exporting template:", error);
      setToastError(true);
      setToastMessage('Failed to export template');
      setShowToast(true);
    } finally {
      setIsExporting(false);
    }
  };

  // Handle closing the editor
  const handleClose = () => {
    if (hasUnsavedChanges) {
      setShowExitConfirmation(true);
    } else {
      if (onClose) onClose();
    }
  };

  // Confirm exit without saving
  const confirmExit = () => {
    setShowExitConfirmation(false);
    if (onClose) onClose();
  };

  return (
    <Frame>
      <Page
        fullWidth
        title="Template Editor"
        backAction={{
          content: "Back to Template",
          onAction: handleClose
        }}
        primaryAction={{
          content: isSaving ? "Saving..." : "Save Template",
          disabled: isSaving || !isEditorLoaded,
          loading: isSaving,
          onAction: handleSave
        }}
        secondaryActions={[
          {
            content: isExporting ? "Exporting..." : "Export HTML",
            disabled: isExporting || !isEditorLoaded,
            loading: isExporting,
            onAction: handleExport
          }
        ]}
      >
        {!isEditorLoaded && (
          <LegacyCard>
            <LegacyCard.Section>
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <Spinner size="large" />
                <div style={{ marginTop: '10px' }}>
                  <Text variant="headingMd" as="p">Loading Editor...</Text>
                </div>
              </div>
            </LegacyCard.Section>
          </LegacyCard>
        )}

        <div 
          style={{ 
            height: 'calc(100vh - 160px)',
            display: isEditorLoaded ? 'block' : 'none',
            marginTop: '16px'
          }}
        >
          <div 
            id="editor-container" 
            ref={editorRef}
            style={{ 
              width: '100%', 
              height: '100%',
              border: '1px solid #E1E3E5',
              borderRadius: '4px'
            }}
          ></div>
        </div>

        {/* Toast notification */}
        {showToast && (
          <Toast
            content={toastMessage}
            error={toastError}
            onDismiss={() => setShowToast(false)}
            duration={3000}
          />
        )}

        {/* Exit confirmation modal */}
        <Modal
          open={showExitConfirmation}
          onClose={() => setShowExitConfirmation(false)}
          title="Unsaved Changes"
          primaryAction={{
            content: 'Save and Exit',
            onAction: () => {
              handleSave();
              setShowExitConfirmation(false);
              if (onClose) setTimeout(() => onClose(), 500);
            }
          }}
          secondaryActions={[
            {
              content: 'Discard Changes',
              destructive: true,
              onAction: confirmExit
            }
          ]}
        >
          <Modal.Section>
            <p>You have unsaved changes. What would you like to do?</p>
          </Modal.Section>
        </Modal>
      </Page>
    </Frame>
  );
};

export default TemplateEdit;