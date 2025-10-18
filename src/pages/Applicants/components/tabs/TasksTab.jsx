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
import { API_BASE_URL } from "../../../../helpers/url_helper";
import { getUmmahAidUser } from "../../../../helpers/userStorage";

const TasksTab = ({ applicantId, tasks, onUpdate, showAlert }) => {
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
      Task_Description: "",
      Date_Required: "",
      Status: "",
    },
  });

  useEffect(() => {
    if (modalOpen) {
      reset({
        Task_Description: editItem?.task_description || "",
        Date_Required: editItem?.date_required || "",
        Status: editItem?.status || "",
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
        task_description: data.Task_Description,
        date_required: data.Date_Required || null,
        status: data.Status,
      };

      if (editItem) {
        payload.updated_by = currentUser?.username || "system";
        await axiosApi.put(`${API_BASE_URL}/tasks/${editItem.id}`, payload);
        showAlert("Task has been updated successfully", "success");
      } else {
        payload.created_by = currentUser?.username || "system";
        await axiosApi.post(`${API_BASE_URL}/tasks`, payload);
        showAlert("Task has been added successfully", "success");
      }

      onUpdate();
      toggleModal();
    } catch (error) {
      console.error("Error saving task:", error);
      showAlert(error?.response?.data?.message || "Operation failed", "danger");
    }
  };

  const handleDelete = () => {
    if (!editItem) return;

    const taskName = editItem.task_description || editItem.title || 'Unknown Task';
    
    showDeleteConfirmation({
      id: editItem.id,
      name: taskName,
      type: "task",
      message: "This task will be permanently removed from the system."
    }, async () => {
      await axiosApi.delete(`${API_BASE_URL}/tasks/${editItem.id}`);
      showAlert("Task has been deleted successfully", "success");
      onUpdate();
      toggleModal();
    });
  };

  const columns = useMemo(
    () => [
      {
        header: "Task Description",
        accessorKey: "task_description",
        enableSorting: false,
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
        header: "Date Required",
        accessorKey: "date_required",
        enableSorting: true,
        enableColumnFilter: false,
        cell: (cell) => {
          const date = cell.getValue();
          return date ? new Date(date).toLocaleDateString() : "-";
        },
      },
      {
        header: "Status",
        accessorKey: "status",
        enableSorting: true,
        enableColumnFilter: false,
        cell: (cell) => {
          const status = cell.getValue() || "";
          const statusLower = status.toLowerCase();
          let badgeClass = "badge-soft-secondary";
          
          if (statusLower.includes("progress")) {
            badgeClass = "badge-soft-warning";
          } else if (statusLower.includes("complet")) {
            badgeClass = "badge-soft-success";
          }
          
          return <span className={`badge ${badgeClass}`}>{status || "-"}</span>;
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
    []
  );

  return (
    <>
      <div className="mb-3 d-flex justify-content-between align-items-center">
        <h5 className="mb-0">Tasks</h5>
        <Button color="primary" size="sm" onClick={handleAdd}>
          <i className="bx bx-plus me-1"></i> Add Task
        </Button>
      </div>

      {tasks.length === 0 ? (
        <div className="alert alert-info" role="alert">
          <i className="bx bx-info-circle me-2"></i>
          No tasks found. Click "Add Task" to create one.
        </div>
      ) : (
        <TableContainer
          columns={columns}
          data={tasks}
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
          {editItem ? "Edit" : "Add"} Task
        </ModalHeader>

        <Form onSubmit={handleSubmit(onSubmit)}>
          <ModalBody>
            <Row>
              <Col md={12}>
                <FormGroup>
                  <Label for="Task_Description">
                    Task Description <span className="text-danger">*</span>
                  </Label>
                  <Controller
                    name="Task_Description"
                    control={control}
                    rules={{ required: "Task description is required" }}
                    render={({ field }) => (
                      <Input
                        id="Task_Description"
                        type="textarea"
                        rows="4"
                        invalid={!!errors.Task_Description}
                        {...field}
                      />
                    )}
                  />
                  {errors.Task_Description && <FormFeedback>{errors.Task_Description.message}</FormFeedback>}
                </FormGroup>
              </Col>

              <Col md={6}>
                <FormGroup>
                  <Label for="Date_Required">Date Required</Label>
                  <Controller
                    name="Date_Required"
                    control={control}
                    render={({ field }) => <Input id="Date_Required" type="date" {...field} />}
                  />
                </FormGroup>
              </Col>

              <Col md={6}>
                <FormGroup>
                  <Label for="Status">Status</Label>
                  <Controller
                    name="Status"
                    control={control}
                    render={({ field }) => (
                      <Input id="Status" type="select" {...field}>
                        <option value="">Select Status</option>
                        <option value="Pending">Pending</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                      </Input>
                    )}
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

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        toggle={hideDeleteConfirmation}
        onConfirm={confirmDelete}
        title="Delete Task"
        message={deleteItem?.message}
        itemName={deleteItem?.name}
        itemType={deleteItem?.type}
        loading={deleteLoading}
      />
    </>
  );
};

export default TasksTab;

