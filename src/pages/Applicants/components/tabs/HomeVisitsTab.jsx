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
import DeleteConfirmationModal from "../../../../components/Common/DeleteConfirmationModal";
import useDeleteConfirmation from "../../../../hooks/useDeleteConfirmation";
import axiosApi from "../../../../helpers/api_helper";
import { API_BASE_URL, API_STREAM_BASE_URL } from "../../../../helpers/url_helper";
import { getUmmahAidUser } from "../../../../helpers/userStorage";

const HomeVisitsTab = ({ applicantId, homeVisits, onUpdate, showAlert }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);

  // Delete confirmation hook
  const {
    deleteModalOpen,
    deleteItem,
    deleteLoading,
    showDeleteConfirmation,
    hideDeleteConfirmation,
    confirmDelete
  } = useDeleteConfirmation();

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm();

  useEffect(() => {
    if (modalOpen) {
      reset({
        Visit_Date: editItem?.visit_date || "",
        Representative: editItem?.representative || "",
        Comments: editItem?.comments || "",
        Attachment_1: null,
        Attachment_2: null,
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

      // Check if any attachment is being uploaded
      const hasAttachment1 = data.Attachment_1 && data.Attachment_1.length > 0;
      const hasAttachment2 = data.Attachment_2 && data.Attachment_2.length > 0;

      if (hasAttachment1 || hasAttachment2) {
        // Use FormData for file upload
        const formData = new FormData();
        formData.append("file_id", applicantId);
        formData.append("visit_date", data.Visit_Date || "");
        formData.append("representative", data.Representative);
        formData.append("comments", data.Comments);

        if (hasAttachment1) {
          formData.append("attachment_1", data.Attachment_1[0]);
        }
        if (hasAttachment2) {
          formData.append("attachment_2", data.Attachment_2[0]);
        }

        if (editItem) {
          formData.append("updated_by", currentUser?.username || "system");
          await axiosApi.put(`${API_BASE_URL}/homeVisit/${editItem.id}`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
        } else {
          formData.append("created_by", currentUser?.username || "system");
          await axiosApi.post(`${API_BASE_URL}/homeVisit`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
        }
      } else {
        // Use JSON for regular update/create without file
        const payload = {
          file_id: applicantId,
          visit_date: data.Visit_Date || null,
          representative: data.Representative,
          comments: data.Comments,
        };

        if (editItem) {
          payload.updated_by = currentUser?.username || "system";
          await axiosApi.put(`${API_BASE_URL}/homeVisit/${editItem.id}`, payload);
        } else {
          payload.created_by = currentUser?.username || "system";
          await axiosApi.post(`${API_BASE_URL}/homeVisit`, payload);
        }
      }

      showAlert(
        editItem ? "Home visit has been updated successfully" : "Home visit has been added successfully",
        "success"
      );
      onUpdate();
      toggleModal();
    } catch (error) {
      console.error("Error saving home visit:", error);
      showAlert(error?.response?.data?.message || "Operation failed", "danger");
    }
  };

  const handleDelete = () => {
    if (!editItem) return;

    const visitName = `Visit on ${editItem.visit_date || 'Unknown Date'} - ${editItem.visit_purpose || 'Unknown Purpose'}`;
    
    showDeleteConfirmation({
      id: editItem.id,
      name: visitName,
      type: "home visit",
      message: "This home visit record will be permanently removed from the system."
    }, async () => {
      await axiosApi.delete(`${API_BASE_URL}/homeVisit/${editItem.id}`);
      showAlert("Home visit has been deleted successfully", "success");
      onUpdate();
      if (modalOpen) {
        setModalOpen(false);
      }
    });
  };

  const columns = useMemo(
    () => [
      {
        header: "Representative",
        accessorKey: "representative",
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
        header: "Visit Date",
        accessorKey: "visit_date",
        enableSorting: true,
        enableColumnFilter: false,
        cell: (cell) => {
          const date = cell.getValue();
          return date ? new Date(date).toLocaleDateString() : "-";
        },
      },
      {
        header: "Comments",
        accessorKey: "comments",
        enableSorting: false,
        enableColumnFilter: false,
        cell: (cell) => {
          const comment = cell.getValue() || "";
          return comment.length > 50 ? `${comment.substring(0, 50)}...` : comment || "-";
        },
      },
      {
        header: "Attachment 1",
        accessorKey: "attachment_1",
        enableSorting: false,
        enableColumnFilter: false,
        cell: (cell) => {
          const attachment = cell.getValue();
          const rowId = cell.row.original.id;
          return attachment ? (
            <div className="d-flex gap-2">
              <a
                href={`${API_STREAM_BASE_URL}/homeVisit/${rowId}/view-attachment-1`}
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
                href={`${API_STREAM_BASE_URL}/homeVisit/${rowId}/download-attachment-1`}
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
      {
        header: "Attachment 2",
        accessorKey: "attachment_2",
        enableSorting: false,
        enableColumnFilter: false,
        cell: (cell) => {
          const attachment = cell.getValue();
          const rowId = cell.row.original.id;
          return attachment ? (
            <div className="d-flex gap-2">
              <a
                href={`${API_STREAM_BASE_URL}/homeVisit/${rowId}/view-attachment-2`}
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
                href={`${API_STREAM_BASE_URL}/homeVisit/${rowId}/download-attachment-2`}
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
      {
        header: "Created By",
        accessorKey: "created_by",
        enableSorting: true,
        enableColumnFilter: false,
        cell: (cell) => cell.getValue() || "-",
      },
      {
        header: "Created On",
        accessorKey: "created_at",
        enableSorting: true,
        enableColumnFilter: false,
        cell: (cell) => {
          const v = cell.getValue();
          return v ? new Date(v).toLocaleDateString() : "-";
        },
      },
      {
        header: "Updated By",
        accessorKey: "updated_by",
        enableSorting: true,
        enableColumnFilter: false,
        cell: (cell) => cell.getValue() || "-",
      },
      {
        header: "Updated On",
        accessorKey: "updated_at",
        enableSorting: true,
        enableColumnFilter: false,
        cell: (cell) => {
          const v = cell.getValue();
          return v ? new Date(v).toLocaleDateString() : "-";
        },
      },
    ],
    []
  );

  return (
    <>
      <div className="mb-3 d-flex justify-content-between align-items-center">
        <h5 className="mb-0">Home Visits</h5>
        <Button color="primary" size="sm" onClick={handleAdd}>
          <i className="bx bx-plus me-1"></i> Add Home Visit
        </Button>
      </div>

      {homeVisits.length === 0 ? (
        <div className="alert alert-info" role="alert">
          <i className="bx bx-info-circle me-2"></i>
          No home visits found. Click "Add Home Visit" to create one.
        </div>
      ) : (
        <TableContainer
          columns={columns}
          data={homeVisits}
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
          {editItem ? "Edit" : "Add"} Home Visit
        </ModalHeader>

        <Form onSubmit={handleSubmit(onSubmit)}>
          <ModalBody>
            <Row>
              <Col md={6}>
                <FormGroup>
                  <Label for="Visit_Date">
                    Visit Date <span className="text-danger">*</span>
                  </Label>
                  <Controller
                    name="Visit_Date"
                    control={control}
                    rules={{ required: "Visit date is required" }}
                    render={({ field }) => (
                      <Input id="Visit_Date" type="date" invalid={!!errors.Visit_Date} {...field} />
                    )}
                  />
                  {errors.Visit_Date && <FormFeedback>{errors.Visit_Date.message}</FormFeedback>}
                </FormGroup>
              </Col>

              <Col md={6}>
                <FormGroup>
                  <Label for="Representative">
                    Representative <span className="text-danger">*</span>
                  </Label>
                  <Controller
                    name="Representative"
                    control={control}
                    rules={{ required: "Representative is required" }}
                    render={({ field }) => (
                      <Input id="Representative" type="text" invalid={!!errors.Representative} {...field} />
                    )}
                  />
                  {errors.Representative && <FormFeedback>{errors.Representative.message}</FormFeedback>}
                </FormGroup>
              </Col>

              <Col md={12}>
                <FormGroup>
                  <Label for="Comments">Comments</Label>
                  <Controller
                    name="Comments"
                    control={control}
                    render={({ field }) => <Input id="Comments" type="textarea" rows="5" {...field} />}
                  />
                </FormGroup>
              </Col>

              <Col md={6}>
                <FormGroup>
                  <Label for="Attachment_1">Attachment 1</Label>
                  <Controller
                    name="Attachment_1"
                    control={control}
                    render={({ field: { onChange, value, ...field } }) => (
                      <Input
                        id="Attachment_1"
                        type="file"
                        onChange={(e) => onChange(e.target.files)}
                        invalid={!!errors.Attachment_1}
                        {...field}
                      />
                    )}
                  />
                  {errors.Attachment_1 && <FormFeedback>{errors.Attachment_1.message}</FormFeedback>}
                  {editItem && editItem.attachment_1 && (
                    <small className="text-muted d-block mt-1">
                      Current: {editItem.attachment_1_filename || "attachment_1"}
                    </small>
                  )}
                </FormGroup>
              </Col>

              <Col md={6}>
                <FormGroup>
                  <Label for="Attachment_2">Attachment 2</Label>
                  <Controller
                    name="Attachment_2"
                    control={control}
                    render={({ field: { onChange, value, ...field } }) => (
                      <Input
                        id="Attachment_2"
                        type="file"
                        onChange={(e) => onChange(e.target.files)}
                        invalid={!!errors.Attachment_2}
                        {...field}
                      />
                    )}
                  />
                  {errors.Attachment_2 && <FormFeedback>{errors.Attachment_2.message}</FormFeedback>}
                  {editItem && editItem.attachment_2 && (
                    <small className="text-muted d-block mt-1">
                      Current: {editItem.attachment_2_filename || "attachment_2"}
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

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        toggle={hideDeleteConfirmation}
        onConfirm={confirmDelete}
        title="Delete Home Visit"
        message={deleteItem?.message}
        itemName={deleteItem?.name}
        itemType={deleteItem?.type}
        loading={deleteLoading}
      />
    </>
  );
};

export default HomeVisitsTab;

