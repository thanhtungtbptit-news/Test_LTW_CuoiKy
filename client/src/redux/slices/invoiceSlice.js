import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

export const submitBulkInvoices = createAsyncThunk(
  'invoices/submitBulk',
  async (payload, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('[https://test-ltw-cuoiky.onrender.com/api/invoices/bulk](https://test-ltw-cuoiky.onrender.com/api/invoices/bulk)', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: 'Lỗi kết nối server' });
    }
  }
);

const invoiceSlice = createSlice({
  name: 'invoices',
  initialState: {
    draftRows: [],      // Danh sách dòng nhập chỉ số của tất cả phòng đang thuê
    rowErrors: {},      // Lưu lỗi theo roomId: { [roomId]: "Chỉ số điện mới nhỏ hơn số cũ" }
    loading: false,
    successMessage: null
  },
  reducers: {
    initDraftRows: (state, action) => {
      // Khởi tạo bảng từ danh sách phòng đang có người thuê
      state.draftRows = action.payload.map((room) => ({
        roomId: room._id,
        roomNumber: room.roomNumber,
        tenantName: room.currentTenantName || 'Đang thuê',
        monthlyRent: room.price,
        electricPrice: 3800,
        waterPrice: 25000,
        serviceFee: 120000,
        oldElectric: room.lastElectricIndex || 0,
        newElectric: room.lastElectricIndex || 0,
        oldWater: room.lastWaterIndex || 0,
        newWater: room.lastWaterIndex || 0
      }));
      state.rowErrors = {};
      state.successMessage = null;
    },
    updateDraftRow: (state, action) => {
      const { roomId, field, value } = action.payload;
      state.draftRows = state.draftRows.map((row) =>
        row.roomId === roomId ? { ...row, [field]: Number(value) } : row
      );

      // Kiểm tra từng dòng ngay khi gõ và hiển thị lỗi tại dòng sai
      const updatedRow = state.draftRows.find((r) => r.roomId === roomId);
      if (updatedRow) {
        if (updatedRow.newElectric < updatedRow.oldElectric) {
          state.rowErrors = {
            ...state.rowErrors,
            [roomId]: 'Số điện mới không được nhỏ hơn số điện cũ!'
          };
        } else if (updatedRow.newWater < updatedRow.oldWater) {
          state.rowErrors = {
            ...state.rowErrors,
            [roomId]: 'Số nước mới không được nhỏ hơn số nước cũ!'
          };
        } else {
          const { [roomId]: removed, ...restErrors } = state.rowErrors;
          state.rowErrors = restErrors;
        }
      }
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(submitBulkInvoices.pending, (state) => {
        state.loading = true;
        state.successMessage = null;
      })
      .addCase(submitBulkInvoices.fulfilled, (state, action) => {
        state.loading = false;
        state.successMessage = action.payload.message;
        state.rowErrors = {};
      })
      .addCase(submitBulkInvoices.rejected, (state, action) => {
        state.loading = false;
        if (action.payload?.errors) {
          const serverErrMap = {};
          action.payload.errors.forEach((e) => {
            serverErrMap[e.roomId] = e.message;
          });
          state.rowErrors = serverErrMap;
        }
      });
  }
});

export const { initDraftRows, updateDraftRow } = invoiceSlice.actions;
export default invoiceSlice.reducer;