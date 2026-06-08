import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Document, Page, pdfjs } from 'react-pdf';
import axios from 'axios';

import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

function DocumentView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [numPages, setNumPages] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchDocument = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/docs/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setDoc(res.data.document);
      } catch (err) {
        if (err.response?.status === 401) {
          navigate('/login');
        } else if (err.response?.status === 404) {
          setError('Document not found.');
        } else if (err.response?.status === 403) {
          setError('You do not have access to this document.');
        } else {
          setError('Failed to load document.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDocument();
  }, [id, navigate]);

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setCurrentPage(1);
  };

  const goToPrevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
  const goToNextPage = () => setCurrentPage((prev) => Math.min(prev + 1, numPages));

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500 text-sm">Loading document...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-4">
        <p className="text-red-600 text-sm">{error}</p>
        <Link to="/dashboard" className="text-blue-600 hover:underline text-sm">← Back to Dashboard</Link>
      </div>
    );
  }

  const pdfUrl = `http://localhost:5000/uploads/${doc.file_path}`;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow px-6 py-4 flex items-center justify-between">
        <span className="text-xl font-bold text-gray-900">📄 DocSign</span>
        <Link to="/dashboard" className="text-sm text-blue-600 hover:underline">← Back to Dashboard</Link>
      </nav>

      <div className="max-w-4xl mx-auto mt-8 px-4">
        {/* Document info */}
        <div className="bg-white rounded-lg shadow p-5 mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{doc.original_name}</h2>
            <p className="text-sm text-gray-500 mt-1">
              Size: {doc.file_size ? (doc.file_size / 1024).toFixed(1) + ' KB' : 'N/A'} &nbsp;•&nbsp;
              Uploaded: {new Date(doc.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
            </p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            doc.status === 'signed'
              ? 'bg-green-100 text-green-700'
              : doc.status === 'rejected'
              ? 'bg-red-100 text-red-700'
              : 'bg-yellow-100 text-yellow-700'
          }`}>
            {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
          </span>
        </div>

        {/* PDF Viewer */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-700">Document Preview</h3>
            {numPages && (
              <div className="flex items-center gap-3">
                <button
                  onClick={goToPrevPage}
                  disabled={currentPage <= 1}
                  className="px-3 py-1 text-xs bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-40 transition"
                >
                  ← Prev
                </button>
                <span className="text-xs text-gray-600">
                  Page {currentPage} of {numPages}
                </span>
                <button
                  onClick={goToNextPage}
                  disabled={currentPage >= numPages}
                  className="px-3 py-1 text-xs bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-40 transition"
                >
                  Next →
                </button>
              </div>
            )}
          </div>

          <div className="flex justify-center border rounded-md overflow-hidden bg-gray-100 min-h-96">
            <Document
              file={pdfUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={() => setError('Failed to render PDF preview.')}
              loading={<p className="text-sm text-gray-500 p-10">Loading PDF...</p>}
            >
              <Page
                pageNumber={currentPage}
                width={600}
                renderAnnotationLayer={true}
                renderTextLayer={true}
              />
            </Document>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DocumentView;
