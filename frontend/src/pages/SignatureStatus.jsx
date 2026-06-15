import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

function SignatureStatus() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [doc, setDoc] = useState(null);
  const [signatures, setSignatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionMsg, setActionMsg] = useState('');
  const [processingId, setProcessingId] = useState(null);
  const [rejectReasons, setRejectReasons] = useState({});

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }

    const fetchData = async () => {
      try {
        const [docRes, sigRes] = await Promise.all([
          axios.get(`http://localhost:5000/api/docs/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`http://localhost:5000/api/signatures/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        setDoc(docRes.data.document);
        setSignatures(sigRes.data.signatures);
      } catch (err) {
        if (err.response?.status === 401) navigate('/login');
        else if (err.response?.status === 403) setError('Access denied.');
        else if (err.response?.status === 404) setError('Document not found.');
        else setError('Failed to load data.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, navigate]);

  const handleStatusUpdate = async (sigId, status) => {
    const token = localStorage.getItem('token');
    setProcessingId(sigId);
    setActionMsg('');

    const reason = rejectReasons[sigId] || '';

    try {
      const res = await axios.patch(
        `http://localhost:5000/api/signatures/${sigId}/status`,
        { status, reason },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSignatures((prev) =>
        prev.map((s) => s.id === sigId ? { ...s, status: res.data.signature.status, signed_at: res.data.signature.signed_at } : s)
      );

      // Refresh document status
      const docRes = await axios.get(`http://localhost:5000/api/docs/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDoc(docRes.data.document);

      setActionMsg(
        status === 'signed'
          ? 'Signature accepted successfully.'
          : status === 'rejected'
          ? 'Signature rejected.'
          : 'Signature reset to pending.'
      );
    } catch (err) {
      setActionMsg(err.response?.data?.message || 'Failed to update signature status.');
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500 text-sm">Loading...</p>
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

  const pendingCount = signatures.filter((s) => s.status === 'pending').length;
  const signedCount = signatures.filter((s) => s.status === 'signed').length;
  const rejectedCount = signatures.filter((s) => s.status === 'rejected').length;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow px-6 py-4 flex items-center justify-between">
        <span className="text-xl font-bold text-gray-900">📄 DocSign</span>
        <div className="flex items-center gap-4">
          <Link to={`/docs/${id}`} className="text-sm text-blue-600 hover:underline">← Back to Document</Link>
          <Link to="/dashboard" className="text-sm text-gray-500 hover:underline">Dashboard</Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto mt-10 px-4">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Signature Status</h2>
          <p className="text-sm text-gray-500 mt-1">
            Document: <span className="font-medium text-gray-700">{doc.original_name}</span>
          </p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <p className="text-2xl font-bold text-gray-800">{signatures.length}</p>
            <p className="text-xs text-gray-500 mt-1">Total Fields</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
            <p className="text-xs text-gray-500 mt-1">Pending</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{signedCount}</p>
            <p className="text-xs text-gray-500 mt-1">Signed</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <p className="text-2xl font-bold text-red-600">{rejectedCount}</p>
            <p className="text-xs text-gray-500 mt-1">Rejected</p>
          </div>
        </div>

        {/* Document status banner */}
        <div className={`rounded-lg px-5 py-3 mb-6 text-sm font-medium flex items-center gap-2 ${
          doc.status === 'signed' ? 'bg-green-50 text-green-700 border border-green-200'
          : doc.status === 'rejected' ? 'bg-red-50 text-red-700 border border-red-200'
          : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
        }`}>
          {doc.status === 'signed' ? '✅' : doc.status === 'rejected' ? '❌' : '⏳'}
          Document status: <span className="font-bold">{doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}</span>
        </div>

        {actionMsg && (
          <div className={`text-sm px-4 py-2 rounded mb-4 ${
            actionMsg.includes('Failed') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
          }`}>
            {actionMsg}
          </div>
        )}

        {signatures.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-10 text-center">
            <p className="text-gray-400 text-sm">No signature fields placed on this document yet.</p>
            <Link to={`/docs/${id}`} className="text-blue-600 hover:underline text-sm mt-2 inline-block">
              Go to document editor
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="divide-y">
              {signatures.map((sig) => (
                <div key={sig.id} className="px-6 py-5">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-gray-900 text-sm">{sig.signer_name}</span>
                        <span className="text-gray-400 text-xs">{sig.signer_email}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          sig.status === 'signed' ? 'bg-green-100 text-green-700'
                          : sig.status === 'rejected' ? 'bg-red-100 text-red-700'
                          : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {sig.status.charAt(0).toUpperCase() + sig.status.slice(1)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        Page {sig.page} &nbsp;•&nbsp; Position: {sig.x}%, {sig.y}%
                        {sig.signed_at && <span> &nbsp;•&nbsp; Signed at: {formatDate(sig.signed_at)}</span>}
                      </p>

                      {/* Rejection reason input */}
                      {sig.status !== 'rejected' && (
                        <div className="mt-2">
                          <input
                            type="text"
                            placeholder="Rejection reason (optional)"
                            value={rejectReasons[sig.id] || ''}
                            onChange={(e) =>
                              setRejectReasons((prev) => ({ ...prev, [sig.id]: e.target.value }))
                            }
                            className="border border-gray-300 rounded px-2 py-1 text-xs w-64 focus:outline-none focus:ring-1 focus:ring-red-400"
                          />
                        </div>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {sig.status !== 'signed' && (
                        <button
                          onClick={() => handleStatusUpdate(sig.id, 'signed')}
                          disabled={processingId === sig.id}
                          className="bg-green-600 text-white px-3 py-1.5 rounded text-xs font-medium hover:bg-green-700 disabled:opacity-50 transition"
                        >
                          {processingId === sig.id ? '...' : '✅ Accept'}
                        </button>
                      )}
                      {sig.status !== 'rejected' && (
                        <button
                          onClick={() => handleStatusUpdate(sig.id, 'rejected')}
                          disabled={processingId === sig.id}
                          className="bg-red-500 text-white px-3 py-1.5 rounded text-xs font-medium hover:bg-red-600 disabled:opacity-50 transition"
                        >
                          {processingId === sig.id ? '...' : '❌ Reject'}
                        </button>
                      )}
                      {sig.status !== 'pending' && (
                        <button
                          onClick={() => handleStatusUpdate(sig.id, 'pending')}
                          disabled={processingId === sig.id}
                          className="bg-gray-200 text-gray-700 px-3 py-1.5 rounded text-xs font-medium hover:bg-gray-300 disabled:opacity-50 transition"
                        >
                          {processingId === sig.id ? '...' : '↩ Reset'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default SignatureStatus;
