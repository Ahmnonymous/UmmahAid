import React, { useEffect, useMemo, useState } from "react";
import {
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
  Button,
  Alert,
} from "reactstrap";
import { useForm, Controller, useWatch } from "react-hook-form";

const FREQUENCY_OPTIONS = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

const defaultValues = {
  Assistance_Type: "",
  Financial_Amount: "",
  Date_of_Assistance: "",
  Assisted_By: "",
  Sector: "",
  Program: "",
  Project: "",
  Give_To: "",
  Starting_Date: "",
  End_Date: "",
  Frequency: "",
};

const getDifferenceInDays = (start, end) => {
  const startDate = start ? new Date(start) : null;
  const endDate = end ? new Date(end) : null;
  if (!startDate || !endDate || Number.isNaN(startDate) || Number.isNaN(endDate)) {
    return null;
  }
  return Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
};

const RecurringInvoiceModal = ({
  isOpen,
  toggle,
  lookupData = {},
  recipientOptions = [],
  isOrgExecutive,
  onSave,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues,
  });

  const startingDate = useWatch({ control, name: "Starting_Date" });
  const endDate = useWatch({ control, name: "End_Date" });

  const periodDays = useMemo(
    () => getDifferenceInDays(startingDate, endDate),
    [startingDate, endDate]
  );

  useEffect(() => {
    if (!isOpen) {
      reset(defaultValues);
    }
  }, [isOpen, reset]);

  const handleSave = async (values) => {
    try {
      setIsSubmitting(true);
      const result = await onSave(values);
      if (result !== false) {
        toggle();
      }
    } catch (error) {
      // Error handled upstream
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} toggle={toggle} centered size="lg" backdrop="static">
      <ModalHeader toggle={toggle}>
        <i className="bx bx-refresh me-2"></i>
        Add Recurring Invoice
      </ModalHeader>

      <Form onSubmit={handleSubmit(handleSave)}>
        <ModalBody>
          <Alert color="info" className="d-flex align-items-center" fade={false}>
            <i className="bx bx-calendar me-2 fs-4"></i>
            <div>
              Invoices will be auto-generated between the selected start and end
              dates. Maximum duration is 12 months.
            </div>
          </Alert>
          <Row>
            <Col md={6}>
              <FormGroup>
                <Label for="Recurring_Assistance_Type">
                  Assistance Type <span className="text-danger">*</span>
                </Label>
                <Controller
                  name="Assistance_Type"
                  control={control}
                  rules={{ required: "Assistance type is required" }}
                  render={({ field }) => (
                    <Input
                      id="Recurring_Assistance_Type"
                      type="select"
                      invalid={!!errors.Assistance_Type}
                      disabled={isOrgExecutive}
                      {...field}
                    >
                      <option value="">Select Type</option>
                      {(lookupData?.assistanceTypes || []).map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </Input>
                  )}
                />
                {errors.Assistance_Type && (
                  <FormFeedback>{errors.Assistance_Type.message}</FormFeedback>
                )}
              </FormGroup>
            </Col>

            <Col md={6}>
              <FormGroup>
                <Label for="Recurring_Financial_Amount">
                  Amount (R) <span className="text-danger">*</span>
                </Label>
                <Controller
                  name="Financial_Amount"
                  control={control}
                  rules={{
                    required: "Amount is required",
                    min: { value: 0, message: "Amount must be positive" },
                  }}
                  render={({ field }) => (
                    <Input
                      id="Recurring_Financial_Amount"
                      type="number"
                      step="0.01"
                      invalid={!!errors.Financial_Amount}
                      disabled={isOrgExecutive}
                      {...field}
                    />
                  )}
                />
                {errors.Financial_Amount && (
                  <FormFeedback>{errors.Financial_Amount.message}</FormFeedback>
                )}
              </FormGroup>
            </Col>

            <Col md={6}>
              <FormGroup>
                <Label for="Recurring_Date_of_Assistance">Initial Assistance Date</Label>
                <Controller
                  name="Date_of_Assistance"
                  control={control}
                  render={({ field }) => (
                    <Input
                      id="Recurring_Date_of_Assistance"
                      type="date"
                      disabled={isOrgExecutive}
                      {...field}
                    />
                  )}
                />
              </FormGroup>
            </Col>

            <Col md={6}>
              <FormGroup>
                <Label for="Recurring_Assisted_By">Assisted By</Label>
                <Controller
                  name="Assisted_By"
                  control={control}
                  render={({ field }) => (
                    <Input
                      id="Recurring_Assisted_By"
                      type="select"
                      disabled={isOrgExecutive}
                      {...field}
                    >
                      <option value="">Select Employee</option>
                      {(lookupData?.employees || []).map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {(emp.name || "")} {(emp.surname || "")}
                        </option>
                      ))}
                    </Input>
                  )}
                />
              </FormGroup>
            </Col>

            <Col md={6}>
              <FormGroup>
                <Label for="Recurring_Sector">Sector</Label>
                <Controller
                  name="Sector"
                  control={control}
                  render={({ field }) => (
                    <Input
                      id="Recurring_Sector"
                      type="text"
                      placeholder="Enter sector"
                      disabled={isOrgExecutive}
                      {...field}
                    />
                  )}
                />
              </FormGroup>
            </Col>

            <Col md={6}>
              <FormGroup>
                <Label for="Recurring_Program">Program</Label>
                <Controller
                  name="Program"
                  control={control}
                  render={({ field }) => (
                    <Input
                      id="Recurring_Program"
                      type="text"
                      placeholder="Enter program"
                      disabled={isOrgExecutive}
                      {...field}
                    />
                  )}
                />
              </FormGroup>
            </Col>

            <Col md={6}>
              <FormGroup>
                <Label for="Recurring_Project">Project</Label>
                <Controller
                  name="Project"
                  control={control}
                  render={({ field }) => (
                    <Input
                      id="Recurring_Project"
                      type="text"
                      placeholder="Enter project"
                      disabled={isOrgExecutive}
                      {...field}
                    />
                  )}
                />
              </FormGroup>
            </Col>

            <Col md={6}>
              <FormGroup>
                <Label for="Recurring_Give_To">Given To</Label>
                <Controller
                  name="Give_To"
                  control={control}
                  render={({ field }) => {
                    const optionList = recipientOptions.some(
                      (option) => option.value === field.value
                    )
                      ? recipientOptions
                      : field.value
                      ? [
                          ...recipientOptions,
                          {
                            key: "existing-recipient",
                            value: field.value,
                            label: field.value,
                          },
                        ]
                      : recipientOptions;

                    return (
                      <Input
                        id="Recurring_Give_To"
                        type="select"
                        disabled={isOrgExecutive}
                        value={field.value || ""}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        name={field.name}
                        innerRef={field.ref}
                      >
                        <option value="">Select recipient</option>
                        {optionList.map((option) => (
                          <option key={option.key} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </Input>
                    );
                  }}
                />
              </FormGroup>
            </Col>

            <Col md={6}>
              <FormGroup>
                <Label for="Recurring_Starting_Date">
                  Starting Date <span className="text-danger">*</span>
                </Label>
                <Controller
                  name="Starting_Date"
                  control={control}
                  rules={{ required: "Starting date is required" }}
                  render={({ field }) => (
                    <Input
                      id="Recurring_Starting_Date"
                      type="date"
                      invalid={!!errors.Starting_Date}
                      disabled={isOrgExecutive}
                      {...field}
                    />
                  )}
                />
                {errors.Starting_Date && (
                  <FormFeedback>{errors.Starting_Date.message}</FormFeedback>
                )}
              </FormGroup>
            </Col>

            <Col md={6}>
              <FormGroup>
                <Label for="Recurring_End_Date">
                  End Date <span className="text-danger">*</span>
                </Label>
                <Controller
                  name="End_Date"
                  control={control}
                  rules={{
                    required: "End date is required",
                    validate: (value) => {
                      if (!value) return "End date is required";
                      if (startingDate && value < startingDate) {
                        return "End date must be after start date";
                      }
                      if (periodDays !== null && periodDays > 366) {
                        return "Recurring schedules cannot exceed 12 months";
                      }
                      return true;
                    },
                  }}
                  render={({ field }) => (
                    <Input
                      id="Recurring_End_Date"
                      type="date"
                      invalid={!!errors.End_Date}
                      disabled={isOrgExecutive}
                      {...field}
                    />
                  )}
                />
                {errors.End_Date && (
                  <FormFeedback>{errors.End_Date.message}</FormFeedback>
                )}
              </FormGroup>
            </Col>

            <Col md={6}>
              <FormGroup>
                <Label for="Recurring_Frequency">
                  Frequency <span className="text-danger">*</span>
                </Label>
                <Controller
                  name="Frequency"
                  control={control}
                  rules={{ required: "Frequency is required" }}
                  render={({ field }) => (
                    <Input
                      id="Recurring_Frequency"
                      type="select"
                      invalid={!!errors.Frequency}
                      disabled={isOrgExecutive}
                      {...field}
                    >
                      <option value="">Select frequency</option>
                      {FREQUENCY_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </Input>
                  )}
                />
                {errors.Frequency && (
                  <FormFeedback>{errors.Frequency.message}</FormFeedback>
                )}
              </FormGroup>
            </Col>
          </Row>
        </ModalBody>

        <ModalFooter>
          <Button
            color="light"
            onClick={toggle}
            disabled={isSubmitting}
            className="me-2"
          >
            <i className="bx bx-x me-1"></i> Cancel
          </Button>
          <Button color="success" type="submit" disabled={isSubmitting || isOrgExecutive}>
            {isSubmitting ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" />
                Scheduling...
              </>
            ) : (
              <>
                <i className="bx bx-save me-1"></i> Schedule
              </>
            )}
          </Button>
        </ModalFooter>
      </Form>
    </Modal>
  );
};

export default RecurringInvoiceModal;


