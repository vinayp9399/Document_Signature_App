import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

function Upload() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [draggingOver, setDraggingOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const validateAndSet = (file) => {
    setError('');
    setSuccess('');
    if (!file) return;
    if (file.type !== 'application/pdf') {
      setError('Only PDF files are allowed.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('File exceeds 10MB limit.');
      return;
    }
    setSelectedFile(file);
  };

  const handleFileChange = (e) => validateAndSet(e.target.files[0]);

  const handleDrop = (e) => {
    e.preventDefault();
    setDraggingOver(false);
    validateAndSet(e.dataTransfer.files[0]);
  };

  const handleDragOver = (e) => { e.preventDefault(); setDraggingOver(true); };
  const handleDragLeave = () => setDraggingOver(false);

  const handleUpload = async () => {
    if (!selectedFile) { setError('Please select a PDF file first.'); return; }

    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }

    const formData = new FormData();
    formData.append('pdf', selectedFile);

    setUploading(true);
    setError('');
    setSuccess('');

    try {
      const res = await axios.post('https://document-signature-app-80xa.onrender.com/api/docs/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });
      setSuccess(`"${res.data.document.original_name}" uploaded successfully!`);
      setSelectedFile(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm px-4 md:px-8 py-4 flex items-center justify-between">
        <span className="text-xl font-bold text-gray-900">📄 DocSign</span>
        <Link to="/dashboard" className="text-sm text-blue-600 hover:underline">← Back to Dashboard</Link>
      </nav>

      <div className="max-w-xl mx-auto mt-12 px-4">
        <div className="bg-white rounded-xl shadow p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Upload Document</h2>
          <p className="text-sm text-gray-500 mb-6">Upload a PDF file to begin the signing workflow.</p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-lg mb-4">{error}</div>
          )}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 text-sm p-3 rounded-lg mb-4 flex items-center justify-between">
              <span>{success}</span>
              <Link to="/dashboard" className="text-green-700 font-medium hover:underline ml-4 text-xs">View Dashboard →</Link>
            </div>
          )}

          {/* Drop zone */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`border-2 border-dashed rounded-xl p-10 text-center mb-6 transition ${
              draggingOver ? 'border-blue-400 bg-blue-50' : selectedFile ? 'border-green-400 bg-green-50' : 'border-gray-300 bg-gray-50'
            }`}
          >
            <input
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              className="hidden"
              id="pdf-input"
            />
            <label htmlFor="pdf-input" className="cursor-pointer block">
              <div className="text-4xl mb-3">{selectedFile ? '✅' : draggingOver ? '📂' : '📎'}</div>
              {selectedFile ? (
                <>
                  <p className="text-sm font-medium text-green-700">{selectedFile.name}</p>
                  <p className="text-xs text-green-500 mt-1">{(selectedFile.size / 1024).toFixed(1)} KB — ready to upload</p>
                </>
              ) : (
                <>
                  <p className="text-sm font-medium text-gray-700">
                    {draggingOver ? 'Drop your PDF here' : 'Drag & drop a PDF or click to browse'}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">PDF files only • Max 10MB</p>
                </>
              )}
            </label>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleUpload}
              disabled={uploading || !selectedFile}
              className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition"
            >
              {uploading ? 'Uploading...' : 'Upload PDF'}
            </button>
            {selectedFile && (
              <button
                onClick={() => { setSelectedFile(null); setError(''); setSuccess(''); }}
                className="px-4 py-2.5 rounded-lg text-sm text-gray-600 border border-gray-300 hover:bg-gray-50 transition"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Upload;
