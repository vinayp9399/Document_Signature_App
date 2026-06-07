import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

function Upload() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setError('');
    setSuccess('');
    if (file && file.type !== 'application/pdf') {
      setError('Only PDF files are allowed.');
      setSelectedFile(null);
      return;
    }
    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a PDF file first.');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    const formData = new FormData();
    formData.append('pdf', selectedFile);

    setUploading(true);
    setError('');
    setSuccess('');

    try {
      const res = await axios.post('http://localhost:5000/api/docs/upload', formData, {
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
      <nav className="bg-white shadow px-6 py-4 flex items-center justify-between">
        <Link to="/" className="text-xl font-bold text-gray-900">📄 DocSign</Link>
        <Link to="/dashboard" className="text-sm text-blue-600 hover:underline">← Back to Dashboard</Link>
      </nav>

      <div className="max-w-xl mx-auto mt-12 px-4">
        <div className="bg-white rounded-lg shadow p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload Document</h2>
          <p className="text-sm text-gray-500 mb-6">Upload a PDF file to get started with signing.</p>

          {error && (
            <div className="bg-red-50 text-red-700 text-sm p-3 rounded mb-4">{error}</div>
          )}
          {success && (
            <div className="bg-green-50 text-green-700 text-sm p-3 rounded mb-4">{success}</div>
          )}

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center mb-6">
            <input
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              className="hidden"
              id="pdf-input"
            />
            <label htmlFor="pdf-input" className="cursor-pointer">
              <div className="text-4xl mb-3">📎</div>
              <p className="text-sm font-medium text-gray-700">
                {selectedFile ? selectedFile.name : 'Click to select a PDF file'}
              </p>
              {selectedFile && (
                <p className="text-xs text-gray-400 mt-1">
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </p>
              )}
              {!selectedFile && (
                <p className="text-xs text-gray-400 mt-1">PDF files only, max 10MB</p>
              )}
            </label>
          </div>

          <button
            onClick={handleUpload}
            disabled={uploading || !selectedFile}
            className="w-full bg-blue-600 text-white py-2 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition"
          >
            {uploading ? 'Uploading...' : 'Upload PDF'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Upload;
