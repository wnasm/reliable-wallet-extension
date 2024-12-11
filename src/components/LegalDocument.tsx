import React from 'react';
import { Modal } from 'antd';
import ReactMarkdown from 'react-markdown';

import "../css/legal.css"

interface LegalDocumentProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  content: string;
}

const LegalDocument: React.FC<LegalDocumentProps> = ({ visible, onClose, title, content }) => {
  return (
    <Modal
      title={title}
      open={visible}
      onCancel={onClose}
      footer={null}
      className="legal-modal"
      styles={{
        mask: {
          position: 'absolute',
          backgroundColor: 'rgba(0, 0, 0, 0.45)',
          scrollbarWidth: 'none'
        },
        wrapper: {
          position: 'absolute',
          scrollbarWidth: 'none',
          inset: 0
        }
      }}
      getContainer={() => document.querySelector('.container') || document.body}
    >
      <div className="legal-content">
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>
    </Modal>
  );
};

export default LegalDocument; 