# Trả lời câu hỏi bổ sung – Buổi 7

## 1. Cấu trúc điều hướng
BookDetail được đăng ký ở Stack ngoài cùng nên khi mở nó phủ lên toàn bộ màn hình, che luôn Tab Bar và tự có nút ← quay lại màn trước (Home vẫn giữ nguyên vị trí cuộn). Nếu đặt BookDetail vào Tab thì nó trở thành một tab riêng: Tab Bar vẫn hiện, xuất hiện thêm một mục tab không mong muốn và không có nút ← vì tab không có lịch sử "quay lại" như Stack.

## 2. Redux
Redux Toolkit dùng Immer: trong reducer, `state` thực chất là một bản nháp (draft). Khi ta gọi `state.items.push(...)`, Immer ghi lại thay đổi rồi tạo ra một state mới bất biến, còn state gốc không bị sửa. Nếu bỏ `useMemo` trong `useCart` thì kết quả hiển thị vẫn đúng, chỉ là tổng số lượng và tổng tiền bị tính lại ở mỗi lần render; giỏ càng lớn càng tốn. `useMemo` chỉ là tối ưu hiệu năng, không quyết định đúng/sai.

## 3. Promise.all
Nếu `getCategories()` lỗi còn `getBooks()` thành công thì `Promise.all` bị reject cả nhóm, nên Home hiện ErrorView dù sách đã tải được. Dùng `Promise.allSettled` thì vẫn hiện được danh sách sách, chỉ thiếu chip danh mục. Đánh đổi là phải tự kiểm tra `status` của từng kết quả và tự xử lý lỗi từng phần (ví dụ báo "không tải được danh mục"), code dài và phức tạp hơn; người dùng cũng có thể không nhận ra một phần dữ liệu bị thiếu.

## 4. Debounce
Nếu đặt `setTimeout` thẳng trong `onChangeText` thì mỗi phím gõ tạo một timer riêng và không timer nào bị huỷ; kết quả là mỗi ký tự vẫn gây một lần lọc (chỉ chậm đi chứ không gộp lại). Hàm dọn dẹp `return () => clearTimeout(t)` huỷ timer cũ mỗi khi `value` đổi, nên chỉ lần gõ cuối cùng được áp dụng. Nó còn tránh lỗi cập nhật state sau khi component đã bị gỡ (unmount) vì timer cũng bị huỷ theo.

## 5. Code bổ sung – sắp xếp giá
Đã thêm vào `src/screens/HomeScreen.tsx`: một state `sort` và chỉnh `visibleBooks`.

```tsx
const [sort, setSort] = useState<"asc" | "desc" | null>(null);

const visibleBooks = useMemo(() => {
  const filtered = filterBooks(books, { keyword: debouncedKeyword, categoryId, priceRange });
  if (sort === null) return filtered;
  return [...filtered].sort((a, b) => (sort === "asc" ? a.price - b.price : b.price - a.price));
}, [books, debouncedKeyword, categoryId, priceRange, sort]);
```
Sắp xếp trên bản sao `[...filtered]` để không làm thay đổi mảng gốc. Hai nút "Giá tăng ↑ / Giá giảm ↓" nằm dưới bộ lọc giá, bấm lần nữa để bỏ sắp xếp.

## Thử thách C1 – vì sao đổi thư viện state thì UI không phải sửa?
Giao diện chỉ gọi `useWishlist()` (trả về `ids`, `isFavorite`, `toggle`) chứ không biết gì về Redux, `dispatch` hay `useSelector`. Toàn bộ chi tiết Redux nằm trong `store/hooks.ts` (adapter). Sau này đổi sang Zustand/Recoil chỉ cần viết lại bên trong các hook đó, giữ nguyên chữ ký hàm, nên các màn hình không phải sửa dòng nào.
