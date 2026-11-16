import React, { useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { updateDraftRow, submitBulkInvoices } from '../../redux/slices/invoiceSlice';

const UtilityBulkTable = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { draftRows, rowErrors, loading } = useSelector((state) => state.invoices);

  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  // Dùng useMemo tính tổng tiền dự kiến của toàn bộ dãy trọ trong tháng
  const estimatedTotalAllRooms = useMemo(() => {
    return draftRows.reduce((sum, row) => {
      const eUsed = Math.max(0, row.newElectric - row.oldElectric);
      const wUsed = Math.max(0, row.newWater - row.oldWater);
      const rowTotal =
        row.monthlyRent + eUsed * row.electricPrice + wUsed * row.waterPrice + row.serviceFee;
      return sum + rowTotal;
    }, 0);
  }, [draftRows]);

  const handleInputChange = (roomId, field, value) => {
    dispatch(updateDraftRow({ roomId, field, value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (Object.keys(rowErrors).length > 0) {
      alert('Vui lòng sửa các dòng báo đỏ trước khi phát hành hóa đơn!');
      return;
    }

    const resultAction = await dispatch(
      submitBulkInvoices({
        month,
        year,
        records: draftRows
      })
    );

    if (submitBulkInvoices.fulfilled.match(resultAction)) {
      // Dùng useNavigate chuyển sang trang Dashboard sau khi lưu thành công
      navigate('/landlord/dashboard');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-md p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4 pb-3 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div>
            <label htmlFor="invoice-month" className="block text-xs font-medium text-slate-600">
              Kỳ thu tháng
            </label>
            <input
              id="invoice-month"
              type="number"
              min="1"
              max="12"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="border border-slate-300 rounded px-2.5 py-1 text-sm w-20"
            />
          </div>
          <div>
            <label htmlFor="invoice-year" className="block text-xs font-medium text-slate-600">
              Năm
            </label>
            <input
              id="invoice-year"
              type="number"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="border border-slate-300 rounded px-2.5 py-1 text-sm w-24"
            />
          </div>
        </div>

        <div className="text-right">
          <span className="text-xs text-slate-500 block">Tổng thu dự kiến kỳ này:</span>
          <strong className="text-lg text-blue-700">
            {estimatedTotalAllRooms.toLocaleString('vi-VN')} đ
          </strong>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left border-collapse">
          <thead>
            <tr className="bg-slate-100 text-slate-700 border-b border-slate-300">
              <th className="p-2.5 border">Phòng</th>
              <th className="p-2.5 border">Điện cũ (kWh)</th>
              <th className="p-2.5 border">Điện mới (kWh)</th>
              <th className="p-2.5 border">Nước cũ (m³)</th>
              <th className="p-2.5 border">Nước mới (m³)</th>
              <th className="p-2.5 border text-right">Tạm tính (VNĐ)</th>
            </tr>
          </thead>
          <tbody>
            {draftRows.map((row) => {
              const errorMsg = rowErrors[row.roomId];
              const eUsed = Math.max(0, row.newElectric - row.oldElectric);
              const wUsed = Math.max(0, row.newWater - row.oldWater);
              const provisionalTotal =
                row.monthlyRent + eUsed * row.electricPrice + wUsed * row.waterPrice + row.serviceFee;

              return (
                <React.Fragment key={row.roomId}>
                  <tr className={errorMsg ? 'bg-red-50' : 'hover:bg-slate-50'}>
                    <td className="p-2.5 border font-semibold text-slate-800">
                      {row.roomNumber}
                    </td>
                    <td className="p-2.5 border text-slate-600">{row.oldElectric}</td>
                    <td className="p-2.5 border">
                      <input
                        type="number"
                        aria-label={`Điện mới ${row.roomNumber}`}
                        value={row.newElectric}
                        onChange={(e) => handleInputChange(row.roomId, 'newElectric', e.target.value)}
                        className={`w-24 px-2 py-1 border rounded ${
                          errorMsg ? 'border-red-500 bg-white' : 'border-slate-300'
                        }`}
                      />
                    </td>
                    <td className="p-2.5 border text-slate-600">{row.oldWater}</td>
                    <td className="p-2.5 border">
                      <input
                        type="number"
                        aria-label={`Nước mới ${row.roomNumber}`}
                        value={row.newWater}
                        onChange={(e) => handleInputChange(row.roomId, 'newWater', e.target.value)}
                        className={`w-24 px-2 py-1 border rounded ${
                          errorMsg ? 'border-red-500 bg-white' : 'border-slate-300'
                        }`}
                      />
                    </td>
                    <td className="p-2.5 border text-right font-medium text-slate-800">
                      {provisionalTotal.toLocaleString('vi-VN')} đ
                    </td>
                  </tr>
                  {errorMsg && (
                    <tr className="bg-red-50">
                      <td colSpan="6" className="px-3 py-1.5 text-xs font-medium text-red-600 border">
                        ⚠ Lỗi tại phòng {row.roomNumber}: {errorMsg}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex justify-end">
        <button
          type="submit"
          disabled={loading || Object.keys(rowErrors).length > 0}
          className="bg-blue-700 hover:bg-blue-800 disabled:bg-slate-400 text-white font-medium px-5 py-2 rounded text-sm"
        >
          {loading ? 'Đang xử lý...' : 'Chốt sổ & Phát hành hóa đơn'}
        </button>
      </div>
    </form>
  );
};

export default UtilityBulkTable;