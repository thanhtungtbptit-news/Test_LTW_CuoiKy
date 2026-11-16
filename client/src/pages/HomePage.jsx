import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useDebounce } from '../hooks/useDebounce';

const API = 'http://localhost:5000/api';

const HomePage = () => {
  const [rooms, setRooms] = useState([]);
  const [maxPrice, setMaxPrice] = useState('');
  const [minArea, setMinArea] = useState('');
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [note, setNote] = useState('');
  const [msg, setMsg] = useState('');

  const debouncedPrice = useDebounce(maxPrice, 400);
  const debouncedArea = useDebounce(minArea, 400);

  useEffect(() => {
    const fetchRooms = async () => {
      const params = { status: 'Trống' };
      if (debouncedPrice) params.maxPrice = debouncedPrice;
      if (debouncedArea) params.minArea = debouncedArea;
      const res = await axios.get(`${API}/rooms`, { params });
      setRooms(res.data.data);
    };
    fetchRooms();
  }, [debouncedPrice, debouncedArea]);

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    await axios.post(`${API}/repairs/contact`, {
      roomId: selectedRoom._id,
      guestName,
      guestPhone,
      description: note
    });
    setMsg(`Đã gửi yêu cầu hẹn xem phòng ${selectedRoom.roomNumber}. Chủ trọ sẽ liên hệ sớm!`);
    setSelectedRoom(null);
    setGuestName('');
    setGuestPhone('');
    setNote('');
  };

  return (
    <div>
      <h1 className="text-xl font-bold mb-3">Danh sách phòng đang còn trống</h1>

      <div className="bg-white border border-slate-200 p-3 rounded mb-4 flex flex-wrap gap-4 items-end text-slate-800">
        <div>
          <label htmlFor="maxPrice" className="block text-xs font-medium text-slate-600">Giá tối đa (VNĐ)</label>
          <input
            id="maxPrice"
            type="number"
            placeholder="VD: 3500000"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="border border-slate-300 rounded px-2.5 py-1 text-sm"
          />
        </div>
        <div>
          <label htmlFor="minArea" className="block text-xs font-medium text-slate-600">Diện tích tối thiểu (m²)</label>
          <input
            id="minArea"
            type="number"
            placeholder="VD: 20"
            value={minArea}
            onChange={(e) => setMinArea(e.target.value)}
            className="border border-slate-300 rounded px-2.5 py-1 text-sm"
          />
        </div>
      </div>

      {msg && <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 p-3 rounded mb-4 text-sm">{msg}</div>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {rooms.map((r) => (
          <div key={r._id} className="bg-white border border-slate-200 rounded p-4 shadow-sm text-slate-800">
            <div className="flex justify-between items-center mb-2">
              <span className="font-bold text-lg text-blue-700">{r.roomNumber} (Tầng {r.floor})</span>
              <span className="bg-emerald-100 text-emerald-700 text-xs font-semibold px-2 py-0.5 rounded">{r.status}</span>
            </div>
            <p className="text-xs text-slate-500 mb-2">{r.hostelId?.name} - {r.hostelId?.address}</p>
            <p className="text-sm mb-1">Diện tích: <strong>{r.area} m²</strong></p>
            <p className="text-sm mb-2">Giá thuê: <strong className="text-red-600">{r.price.toLocaleString('vi-VN')} đ/tháng</strong></p>
            <p className="text-xs text-slate-600 mb-3">Tiện ích: {r.amenities?.join(', ')}</p>
            <button
              onClick={() => setSelectedRoom(r)}
              className="w-full bg-blue-700 hover:bg-blue-800 text-white text-sm py-1.5 rounded"
            >
              Để lại thông tin hẹn xem phòng
            </button>
          </div>
        ))}
      </div>

      {selectedRoom && (
        <form onSubmit={handleContactSubmit} className="mt-6 bg-white border border-blue-300 p-4 rounded max-w-md text-slate-800">
          <h3 className="font-bold mb-2">Đăng ký xem phòng {selectedRoom.roomNumber}</h3>
          <div className="mb-2">
            <label htmlFor="gName" className="block text-xs font-medium">Họ và tên *</label>
            <input id="gName" required value={guestName} onChange={(e) => setGuestName(e.target.value)} className="w-full border px-2 py-1 rounded text-sm" />
          </div>
          <div className="mb-2">
            <label htmlFor="gPhone" className="block text-xs font-medium">Số điện thoại *</label>
            <input id="gPhone" required value={guestPhone} onChange={(e) => setGuestPhone(e.target.value)} className="w-full border px-2 py-1 rounded text-sm" />
          </div>
          <div className="mb-3">
            <label htmlFor="gNote" className="block text-xs font-medium">Ghi chú</label>
            <input id="gNote" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ngày giờ muốn xem phòng..." className="w-full border px-2 py-1 rounded text-sm" />
          </div>
          <div className="flex gap-2">
            <button type="submit" className="bg-blue-700 text-white px-4 py-1.5 rounded text-sm">Gửi liên hệ</button>
            <button type="button" onClick={() => setSelectedRoom(null)} className="bg-slate-200 px-3 py-1.5 rounded text-sm">Đóng</button>
          </div>
        </form>
      )}
    </div>
  );
};

export default HomePage;