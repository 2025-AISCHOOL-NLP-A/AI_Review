import React, { useState } from "react";

export default function ProductInfoForm({ onNext, onClose }) {
  const [form, setForm] = useState({
    category: "",
    productName: "",
    brand: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Category와 Product Name은 필수 필드
  const isFormValid = form.category.trim() !== "" && form.productName.trim() !== "";

  const handleNext = () => {
    // 중복 클릭 방지
    if (isSubmitting || !isFormValid) {
      return;
    }

    setIsSubmitting(true);
    // onNext 호출 (모달이 닫히면 컴포넌트가 언마운트되므로 상태 리셋 불필요)
    onNext(form);
    // 모달이 닫히면 컴포넌트가 언마운트되므로 명시적인 리셋은 필요 없음
    // 만약 모달이 닫히지 않는 경우를 대비해 약간의 지연 후 리셋
    setTimeout(() => {
      setIsSubmitting(false);
    }, 500);
  };

  return (
    <>
      <h2>Product Information</h2>
      <p>Please enter the basic information of the product to be analyzed.</p>

      <div className="form-group">
        <label>
          Category <span className="required">*</span>
        </label>
        <select
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
        <button
          className="next"
          disabled={!isFormValid || isSubmitting}
          onClick={handleNext}
        >
          {isSubmitting ? "처리 중..." : "Next"}
        </button>
      </div>
    </>
  );
}

