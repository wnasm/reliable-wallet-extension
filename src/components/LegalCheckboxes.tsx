import React, { useState } from 'react';
import { Checkbox, Typography } from 'antd';
import LegalDocument from './LegalDocument';
import { privacyPolicy, termsOfUse } from '../legal/documents';

const { Text, Link } = Typography;

interface LegalCheckboxesProps {
  onChange: (privacyChecked: boolean, termsChecked: boolean) => void;
}

const LegalCheckboxes: React.FC<LegalCheckboxesProps> = ({ onChange }) => {
  const [privacyChecked, setPrivacyChecked] = useState(false);
  const [termsChecked, setTermsChecked] = useState(false);
  const [privacyVisible, setPrivacyVisible] = useState(false);
  const [termsVisible, setTermsVisible] = useState(false);

  const handleChange = (privacy: boolean, terms: boolean) => {
    setPrivacyChecked(privacy);
    setTermsChecked(terms);
    onChange(privacy, terms);
  };

  return (
    <div className="legal-checkboxes">
      <div className="checkbox-row">
        <Checkbox
          checked={privacyChecked}
          onChange={(e) => handleChange(e.target.checked, termsChecked)}
        >
          I agree to the{' '}
          <Link onClick={() => setPrivacyVisible(true)}>Privacy Policy</Link>
        </Checkbox>
      </div>
      
      <div className="checkbox-row">
        <Checkbox
          checked={termsChecked}
          onChange={(e) => handleChange(privacyChecked, e.target.checked)}
        >
          I agree to the{' '}
          <Link onClick={() => setTermsVisible(true)}>Terms of Use</Link>
        </Checkbox>
      </div>

      <LegalDocument
        visible={privacyVisible}
        onClose={() => setPrivacyVisible(false)}
        title="Privacy Policy"
        content={privacyPolicy}
      />

      <LegalDocument
        visible={termsVisible}
        onClose={() => setTermsVisible(false)}
        title="Terms of Use"
        content={termsOfUse}
      />
    </div>
  );
};

export default LegalCheckboxes; 