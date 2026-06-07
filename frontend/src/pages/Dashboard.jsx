import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

function Dashboard() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchDocuments = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/docs/', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setDocuments(res.data.documents);
      } catch (err) {
        if (err.response?.status === 401) {
          navigate('/login');
        } else {
          setError('Failed to load documents.');
        }
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

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow px-6 py-4 flex items-center justify-between">
        <span className="text-xl font-bold text-gray-900">📄 DocSign</span>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">Hello, {user?.name}</span>
          <Link
            to="/upload"
            className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition"
          >
            + Upload PDF
          </Link>
          <button
            onClick={handleLogout}
            className="text-sm text-red-500 hover:underline"
          >
            Logout
          </button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto mt-10 px-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">My Documents</h2>

        {error && (
          <div className="bg-red-50 text-red-700 text-sm p-3 rounded mb-4">{error}</div>
        )}

        {loading ? (
          <p className="text-gray-500 text-sm">Loading documents...</p>
        ) : documents.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-10 text-center">
            <p className="text-gray-500 text-sm mb-4">No documents uploaded yet.</p>
            <Link
              to="/upload"
              className="bg-blue-600 text-white px-5 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition"
            >
              Upload your first PDF
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-6 py-3 text-gray-600 font-medium">File Name</th>
                  <th className="text-left px-6 py-3 text-gray-600 font-medium">Size</th>
                  <th className="text-left px-6 py-3 text-gray-600 font-medium">Status</th>
                  <th className="text-left px-6 py-3 text-gray-600 font-medium">Uploaded</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => (
                  <tr key={doc.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="px-6 py-4 text-gray-900 font-medium">📄 {doc.original_name}</td>
                    <td className="px-6 py-4 text-gray-500">{formatSize(doc.file_size)}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        doc.status === 'signed'
                          ? 'bg-green-100 text-green-700'
                          : doc.status === 'rejected'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500">{formatDate(doc.created_at)}</td>
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

export default Dashboard;
