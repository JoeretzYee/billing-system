import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Select from "react-select";

function ViewExpensesModal({ isOpen, onClose, waybillNos }) {
  const navigate = useNavigate();
  const [selectedWaybillNo, setSelectedWaybillNo] = useState("");
  const [waybillSearch, setWaybillSearch] = useState("");

  // Filter waybillNos based on search input
  const filteredWaybillNos = waybillNos.filter((waybill) =>
    waybill.toString().includes(waybillSearch)
  );

  // Navigate to View Expenses
  const navigateToViewExpenses = () => {
    if (selectedWaybillNo) {
      navigate("/view-expense", {
        state: { waybillNo: selectedWaybillNo }, // Pass the selected waybillNo via state
      });
    } else {
      alert("Please select a Waybill No.");
    }
  };

  if (!isOpen) return null; // Don't render if modal is not open

  return (
    <div
      className="modal fade show"
      tabIndex="-1"
      style={{ display: "block", backgroundColor: "rgba(0, 0, 0, 0.5)" }}
    >
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">View Expenses</h5>
            <button
              type="button"
              className="btn-close"
              onClick={onClose} // Call parent-provided onClose handler
            ></button>
          </div>
          <div className="modal-body">
            <div className="form-group">
              <label htmlFor="waybillNo">Select Waybill No</label>
              <Select
                id="waybillNo"
                options={filteredWaybillNos.map((waybill) => ({
                  value: waybill,
                  label: waybill,
                }))}
                value={
                  selectedWaybillNo
                    ? { value: selectedWaybillNo, label: selectedWaybillNo }
                    : null
                }
                onChange={(selectedOption) =>
                  setSelectedWaybillNo(
                    selectedOption ? selectedOption.value : ""
                  )
                }
                placeholder="Search or Select Waybill No"
                isSearchable
              />
            </div>

            <button
              className="btn btn-primary mt-3"
              onClick={navigateToViewExpenses}
            >
              Go to View Expenses
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ViewExpensesModal;
