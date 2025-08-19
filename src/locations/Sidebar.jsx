import React, { useState } from 'react';
import { Note, Button, Text } from '@contentful/f36-components';
import { useSDK } from '@contentful/react-apps-toolkit';
import getSummaryFromDescription from '../utils/promptFunction';

const Sidebar = () => {
  const sdk = useSDK();
  const fields = sdk?.entry?.fields || {};

  const [seoSummary, setSeoSummary] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGenerateSummary = async () => {
    let collected = '';
    Object.keys(fields).forEach((fieldId) => {
      const value = fields[fieldId].getValue();
      if (typeof value === 'string' && value.trim()) {
        collected += value + '\n';
      }
    });

    const trimmedText = collected.trim();
    if (!trimmedText) {
      setSeoSummary('No text fields provided');
      return;
    }

    setLoading(true);
    try {
      const summary = await getSummaryFromDescription(trimmedText);
      setSeoSummary(summary || 'No summary generated');
    } catch (error) {
      console.error('Error generating summary:', error);
      setSeoSummary('Error generating summary');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button onClick={handleGenerateSummary} isDisabled={loading} style={{ marginBottom: '12px' }}>
        {loading ? 'Generating...' : 'Generate SEO Summary'}
      </Button>

      <Note style={{ whiteSpace: 'pre-wrap' }}>
        <Text fontWeight="fontWeightDemiBold">SEO Summary:</Text>
        <br />
        {seoSummary}
      </Note>
    </>
  );
};

export default Sidebar;
