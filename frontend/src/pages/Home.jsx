import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Home() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">📄 DocSign</h1>
        <p className="text-lg text-gray-600 mb-8">Document Signature App</p>

        {user ? (
          <div className="bg-white rounded-lg shadow p-6 max-w-md mx-auto text-left space-y-3">
            <p className="text-gray-700">
              Welcome, <span className="font-semibold">{user.name}</span>!
            </p>
            <Link
              to="/dashboard"
              className="block w-full text-center bg-blue-600 text-white py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition"
            >
              Go to Dashboard
            </Link>
            <button
              onClick={handleLogout}
              className="w-full bg-red-500 text-white py-2 rounded-md text-sm font-medium hover:bg-red-600 transition"
            >
              Logout
            </button>
          </div>
        ) : (
          <div className="flex gap-4 justify-center">
            <Link
              to="/login"
              className="bg-blue-600 text-white px-6 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="bg-gray-200 text-gray-800 px-6 py-2 rounded-md text-sm font-medium hover:bg-gray-300 transition"
            >
              Register
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default Home;
