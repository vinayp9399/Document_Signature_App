import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Document, Page, pdfjs } from 'react-pdf';
import axios from 'axios';

import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const PAGE_WIDTH = 600;

function DocumentView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const pageRef = useRef(null);

  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [numPages, setNumPages] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [signatures, setSignatures] = useState([]);
  const [savingSignature, setSavingSignature] = useState(false);
  const [sigMsg, setSigMsg] = useState('');

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
        if (err.response?.status === 401) navigate('/login');
        else if (err.response?.status === 404) setError('Document not found.');
        else if (err.response?.status === 403) setError('You do not have access to this document.');
        else setError('Failed to load document.');
      } finally {
        setLoading(false);
      }
    };

    fetchDocument();
  }, [id, navigate]);

  useEffect(() => {
    if (!doc) return;
    const token = localStorage.getItem('token');

    const fetchSignatures = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/signatures/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSignatures(res.data.signatures);
      } catch (err) {
        console.error('Failed to fetch signatures:', err);
      }
    };

    fetchSignatures();
  }, [doc, id]);

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setCurrentPage(1);
  };

  const goToPrevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
  const goToNextPage = () => setCurrentPage((prev) => Math.min(prev + 1, numPages));

  const handlePageClick = async (e) => {
    if (!pageRef.current) return;
    const rect = pageRef.current.getBoundingClientRect();
    const x = parseFloat(((e.clientX - rect.left) / rect.width * 100).toFixed(2));
    const y = parseFloat(((e.clientY - rect.top) / rect.height * 100).toFixed(2));

    const token = localStorage.getItem('token');
    setSavingSignature(true);
    setSigMsg('');

    try {
      const res = await axios.post(
        'http://localhost:5000/api/signatures',
        { documentId: parseInt(id), x, y, page: currentPage },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSignatures((prev) => [...prev, res.data.signature]);
      setSigMsg('Signature placeholder placed!');
    } catch (err) {
      setSigMsg('Failed to save signature position.');
    } finally {
      setSavingSignature(false);
    }
  };

  const currentPageSignatures = signatures.filter(
    (s) => s.page === currentPage
  );

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

        {/* Signature instruction */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 mb-4 text-sm text-blue-700">
          💡 Click anywhere on the PDF below to place a signature placeholder.
        </div>

        {sigMsg && (
          <div className={`text-sm px-4 py-2 rounded mb-4 ${
            sigMsg.includes('Failed') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
          }`}>
            {sigMsg}
          </div>
        )}

        {/* PDF Viewer */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-700">
              Document Preview
              {currentPageSignatures.length > 0 && (
                <span className="ml-2 text-xs text-blue-600 font-normal">
                  ({currentPageSignatures.length} signature{currentPageSignatures.length > 1 ? 's' : ''} on this page)
                </span>
              )}
            </h3>
            {numPages && (
              <div className="flex items-center gap-3">
                <button
                  onClick={goToPrevPage}
                  disabled={currentPage <= 1}
                  className="px-3 py-1 text-xs bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-40 transition"
                >
                  ← Prev
                </button>
                <span className="text-xs text-gray-600">Page {currentPage} of {numPages}</span>
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

          {/* PDF + signature overlay wrapper */}
          <div className="flex justify-center">
            <div
              ref={pageRef}
              onClick={handlePageClick}
              className="relative cursor-crosshair border rounded-md overflow-hidden bg-gray-100"
              style={{ width: PAGE_WIDTH }}
            >
              <Document
                file={pdfUrl}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={() => setError('Failed to render PDF preview.')}
                loading={<p className="text-sm text-gray-500 p-10 text-center">Loading PDF...</p>}
              >
                <Page
                  pageNumber={currentPage}
                  width={PAGE_WIDTH}
                  renderAnnotationLayer={true}
                  renderTextLayer={true}
                />
              </Document>

              {/* Render signature placeholders on current page */}
              {currentPageSignatures.map((sig) => (
                <div
                  key={sig.id}
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    position: 'absolute',
                    left: `${sig.x}%`,
                    top: `${sig.y}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                  className="bg-yellow-200 border-2 border-yellow-500 rounded px-2 py-1 text-xs text-yellow-800 font-medium shadow pointer-events-none select-none"
                >
                  ✍️ {sig.signer_name || 'Signature'}
                </div>
              ))}

              {savingSignature && (
                <div className="absolute inset-0 bg-white bg-opacity-40 flex items-center justify-center">
                  <span className="text-xs text-gray-600">Saving...</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Signatures list */}
        {signatures.length > 0 && (
          <div className="bg-white rounded-lg shadow p-5 mt-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Placed Signature Fields</h3>
            <table className="w-full text-xs">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-3 py-2 text-gray-500 font-medium">Signer</th>
                  <th className="text-left px-3 py-2 text-gray-500 font-medium">Page</th>
                  <th className="text-left px-3 py-2 text-gray-500 font-medium">Position (x, y)</th>
                  <th className="text-left px-3 py-2 text-gray-500 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {signatures.map((sig) => (
                  <tr key={sig.id} className="border-b last:border-0">
                    <td className="px-3 py-2 text-gray-700">{sig.signer_name}</td>
                    <td className="px-3 py-2 text-gray-500">{sig.page}</td>
                    <td className="px-3 py-2 text-gray-500">{sig.x}%, {sig.y}%</td>
                    <td className="px-3 py-2">
                      <span className={`px-2 py-0.5 rounded-full font-medium ${
                        sig.status === 'signed'
                          ? 'bg-green-100 text-green-700'
                          : sig.status === 'rejected'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {sig.status.charAt(0).toUpperCase() + sig.status.slice(1)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default DocumentView;
