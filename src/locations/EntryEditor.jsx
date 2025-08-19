import React, { useState } from 'react';
import { Note, Button, Text } from '@contentful/f36-components';
import { useSDK } from '@contentful/react-apps-toolkit';
import getSummaryFromDescription from '../utils/promptFunction';
import getAltTextFromImage from '../utils/getAltTextFromImage';

const Entry = () => {
  const sdk = useSDK();
  const fields = sdk?.entry?.fields || {};

  const [seoSummary, setSeoSummary] = useState('');
  const [altTexts, setAltTexts] = useState({});
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
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
        } catch (err) {
          console.error("Error generating summary:", err);
          setSeoSummary("Error generating summary. Check the console.");
        }
      } else {
        setSeoSummary("No text fields found to generate a summary.");
      }

      for (const fieldId of Object.keys(fields)) {
        const asset = fields[fieldId].getValue();
        if (asset && asset.sys && asset.sys.type === 'Link' && asset.sys.linkType === 'Asset') {
          const fullAsset = sdk.space.getAsset(asset.sys.id);
          const resolvedAsset = await fullAsset;

          const file = resolvedAsset?.fields?.file?.["en-US"];
          if (file?.contentType?.startsWith("image/")) {
            const url = file.url.startsWith("https:")
              ? file.url
              : "https:" + file.url;
            
            const mimeType = file.contentType;

            try {
              const altText = await getAltTextFromImage(url, mimeType);
              newAltTexts[fieldId] = altText;
            } catch (err) {
              console.error("Error generating alt text for", fieldId, err);
              newAltTexts[fieldId] = "Error generating alt text. Check the console.";
            }
          }
        }
      }

      setAltTexts(newAltTexts);

    } catch(err) {
      console.error("An unexpected error occurred in handleGenerate:", err);
    }
    finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button onClick={handleGenerate} isDisabled={loading} variant="primary" style={{ marginBottom: '12px' }}>
        {loading ? 'Generating...' : 'Generate SEO Content'}
      </Button>

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
    </>
  );
};

export default Entry;