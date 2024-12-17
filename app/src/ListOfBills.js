import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./App.css";
import BillForm from "./BillForm";
import { collection, db, getDocs, orderBy, query, where } from "./firebase";
import Select from "react-select";

function ListOfBills() {
  const navigate = useNavigate();
  // State for managing modal visibility
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExpensesModalOpen, setIsExpensesModalOpen] = useState(false);

  // State to hold fetched details and Waybill No options
  const [details, setDetails] = useState([]);
  const [waybillNos, setWaybillNos] = useState([]);
  const [selectedWaybillNo, setSelectedWaybillNo] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [waybillSearch, setWaybillSearch] = useState("");

  // Toggle visibility for Add Form modal
  const toggleModal = () => setIsModalOpen(!isModalOpen);

  // Toggle visibility for View Expenses modal
  const toggleExpensesModal = () =>
    setIsExpensesModalOpen(!isExpensesModalOpen);

  // Fetch Waybill Nos
  useEffect(() => {
    const fetchWaybillNos = async () => {
      try {
        const waybillRef = collection(db, "details_form");
        const querySnapshot = await getDocs(
          query(waybillRef, orderBy("waybillNo"))
        );
        const waybills = querySnapshot.docs.map((doc) => doc.data().waybillNo);
        setWaybillNos(waybills);
      } catch (e) {
        console.error("Error fetching Waybill Nos: ", e);
      }
    };
    fetchWaybillNos();
  }, []);

  // Fetch details based on Waybill No
  useEffect(() => {
    const fetchDetailsByWaybillNo = async () => {
      if (!selectedWaybillNo) {
        setDetails([]);
        return;
      }
      try {
        const detailsRef = collection(db, "details_form");
        const q = query(
          detailsRef,
          where("waybillNo", "==", selectedWaybillNo)
        );
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
    fetchDetailsByWaybillNo();
  }, [selectedWaybillNo]);

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

  const navigateToViewExpenses = () => {
    if (selectedWaybillNo) {
      navigate("/view-expense", {
        state: { waybillNo: selectedWaybillNo }, // Pass the selected waybillNo via state
      });
    } else {
      alert("Please select a Waybill No.");
    }
  };

  // Filter waybillNos based on search input
  const filteredWaybillNos = waybillNos.filter(
    (waybill) => waybill.toString().includes(waybillSearch) // Filter waybillNos
  );

  return (
    <div>
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
        style={{ display: isExpensesModalOpen ? "block" : "none" }}
      >
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">View Expenses</h5>
              <button
                type="button"
                className="btn-close"
                onClick={toggleExpensesModal}
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
                  }))} // Format waybillNos for react-select
                  value={
                    selectedWaybillNo
                      ? { value: selectedWaybillNo, label: selectedWaybillNo }
                      : null
                  } // Display selected value
                  onChange={(selectedOption) =>
                    setSelectedWaybillNo(
                      selectedOption ? selectedOption.value : ""
                    )
                  }
                  placeholder="Search or Select Waybill No"
                  isSearchable
                />
              </div>

              <div className="form-group">
                <label htmlFor="waybillNo">Select Waybill No</label>
                <select
                  id="waybillNo"
                  className="form-control"
                  value={selectedWaybillNo}
                  onChange={(e) => setSelectedWaybillNo(e.target.value)}
                >
                  <option value="">Select Waybill No</option>
                  {filteredWaybillNos.map((waybillNo, index) => (
                    <option key={index} value={waybillNo}>
                      {waybillNo}
                    </option>
                  ))}
                </select>
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
    </div>
  );
}

export default ListOfBills;
