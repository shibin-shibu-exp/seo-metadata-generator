import React, { useEffect, useState } from 'react';
import {
  Accordion,
  Box,
  Button,
  Flex,
  Paragraph,
  Spinner,
  Text,
  CopyButton, 
  Caption
} from '@contentful/f36-components';
import { useSDK } from '@contentful/react-apps-toolkit';
import getSummaryFromDescription from '../utils/promptFunction';
import getAltTextFromImage from '../utils/getAltTextFromImage';
import uploadSeoToContentful from '../utils/uploadSeoToContentful';

const Sidebar = () => {
  const sdk = useSDK();
  const fields = sdk.entry.fields;

  useEffect(() => {
    sdk.window.startAutoResizer();
  }, [sdk]);

  const [seoSummary, setSeoSummary] = useState('');
  const [altTexts, setAltTexts] = useState({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const canUploadSeo = seoSummary.trim() !== '';
  const canUploadAlt = Object.keys(altTexts).length > 0;

  const handleSEOUpload = async () => {
    setIsUploading(true);
    
    await uploadSeoToContentful({ seoSummary }, fields?.blogTitle?.getValue());
    
    setSeoSummary('');
    sdk.notifier.success("SEO content saved successfully!");
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

      sdk.notifier.success("Alt text saved successfully!");
      setAltTexts({});

    } catch (error) {
      console.error("Failed to set alt text fields:", error);
      sdk.notifier.error("Failed to save alt text. See console for details.");
    }
    
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
          if (asset?.sys?.type === 'Link' && asset.sys.linkType === 'Asset') {
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

  return <>
    {canUploadSeo && (
      <Accordion>
        <Accordion.Item title={
          <Caption fontWeight="fontWeightMedium" fontColor='gray900' fontSize='fontSizeS'>
            Generated SEO Content
          </Caption>
        }>
          <Flex flexDirection="column" gap="spacingM">
          {(() => {
            try {
              const seoData = JSON.parse(seoSummary);
              return (
                <>
                  <Box>
                    <Flex justifyContent="space-between" alignItems="center">
                      <Text fontWeight="fontWeightDemiBold">Title</Text>
                      <CopyButton value={seoData.title} size='small' />
                    </Flex>
                    <Paragraph>{seoData.title}</Paragraph>
                  </Box>
                  <Box>
                    <Flex justifyContent="space-between" alignItems="center">
                      <Text fontWeight="fontWeightDemiBold">Description</Text>
                      <CopyButton value={seoData.description} size='small' />
                    </Flex>
                    <Paragraph>{seoData.description}</Paragraph>
                  </Box>
                  <Box>
                    <Flex justifyContent="space-between" alignItems="center">
                      <Text fontWeight="fontWeightDemiBold">Tags</Text>
                      <CopyButton value={seoData.tags.join(', ')} size='small' />
                    </Flex>
                    <Paragraph>{seoData.tags.join(', ')}</Paragraph>
                  </Box>
                </>
              );
            } catch (e) {
              return <Paragraph>Could not parse SEO data. Raw output: {seoSummary}</Paragraph>;
            }
          })()}
            
            <Button 
              onClick={handleSEOUpload} 
              isDisabled={!canUploadSeo || isGenerating || isUploading} 
              variant="positive"
              endIcon={isUploading && canUploadSeo ? <Spinner variant="white" /> : null}
              isFullWidth
            >
              Add SEO to New Entry
            </Button>
          </Flex>
        </Accordion.Item>
      </Accordion>
    )}

    {canUploadAlt && (
        <Accordion style={{ marginTop: '12px' }}>
        <Accordion.Item title={
          <Caption fontWeight="fontWeightMedium" fontColor='gray900' fontSize='fontSizeS'>
            {`Generated Alt Text (${Object.keys(altTexts).length})`}
          </Caption>
        }>
          <Flex flexDirection="column" gap="spacingL">
            {Object.entries(altTexts).map(([fieldId, alt]) => (
              <Box key={fieldId}>
                <Flex justifyContent="space-between" alignItems="center" marginBottom="spacingXs">
                  <Text fontColor="blue900">For field: <strong>{fieldId}</strong></Text>
                  <CopyButton value={alt} size='small'/>
                </Flex>
                <Paragraph>{alt}</Paragraph>
              </Box>
            ))}
            <Button 
              onClick={handleALTUpload} 
              isDisabled={!canUploadAlt || isGenerating || isUploading} 
              variant="positive"
              endIcon={isUploading && canUploadAlt ? <Spinner variant="white" /> : null}
              isFullWidth
            >
              Add All Alt Texts to Entry
            </Button>
          </Flex>
        </Accordion.Item>
      </Accordion>
    )}

    <Button 
      onClick={handleGenerate} 
      isDisabled={isGenerating || isUploading} 
      variant="primary" 
      isFullWidth
      endIcon={isGenerating ? <Spinner variant="white" /> : null}
      style={{ marginTop: '12px' }}
    >
      {isGenerating ? 'Generating' : 'Generate Metadata'}
    </Button>
  </>;
};

export default Sidebar;