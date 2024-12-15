import { useState, useEffect } from "react";
import { collection, getDocs, query, where, db } from "./firebase";
import ViewExpenses from "./ViewExpenses"; // Make sure this is your ViewExpenses component
import BillForm from "./BillForm";
import "./App.css";

function App() {
  // State for managing modal visibility
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExpensesModalOpen, setIsExpensesModalOpen] = useState(false);

  // State to hold fetched details and Waybill No options
  const [details, setDetails] = useState([]);
  const [waybillNos, setWaybillNos] = useState([]);
  const [selectedWaybillNo, setSelectedWaybillNo] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Toggle visibility for Add Form modal
  const toggleModal = () => setIsModalOpen(!isModalOpen);

  // Toggle visibility for View Expenses modal
  const toggleExpensesModal = () =>
    setIsExpensesModalOpen(!isExpensesModalOpen);

  // Fetch data for Waybill Nos
  useEffect(() => {
    const fetchWaybillNos = async () => {
      const detailsRef = collection(db, "details_form");
      try {
        const querySnapshot = await getDocs(detailsRef);
        querySnapshot.forEach((doc) => {
          console.log(doc.id, doc.data()); // Check what is returned
        });
        const waybillList = querySnapshot.docs
          .map((doc) => doc.data().waybillNo)
          .filter((waybillNo) => waybillNo); // Filter out empty or undefined waybillNo
        setWaybillNos(waybillList);
      } catch (e) {
        console.error("Error fetching waybillNos: ", e);
      }
    };

    fetchWaybillNos(); // Call the fetch function here
  }, []); // Fetch once on component mount

  console.log("waybill nos: ", waybillNos);
  // Fetch details based on search query or selected Waybill No
  useEffect(() => {
    const fetchDetails = async () => {
      const detailsRef = collection(db, "details_form");
      const q = searchQuery
        ? query(detailsRef, where("waybillNo", "==", searchQuery))
        : detailsRef;

      try {
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map((doc) => doc.data());
        setDetails(data);
      } catch (e) {
        console.error("Error fetching documents: ", e);
      }
    };

    fetchDetails();
  }, [searchQuery]); // Fetch data when search query changes

  // Helper function to extract true modes from an object
  const getTrueModes = (modeObject) => {
    if (modeObject && typeof modeObject === "object") {
      return Object.entries(modeObject)
        .filter(([key, value]) => value === true)
        .map(([key]) => key)
        .join(", ");
    }
    return "";
  };

  // Calculate total charges
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

  return (
    <div className="app">
      <header className="bg-dark text-white py-3">
        <div className="container">
          <h1 className="text-center mb-0">ES Tablante Cargo Services</h1>
        </div>
      </header>
      <main>
        <div className="container d-flex flex-row align-items-center justify-content-between">
          <button
            className="btn btn-md btn-primary mt-2"
            onClick={toggleExpensesModal}
          >
            View Expenses
          </button>
          <button className="btn btn-md btn-primary mt-2" onClick={toggleModal}>
            Add
          </button>
        </div>
        <br />
        {/* Search field to filter by Waybill No */}
        <div className="container mb-4">
          <input
            type="number"
            className="form-control"
            placeholder="Search by Waybill No"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)} // Set search query
          />
        </div>

        {/* View Expenses Modal */}
        <div
          className={`modal fade ${isExpensesModalOpen ? "show" : ""}`}
          tabIndex="-1"
          aria-labelledby="viewExpensesModalLabel"
          aria-hidden={!isExpensesModalOpen}
          style={{ display: isExpensesModalOpen ? "block" : "none" }}
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title" id="viewExpensesModalLabel">
                  View Expenses
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  aria-label="Close"
                  onClick={toggleExpensesModal}
                ></button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label htmlFor="waybillNo">Select Waybill No</label>
                  <select
                    id="waybillNo"
                    className="form-control"
                    value={selectedWaybillNo}
                    onChange={(e) => setSelectedWaybillNo(e.target.value)}
                  >
                    <option value="">Select Waybill No</option>
                    {waybillNos.map((waybillNo, index) => (
                      <option key={index} value={waybillNo}>
                        {waybillNo}
                      </option>
                    ))}
                  </select>
                </div>
                {selectedWaybillNo && <ViewExpenses details={details} />}
              </div>
            </div>
          </div>
        </div>

        {/* Add Form Modal */}
        <div
          className={`modal fade ${isModalOpen ? "show" : ""}`}
          tabIndex="-1"
          aria-labelledby="exampleModalLabel"
          aria-hidden={!isModalOpen}
          style={{ display: isModalOpen ? "block" : "none" }}
        >
          <div className="modal-dialog modal-xl">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title" id="exampleModalLabel">
                  Bill Form
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  data-bs-dismiss="modal"
                  aria-label="Close"
                  onClick={toggleModal}
                ></button>
              </div>
              <div className="modal-body">
                <BillForm />
              </div>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="container">
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
                        Object.entries(detail.charges).map(
                          ([key, value], idx) => (
                            <div key={idx}>
                              {key}: {value}
                            </div>
                          )
                        )}
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
        </div>
      </main>

      <footer className="bg-dark text-white py-3">
        <div className="container text-center">
          <p className="mb-0">
            &copy; {new Date().getFullYear()} Management System. All Rights
            Reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
