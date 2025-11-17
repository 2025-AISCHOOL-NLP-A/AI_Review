import React, { useRef } from "react";
import { useNavigate } from "react-router-dom";
import ProductActionMenu from "./ProductActionMenu";

/**
 * 제품 목록 테이블 컴포넌트
 */
export default function ProductListTable({
  workplaceData,
  loading,
  selectedProducts,
  onSelectAll,
  onSelectItem,
  sortField,
  sortDirection,
  onSort,
  formatDate,
  getCategoryName,
  openMenuIndex,
  onMenuToggle,
  dropdownPosition,
  menuRefs,
  onEdit,
  onAddReview,
  onDelete,
}) {
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  return (
    <div className="workplace-table-container">
      <table className="workplace-table">
        <thead>
          <tr>
            <th className="checkbox-column">
              <input
                type="checkbox"
                id="workplace_select_all"
                name="select_all"
                checked={
                  workplaceData.length > 0 &&
                  selectedProducts.length === workplaceData.length
                }
                onChange={onSelectAll}
                disabled={loading || workplaceData.length === 0}
              />
            </th>
            <th
              className="sortable-header"
              onClick={() => onSort("registered_date")}
              style={{ cursor: "pointer", userSelect: "none", textAlign: "center" }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                }}
              >
                <span style={{ flex: 1, textAlign: "center" }}>등록일</span>
                <span
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "2px",
                    fontSize: "0.7rem",
                    alignItems: "center",
                    color: sortField === "registered_date" ? "#5B8EFF" : "#9CA3AF",
                    marginLeft: "auto",
                  }}
                >
                  <span
                    style={{
                      opacity: sortField === "registered_date" && sortDirection === "asc" ? 1 : 0.3,
                    }}
                  >
                    ▲
                  </span>
                  <span
                    style={{
                      opacity: sortField === "registered_date" && sortDirection === "desc" ? 1 : 0.3,
                    }}
                  >
                    ▼
                  </span>
                </span>
              </div>
            </th>
            <th style={{ textAlign: "center" }}>제품명</th>
            <th style={{ textAlign: "center" }}>브랜드</th>
            <th style={{ textAlign: "center" }}>카테고리</th>
            <th className="action-column"></th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan="6" style={{ textAlign: "center", padding: "2rem" }}>
                로딩 중...
              </td>
            </tr>
          ) : workplaceData.length === 0 ? (
            <tr>
              <td colSpan="6" style={{ textAlign: "center", padding: "2rem" }}>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <p style={{ margin: 0, fontSize: "1rem", color: "#6b7280" }}>
                    등록된 제품이 없습니다.
                  </p>
                  <p style={{ margin: 0, fontSize: "0.875rem", color: "#9ca3af" }}>
                    제품을 추가하여 분석을 시작하세요.
                  </p>
                </div>
              </td>
            </tr>
          ) : (
            workplaceData.map((item, index) => (
              <tr
                key={item.product_id}
                onClick={() => {
                  navigate(`/dashboard?productId=${item.product_id}`);
                }}
                style={{ cursor: "pointer" }}
              >
                <td className="checkbox-column" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    id={`workplace_product_${item.product_id}`}
                    name={`product_${item.product_id}`}
                    checked={selectedProducts.includes(item.product_id)}
                    onChange={(e) => {
                      e.stopPropagation();
                      onSelectItem(item.product_id);
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                </td>
                <td style={{ textAlign: "center" }}>{formatDate(item)}</td>
                <td className="product-cell" style={{ textAlign: "center" }}>
                  {item.product_name || "-"}
                </td>
                <td style={{ textAlign: "center" }}>
                  {item.brand && item.brand.trim() !== "" ? item.brand : "-"}
                </td>
                <td style={{ textAlign: "center" }}>{getCategoryName(item.category_id)}</td>
                <td className="action-column" onClick={(e) => e.stopPropagation()}>
                  <div
                    className="meatballs-menu"
                    ref={(el) => {
                      if (el) {
                        menuRefs.current[index] = el;
                      } else {
                        delete menuRefs.current[index];
                      }
                    }}
                  >
                    <button
                      className="meatballs-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        onMenuToggle(index);
                      }}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <circle cx="12" cy="12" r="1"></circle>
                        <circle cx="12" cy="5" r="1"></circle>
                        <circle cx="12" cy="19" r="1"></circle>
                      </svg>
                    </button>

                    {openMenuIndex === index && (
                      <ProductActionMenu
                        isOpen={true}
                        onEdit={() => onEdit(item)}
                        onAddReview={() => onAddReview(item)}
                        onDelete={() => onDelete(item.product_id)}
                        position={dropdownPosition}
                        onClose={() => onMenuToggle(null)}
                      />
                    )}
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

