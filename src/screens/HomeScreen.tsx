import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Header } from "../components/Header";
import { SearchBar } from "../components/SearchBar";
import { CategoryChips } from "../components/CategoryChips";
import { PriceFilter } from "../components/PriceFilter";
import { BookGrid } from "../components/BookGrid";
import { FloatingCartButton } from "../components/FloatingCartButton";
import { EmptyState } from "../components/EmptyState";
import { LoadingView } from "../components/LoadingView";
import { ErrorView } from "../components/ErrorView";
import { getBooks } from "../services/bookService";
import { getCategories } from "../services/categoryService";
import { getErrorMessage } from "../api/client";
import { useDebounce } from "../hooks/useDebounce";
import { filterBooks, PriceRange } from "../utils/filters";
import { useCart } from "../store/hooks";
import { TabScreenProps } from "../navigation/types";
import { Book, Category } from "../types";
import { colors, radius } from "../theme";

type SortOrder = "asc" | "desc" | null;

export function HomeScreen({ navigation, route }: TabScreenProps<"Home">) {
  const { totalQuantity } = useCart(); // BT7.3d

  // BT7.5b: dữ liệu từ API
  const [books, setBooks] = useState<Book[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // hai API độc lập → chạy song song
      const [b, c] = await Promise.all([getBooks(), getCategories()]);
      setBooks(b);
      setCategories(c);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const [searchOpen, setSearchOpen] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [priceRange, setPriceRange] = useState<PriceRange>(null);
  const [sort, setSort] = useState<SortOrder>(null); // Câu 5: sắp xếp theo giá

  // BT7.7a: chỉ lọc sau khi ngừng gõ 400ms
  const debouncedKeyword = useDebounce(keyword, 400);

  // BT7.7c + câu 5: lọc kết hợp rồi sắp xếp trên bản sao
  const visibleBooks = useMemo(() => {
    const filtered = filterBooks(books, { keyword: debouncedKeyword, categoryId, priceRange });
    if (sort === null) return filtered;
    return [...filtered].sort((a, b) => (sort === "asc" ? a.price - b.price : b.price - a.price));
  }, [books, debouncedKeyword, categoryId, priceRange, sort]);

  // BT7.8b: nhận categoryId từ tab Danh mục rồi xoá params để không áp dụng lại
  const paramCategoryId = route.params?.categoryId;
  useEffect(() => {
    if (paramCategoryId !== undefined) {
      setCategoryId(paramCategoryId);
      navigation.setParams({ categoryId: undefined });
    }
  }, [paramCategoryId, navigation]);

  // BT7.7d/e
  const hasFilter = keyword !== "" || categoryId !== null || priceRange !== null;
  const clearFilters = () => {
    setKeyword("");
    setCategoryId(null);
    setPriceRange(null);
  };

  const toggleSort = (order: Exclude<SortOrder, null>) => setSort((s) => (s === order ? null : order));

  return (
    <View style={styles.container}>
      <Header title="📚 BookStore" onSearchPress={() => setSearchOpen((v) => !v)} />
      {searchOpen && (
        <SearchBar
          value={keyword}
          onChangeText={setKeyword}
          onClose={() => {
            setSearchOpen(false);
            setKeyword("");
          }}
        />
      )}
      {/* BT7.5c: 3 trạng thái */}
      {loading ? (
        <LoadingView label="Đang tải sách..." />
      ) : error ? (
        <ErrorView message={error} onRetry={load} />
      ) : (
        <BookGrid
          data={visibleBooks}
          onPressBook={(b) => navigation.navigate("BookDetail", { bookId: b.id })} // BT7.2a
          ListHeaderComponent={
            <View>
              <CategoryChips categories={categories} selectedId={categoryId} onSelect={setCategoryId} />
              <PriceFilter value={priceRange} onChange={setPriceRange} />
              <View style={styles.toolRow}>
                <Pressable style={[styles.sortBtn, sort === "asc" && styles.sortBtnActive]} onPress={() => toggleSort("asc")}>
                  <Text style={[styles.sortText, sort === "asc" && styles.sortTextActive]}>Giá tăng ↑</Text>
                </Pressable>
                <Pressable style={[styles.sortBtn, sort === "desc" && styles.sortBtnActive]} onPress={() => toggleSort("desc")}>
                  <Text style={[styles.sortText, sort === "desc" && styles.sortTextActive]}>Giá giảm ↓</Text>
                </Pressable>
                {hasFilter && (
                  <Pressable onPress={clearFilters} hitSlop={8} style={styles.clearBtn}>
                    <Text style={styles.clearText}>✕ Xóa bộ lọc</Text>
                  </Pressable>
                )}
              </View>
            </View>
          }
          ListEmptyComponent={
            <EmptyState
              emoji="🔎"
              title="Không tìm thấy sách phù hợp"
              message="Hãy thử từ khoá khác hoặc bỏ bớt bộ lọc."
              actionLabel="Xóa bộ lọc"
              onAction={clearFilters}
            />
          }
        />
      )}
      <FloatingCartButton count={totalQuantity} onPress={() => navigation.navigate("Cart")} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  toolRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, paddingBottom: 8 },
  sortBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.pill, backgroundColor: "#fff", borderWidth: 1, borderColor: colors.line },
  sortBtnActive: { backgroundColor: colors.cyan, borderColor: colors.cyan },
  sortText: { color: colors.text, fontWeight: "600", fontSize: 13 },
  sortTextActive: { color: "#fff" },
  clearBtn: { marginLeft: "auto" },
  clearText: { color: colors.indigo, fontWeight: "800" },
});
