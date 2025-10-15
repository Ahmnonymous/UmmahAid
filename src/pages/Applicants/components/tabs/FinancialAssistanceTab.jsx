import React, { useState, useMemo, useEffect } from "react";
import {
  Button,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Form,
  FormGroup,
  Label,
  Input,
  Row,
  Col,
  FormFeedback,
} from "reactstrap";
import { useForm, Controller } from "react-hook-form";
import TableContainer from "../../../../components/Common/TableContainer";
import axiosApi from "../../../../helpers/api_helper";
import { API_BASE_URL } from "../../../../helpers/url_helper";
import { getUmmahAidUser } from "../../../../helpers/userStorage";

const FinancialAssistanceTab = ({ applicantId, financialAssistance, lookupData, onUpdate, showAlert }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm();

  useEffect(() => {
    if (modalOpen) {
      reset({
        Assistance_Type: editItem?.assistance_type || "",
        Financial_Amount: editItem?.financial_amount || "",
        Date_of_Assistance: editItem?.date_of_assistance || "",
      });
    }
  }, [editItem, modalOpen, reset]);

  const toggleModal = () => {
    setModalOpen(!modalOpen);
    if (modalOpen) {
      setEditItem(null);
    }
  };

  const handleAdd = () => {
    setEditItem(null);
    setModalOpen(true);
  };

  const handleEdit = (item) => {
    setEditItem(item);
    setModalOpen(true);
  };

  const onSubmit = async (data) => {
    try {
      const currentUser = getUmmahAidUser();

      const payload = {
        file_id: applicantId,
        assistance_type: data.Assistance_Type ? parseInt(data.Assistance_Type) : null,
        financial_amount: data.Financial_Amount ? parseFloat(data.Financial_Amount) : 0,
        date_of_assistance: data.Date_of_Assistance || null,
      };

      if (editItem) {
        payload.updated_by = currentUser?.username || "system";
        await axiosApi.put(`${API_BASE_URL}/financialAssistance/${editItem.id}`, payload);
        showAlert("Financial assistance has been updated successfully", "success");
      } else {
        payload.created_by = currentUser?.username || "system";
        await axiosApi.post(`${API_BASE_URL}/financialAssistance`, payload);
        showAlert("Financial assistance has been added successfully", "success");
      }

      onUpdate();
      toggleModal();
    } catch (error) {
      console.error("Error saving financial assistance:", error);
      showAlert(error?.response?.data?.message || "Operation failed", "danger");
    }
  };

  const handleDelete = async () => {
    if (!editItem) return;

    try {
      await axiosApi.delete(`${API_BASE_URL}/financialAssistance/${editItem.id}`);
      showAlert("Financial assistance has been deleted successfully", "danger");
      onUpdate();
      toggleModal();
    } catch (error) {
      console.error("Error deleting financial assistance:", error);
      showAlert(error?.response?.data?.message || "Delete failed", "danger");
    }
  };

  const getLookupName = (lookupArray, id) => {
    if (!id) return "-";
    const item = lookupArray.find((l) => l.id == id);
    return item ? item.name : "-";
  };

  const columns = useMemo(
    () => [
      {
        header: "Date",
        accessorKey: "date_of_assistance",
        enableSorting: true,
        enableColumnFilter: false,
        cell: (cell) => {
          const date = cell.getValue();
          return date ? new Date(date).toLocaleDateString() : "-";
        },
      },
      {
        header: "Assistance Type",
        accessorKey: "assistance_type",
        enableSorting: true,
        enableColumnFilter: false,
        cell: (cell) => (
          <span
            style={{ cursor: "pointer", color: "inherit" }}
            onClick={() => handleEdit(cell.row.original)}
            onMouseOver={(e) => {
              e.currentTarget.classList.add('text-primary', 'text-decoration-underline');
            }}
            onMouseOut={(e) => {
              e.currentTarget.classList.remove('text-primary', 'text-decoration-underline');
            }}
          >
            {getLookupName(lookupData.assistanceTypes, cell.getValue())}
          </span>
        ),
      },
      {
        header: "Amount",
        accessorKey: "financial_amount",
        enableSorting: true,
        enableColumnFilter: false,
        cell: (cell) => {
          const amount = parseFloat(cell.getValue()) || 0;
          return `R ${amount.toFixed(2)}`;
        },
      },
      {
        header: "Created By",
        accessorKey: "created_by",
        enableSorting: true,
        enableColumnFilter: false,
        cell: (cell) => cell.getValue() || "-",
      },
    ],
    [lookupData]
  );

  const totalAmount = financialAssistance.reduce(
    (sum, item) => sum + (parseFloat(item.financial_amount) || 0),
    0
  );

  return (
    <>
      <div className="mb-3 d-flex justify-content-between align-items-center">
        <h5 className="mb-0">Financial Assistance</h5>
        <Button color="primary" size="sm" onClick={handleAdd}>
          <i className="bx bx-plus me-1"></i> Add Financial Assistance
        </Button>
      </div>

      {financialAssistance.length === 0 ? (
        <div className="alert alert-info" role="alert">
          <i className="bx bx-info-circle me-2"></i>
          No financial assistance records found. Click "Add Financial Assistance" to create one.
        </div>
      ) : (
        <TableContainer
          columns={columns}
          data={financialAssistance}
          isGlobalFilter={false}
          isPagination={true}
          isCustomPageSize={true}
          pagination="pagination"
          paginationWrapper="dataTables_paginate paging_simple_numbers"
          tableClass="table-bordered table-nowrap dt-responsive nowrap w-100 dataTable no-footer dtr-inline"
        />
      )}

      {/* Modal */}
      <Modal isOpen={modalOpen} toggle={toggleModal} centered size="lg" backdrop="static">
        <ModalHeader toggle={toggleModal}>
          <i className={`bx ${editItem ? "bx-edit" : "bx-plus-circle"} me-2`}></i>
          {editItem ? "Edit" : "Add"} Financial Assistance
        </ModalHeader>

        <Form onSubmit={handleSubmit(onSubmit)}>
          <ModalBody>
            <Row>
              <Col md={6}>
                <FormGroup>
                  <Label for="Assistance_Type">
                    Assistance Type <span className="text-danger">*</span>
                  </Label>
                  <Controller
                    name="Assistance_Type"
                    control={control}
                    rules={{ required: "Assistance type is required" }}
                    render={({ field }) => (
                      <Input id="Assistance_Type" type="select" invalid={!!errors.Assistance_Type} {...field}>
                        <option value="">Select Type</option>
                        {lookupData.assistanceTypes.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.name}
                          </option>
                        ))}
                      </Input>
                    )}
                  />
                  {errors.Assistance_Type && <FormFeedback>{errors.Assistance_Type.message}</FormFeedback>}
                </FormGroup>
              </Col>

              <Col md={6}>
                <FormGroup>
                  <Label for="Financial_Amount">
                    Amount (R) <span className="text-danger">*</span>
                  </Label>
                  <Controller
                    name="Financial_Amount"
                    control={control}
                    rules={{ required: "Amount is required", min: { value: 0, message: "Amount must be positive" } }}
                    render={({ field }) => (
                      <Input id="Financial_Amount" type="number" step="0.01" invalid={!!errors.Financial_Amount} {...field} />
                    )}
                  />
                  {errors.Financial_Amount && <FormFeedback>{errors.Financial_Amount.message}</FormFeedback>}
                </FormGroup>
              </Col>

              <Col md={6}>
                <FormGroup>
                  <Label for="Date_of_Assistance">Date of Assistance</Label>
                  <Controller
                    name="Date_of_Assistance"
                    control={control}
                    render={({ field }) => <Input id="Date_of_Assistance" type="date" {...field} />}
                  />
                </FormGroup>
              </Col>
            </Row>
          </ModalBody>

          <ModalFooter className="d-flex justify-content-between">
            <div>
              {editItem && (
                <Button color="danger" onClick={handleDelete} type="button" disabled={isSubmitting}>
                  <i className="bx bx-trash me-1"></i> Delete
                </Button>
              )}
            </div>

            <div>
              <Button color="light" onClick={toggleModal} disabled={isSubmitting} className="me-2">
                <i className="bx bx-x me-1"></i> Cancel
              </Button>
              <Button color="success" type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" />
                    Saving...
                  </>
                ) : (
                  <>
                    <i className="bx bx-save me-1"></i> Save
                  </>
                )}
              </Button>
            </div>
          </ModalFooter>
        </Form>
      </Modal>
    </>
  );
};

export default FinancialAssistanceTab;

