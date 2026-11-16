import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useDispatch } from 'react-redux';
import { initDraftRows } from '../redux/slices/invoiceSlice';
import UtilityBulkTable from '../components/invoices/UtilityBulkTable';

const API = 'https://test-ltw-cuoi-ky-dkmx.vercel.app/landlord/rooms';
const authHeader = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

// 1. DASHBOARD CHỦ TRỌ (Hiển thị kết quả Aggregation Pipeline)
export const DashboardPage = () => {
  const [stats, setStats] = useState({ monthlyRevenue: [], unpaidRooms: [], roomStatusSummary: [] });

  useEffect(() => {
    axios.get(`${API}/invoices/stats/dashboard`, authHeader()).then((res) => setStats(res.data));
  }, []);

  return (
    <div className="space-y-6 text-slate-800">
      <h1 className="text-xl font-bold text-slate-700">Thống kê hoạt động nhà trọ</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.roomStatusSummary.map((item) => (
          <div key={item._id} className="bg-white border border-slate-200 p-4 rounded shadow-sm">
            <span className="text-xs text-slate-500">Trạng thái: {item._id}</span>
            <p className="text-2xl font-bold text-blue-700">{item.count} phòng</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 p-4 rounded">
          <h3 className="font-bold mb-3">Doanh thu đã thu theo tháng</h3>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-slate-100"><th className="border p-2">Tháng/Năm</th><th className="border p-2">Số HĐ</th><th className="border p-2 text-right">Tổng thu</th></tr>
            </thead>
            <tbody>
              {stats.monthlyRevenue.map((m) => (
                <tr key={`${m._id.month}-${m._id.year}`}>
                  <td className="border p-2">Tháng {m._id.month}/{m._id.year}</td>
                  <td className="border p-2 text-center">{m.invoiceCount}</td>
                  <td className="border p-2 text-right font-semibold text-emerald-700">{m.totalRevenue.toLocaleString('vi-VN')} đ</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded">
          <h3 className="font-bold mb-3 text-red-600">Danh sách phòng đang nợ tiền</h3>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-red-50"><th className="border p-2">Phòng</th><th className="border p-2">Người thuê</th><th className="border p-2">Kỳ</th><th className="border p-2 text-right">Số tiền nợ</th></tr>
            </thead>
            <tbody>
              {stats.unpaidRooms.map((u) => (
                <tr key={u._id}>
                  <td className="border p-2 font-bold">{u.roomNumber}</td>
                  <td className="border p-2">{u.tenantName} ({u.tenantPhone})</td>
                  <td className="border p-2">{u.month}/{u.year}</td>
                  <td className="border p-2 text-right font-bold text-red-600">{u.totalAmount.toLocaleString('vi-VN')} đ</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// 2. QUẢN LÝ PHÒNG & HỢP ĐỒNG
export const ManageRoomsPage = () => {
  const [rooms, setRooms] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [form, setForm] = useState({ roomId: '', tenantId: '', startDate: '2026-11-01', endDate: '2027-11-01', deposit: 3000000, monthlyRent: 3000000 });
  const [msg, setMsg] = useState('');

  const loadData = async () => {
    const [rRes, cRes, tRes] = await Promise.all([
      axios.get(`${API}/rooms`),
      axios.get(`${API}/contracts`, authHeader()),
      axios.get(`${API}/users/tenants`, authHeader())
    ]);
    setRooms(rRes.data.data);
    setContracts(cRes.data.data);
    setTenants(tRes.data.data);
  };

  useEffect(() => { loadData(); }, []);

  const handleCreateContract = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API}/contracts`, form, authHeader());
      setMsg(res.data.message);
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi tạo hợp đồng');
    }
  };

  const handleTerminate = async (id) => {
    await axios.patch(`${API}/contracts/${id}/terminate`, {}, authHeader());
    loadData();
  };

  return (
    <div className="space-y-6 text-slate-800">
      {msg && <div className="bg-blue-50 border border-blue-200 text-blue-800 p-2.5 rounded text-sm">{msg}</div>}
      <div className="bg-white border border-slate-200 p-4 rounded">
        <h2 className="font-bold mb-3">Tạo Hợp đồng mới (Chỉ áp dụng cho phòng Trống)</h2>
        <form onSubmit={handleCreateContract} className="grid grid-cols-1 md:grid-cols-5 gap-3 text-sm items-end">
          <div>
            <label className="block text-xs mb-1">Chọn phòng</label>
            <select required value={form.roomId} onChange={(e) => setForm({ ...form, roomId: e.target.value })} className="w-full border p-1.5 rounded">
              <option value="">-- Chọn phòng --</option>
              {rooms.map((r) => <option key={r._id} value={r._id}>{r.roomNumber} ({r.status})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs mb-1">Người thuê</label>
            <select required value={form.tenantId} onChange={(e) => setForm({ ...form, tenantId: e.target.value })} className="w-full border p-1.5 rounded">
              <option value="">-- Chọn người thuê --</option>
              {tenants.map((t) => <option key={t._id} value={t._id}>{t.fullName}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs mb-1">Giá thuê/tháng</label>
            <input type="number" value={form.monthlyRent} onChange={(e) => setForm({ ...form, monthlyRent: Number(e.target.value) })} className="w-full border p-1.5 rounded" />
          </div>
          <div>
            <label className="block text-xs mb-1">Tiền cọc</label>
            <input type="number" value={form.deposit} onChange={(e) => setForm({ ...form, deposit: Number(e.target.value) })} className="w-full border p-1.5 rounded" />
          </div>
          <button type="submit" className="bg-blue-700 text-white py-1.5 px-3 rounded">Ký hợp đồng</button>
        </form>
      </div>

      <div className="bg-white border border-slate-200 p-4 rounded">
        <h2 className="font-bold mb-3">Danh sách Hợp đồng</h2>
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-slate-100"><th className="border p-2">Phòng</th><th className="border p-2">Người thuê</th><th className="border p-2">Giá thuê</th><th className="border p-2">Trạng thái</th><th className="border p-2">Thao tác</th></tr>
          </thead>
          <tbody>
            {contracts.map((c) => (
              <tr key={c._id}>
                <td className="border p-2 font-bold">{c.roomId?.roomNumber}</td>
                <td className="border p-2">{c.tenantId?.fullName} ({c.tenantId?.phone})</td>
                <td className="border p-2">{c.monthlyRent.toLocaleString('vi-VN')} đ</td>
                <td className="border p-2">{c.status}</td>
                <td className="border p-2 text-center">
                  {c.status === 'Hiệu lực' && (
                    <button onClick={() => handleTerminate(c._id)} className="bg-red-600 text-white text-xs px-2.5 py-1 rounded">
                      Kết thúc HĐ
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// 3. TRANG NHẬP ĐIỆN NƯỚC HÀNG LOẠT & THU TIỀN HÓA ĐƠN
export const BulkUtilityPage = () => {
  const dispatch = useDispatch();
  const [invoices, setInvoices] = useState([]);

  const loadData = async () => {
    const [rRes, iRes] = await Promise.all([
      axios.get(`${API}/rooms`, { params: { status: 'Đang thuê' } }),
      axios.get(`${API}/invoices`, authHeader())
    ]);
    dispatch(initDraftRows(rRes.data.data));
    setInvoices(iRes.data.data);
  };

  useEffect(() => { loadData(); }, []);

  const markPaid = async (id) => {
    await axios.patch(`${API}/invoices/${id}/pay`, {}, authHeader());
    loadData();
  };

  return (
    <div className="space-y-6 text-slate-800">
      <h2 className="text-lg font-bold">Chốt chỉ số điện nước cuối tháng (Tất cả phòng đang thuê)</h2>
      <UtilityBulkTable />

      <div className="bg-white border border-slate-200 p-4 rounded">
        <h3 className="font-bold mb-3">Danh sách Hóa đơn đã phát hành</h3>
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-slate-100"><th className="border p-2">Phòng</th><th className="border p-2">Kỳ</th><th className="border p-2">Điện (Cũ-Mới)</th><th className="border p-2">Nước (Cũ-Mới)</th><th className="border p-2">Tổng tiền</th><th className="border p-2">Trạng thái</th></tr>
          </thead>
          <tbody>
            {invoices.map((inv) => (
              <tr key={inv._id}>
                <td className="border p-2 font-bold">{inv.roomId?.roomNumber}</td>
                <td className="border p-2">{inv.month}/{inv.year}</td>
                <td className="border p-2">{inv.oldElectric} → {inv.newElectric}</td>
                <td className="border p-2">{inv.oldWater} → {inv.newWater}</td>
                <td className="border p-2 font-bold text-blue-700">{inv.totalAmount.toLocaleString('vi-VN')} đ</td>
                <td className="border p-2">
                  {inv.isPaid ? (
                    <span className="text-emerald-700 font-semibold">Đã thu tiền</span>
                  ) : (
                    <button onClick={() => markPaid(inv._id)} className="bg-emerald-600 text-white text-xs px-2.5 py-1 rounded">
                      Đánh dấu đã thu
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// 4. QUẢN LÝ YÊU CẦU SỬA CHỮA & KHÁCH LIÊN HỆ
export const ManageRepairsPage = () => {
  const [repairs, setRepairs] = useState([]);

  const loadRepairs = async () => {
    const res = await axios.get(`${API}/repairs`, authHeader());
    setRepairs(res.data.data);
  };

  useEffect(() => { loadRepairs(); }, []);

  const changeStatus = async (id, status) => {
    await axios.patch(`${API}/repairs/${id}/status`, { status }, authHeader());
    loadRepairs();
  };

  return (
    <div className="bg-white border border-slate-200 p-4 rounded text-slate-800">
      <h2 className="font-bold mb-3">Yêu cầu sửa chữa & Khách liên hệ xem phòng</h2>
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-slate-100"><th className="border p-2">Phòng</th><th className="border p-2">Loại</th><th className="border p-2">Tiêu đề & Mô tả</th><th className="border p-2">Trạng thái</th><th className="border p-2">Đổi trạng thái</th></tr>
        </thead>
        <tbody>
          {repairs.map((r) => (
            <tr key={r._id}>
              <td className="border p-2 font-bold">{r.roomId?.roomNumber}</td>
              <td className="border p-2">{r.type === 'REPAIR' ? 'Sửa chữa' : `Khách hẹn (${r.guestPhone})`}</td>
              <td className="border p-2"><strong>{r.title}:</strong> {r.description}</td>
              <td className="border p-2 font-semibold">{r.status}</td>
              <td className="border p-2 space-x-1">
                {['Mới', 'Đang xử lý', 'Xong'].map((st) => (
                  <button key={st} onClick={() => changeStatus(r._id, st)} className="border px-2 py-0.5 rounded text-xs hover:bg-slate-100">
                    {st}
                  </button>
                ))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// 5. CỔNG THÔNG TIN NGƯỜI THUÊ (Xem HĐ, Hóa đơn phòng mình, Gửi sửa chữa)
export const TenantPortalPage = () => {
  const [contracts, setContracts] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [repairs, setRepairs] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const loadTenantData = async () => {
    const [cRes, iRes, rRes] = await Promise.all([
      axios.get(`${API}/contracts`, authHeader()),
      axios.get(`${API}/invoices`, authHeader()),
      axios.get(`${API}/repairs`, authHeader())
    ]);
    setContracts(cRes.data.data);
    setInvoices(iRes.data.data);
    setRepairs(rRes.data.data);
  };

  useEffect(() => { loadTenantData(); }, []);

  const submitRepair = async (e) => {
    e.preventDefault();
    if (!contracts[0]) return;
    await axios.post(`${API}/repairs`, { roomId: contracts[0].roomId._id, title, description }, authHeader());
    setTitle('');
    setDescription('');
    loadTenantData();
  };

  return (
    <div className="space-y-6 text-slate-800">
      <div className="bg-white border border-slate-200 p-4 rounded">
        <h2 className="font-bold mb-2">Hợp đồng thuê phòng của tôi</h2>
        {contracts.map((c) => (
          <div key={c._id} className="text-sm">
            Phòng: <strong>{c.roomId?.roomNumber}</strong> | Giá thuê: <strong>{c.monthlyRent.toLocaleString('vi-VN')} đ/tháng</strong> | Trạng thái: <strong>{c.status}</strong>
          </div>
        ))}
      </div>

      <div className="bg-white border border-slate-200 p-4 rounded">
        <h2 className="font-bold mb-3">Danh sách Hóa đơn hàng tháng</h2>
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-slate-100"><th className="border p-2">Kỳ</th><th className="border p-2">Tiền phòng</th><th className="border p-2">Điện</th><th className="border p-2">Nước</th><th className="border p-2">Dịch vụ</th><th className="border p-2">Tổng cộng</th><th className="border p-2">Trạng thái</th></tr>
          </thead>
          <tbody>
            {invoices.map((i) => (
              <tr key={i._id}>
                <td className="border p-2">{i.month}/{i.year}</td>
                <td className="border p-2">{i.roomRent.toLocaleString('vi-VN')} đ</td>
                <td className="border p-2">{((i.newElectric - i.oldElectric) * i.electricPrice).toLocaleString('vi-VN')} đ</td>
                <td className="border p-2">{((i.newWater - i.oldWater) * i.waterPrice).toLocaleString('vi-VN')} đ</td>
                <td className="border p-2">{i.serviceFee.toLocaleString('vi-VN')} đ</td>
                <td className="border p-2 font-bold text-red-600">{i.totalAmount.toLocaleString('vi-VN')} đ</td>
                <td className="border p-2">{i.isPaid ? 'Đã thanh toán' : 'Chưa thanh toán'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-white border border-slate-200 p-4 rounded">
        <h2 className="font-bold mb-2">Báo hỏng / Gửi yêu cầu sửa chữa</h2>
        <form onSubmit={submitRepair} className="flex flex-wrap gap-2 mb-4 text-sm">
          <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Tiêu đề (VD: Hỏng vòi nước)" className="border p-1.5 rounded flex-1" />
          <input required value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Mô tả chi tiết..." className="border p-1.5 rounded flex-2" />
          <button type="submit" className="bg-blue-700 text-white px-4 py-1.5 rounded">Gửi yêu cầu</button>
        </form>
        <ul className="text-sm space-y-1">
          {repairs.map((r) => (
            <li key={r._id} className="border-b py-1">🔧 <strong>{r.title}</strong> - {r.description} (<span className="text-blue-700 font-semibold">{r.status}</span>)</li>
          ))}
        </ul>
      </div>
    </div>
  );
};