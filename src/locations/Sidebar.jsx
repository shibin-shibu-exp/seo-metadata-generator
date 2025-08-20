import React, { useState } from 'react';
import { Note, Button, Text, Spinner } from '@contentful/f36-components';
import { useSDK } from '@contentful/react-apps-toolkit';
import getSummaryFromDescription from '../utils/promptFunction';
import getAltTextFromImage from '../utils/getAltTextFromImage';
import uploadSeoToContentful from '../utils/uploadSeoToContentful';

const Sidebar = () => {
  const sdk = useSDK();
  const fields = sdk.entry.fields; 

  const [seoSummary, setSeoSummary] = useState('');
  const [altTexts, setAltTexts] = useState({});
  const [isGenerating, setIsGenerating] = useState(false); 
  const [isUploading, setIsUploading] = useState(false);   
  const [disableUpload, setDisableUpload] = useState(true);

  const handleSEOUpload = async () => {
    setIsUploading(true); 

    uploadSeoToContentful({seoSummary},sdk?.entry?.fields?.blogTitle.getValue());

    setDisableUpload(true);
    setSeoSummary('');
    setIsUploading(false);
  };

  const handleALTUpload = async () => {
    setIsUploading(true);

    try {
      const altTextEntries = Object.entries(altTexts);
      
      for (const [imageFieldId, altTextValue] of altTextEntries) {
        const targetAltTextFieldId = `${imageFieldId}AltText`;

        if (fields[targetAltTextFieldId]) {
          await fields[targetAltTextFieldId].setValue(altTextValue);
        } else {
          console.warn(`Field "${targetAltTextFieldId}" not found. Skipping.`);
          sdk.notifier.warning(`Could not find alt text field for "${imageFieldId}".`);
        }
      }

      sdk.notifier.success("Content saved successfully!");

    } catch (error) {
      console.error("Failed to set alt text fields:", error);
      sdk.notifier.error("Failed to save alt text. See console for details.");
    }

    setDisableUpload(true);
    setAltTexts({});
    setIsUploading(false);
  };

  const handleGenerate = async () => {
    setIsGenerating(true); 
    setSeoSummary('');
    setAltTexts({});

    let collected = '';
    const newAltTexts = {};

    try {
      Object.keys(fields).forEach((fieldId) => {
        const value = fields[fieldId].getValue();
        if (typeof value === 'string' && value.trim()) {
          collected += value + '\n';
        }
      });

      const trimmedText = collected.trim();
      if (trimmedText) {
        try {
          const summary = await getSummaryFromDescription(trimmedText);
          setSeoSummary(summary || 'No summary generated');
          setDisableUpload(false);
        } catch (err) {
          console.error("Error generating summary:", err);
          setSeoSummary("Error generating summary. Check the console.");
        }
      } else {
        setSeoSummary("No text fields found to generate a summary.");
      }

      for (const fieldId of Object.keys(fields)) {
        let assets = fields[fieldId].getValue();
        if (!assets) continue;

        if (!Array.isArray(assets)) {
          assets = [assets];
        }

        const generatedTextsForField = [];

        for (const asset of assets) {
          if (asset && asset.sys && asset.sys.type === 'Link' && asset.sys.linkType === 'Asset') {
            const resolvedAsset = await sdk.space.getAsset(asset.sys.id);
            const file = resolvedAsset?.fields?.file?.["en-US"];

            if (file?.contentType?.startsWith("image/")) {
              const url = file.url.startsWith("https:") ? file.url : "https:" + file.url;
              try {
                const altText = await getAltTextFromImage(url, file.contentType);
                generatedTextsForField.push(altText);
              } catch (err) {
                console.error("Error generating alt text for", fieldId, err);
                generatedTextsForField.push("Error generating alt text.");
              }
            }
          }
        }
        
        if (generatedTextsForField.length > 0) {
            newAltTexts[fieldId] = generatedTextsForField.join('\n\n---\n\n');
        }
      }

      setAltTexts(newAltTexts);
    } catch (err) {
      console.error("An unexpected error occurred in handleGenerate:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div style={{ padding: '12px', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
        <Button onClick={handleGenerate} isDisabled={isGenerating || isUploading} variant="primary" isFullWidth>
          {isGenerating ? <Spinner /> : 'Generate'}
        </Button>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', maxWidth: '48.5%' }}>
          <Button onClick={handleSEOUpload} isDisabled={disableUpload || isGenerating || isUploading} variant="positive" isFullWidth>
            {isUploading ? <Spinner /> : 'Add SEO'}
          </Button>
          <Button onClick={handleALTUpload} isDisabled={disableUpload || isGenerating || isUploading} variant="positive" isFullWidth>
            {isUploading ? <Spinner /> : 'Add ALT'}
          </Button>
        </div>
      </div>

      {seoSummary && (
        <Note style={{ whiteSpace: 'pre-wrap', marginBottom: '16px' }}>
          <Text fontWeight="fontWeightDemiBold">SEO Summary & Tags:</Text>
          <br />
          {seoSummary}
        </Note>
      )}

      {Object.entries(altTexts).map(([fieldId, alt]) => (
        <Note key={fieldId} style={{ whiteSpace: 'pre-wrap', marginBottom: '12px' }}>
          <Text fontWeight="fontWeightDemiBold">Alt Text for "{fieldId}":</Text>
          <br />
          {alt}
        </Note>
      ))}
    </div>
  );
};

export default Sidebar;