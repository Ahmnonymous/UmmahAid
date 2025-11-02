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
import { useRole } from "../../../../helpers/useRole";
import axiosApi from "../../../../helpers/api_helper";
import { API_BASE_URL } from "../../../../helpers/url_helper";
import { getUmmahAidUser } from "../../../../helpers/userStorage";

const CommentsTab = ({ applicantId, comments, onUpdate, showAlert }) => {
  const { isOrgExecutive } = useRole(); // Read-only check
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
  } = useForm({
    defaultValues: {
      Comment: "",
      Comment_Date: "",
    },
  });

  useEffect(() => {
    if (modalOpen) {
      reset({
        Comment: editItem?.comment || "",
        Comment_Date: editItem?.comment_date || new Date().toISOString().split("T")[0],
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
        comment: data.Comment,
        comment_date: data.Comment_Date || new Date().toISOString().split("T")[0],
      };

      if (editItem) {
        payload.updated_by = currentUser?.username || "system";
        await axiosApi.put(`${API_BASE_URL}/comments/${editItem.id}`, payload);
        showAlert("Comment has been updated successfully", "success");
      } else {
        payload.created_by = currentUser?.username || "system";
        await axiosApi.post(`${API_BASE_URL}/comments`, payload);
        showAlert("Comment has been added successfully", "success");
      }

      onUpdate();
      toggleModal();
    } catch (error) {
      console.error("Error saving comment:", error);
      showAlert(error?.response?.data?.message || "Operation failed", "danger");
    }
  };

  const handleDelete = () => {
    if (!editItem) return;

    const commentName = editItem.comment ? editItem.comment.substring(0, 50) + (editItem.comment.length > 50 ? '...' : '') : 'Unknown Comment';
    
    showDeleteConfirmation({
      id: editItem.id,
      name: commentName,
      type: "comment",
      message: "This comment will be permanently removed from the system."
    }, async () => {
      await axiosApi.delete(`${API_BASE_URL}/comments/${editItem.id}`);
      showAlert("Comment has been deleted successfully", "success");
      onUpdate();
      if (modalOpen) {
        setModalOpen(false);
      }
    });
  };

  const columns = useMemo(
    () => [
      {
        header: "Comment",
        accessorKey: "comment",
        enableSorting: false,
        enableColumnFilter: false,
        cell: (cell) => (
          <span
            className="text-decoration-none"
            style={{ cursor: "pointer" }}
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
        header: "Date",
        accessorKey: "comment_date",
        enableSorting: true,
        enableColumnFilter: false,
        cell: (cell) => {
          const date = cell.getValue();
          return date ? new Date(date).toLocaleDateString() : "-";
        },
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
        <h5 className="mb-0">Comments</h5>
        {!isOrgExecutive && (
          <Button color="primary" size="sm" onClick={handleAdd}>
            <i className="bx bx-plus me-1"></i> Add Comment
          </Button>
        )}
      </div>

      {comments.length === 0 ? (
        <div className="alert alert-info" role="alert">
          <i className="bx bx-info-circle me-2"></i>
          No comments found. Click "Add Comment" to create one.
        </div>
      ) : (
        <TableContainer
          columns={columns}
          data={comments}
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
          {editItem ? "Edit" : "Add"} Comment
        </ModalHeader>

        <Form onSubmit={handleSubmit(onSubmit)}>
          <ModalBody>
            <Row>
              <Col md={12}>
                <FormGroup>
                  <Label for="Comment">
                    Comment <span className="text-danger">*</span>
                  </Label>
                  <Controller
                    name="Comment"
                    control={control}
                    rules={{ required: "Comment is required" }}
                    render={({ field }) => (
                      <Input
                        id="Comment"
                        type="textarea"
                        rows="5"
                        invalid={!!errors.Comment}
                        disabled={isOrgExecutive}
                        {...field}
                      />
                    )}
                  />
                  {errors.Comment && <FormFeedback>{errors.Comment.message}</FormFeedback>}
                </FormGroup>
              </Col>

              <Col md={6}>
                <FormGroup>
                  <Label for="Comment_Date">Comment Date</Label>
                  <Controller
                    name="Comment_Date"
                    control={control}
                    render={({ field }) => <Input id="Comment_Date" type="date" disabled={isOrgExecutive} {...field} />}
                  />
                </FormGroup>
              </Col>
            </Row>
          </ModalBody>

          <ModalFooter className="d-flex justify-content-between">
            <div>
              {editItem && !isOrgExecutive && (
                <Button color="danger" onClick={handleDelete} type="button" disabled={isSubmitting}>
                  <i className="bx bx-trash me-1"></i> Delete
                </Button>
              )}
            </div>

            <div>
              <Button color="light" onClick={toggleModal} disabled={isSubmitting} className="me-2">
                <i className="bx bx-x me-1"></i> Cancel
              </Button>
              {!isOrgExecutive && (
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
              )}
            </div>
          </ModalFooter>
        </Form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        toggle={hideDeleteConfirmation}
        onConfirm={confirmDelete}
        title="Delete Comment"
        message={deleteItem?.message}
        itemName={deleteItem?.name}
        itemType={deleteItem?.type}
        loading={deleteLoading}
      />
    </>
  );
};

export default CommentsTab;

