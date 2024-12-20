import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Select from "react-select";
import "./App.css";
import BillForm from "./BillForm";
import { collection, db,doc,updateDoc, getDocs, orderBy, query, where } from "./firebase";

function ListOfBills() {
  const navigate = useNavigate();
  // State for managing modal visibility
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExpensesModalOpen, setIsExpensesModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);  // New state for edit modal
  const [editDetail, setEditDetail] = useState(null);  // State to hold selected bill data for editing

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

  // Toggle visibility for Edit Billing modal
  const toggleEditModal = () => setIsEditModalOpen(!isEditModalOpen);


  console.log('details: ', details)
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

  // Function to handle edit button click
  const handleEdit = (detail) => {
    setEditDetail(detail); // Set the selected bill data for editing
    setIsEditModalOpen(true); // Open the edit modal
  };

  const handleSaveChanges = async () => {
    if (editDetail) {
      try {
        // Update the document's structure
        const updatedDetail = {
          ...editDetail,  // Spread the existing detail
          charges: {
            documentation: editDetail.charges?.documentation || 0,
            freight: editDetail.charges?.freight || 0,
            handling: editDetail.charges?.handling || 0,
            valuation: editDetail.charges?.valuation || 0,
          },
          modeOfService: {
            ...editDetail.modeOfService,  // Spread to preserve other modes
          },
          modeOfTransport: {
            ...editDetail.modeOfTransport,  // Spread to preserve transport modes
          },
          others: editDetail.others || [],  // Default to an empty array if not defined
          rows: editDetail.rows || [],  // Default to an empty array if not defined
          shipmentDetails: {
            ...editDetail.shipmentDetails,  // Spread to preserve shipment details
          },
          shipperName: editDetail.shipperName || "",  // Ensure the shipper name is saved
          waybillNo: editDetail.waybillNo || "",  // Ensure the waybillNo is saved
        };
  
        // Reference the document to update using its ID
        const docRef = doc(db, "details_form", editDetail.id);
        await updateDoc(docRef, updatedDetail);  // Update the document in Firestore
  
        alert("Changes saved successfully!");  // Confirmation alert
        setIsEditModalOpen(false);  // Optionally close the modal
      } catch (error) {
        console.error("Error updating document: ", error);
        alert("Error saving changes. Please try again.");
      }
    }
  };
  

  const getSelectedModes = (modeObject) => {
    // Generate a list of selected modes (values that are true)
    return Object.entries(modeObject)
      .filter(([key, value]) => value === true) // Only include true values
      .map(([key]) => key.replace(/([A-Z])/g, ' $1').trim()) // Format the keys for display
      .join(', ') || 'No mode selected';
  };

  return (
    <div>
      <div className="container d-flex flex-row align-items-center justify-content-between">
        <button
          className="btn btn-md btn-primary mt-2"
          onClick={toggleExpensesModal}
        >
          View Expenses
        </button>
        <div>
          <button className="btn btn-md btn-secondary mt-2 me-2">
            Edit Billing
          </button>
          <button className="btn btn-md btn-primary mt-2" onClick={toggleModal}>
            Add Billing
          </button>
        </div>
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

      {/* Edit Billing Modal */}
      <div
  className={`modal fade ${isEditModalOpen ? "show" : ""}`}
  tabIndex="-1"
  style={{ display: isEditModalOpen ? "block" : "none" }}
>
  <div className="modal-dialog modal-xl">
    <div className="modal-content">
      <div className="modal-header">
        <h5 className="modal-title">Edit Billing</h5>
        <button
          type="button"
          className="btn-close"
          onClick={toggleEditModal}
        ></button>
      </div>
      <div className="modal-body">
        {editDetail ? (
          <>
            {/* Waybill No */}
            <div className="form-group">
              <label htmlFor="editWaybillNo">Waybill No</label>
              <input
                type="text"
                id="editWaybillNo"
                className="form-control"
                value={editDetail.waybillNo}
                readOnly // You can make this editable if needed
              />
            </div>

            {/* Shipper Name */}
            <div className="form-group">
              <label htmlFor="editShipperName">Shipper Name</label>
              <input
                type="text"
                id="editShipperName"
                className="form-control"
                value={editDetail.shipperName}
                onChange={(e) => {
                  setEditDetail({
                    ...editDetail,
                    shipperName: e.target.value,
                  });
                }}
              />
            </div>

            {/* Charges - Documentation */}
            <div className="form-group">
              <label htmlFor="editChargesDocumentation">Documentation Charge</label>
              <input
                type="number"
                id="editChargesDocumentation"
                className="form-control"
                value={editDetail.charges?.documentation || 0}
                onChange={(e) => {
                  setEditDetail({
                    ...editDetail,
                    charges: {
                      ...editDetail.charges,
                      documentation: e.target.value,
                    },
                  });
                }}
              />
            </div>

            {/* Charges - Freight */}
            <div className="form-group">
              <label htmlFor="editChargesFreight">Freight Charge</label>
              <input
                type="number"
                id="editChargesFreight"
                className="form-control"
                value={editDetail.charges?.freight || 0}
                onChange={(e) => {
                  setEditDetail({
                    ...editDetail,
                    charges: {
                      ...editDetail.charges,
                      freight: e.target.value,
                    },
                  });
                }}
              />
            </div>

            {/* Charges - Handling */}
            <div className="form-group">
              <label htmlFor="editChargesHandling">Handling Charge</label>
              <input
                type="number"
                id="editChargesHandling"
                className="form-control"
                value={editDetail.charges?.handling || 0}
                onChange={(e) => {
                  setEditDetail({
                    ...editDetail,
                    charges: {
                      ...editDetail.charges,
                      handling: e.target.value,
                    },
                  });
                }}
              />
            </div>

            {/* Charges - Valuation */}
            <div className="form-group">
              <label htmlFor="editChargesValuation">Valuation Charge</label>
              <input
                type="number"
                id="editChargesValuation"
                className="form-control"
                value={editDetail.charges?.valuation || 0}
                onChange={(e) => {
                  setEditDetail({
                    ...editDetail,
                    charges: {
                      ...editDetail.charges,
                      valuation: e.target.value,
                    },
                  });
                }}
              />
            </div>

            {/* Mode of Transport */}
            <div className="form-group">
              <label htmlFor="editModeOfTransport">Mode of Transport</label>
              <input
                type="text"
                id="editModeOfTransport"
                className="form-control"
                value={getSelectedModes(editDetail.modeOfTransport)} // Display the selected modes
                onChange={(e) => {
                  setEditDetail({
                    ...editDetail,
                    modeOfTransport: e.target.value,
                  });
                }}
              />
            </div>

            {/* Mode of Service */}
            <div className="form-group">
              <label htmlFor="editModeOfService">Mode of Service</label>
              <input
                type="text"
                id="editModeOfService"
                className="form-control"
                value={getSelectedModes(editDetail.modeOfService)} // Display the selected modes
                onChange={(e) => {
                  setEditDetail({
                    ...editDetail,
                    modeOfService: e.target.value,
                  });
                }}
              />
            </div>

            {/* Other Charges (If any) */}
            <div className="form-group">
              <label htmlFor="editOtherCharges">Other Charges</label>
              {editDetail.others?.map((other, index) => (
                <div key={index} className="d-flex justify-content-between">
                  <input
                    type="number"
                    className="form-control mb-2"
                    value={other.amount || 0}
                    onChange={(e) => {
                      const updatedOthers = [...editDetail.others];
                      updatedOthers[index].amount = e.target.value;
                      setEditDetail({
                        ...editDetail,
                        others: updatedOthers,
                      });
                    }}
                  />
                  <input
                    type="text"
                    className="form-control mb-2"
                    value={other.description || ""}
                    onChange={(e) => {
                      const updatedOthers = [...editDetail.others];
                      updatedOthers[index].description = e.target.value;
                      setEditDetail({
                        ...editDetail,
                        others: updatedOthers,
                      });
                    }}
                  />
                </div>
              ))}
            </div>

            {/* Shipment Details - Consignee Name */}
            <div className="form-group">
              <label htmlFor="editConsigneeName">Consignee Name</label>
              <input
                type="text"
                id="editConsigneeName"
                className="form-control"
                value={editDetail.shipmentDetails?.consigneeName || ""}
                onChange={(e) => {
                  setEditDetail({
                    ...editDetail,
                    shipmentDetails: {
                      ...editDetail.shipmentDetails,
                      consigneeName: e.target.value,
                    },
                  });
                }}
              />
            </div>

            {/* Shipment Details - Origin */}
            <div className="form-group">
              <label htmlFor="editOrigin">Origin</label>
              <input
                type="text"
                id="editOrigin"
                className="form-control"
                value={editDetail.shipmentDetails?.origin || ""}
                onChange={(e) => {
                  setEditDetail({
                    ...editDetail,
                    shipmentDetails: {
                      ...editDetail.shipmentDetails,
                      origin: e.target.value,
                    },
                  });
                }}
              />
            </div>

            {/* Shipment Details - Destination */}
            <div className="form-group">
              <label htmlFor="editDestination">Destination</label>
              <input
                type="text"
                id="editDestination"
                className="form-control"
                value={editDetail.shipmentDetails?.destination || ""}
                onChange={(e) => {
                  setEditDetail({
                    ...editDetail,
                    shipmentDetails: {
                      ...editDetail.shipmentDetails,
                      destination: e.target.value,
                    },
                  });
                }}
              />
            </div>

            {/* Quantity, Description, Volume */}
            <div className="form-group">
              <label htmlFor="editRows">Quantity, Description, Volume</label>
              {editDetail.rows?.map((row, index) => (
                <div key={index}>
                  <input
                    type="number"
                    className="form-control mb-2"
                    value={row.quantity || 0}
                    onChange={(e) => {
                      const updatedRows = [...editDetail.rows];
                      updatedRows[index].quantity = e.target.value;
                      setEditDetail({
                        ...editDetail,
                        rows: updatedRows,
                      });
                    }}
                    placeholder="Quantity"
                  />
                  <input
                    type="text"
                    className="form-control mb-2"
                    value={row.description || ""}
                    onChange={(e) => {
                      const updatedRows = [...editDetail.rows];
                      updatedRows[index].description = e.target.value;
                      setEditDetail({
                        ...editDetail,
                        rows: updatedRows,
                      });
                    }}
                    placeholder="Description"
                  />
                  <input
                    type="number"
                    className="form-control mb-2"
                    value={row.volume || 0}
                    onChange={(e) => {
                      const updatedRows = [...editDetail.rows];
                      updatedRows[index].volume = e.target.value;
                      setEditDetail({
                        ...editDetail,
                        rows: updatedRows,
                      });
                    }}
                    placeholder="Volume"
                  />
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="form-group">
              <label>Total</label>
              <input
                type="text"
                className="form-control"
                value={calculateTotalCharges(
                  editDetail.charges,
                  editDetail.others,
                  editDetail.rows
                ).toLocaleString()}
                readOnly
              />
            </div>

            <button
              className="btn btn-primary mt-3"
              onClick={handleSaveChanges}
            >
              Save Changes
            </button>
          </>
        ) : (
          <p>No details available</p>
        )}
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
              <th>Action</th>
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
                  <td>
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={() => handleEdit(detail)} // Handle edit
                    >
                      Edit
                    </button>
                  </td>
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
