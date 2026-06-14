import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const ACTION_LABELS = {
  document_uploaded: { label: 'Document Uploaded', color: 'bg-blue-100 text-blue-700' },
  document_viewed: { label: 'Document Viewed', color: 'bg-gray-100 text-gray-700' },
  signature_placed: { label: 'Signature Field Placed', color: 'bg-yellow-100 text-yellow-700' },
  document_finalized: { label: 'Document Finalized', color: 'bg-green-100 text-green-700' },
  signing_link_generated: { label: 'Signing Link Generated', color: 'bg-purple-100 text-purple-700' },
};

function getActionDisplay(action) {
  if (ACTION_LABELS[action]) return ACTION_LABELS[action];
  if (action.startsWith('document_signed_by_')) {
    return {
      label: `Signed by ${action.replace('document_signed_by_', '')}`,
      color: 'bg-green-100 text-green-700',
    };
  }
  return { label: action, color: 'bg-gray-100 text-gray-600' };
}

function AuditTrail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [docName, setDocName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }

    const fetchData = async () => {
      try {
        const [auditRes, docRes] = await Promise.all([
          axios.get(`http://localhost:5000/api/audit/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`http://localhost:5000/api/docs/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        setLogs(auditRes.data.logs);
        setDocName(docRes.data.document.original_name);
      } catch (err) {
        if (err.response?.status === 401) navigate('/login');
        else if (err.response?.status === 403) setError('Access denied.');
        else if (err.response?.status === 404) setError('Document not found.');
        else setError('Failed to load audit trail.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, navigate]);

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500 text-sm">Loading audit trail...</p>
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
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Audit Trail</h2>
          <p className="text-sm text-gray-500 mt-1">Document: <span className="font-medium text-gray-700">{docName}</span></p>
        </div>

        {logs.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-10 text-center">
            <p className="text-gray-400 text-sm">No audit events recorded yet for this document.</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {/* Summary row */}
            <div className="bg-gray-50 border-b px-6 py-3 flex items-center gap-6">
              <span className="text-xs text-gray-500">{logs.length} event{logs.length !== 1 ? 's' : ''} recorded</span>
              <span className="text-xs text-gray-500">
                First: {formatDate(logs[logs.length - 1]?.created_at)}
              </span>
              <span className="text-xs text-gray-500">
                Latest: {formatDate(logs[0]?.created_at)}
              </span>
            </div>

            {/* Timeline */}
            <div className="divide-y">
              {logs.map((log, index) => {
                const { label, color } = getActionDisplay(log.action);
                return (
                  <div key={log.id} className="px-6 py-4 flex items-start gap-4">
                    {/* Timeline dot */}
                    <div className="flex flex-col items-center pt-1">
                      <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                        index === 0 ? 'bg-blue-500' : 'bg-gray-300'
                      }`} />
                      {index < logs.length - 1 && (
                        <div className="w-px flex-1 bg-gray-200 mt-1" style={{ minHeight: 24 }} />
                      )}
                    </div>

                    {/* Event details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${color}`}>
                          {label}
                        </span>
                        <span className="text-xs text-gray-400">{formatDate(log.created_at)}</span>
                      </div>
                      <div className="mt-1 flex items-center gap-4 flex-wrap">
                        {log.user_name && (
                          <span className="text-xs text-gray-600">
                            👤 {log.user_name}
                            {log.user_email && <span className="text-gray-400"> ({log.user_email})</span>}
                          </span>
                        )}
                        {log.ip_address && (
                          <span className="text-xs text-gray-500">
                            🌐 IP: {log.ip_address}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AuditTrail;
