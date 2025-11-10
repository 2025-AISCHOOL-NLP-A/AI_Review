import React, { useState } from "react";

export default function ProductInfoForm({ onNext, onClose }) {
  const [form, setForm] = useState({
    category: "",
    productName: "",
    brand: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Category와 Product Name은 필수 필드
  const isFormValid = form.category.trim() !== "" && form.productName.trim() !== "";

  const handleNext = () => {
    if (isFormValid) {
      onNext(form);
    }
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
          <option value="화장품">화장품</option>
          <option value="전자기기">전자기기</option>
          <option value="게임">게임</option>
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
        <button className="cancel" onClick={onClose}>
          Cancel
        </button>
        <button
          className="next"
          disabled={!isFormValid}
          onClick={handleNext}
        >
          Next
        </button>
      </div>
    </>
  );
}

