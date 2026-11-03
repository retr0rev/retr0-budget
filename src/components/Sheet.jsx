import React from 'react';

export default function Sheet({ title, onClose, children }) {
  return (
    <div className="sheet-wrap" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="sheet" role="dialog" aria-modal="true">
        <div className="sheet-head">
          <h3>{title}</h3>
          <button className="iconbtn ghost" onClick={onClose} aria-label="close">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}
