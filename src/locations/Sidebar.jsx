import React, { useState } from 'react';
import { Note, Button } from '@contentful/f36-components';
import { useSDK } from '@contentful/react-apps-toolkit';
import getSummaryFromDescription from '../utils/promptFunction';

const Sidebar = () => {

  const sdk = useSDK();
  const fields = sdk.entry.fields;

  const [combinedText, setCombinedText] = useState('');
  const [seoSummary, setSeoSummary] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGenerateSummary = () => {
    let collected = '';
    Object.keys(fields).forEach((fieldId) => {
      const value = fields[fieldId].getValue();
      if (typeof value === 'string' && value.trim()) {
        collected += value + '\n';
      }
    });
    const trimmedText = collected.trim();
    setCombinedText(trimmedText);

    if (!trimmedText) {
      setSeoSummary('');
      return;
    }

    setLoading(true);
    getSummaryFromDescription(trimmedText)
      .then((summary) => {
        setSeoSummary(summary);
      })
      .catch((error) => {
        console.error('Error generating summary:', error);
        setSeoSummary('');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <>
      <Button onClick={handleGenerateSummary} isDisabled={loading} style={{ marginBottom: '12px' }}>
        {loading ? 'Generating...' : 'Generate SEO Summary'}
      </Button>

      <Note style={{ whiteSpace: 'pre-wrap' }}>
        <strong>SEO Summary:</strong> {seoSummary || 'No text fields provided'}
      </Note>
    </>
  );
};

export default Sidebar;
