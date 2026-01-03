import React, { useRef, useState } from 'react';
import './FileUpload.css';

const FileUpload = ({ onFilesChange, accept, multiple, maxFiles, maxSize = 10 }) => {
  const fileInputRef = useRef(null);
  const [files, setFiles] = useState([]);
  const [dragOver, setDragOver] = useState(false);

  const isFileAccepted = (file, accept) => {
    if (!accept) return true;
    const types = accept.split(',').map(t => t.trim());
    return types.some(type => {
      if (type.endsWith('/*')) {
        const prefix = type.slice(0, -1);
        return file.type.startsWith(prefix);
      } else if (type.startsWith('.')) {
        const ext = type.slice(1).toLowerCase();
        return file.name.toLowerCase().endsWith('.' + ext);
      } else {
        return file.type === type;
      }
    });
  };

  const handleFileSelect = (selectedFiles) => {
    const fileArray = Array.from(selectedFiles);

    if (maxFiles && fileArray.length + files.length > maxFiles) {
      alert(`Maximum ${maxFiles} files allowed`);
      return;
    }

    const validFiles = fileArray.filter(file => {
      if (accept && !isFileAccepted(file, accept)) {
        alert(`Invalid file type: ${file.name}. Accepted types: ${accept}`);
        return false;
      }

      if (file.size > maxSize * 1024 * 1024) {
        alert(`File too large: ${file.name}. Maximum size is ${maxSize}MB`);
        return false;
      }

      return true;
    });

    const newFiles = [...files, ...validFiles].slice(0, maxFiles);
    setFiles(newFiles);
    onFilesChange(newFiles);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const removeFile = (index) => {
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
    onFilesChange(newFiles);
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="file-upload">
      <div
        className={`upload-area ${dragOver ? 'drag-over' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={openFileDialog}
      >
        <div className="upload-content">
          <div className="upload-icon">📁</div>
          <p>Drag & drop files here or click to browse</p>
          <small>
            {accept ? `Accepted: ${accept}` : 'All files'} • Max: {maxSize}MB per file
            {maxFiles && ` • Max files: ${maxFiles}`}
          </small>
        </div>
        
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={(e) => handleFileSelect(e.target.files)}
          style={{ display: 'none' }}
        />
      </div>

      {files.length > 0 && (
        <div className="file-list">
          <h4>Selected Files ({files.length}{maxFiles && `/${maxFiles}`})</h4>
          {files.map((file, index) => (
            <div key={index} className="file-item">
              <span className="file-name">{file.name}</span>
              <span className="file-size">
                {(file.size / (1024 * 1024)).toFixed(2)} MB
              </span>
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="remove-file-btn"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Change to default export
export default FileUpload;