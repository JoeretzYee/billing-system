import React, { useState, useRef } from "react";
import { addDoc, collection, db } from "./firebase";
import Swal from "sweetalert2"; // Import SweetAlert

function BillForm() {
  // Ref for modal element
  const modalRef = useRef(null);
  const [shipperName, setShipperName] = useState("");
  const [waybillNo, setWaybillNo] = useState("");
  const [rows, setRows] = useState([
    { quantity: "", description: "", volume: "" },
  ]);

  const [others, setOthers] = useState([{ description: "", amount: "" }]);

  const [charges, setCharges] = useState({
    freight: "",
    valuation: "",
    documentation: "",
    handling: "",
  });

  const [shipmentDetails, setShipmentDetails] = useState({
    consigneeName: "",
    origin: "",
    destination: "",
  });
  const [modeOfTransport, setModeOfTransport] = useState({
    air: false,
    land: false,
    sea: false,
  });

  const [modeOfService, setModeOfService] = useState({
    doorDoor: false,
    doorPier: false,
    pierDoor: false,
    pierPier: false,
  });

  const handleTransportChange = (e) => {
    const { id, checked } = e.target;
    setModeOfTransport({ ...modeOfTransport, [id]: checked });
  };

  const handleServiceChange = (e) => {
    const { id, checked } = e.target;
    setModeOfService({ ...modeOfService, [id]: checked });
  };

  const handleAddRow = () => {
    setRows([...rows, { quantity: "", description: "", volume: "" }]);
  };

  const handleRemoveRow = (index) => {
    const updatedRows = rows.filter((_, i) => i !== index);
    setRows(updatedRows);
  };

  const handleRowChange = (index, field, value) => {
    const updatedRows = rows.map((row, i) =>
      i === index ? { ...row, [field]: value } : row
    );
    setRows(updatedRows);
  };

  const handleChargeChange = (field, value) => {
    setCharges({ ...charges, [field]: value });
  };

  const handleAddOther = () => {
    setOthers([...others, { description: "", amount: "" }]);
  };

  const handleRemoveOther = (index) => {
    const updatedOthers = others.filter((_, i) => i !== index);
    setOthers(updatedOthers);
  };

  const handleOtherChange = (index, field, value) => {
    const updatedOthers = others.map((other, i) =>
      i === index ? { ...other, [field]: value } : other
    );
    setOthers(updatedOthers);
  };

  const handleShipmentDetailsChange = (field, value) => {
    setShipmentDetails({ ...shipmentDetails, [field]: value });
  };
  const handleShipperNameChange = (e) => {
    setShipperName(e.target.value); // Update shipper name state
  };
  const handleWaybillNoChange = (e) => {
    setWaybillNo(e.target.value); // Update shipper name state
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Collect data
    const formData = {
      waybillNo,
      shipperName,
      shipmentDetails,
      rows,
      charges,
      others,
      modeOfTransport,
      modeOfService,
    };

    try {
      // Add form data to Firebase Firestore
      const docRef = await addDoc(collection(db, "details_form"), formData);
      console.log("Document written with ID: ", docRef.id);
      // Show success alert
      Swal.fire({
        title: "Success!",
        text: "Form submitted successfully.",
        icon: "success",
        confirmButtonText: "OK",
        timer: 2000, // The alert will automatically close after 3 seconds
        timerProgressBar: true, // Optional: adds a progress bar while the timer is active
      }).then(() => {
        // You can reset the form here, if needed, after the alert closes.
        setRows([{ quantity: "", description: "", volume: "" }]);
        setOthers([{ description: "", amount: "" }]);
        setCharges({
          freight: "",
          valuation: "",
          documentation: "",
          handling: "",
        });
        setShipmentDetails({ consigneeName: "", origin: "", destination: "" });
        setShipperName("");
        setWaybillNo("");
        setModeOfTransport({ air: false, land: false, sea: false });
        setModeOfService({
          doorDoor: false,
          doorPier: false,
          pierDoor: false,
          pierPier: false,
        });
        // Close the modal
        window.location.reload();
      });
    } catch (e) {
      console.error("Error adding document: ", e);
      // Show error alert
      Swal.fire({
        title: "Error!",
        text: "There was an issue submitting the form. Please try again.",
        icon: "error",
        confirmButtonText: "OK",
      });
    }
  };

  return (
    <div className="container mt-4">
      <h2 className="mb-4">Shipper Form</h2>
      <form className="w-100" onSubmit={handleSubmit}>
        <div className="mb-3">
          <label htmlFor="shipperName" className="form-label">
            Waybill No
          </label>
          <input
            type="number"
            className="form-control"
            id="waybillNo"
            value={waybillNo} // Bind value to state
            onChange={handleWaybillNoChange} // Handle change
            placeholder="Enter name waybill No."
          />
        </div>
        {/* Shipper Name */}
        <div className="mb-3">
          <label htmlFor="shipperName" className="form-label">
            Name of Shipper
          </label>
          <input
            type="text"
            className="form-control"
            id="shipperName"
            value={shipperName} // Bind value to state
            onChange={handleShipperNameChange} // Handle change
            placeholder="Enter name of shipper"
          />
        </div>

        {/* Mode of Transport */}
        <div className="mb-3">
          <label className="form-label">Mode of Transport</label>
          <div className="form-check">
            <input
              className="form-check-input"
              type="checkbox"
              id="air"
              checked={modeOfTransport.air}
              onChange={handleTransportChange}
            />
            <label className="form-check-label" htmlFor="air">
              Air
            </label>
          </div>
          <div className="form-check">
            <input
              className="form-check-input"
              type="checkbox"
              id="land"
              checked={modeOfTransport.land}
              onChange={handleTransportChange}
            />
            <label className="form-check-label" htmlFor="land">
              Land
            </label>
          </div>
          <div className="form-check">
            <input
              className="form-check-input"
              type="checkbox"
              id="sea"
              checked={modeOfTransport.sea}
              onChange={handleTransportChange}
            />
            <label className="form-check-label" htmlFor="sea">
              Sea
            </label>
          </div>
        </div>

        {/* Mode of Service */}
        <div className="mb-3">
          <label className="form-label">Mode of Service</label>
          <div className="form-check">
            <input
              className="form-check-input"
              type="checkbox"
              id="doorDoor"
              checked={modeOfService.doorDoor}
              onChange={handleServiceChange}
            />
            <label className="form-check-label" htmlFor="doorDoor">
              Door/Door
            </label>
          </div>
          <div className="form-check">
            <input
              className="form-check-input"
              type="checkbox"
              id="doorPier"
              checked={modeOfService.doorPier}
              onChange={handleServiceChange}
            />
            <label className="form-check-label" htmlFor="doorPier">
              Door/Pier
            </label>
          </div>
          <div className="form-check">
            <input
              className="form-check-input"
              type="checkbox"
              id="pierDoor"
              checked={modeOfService.pierDoor}
              onChange={handleServiceChange}
            />
            <label className="form-check-label" htmlFor="pierDoor">
              Pier/Door
            </label>
          </div>
          <div className="form-check">
            <input
              className="form-check-input"
              type="checkbox"
              id="pierPier"
              checked={modeOfService.pierPier}
              onChange={handleServiceChange}
            />
            <label className="form-check-label" htmlFor="pierPier">
              Pier/Pier
            </label>
          </div>
        </div>

        {/* Name of Consignee, Origin, Destination */}
        <div className="mb-3">
          <label htmlFor="consigneeName" className="form-label">
            Name of Consignee
          </label>
          <input
            type="text"
            className="form-control"
            id="consigneeName"
            placeholder="Enter name of consignee"
            value={shipmentDetails.consigneeName}
            onChange={(e) =>
              handleShipmentDetailsChange("consigneeName", e.target.value)
            }
          />
        </div>
        <div className="mb-3">
          <label htmlFor="origin" className="form-label">
            Origin
          </label>
          <input
            type="text"
            className="form-control"
            id="origin"
            placeholder="Enter origin"
            value={shipmentDetails.origin}
            onChange={(e) =>
              handleShipmentDetailsChange("origin", e.target.value)
            }
          />
        </div>
        <div className="mb-3">
          <label htmlFor="destination" className="form-label">
            Destination
          </label>
          <input
            type="text"
            className="form-control"
            id="destination"
            placeholder="Enter destination"
            value={shipmentDetails.destination}
            onChange={(e) =>
              handleShipmentDetailsChange("destination", e.target.value)
            }
          />
        </div>

        {/* Quantity, Description, and Volume */}
        <div className="mb-3">
          <label className="form-label">
            Quantity, Description, and Volume
          </label>
          {rows.map((row, index) => (
            <div className="row mb-3" key={index}>
              <div className="col-md-3">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Quantity"
                  value={row.quantity}
                  onChange={(e) =>
                    handleRowChange(index, "quantity", e.target.value)
                  }
                />
              </div>
              <div className="col-md-6">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Description"
                  value={row.description}
                  onChange={(e) =>
                    handleRowChange(index, "description", e.target.value)
                  }
                />
              </div>
              <div className="col-md-3">
                <input
                  type="number"
                  className="form-control"
                  placeholder="Volume (CBM)"
                  value={row.volume}
                  onChange={(e) =>
                    handleRowChange(index, "volume", e.target.value)
                  }
                />
              </div>
              <div className="col-md-1">
                <br />
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => handleRemoveRow(index)}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
          <button
            type="button"
            className="btn btn-primary mt-2"
            onClick={handleAddRow}
          >
            Add Row
          </button>
        </div>

        {/* Table to Display Rows */}
        {rows.length > 0 && (
          <div className="table-responsive mt-4">
            <table className="table table-bordered">
              <thead>
                <tr>
                  <th>Quantity</th>
                  <th>Description</th>
                  <th>Volume (CBM)</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={index}>
                    <td>{row.quantity}</td>
                    <td>{row.description}</td>
                    <td>{row.volume}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Charges */}
        <div className="mb-3">
          <label className="form-label">Charges</label>
          <div className="row">
            <div className="col-md-3">
              <input
                type="number"
                className="form-control"
                placeholder="Freight"
                value={charges.freight}
                onChange={(e) => handleChargeChange("freight", e.target.value)}
              />
            </div>
            <div className="col-md-3">
              <input
                type="number"
                className="form-control"
                placeholder="Valuation"
                value={charges.valuation}
                onChange={(e) =>
                  handleChargeChange("valuation", e.target.value)
                }
              />
            </div>
            <div className="col-md-3">
              <input
                type="number"
                className="form-control"
                placeholder="Documentation Fee"
                value={charges.documentation}
                onChange={(e) =>
                  handleChargeChange("documentation", e.target.value)
                }
              />
            </div>
            <div className="col-md-3">
              <input
                type="number"
                className="form-control"
                placeholder="Handling Fee"
                value={charges.handling}
                onChange={(e) => handleChargeChange("handling", e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Others */}
        <div className="mb-3">
          <label className="form-label">Others</label>
          {others.map((other, index) => (
            <div className="row mb-3" key={index}>
              <div className="col-md-6">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Description"
                  value={other.description}
                  onChange={(e) =>
                    handleOtherChange(index, "description", e.target.value)
                  }
                />
              </div>
              <div className="col-md-6">
                <input
                  type="number"
                  className="form-control"
                  placeholder="Amount"
                  value={other.amount}
                  onChange={(e) =>
                    handleOtherChange(index, "amount", e.target.value)
                  }
                />
              </div>

              <div className="col-md- mt-2">
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => handleRemoveOther(index)}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleAddOther}
          >
            Add Other
          </button>
        </div>

        {/* Table to Display Others */}
        {others.length > 0 && (
          <div className="table-responsive mt-4">
            <table className="table table-bordered">
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {others.map((other, index) => (
                  <tr key={index}>
                    <td>{other.description}</td>
                    <td>{other.amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <button type="submit" className="btn btn-success">
          Submit
        </button>
      </form>
    </div>
  );
}

export default BillForm;
