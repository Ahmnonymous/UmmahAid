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

const AttachmentsTab = ({ applicantId, attachments, onUpdate, showAlert }) => {
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
        Attachment_Name: editItem?.attachment_name || "",
        Attachment_Details: editItem?.attachment_details || "",
        File: null,
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

      // Check if file is being uploaded
      const hasFile = data.File && data.File.length > 0;

      if (hasFile) {
        // Use FormData for file upload
        const formData = new FormData();
        formData.append("file_id", applicantId);
        formData.append("attachment_name", data.Attachment_Name);
        formData.append("attachment_details", data.Attachment_Details);
        formData.append("file", data.File[0]);

        if (editItem) {
          formData.append("updated_by", currentUser?.username || "system");
          await axiosApi.put(`${API_BASE_URL}/attachments/${editItem.id}`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
        } else {
          formData.append("created_by", currentUser?.username || "system");
          await axiosApi.post(`${API_BASE_URL}/attachments`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
        }
      } else {
        // Use JSON for regular update/create without file
        const payload = {
          file_id: applicantId,
          attachment_name: data.Attachment_Name,
          attachment_details: data.Attachment_Details,
        };

        if (editItem) {
          payload.updated_by = currentUser?.username || "system";
          await axiosApi.put(`${API_BASE_URL}/attachments/${editItem.id}`, payload);
        } else {
          payload.created_by = currentUser?.username || "system";
          await axiosApi.post(`${API_BASE_URL}/attachments`, payload);
        }
      }

      showAlert(
        editItem ? "Attachment has been updated successfully" : "Attachment has been added successfully",
        "success"
      );
      onUpdate();
      toggleModal();
    } catch (error) {
      console.error("Error saving attachment:", error);
      showAlert(error?.response?.data?.message || "Operation failed", "danger");
    }
  };

  const handleDelete = async () => {
    if (!editItem) return;

    try {
      await axiosApi.delete(`${API_BASE_URL}/attachments/${editItem.id}`);
      showAlert("Attachment has been deleted successfully", "danger");
      onUpdate();
      toggleModal();
    } catch (error) {
      console.error("Error deleting attachment:", error);
      showAlert(error?.response?.data?.message || "Delete failed", "danger");
    }
  };

  const columns = useMemo(
    () => [
      {
        header: "Attachment Name",
        accessorKey: "attachment_name",
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
            {cell.getValue() || "-"}
          </span>
        ),
      },
      {
        header: "Details",
        accessorKey: "attachment_details",
        enableSorting: false,
        enableColumnFilter: false,
        cell: (cell) => cell.getValue() || "-",
      },
      {
        header: "Created By",
        accessorKey: "created_by",
        enableSorting: true,
        enableColumnFilter: false,
        cell: (cell) => cell.getValue() || "-",
      },
      {
        header: "Created At",
        accessorKey: "created_at",
        enableSorting: true,
        enableColumnFilter: false,
        cell: (cell) => {
          const date = cell.getValue();
          return date ? new Date(date).toLocaleDateString() : "-";
        },
      },
      {
        header: "File",
        accessorKey: "file",
        enableSorting: false,
        enableColumnFilter: false,
        cell: (cell) => {
          const file = cell.getValue();
          const rowId = cell.row.original.id;
          return file ? (
            <div className="d-flex gap-2">
              <a
                href={`${API_BASE_URL}/attachments/${rowId}/view-file`}
                target="_blank"
                rel="noopener noreferrer"
                title="View"
              >
                <i
                  className="bx bx-show text-success"
                  style={{ cursor: "pointer", fontSize: "16px" }}
                ></i>
              </a>
              <a
                href={`${API_BASE_URL}/attachments/${rowId}/download-file`}
                download
                title="Download"
              >
                <i
                  className="bx bx-download text-primary"
                  style={{ cursor: "pointer", fontSize: "16px" }}
                ></i>
              </a>
            </div>
          ) : (
            "-"
          );
        },
      },
    ],
    []
  );

  return (
    <>
      <div className="mb-3 d-flex justify-content-between align-items-center">
        <h5 className="mb-0">Attachments</h5>
        <Button color="primary" size="sm" onClick={handleAdd}>
          <i className="bx bx-plus me-1"></i> Add Attachment
        </Button>
      </div>

      {attachments.length === 0 ? (
        <div className="alert alert-info" role="alert">
          <i className="bx bx-info-circle me-2"></i>
          No attachments found. Click "Add Attachment" to create one.
        </div>
      ) : (
        <TableContainer
          columns={columns}
          data={attachments}
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
          {editItem ? "Edit" : "Add"} Attachment
        </ModalHeader>

        <Form onSubmit={handleSubmit(onSubmit)}>
          <ModalBody>
            <Row>
              <Col md={12}>
                <FormGroup>
                  <Label for="Attachment_Name">
                    Attachment Name <span className="text-danger">*</span>
                  </Label>
                  <Controller
                    name="Attachment_Name"
                    control={control}
                    rules={{ required: "Attachment name is required" }}
                    render={({ field }) => (
                      <Input id="Attachment_Name" type="text" invalid={!!errors.Attachment_Name} {...field} />
                    )}
                  />
                  {errors.Attachment_Name && <FormFeedback>{errors.Attachment_Name.message}</FormFeedback>}
                </FormGroup>
              </Col>

              <Col md={12}>
                <FormGroup>
                  <Label for="Attachment_Details">Attachment Details</Label>
                  <Controller
                    name="Attachment_Details"
                    control={control}
                    render={({ field }) => <Input id="Attachment_Details" type="textarea" rows="4" {...field} />}
                  />
                </FormGroup>
              </Col>

              <Col md={12}>
                <FormGroup>
                  <Label for="File">File</Label>
                  <Controller
                    name="File"
                    control={control}
                    render={({ field: { onChange, value, ...field } }) => (
                      <Input
                        id="File"
                        type="file"
                        onChange={(e) => onChange(e.target.files)}
                        invalid={!!errors.File}
                        {...field}
                      />
                    )}
                  />
                  {errors.File && <FormFeedback>{errors.File.message}</FormFeedback>}
                  {editItem && editItem.file && (
                    <small className="text-muted d-block mt-1">
                      Current: {editItem.file_filename || "file"}
                    </small>
                  )}
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

export default AttachmentsTab;

