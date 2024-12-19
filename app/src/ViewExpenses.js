import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { addDoc, collection, db, getDocs, query, where } from "./firebase";

function ViewExpense() {
  const location = useLocation();
  const navigate = useNavigate();
  const { waybillNo } = location.state || {}; // Retrieve waybillNo from state
  const [details, setDetails] = useState([]);
  const [profitData, setProfitData] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [referralFee, setReferralFee] = useState(0);
  const [taxes, setTaxes] = useState({ bir: 0, serviceTax: 0 });
  const [variableExpenses, setVariableExpenses] = useState([
    { name: "Gas", amount: 0 },
    { name: "Salary", amount: 0 },
    { name: "Trucking", amount: 0 },
    { name: "Freight", amount: 0 },
    { name: "Tip/Facilitation", amount: 0 },
    { name: "Meals", amount: 0 },
  ]);

  const getTrueModes = (modeObject) => {
    if (modeObject && typeof modeObject === "object") {
      return Object.entries(modeObject)
        .filter(([key, value]) => value === true)
        .map(([key]) => key)
        .join(", ");
    }
    return "";
  };

  const calculateTotalCharges = (charges, others, rows) => {
    let total = 0;

    if (charges) {
      total += parseFloat(charges.documentation || 0);
      if (charges.freight && rows && rows[0].volume) {
        total += parseFloat(charges.freight) * parseFloat(rows[0].volume); // Multiply freight by volume
      } else {
        total += parseFloat(charges.freight || 0);
      }

      total += parseFloat(charges.handling || 0);
      total += parseFloat(charges.valuation || 0);
    }

    if (others) {
      total += others.reduce(
        (sum, other) => sum + parseFloat(other.amount || 0),
        0
      );
    }

    return total;
  };

  const handleAddExpense = () => {
    setVariableExpenses([...variableExpenses, { name: "", amount: 0 }]);
  };

  const handleExpenseChange = (index, field, value) => {
    const updatedExpenses = [...variableExpenses];
    updatedExpenses[index][field] = value;
    setVariableExpenses(updatedExpenses);
  };

  const handleCalculateProfit = async () => {
    const totalCharges = details.reduce((acc, detail) => {
      return (
        acc + calculateTotalCharges(detail.charges, detail.others, detail.rows)
      );
    }, 0);

    const totalExpenses = variableExpenses.reduce(
      (acc, exp) => acc + parseFloat(exp.amount || 0),
      0
    );

    const totalTaxes =
      ((parseFloat(taxes.bir) + parseFloat(taxes.serviceTax)) / 100) *
      totalCharges;

    const profit =
      totalCharges - (totalExpenses + totalTaxes + parseFloat(referralFee));

    console.log("Calculated Profit:", profit);
    try {
      // Save the profit and inputs to the Firebase 'profit' collection
      const profitData = {
        waybillNo: waybillNo || "Unknown", // Ensure waybillNo is included
        totalCharges,
        totalExpenses,
        totalTaxes,
        referralFee: parseFloat(referralFee),
        profit,
        variableExpenses, // Save the array of expenses
        timestamp: new Date().toISOString(), // Add a timestamp for reference
      };

      const profitRef = collection(db, "profit");
      await addDoc(profitRef, profitData);

      alert("Profit data saved successfully!");
      setShowModal(false); // Close the modal after saving
    } catch (error) {
      console.error("Error saving profit data:", error);
      alert("Failed to save profit data. Please try again.");
    }
  };

  useEffect(() => {
    const fetchDetails = async () => {
      if (!waybillNo) return;

      const detailsRef = collection(db, "details_form");
      const q = query(detailsRef, where("waybillNo", "==", waybillNo));

      try {
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setDetails(data);
      } catch (e) {
        console.error("Error fetching documents: ", e);
      }
    };

    fetchDetails();
  }, [waybillNo]);

  useEffect(() => {
    const fetchProfitData = async () => {
      try {
        const profitRef = collection(db, "profit");
        const querySnapshot = await getDocs(profitRef);
        const data = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setProfitData(data);
      } catch (error) {
        console.error("Error fetching profit data:", error);
      }
    };

    fetchProfitData();
  }, []);

  const renderCharges = (charges) => {
    return Object.entries(charges).map(([key, value], idx) => {
      if (typeof value === "object") {
        return (
          <div key={idx}>
            {key}:{" "}
            <div style={{ marginLeft: "20px" }}>{renderCharges(value)}</div>
          </div>
        );
      } else {
        return (
          <div key={idx}>
            {key}: {value !== undefined ? value : "N/A"}
          </div>
        );
      }
    });
  };

  return (
    <div className="container">
      <br />
      <div className="d-flex align-items-center justify-content-between">
        <h1>Waybill No: {waybillNo}</h1>
        <button
          className="btn btn-md btn-primary"
          onClick={() => setShowModal(true)}
        >
          Calculate Profit
        </button>
      </div>

      <table className="table table-bordered">
        <thead>
          <tr>
            <th>Waybill No</th>
            <th>Shipper Name</th>
            <th>Charges</th>
            <th>Mode of Transport</th>
            <th>Mode of Service</th>
            <th>Others</th>
            <th>Name of Consignee, Origin, Destination</th>
            <th>Quantity, Description, Volume</th>
            <th>Volume</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {details.map((detail, index) => {
            const totalCharges = calculateTotalCharges(
              detail.charges,
              detail.others,
              detail.rows
            );
            return (
              <tr key={index}>
                <td>{detail.waybillNo}</td>
                <td>{detail.shipperName}</td>
                <td>
                  {detail.charges &&
                    Object.entries(detail.charges).map(([key, value], idx) => (
                      <div key={idx}>
                        {key}: {value}
                      </div>
                    ))}
                </td>
                <td>{getTrueModes(detail.modeOfTransport)}</td>
                <td>{getTrueModes(detail.modeOfService)}</td>
                <td>
                  {detail.others &&
                    detail.others.map((other, idx) => (
                      <div key={idx}>
                        {other.amount} - {other.description}
                      </div>
                    ))}
                </td>
                <td>
                  {detail.shipmentDetails
                    ? `Consignee: ${detail.shipmentDetails.consigneeName}, ${detail.shipmentDetails.origin} to ${detail.shipmentDetails.destination}`
                    : ""}
                </td>
                <td>
                  {detail.rows &&
                    detail.rows.map((row, idx) => (
                      <div key={idx}>
                        {row.description}: {row.quantity}
                      </div>
                    ))}
                </td>
                <td>
                  {detail.rows &&
                    detail.rows.map((row, idx) => (
                      <div key={idx}>{row.volume}</div>
                    ))}
                </td>
                <td>{totalCharges.toLocaleString()}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="row">
        {/* <h2>Profit Data</h2> */}
        {profitData.length > 0 ? (
          <ul className="list-group">
            {profitData.map((profit, index) => (
              <li className="list-group-item" key={profit.id}>
                <strong>Total Charges:</strong>{" "}
                {profit.totalCharges.toLocaleString()} <br />
                <strong>Total Expenses:</strong>{" "}
                {profit.totalExpenses.toLocaleString()} <br />
                <strong>Total Taxes:</strong>{" "}
                {profit.totalTaxes.toLocaleString()} <br />
                <strong>Referral Fee:</strong>{" "}
                {profit.referralFee.toLocaleString()} <br />
                <strong>Profit:</strong> {profit.profit.toLocaleString()} <br />
                <strong>Variable Expenses:</strong>
                <ul className="list-group list-group-flush">
                  {profit.variableExpenses.map((expense, idx) => (
                    <li
                      key={idx}
                      className="list-group-item d-flex justify-content-between"
                    >
                      <span>{expense.name}</span>
                      <span>{expense.amount.toLocaleString()}</span>
                    </li>
                  ))}
                </ul>
                {/* <small className="text-muted">
                  <strong>Timestamp:</strong>{" "}
                  {new Date(profit.timestamp).toLocaleString()}
                </small> */}
              </li>
            ))}
          </ul>
        ) : (
          <p>No profit data available.</p>
        )}
      </div>
      <br />

      {showModal && (
        <div className="modal" style={{ display: "block" }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Calculate Profit</h5>
                <button className="close" onClick={() => setShowModal(false)}>
                  <span>&times;</span>
                </button>
              </div>
              <div className="modal-body">
                <div>
                  <label>Referral Fee</label>
                  <input
                    type="number"
                    value={referralFee}
                    onChange={(e) => setReferralFee(e.target.value)}
                    className="form-control"
                  />
                </div>
                <div>
                  <label>BIR Tax</label>
                  <input
                    type="number"
                    value={taxes.bir}
                    onChange={(e) =>
                      setTaxes({ ...taxes, bir: e.target.value })
                    }
                    className="form-control"
                  />
                </div>
                <div>
                  <label>Service Tax</label>
                  <input
                    type="number"
                    value={taxes.serviceTax}
                    onChange={(e) =>
                      setTaxes({ ...taxes, serviceTax: e.target.value })
                    }
                    className="form-control"
                  />
                </div>
                <div>
                  <label>Variable Expenses</label>
                  {variableExpenses.map((expense, index) => (
                    <div key={index} className="d-flex align-items-center mb-2">
                      <input
                        type="text"
                        value={expense.name}
                        onChange={(e) =>
                          handleExpenseChange(index, "name", e.target.value)
                        }
                        className="form-control"
                        placeholder="Expense Name"
                      />
                      <input
                        type="number"
                        value={expense.amount}
                        onChange={(e) =>
                          handleExpenseChange(index, "amount", e.target.value)
                        }
                        className="form-control ml-2"
                        placeholder="Amount"
                      />
                    </div>
                  ))}
                  <button
                    className="btn btn-secondary"
                    onClick={handleAddExpense}
                  >
                    Add More Expenses
                  </button>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Close
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleCalculateProfit}
                >
                  Calculate Profit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <button
        className="btn btn-sm btn-dark mb-3"
        onClick={() => navigate("/")}
      >
        Back
      </button>
      <br />
    </div>
  );
}

export default ViewExpense;
