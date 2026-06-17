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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Navbar */}
      <nav className="bg-white shadow-sm px-6 py-4 flex items-center justify-between">
        <span className="text-xl font-bold text-gray-900">📄 DocSign</span>
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Link to="/dashboard" className="text-sm text-blue-600 hover:underline font-medium">Dashboard</Link>
              <button onClick={handleLogout} className="text-sm text-red-500 hover:underline">Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm text-gray-600 hover:underline">Login</Link>
              <Link to="/register" className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition">
                Get Started
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero with background image */}
      <div
        className="relative flex-1 flex flex-col items-center justify-center px-4 text-center py-20"
        style={{
          backgroundImage:
            "linear-gradient(to bottom, rgba(249,250,251,0.93), rgba(249,250,251,0.96)), url('https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=1600&q=80')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="text-6xl mb-6">📄</div>
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          Sign Documents <span className="text-blue-600">Digitally</span>
        </h1>
        <p className="text-lg text-gray-500 max-w-xl mb-10">
          Upload PDFs, place signature fields, share signing links, and generate legally traceable signed documents — all in one place.
        </p>

        {user ? (
          <div className="flex gap-4 flex-wrap justify-center">
            <Link
              to="/dashboard"
              className="bg-blue-600 text-white px-8 py-3 rounded-lg text-sm font-semibold hover:bg-blue-700 transition"
            >
              Go to Dashboard
            </Link>
            <Link
              to="/upload"
              className="bg-white border border-gray-300 text-gray-700 px-8 py-3 rounded-lg text-sm font-semibold hover:bg-gray-50 transition"
            >
              Upload a PDF
            </Link>
          </div>
        ) : (
          <div className="flex gap-4 flex-wrap justify-center">
            <Link
              to="/register"
              className="bg-blue-600 text-white px-8 py-3 rounded-lg text-sm font-semibold hover:bg-blue-700 transition"
            >
              Get Started Free
            </Link>
            <Link
              to="/login"
              className="bg-white border border-gray-300 text-gray-700 px-8 py-3 rounded-lg text-sm font-semibold hover:bg-gray-50 transition"
            >
              Login
            </Link>
          </div>
        )}

        {/* Feature highlights */}
        <div className="relative grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 max-w-3xl w-full text-left">
          {[
            { icon: '🔒', title: 'Secure Auth', desc: 'JWT-based authentication with protected document access.' },
            { icon: '✍️', title: 'Drag & Drop Signing', desc: 'Place signature fields anywhere on the PDF with ease.' },
            { icon: '📋', title: 'Full Audit Trail', desc: 'Every action logged with timestamps and IP addresses.' },
          ].map((f) => (
            <div key={f.title} className="bg-white rounded-xl shadow p-5">
              <div className="text-2xl mb-2">{f.icon}</div>
              <h3 className="font-semibold text-gray-900 text-sm mb-1">{f.title}</h3>
              <p className="text-xs text-gray-500">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Home;