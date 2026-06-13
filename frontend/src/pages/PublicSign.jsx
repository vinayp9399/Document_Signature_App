import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Document, Page, pdfjs } from 'react-pdf';
import axios from 'axios';

import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const PAGE_WIDTH = 620;

function PublicSign() {
  const { token } = useParams();
  const dropZoneRef = useRef(null);

  const [tokenData, setTokenData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [numPages, setNumPages] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pendingSignature, setPendingSignature] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitMsg, setSubmitMsg] = useState('');

  useEffect(() => {
    const verifyToken = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/signing/verify/${token}`);
        setTokenData(res.data);
      } catch (err) {
        if (err.response?.status === 410) {
          setError(err.response.data.message);
        } else if (err.response?.status === 404) {
          setError('This signing link is invalid or does not exist.');
        } else {
          setError('Failed to load signing request.');
        }
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, [token]);

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setCurrentPage(1);
  };

  const goToPrevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
  const goToNextPage = () => setCurrentPage((prev) => Math.min(prev + 1, numPages));

  const handlePageClick = (e) => {
    if (!dropZoneRef.current || submitted) return;
    const rect = dropZoneRef.current.getBoundingClientRect();
    const x = parseFloat(((e.clientX - rect.left) / rect.width * 100).toFixed(2));
    const y = parseFloat(((e.clientY - rect.top) / rect.height * 100).toFixed(2));
    setPendingSignature({ x, y, page: currentPage });
  };

  const handleSubmitSignature = async () => {
    if (!pendingSignature) return;
    setSubmitting(true);
    setSubmitMsg('');
    try {
      await axios.post(`http://localhost:5000/api/signing/sign/${token}`, {
        x: pendingSignature.x,
        y: pendingSignature.y,
        page: pendingSignature.page,
      });
      setSubmitted(true);
      setSubmitMsg('You have successfully signed the document!');
    } catch (err) {
      setSubmitMsg(err.response?.data?.message || 'Failed to submit signature.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500 text-sm">Verifying signing link...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-3 px-4">
        <div className="text-4xl">⚠️</div>
        <h2 className="text-lg font-semibold text-gray-800">Signing Link Unavailable</h2>
        <p className="text-sm text-red-600 text-center">{error}</p>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-3 px-4">
        <div className="text-5xl">✅</div>
        <h2 className="text-xl font-bold text-gray-900">Document Signed!</h2>
        <p className="text-sm text-green-700">{submitMsg}</p>
        <p className="text-xs text-gray-500 mt-2">You may close this window.</p>
      </div>
    );
  }

  const pdfUrl = `http://localhost:5000/uploads/${tokenData.filePath}`;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow px-6 py-4">
        <span className="text-xl font-bold text-gray-900">📄 DocSign</span>
      </nav>

      <div className="max-w-3xl mx-auto mt-8 px-4">
        {/* Request info */}
        <div className="bg-white rounded-lg shadow p-5 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-1">Signature Request</h2>
          <p className="text-sm text-gray-600">
            You have been asked to sign: <span className="font-medium">{tokenData.documentName}</span>
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Signing as: {tokenData.signerEmail} &nbsp;•&nbsp;
            Expires: {new Date(tokenData.expiresAt).toLocaleString()}
          </p>
        </div>

        {/* Instruction */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 mb-4 text-sm text-blue-700">
          💡 Click on the document below where you want to place your signature, then click <strong>Submit Signature</strong>.
        </div>

        {pendingSignature && (
          <div className="bg-yellow-50 border border-yellow-300 rounded-lg px-4 py-3 mb-4 flex items-center justify-between">
            <p className="text-sm text-yellow-800">
              Signature placed on page {pendingSignature.page} at ({pendingSignature.x}%, {pendingSignature.y}%). Ready to submit.
            </p>
            <button
              onClick={handleSubmitSignature}
              disabled={submitting}
              className="ml-4 bg-green-600 text-white px-4 py-1.5 rounded-md text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition flex-shrink-0"
            >
              {submitting ? 'Submitting...' : '✅ Submit Signature'}
            </button>
          </div>
        )}

        {submitMsg && !submitted && (
          <div className="bg-red-50 text-red-700 text-sm px-4 py-2 rounded mb-4">{submitMsg}</div>
        )}

        {/* PDF viewer */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-gray-500">Click on the PDF to place your signature.</p>
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

          <div
            ref={dropZoneRef}
            onClick={handlePageClick}
            className="relative border rounded-md overflow-hidden bg-gray-100 cursor-crosshair"
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

            {/* Show pending signature placement */}
            {pendingSignature && pendingSignature.page === currentPage && (
              <div
                style={{
                  position: 'absolute',
                  left: `${pendingSignature.x}%`,
                  top: `${pendingSignature.y}%`,
                  transform: 'translate(-50%, -50%)',
                  pointerEvents: 'none',
                }}
                className="bg-yellow-200 border-2 border-yellow-500 rounded px-2 py-1 text-xs font-medium text-yellow-800 shadow select-none"
              >
                ✍️ Your Signature
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PublicSign;
