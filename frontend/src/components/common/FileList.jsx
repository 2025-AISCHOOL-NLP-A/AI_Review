import React from "react";

/**
 * FileList - 매핑 완료된 파일 목록 컴포넌트
 */
export default function FileList({ mappedFiles, onDelete, disabled }) {
  if (mappedFiles.length === 0) {
    return null;
  }

  return (
    <div className="mapped-files-list">
      {mappedFiles.map((mappedFile) => (
        <div key={mappedFile.id} className="mapped-file-block">
          <div className="mapped-file-info">
            <div className="file-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M14 2V8H20" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="mapped-file-name">
              {mappedFile.file.name}
            </div>
          </div>
          <div className="mapped-file-actions">
            <div className="mapped-check-icon" title="매핑 완료">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 6L9 17L4 12" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <button
              className="delete-file-btn"
              onClick={() => onDelete(mappedFile.id)}
              title="삭제"
              disabled={disabled}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 6L6 18M6 6L18 18" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

