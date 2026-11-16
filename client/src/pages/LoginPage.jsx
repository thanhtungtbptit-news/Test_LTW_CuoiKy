import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { loginUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', { email, password });
      loginUser(res.data.user, res.data.token);
      if (res.data.user.role === 'landlord') navigate('/landlord/dashboard');
      else navigate('/tenant/portal');
    } catch (err) {
      setError(err.response?.data?.message || 'Đăng nhập thất bại');
    }
  };

  return (
    <div className="max-w-sm mx-auto mt-10 bg-white border border-slate-200 p-5 rounded shadow-sm text-slate-800">
      <h2 className="text-lg font-bold mb-4 text-center">Đăng nhập Hệ thống</h2>
      {error && <div className="bg-red-50 text-red-600 text-xs p-2 rounded mb-3 border border-red-200">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label htmlFor="email" className="block text-xs font-medium mb-1">Email</label>
          <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-sm" />
        </div>
        <div>
          <label htmlFor="password" className="block text-xs font-medium mb-1">Mật khẩu</label>
          <input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-sm" />
        </div>
        <button type="submit" className="w-full bg-blue-700 hover:bg-blue-800 text-white font-medium py-2 rounded text-sm">
          Đăng nhập
        </button>
      </form>

      <div className="mt-4 pt-3 border-t border-slate-200 text-xs space-y-1.5">
        <p className="font-semibold text-slate-500">Chọn nhanh tài khoản Demo (từ seed.js):</p>
        <button
          type="button"
          onClick={() => { setEmail('chunhatro.hung@gmail.com'); setPassword('123456'); }}
          className="block w-full text-left bg-slate-100 hover:bg-slate-200 p-1.5 rounded"
        >
          🔑 <strong>Chủ trọ:</strong> chunhatro.hung@gmail.com / 123456
        </button>
        <button
          type="button"
          onClick={() => { setEmail('tung.tran@student.edu.vn'); setPassword('123456'); }}
          className="block w-full text-left bg-slate-100 hover:bg-slate-200 p-1.5 rounded"
        >
          👤 <strong>Người thuê (P.201):</strong> tung.tran@student.edu.vn / 123456
        </button>
      </div>
    </div>
  );
};

export default LoginPage;