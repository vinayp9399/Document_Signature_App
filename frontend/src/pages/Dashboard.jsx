import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const STATUS_FILTERS = ['all', 'pending', 'signed', 'rejected'];

function Dashboard() {
  const [documents, setDocuments] = useState([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }

    const fetchDocuments = async () => {
      try {
        const res = await axios.get('https://document-signature-app-80xa.onrender.com/api/docs/', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setDocuments(res.data.documents);
      } catch (err) {
        if (err.response?.status === 401) navigate('/login');
        else setError('Failed to load documents.');
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const formatSize = (bytes) => {
    if (!bytes) return 'N/A';
    return (bytes / 1024).toFixed(1) + ' KB';
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  };

  const filtered = documents.filter((doc) => {
    const matchesStatus = filter === 'all' || doc.status === filter;
    const matchesSearch = doc.original_name.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const counts = {
    all: documents.length,
    pending: documents.filter((d) => d.status === 'pending').length,
    signed: documents.filter((d) => d.status === 'signed').length,
    rejected: documents.filter((d) => d.status === 'rejected').length,
  };

  const statusStyles = {
    signed: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
    pending: 'bg-yellow-100 text-yellow-700',
  };

  const filterStyles = {
    all: { active: 'bg-gray-800 text-white', idle: 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50' },
    pending: { active: 'bg-yellow-500 text-white', idle: 'bg-white text-yellow-600 border border-yellow-300 hover:bg-yellow-50' },
    signed: { active: 'bg-green-600 text-white', idle: 'bg-white text-green-600 border border-green-300 hover:bg-green-50' },
    rejected: { active: 'bg-red-500 text-white', idle: 'bg-white text-red-500 border border-red-300 hover:bg-red-50' },
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white shadow-sm px-4 md:px-8 py-4 flex items-center justify-between">
        <span className="text-xl font-bold text-gray-900">📄 DocSign</span>
        <div className="flex items-center gap-2 md:gap-4">
          <span className="hidden md:block text-sm text-gray-500">Hello, <span className="font-medium text-gray-700">{user?.name}</span></span>
          <Link
            to="/upload"
            className="bg-blue-600 text-white px-3 md:px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition"
          >
            + Upload
          </Link>
          <button onClick={handleLogout} className="text-sm text-red-500 hover:underline">
            Logout
          </button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto mt-8 px-4">
        {/* Page header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">My Documents</h2>
            <p className="text-sm text-gray-500 mt-0.5">{documents.length} document{documents.length !== 1 ? 's' : ''} total</p>
          </div>
          {/* Search */}
          <input
            type="text"
            placeholder="Search by file name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Status filter pills */}
        <div className="flex flex-wrap gap-2 mb-6">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
                filter === s ? filterStyles[s].active : filterStyles[s].idle
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
              <span className="ml-1.5 opacity-75">({counts[s]})</span>
            </button>
          ))}
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 text-sm p-3 rounded mb-4">{error}</div>
        )}

        {loading ? (
          <div className="bg-white rounded-lg shadow p-10 text-center">
            <p className="text-gray-400 text-sm">Loading documents...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-10 text-center">
            {documents.length === 0 ? (
              <>
                <p className="text-4xl mb-3">📭</p>
                <p className="text-gray-500 text-sm mb-4">No documents uploaded yet.</p>
                <Link
                  to="/upload"
                  className="bg-blue-600 text-white px-5 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition"
                >
                  Upload your first PDF
                </Link>
              </>
            ) : (
              <>
                <p className="text-4xl mb-3">🔍</p>
                <p className="text-gray-500 text-sm">No documents match your filter.</p>
                <button
                  onClick={() => { setFilter('all'); setSearch(''); }}
                  className="mt-3 text-blue-600 hover:underline text-sm"
                >
                  Clear filters
                </button>
              </>
            )}
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block bg-white rounded-lg shadow overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-6 py-3 text-gray-500 font-medium">File Name</th>
                    <th className="text-left px-6 py-3 text-gray-500 font-medium">Size</th>
                    <th className="text-left px-6 py-3 text-gray-500 font-medium">Status</th>
                    <th className="text-left px-6 py-3 text-gray-500 font-medium">Uploaded</th>
                    <th className="text-left px-6 py-3 text-gray-500 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((doc) => (
                    <tr key={doc.id} className="border-b last:border-0 hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400">📄</span>
                          <span className="font-medium text-gray-900 truncate max-w-xs">{doc.original_name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-500">{formatSize(doc.file_size)}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusStyles[doc.status] || 'bg-gray-100 text-gray-600'}`}>
                          {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-500">{formatDate(doc.created_at)}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Link to={`/docs/${doc.id}`} className="text-blue-600 hover:underline text-sm font-medium">Preview</Link>
                          <Link to={`/status/${doc.id}`} className="text-purple-600 hover:underline text-sm">Status</Link>
                          <Link to={`/audit/${doc.id}`} className="text-gray-400 hover:underline text-sm">Audit</Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden flex flex-col gap-3">
              {filtered.map((doc) => (
                <div key={doc.id} className="bg-white rounded-lg shadow p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="font-medium text-gray-900 text-sm truncate">📄 {doc.original_name}</p>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${statusStyles[doc.status] || 'bg-gray-100 text-gray-600'}`}>
                      {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mb-3">
                    {formatSize(doc.file_size)} &nbsp;•&nbsp; {formatDate(doc.created_at)}
                  </p>
                  <div className="flex items-center gap-4 border-t pt-3">
                    <Link to={`/docs/${doc.id}`} className="text-blue-600 text-sm font-medium hover:underline">Preview</Link>
                    <Link to={`/status/${doc.id}`} className="text-purple-600 text-sm hover:underline">Status</Link>
                    <Link to={`/audit/${doc.id}`} className="text-gray-400 text-sm hover:underline">Audit</Link>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
