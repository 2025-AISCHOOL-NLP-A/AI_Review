import React, { useState, useEffect } from "react";
import { sanitizeInput } from "../../utils/format/inputSanitizer";

export default function ProductInfoForm({ onNext, onClose, initialData, onSave, isEditMode = false }) {
  const [form, setForm] = useState({
    category: "",
    productName: "",
    brand: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 수정 모드일 때 initialData로 폼 초기화
  useEffect(() => {
    if (isEditMode && initialData) {
      setForm({
        category: String(initialData.category_id || ""),
        productName: initialData.product_name || "",
        brand: initialData.brand || "",
      });
    }
  }, [isEditMode, initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let sanitizedValue = value;

    // 입력 필드별 sanitization (입력 중에는 스페이스바 허용을 위해 trim 비활성화)
    if (name === "productName") {
      // 제품명: HTML 제거, 최대 200자, 입력 중에는 trim 비활성화
      sanitizedValue = sanitizeInput(value, { type: 'text', maxLength: 200, trim: false });
    } else if (name === "brand") {
      // 브랜드: HTML 제거, 최대 100자, 입력 중에는 trim 비활성화
      sanitizedValue = sanitizeInput(value, { type: 'text', maxLength: 100, trim: false });
    }
    // category는 select이므로 sanitization 불필요

    setForm({ ...form, [name]: sanitizedValue });
  };

  // Category와 Product Name은 필수 필드
  const isFormValid = form.category.trim() !== "" && form.productName.trim() !== "";

  const handleNext = () => {
    // 중복 클릭 방지
    if (isSubmitting || !isFormValid) {
      return;
    }

    setIsSubmitting(true);
    
    // 제출 전 최종 sanitization
    const sanitizedForm = {
      ...form,
      productName: sanitizeInput(form.productName, { type: 'text', maxLength: 200 }),
      brand: form.brand ? sanitizeInput(form.brand, { type: 'text', maxLength: 100 }) : "",
    };
    
    // onNext 호출 (모달이 닫히면 컴포넌트가 언마운트되므로 상태 리셋 불필요)
    onNext(sanitizedForm);
    // 모달이 닫히면 컴포넌트가 언마운트되므로 명시적인 리셋은 필요 없음
    // 만약 모달이 닫히지 않는 경우를 대비해 약간의 지연 후 리셋
    setTimeout(() => {
      setIsSubmitting(false);
    }, 500);
  };

  const handleSave = () => {
    // 중복 클릭 방지
    if (isSubmitting || !isFormValid) {
      return;
    }

    setIsSubmitting(true);
    
    // 제출 전 최종 sanitization
    const sanitizedForm = {
      ...form,
      productName: sanitizeInput(form.productName, { type: 'text', maxLength: 200 }),
      brand: form.brand ? sanitizeInput(form.brand, { type: 'text', maxLength: 100 }) : "",
    };
    
    // onSave 호출 (수정 모드)
    if (onSave) {
      onSave(sanitizedForm);
    }
    setTimeout(() => {
      setIsSubmitting(false);
    }, 500);
  };

  return (
    <>
      <h2>Product Information</h2>
      <p>{isEditMode ? "Please update the product information." : "Please enter the basic information of the product to be analyzed."}</p>

      <div className="form-group">
        <label>
          Category <span className="required">*</span>
        </label>
        <select
          id="product_category"
          name="category"
          value={form.category}
          onChange={handleChange}
        >
          <option value="">Select Category</option>
          <option value="102">화장품</option>
          <option value="101">전자기기</option>
          <option value="103">게임</option>
        </select>
      </div>

      <div className="form-group">
        <label>
          Product Name <span className="required">*</span>
        </label>
        <input
          type="text"
          id="product_name"
          name="productName"
          value={form.productName}
          onChange={handleChange}
          placeholder="Input"
        />
      </div>

      <div className="form-group">
        <label>Brand</label>
        <input
          type="text"
          id="product_brand"
          name="brand"
          value={form.brand}
          onChange={handleChange}
          placeholder="Input"
        />
      </div>

      <div className="button-row">
        <button 
          className="cancel" 
          onClick={onClose}
          disabled={isSubmitting}
        >
          Cancel
        </button>
        {isEditMode ? (
          <button
            className="next"
            disabled={!isFormValid || isSubmitting}
            onClick={handleSave}
          >
            {isSubmitting ? "처리 중..." : "Save"}
          </button>
        ) : (
          <button
            className="next"
            disabled={!isFormValid || isSubmitting}
            onClick={handleNext}
          >
            {isSubmitting ? "처리 중..." : "Next"}
          </button>
        )}
      </div>
    </>
  );
}

