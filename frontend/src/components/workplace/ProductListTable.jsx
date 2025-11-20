import React, { useRef } from "react";
import { useNavigate } from "react-router-dom";
import ProductActionMenu from "./ProductActionMenu";
import "../../pages/dashboard/workplace.css";

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
            >
              <div className="sortable-header-content">
                <span className="sortable-header-label">등록일</span>
                <span
                  className={`sort-icons-container ${
                    sortField === "registered_date" ? "active" : "inactive"
                  }`}
                >
                  <span
                    className={`sort-icon-asc ${
                      sortField === "registered_date" && sortDirection === "asc" ? "active" : ""
                    }`}
                  >
                    ▲
                  </span>
                  <span
                    className={`sort-icon-desc ${
                      sortField === "registered_date" && sortDirection === "desc" ? "active" : ""
                    }`}
                  >
                    ▼
                  </span>
                </span>
              </div>
            </th>
            <th className="text-center">제품명</th>
            <th className="text-center">브랜드</th>
            <th className="text-center">카테고리</th>
            <th className="action-column"></th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan="6" className="table-empty-cell">
                로딩 중...
              </td>
            </tr>
          ) : workplaceData.length === 0 ? (
            <tr>
              <td colSpan="6" className="table-empty-cell">
                <div className="empty-state-container">
                  <p className="empty-state-text-primary">
                    등록된 제품이 없습니다.
                  </p>
                  <p className="empty-state-text-secondary">
                    제품을 추가하여 분석을 시작하세요.
                  </p>
                </div>
              </td>
            </tr>
          ) : (
            workplaceData.map((item, index) => (
              <tr
                key={item.product_id}
                className="clickable"
                onClick={() => {
                  navigate(`/dashboard?productId=${item.product_id}`);
                }}
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
                <td className="text-center">{formatDate(item)}</td>
                <td className="product-cell">
                  <span
                    className={item.has_dashboard_error === 1 ? "product-name-error" : ""}
                  >
                    {item.has_dashboard_error === 1 && (
                      <svg
                        className="warning-icon"
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                        <line x1="12" y1="9" x2="12" y2="13"></line>
                        <line x1="12" y1="17" x2="12.01" y2="17"></line>
                      </svg>
                    )}
                    {item.product_name || "-"}
                  </span>
                </td>
                <td className="text-center">
                  {item.brand && item.brand.trim() !== "" ? item.brand : "-"}
                </td>
                <td className="text-center">{getCategoryName(item.category_id)}</td>
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

