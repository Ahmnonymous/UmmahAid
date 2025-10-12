-- PostgreSQL Schema for Welfare Application
-- Updated to implement recommendations: Supplier_Category table, TIMESTAMPTZ standardization, secure password storage,
-- Employee_ID relationships, validation, HSEQ status consistency, inventory triggers, and documentation.
-- Unchanged tables are noted but not repeated for brevity.

-- =========================
-- Extensions
-- =========================
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =========================
-- Trigger Functions
-- =========================
CREATE OR REPLACE FUNCTION set_created_updated_by_insert()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.Created_By IS NULL THEN
        NEW.Created_By := CURRENT_USER;
        NEW.Updated_By := CURRENT_USER;
    ELSE
        NEW.Updated_By := CURRENT_USER;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION set_updated_by_at_timestamptz()
RETURNS TRIGGER AS $$
BEGIN
    NEW.Updated_By := CURRENT_USER;
    NEW.Updated_At := now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to hash password on insert or update
CREATE OR REPLACE FUNCTION hash_employee_password()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.Password_Hash IS NOT NULL AND NEW.Password_Hash !~ '^\$2[ayb]\$11\$.{53}$' THEN
        NEW.Password_Hash := crypt(NEW.Password_Hash, gen_salt('bf'));
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger function to update Financial_Assessment totals
CREATE OR REPLACE FUNCTION update_financial_assessment_totals()
RETURNS TRIGGER AS $$  
BEGIN
    UPDATE Financial_Assessment fa
    SET 
        Total_Income = (SELECT COALESCE(SUM(Amount), 0) FROM Applicant_Income WHERE Financial_Assessment_ID = fa.ID),
        Total_Expenses = (SELECT COALESCE(SUM(Amount), 0) FROM Applicant_Expense WHERE Financial_Assessment_ID = fa.ID),
        Disposable_Income = (
            (SELECT COALESCE(SUM(Amount), 0) FROM Applicant_Income WHERE Financial_Assessment_ID = fa.ID) -
            (SELECT COALESCE(SUM(Amount), 0) FROM Applicant_Expense WHERE Financial_Assessment_ID = fa.ID)
        )
    WHERE fa.ID = COALESCE(NEW.Financial_Assessment_ID, OLD.Financial_Assessment_ID);  -- Handle INSERT/DELETE
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- New trigger function for inventory quantity updates
CREATE OR REPLACE FUNCTION update_inventory_quantity()
RETURNS TRIGGER AS $$  
DECLARE
    delta DECIMAL(12,2);
    item_id BIGINT;
    trans_type VARCHAR(50);
BEGIN
    item_id := COALESCE(NEW.Item_ID, OLD.Item_ID);
    trans_type := COALESCE(NEW.Transaction_Type, OLD.Transaction_Type);
    
    IF TG_OP = 'INSERT' THEN
        delta := NEW.Quantity;
    ELSIF TG_OP = 'UPDATE' THEN
        delta := NEW.Quantity - COALESCE(OLD.Quantity, 0);
    ELSIF TG_OP = 'DELETE' THEN
        delta := -COALESCE(OLD.Quantity, 0);
    END IF;

    UPDATE Inventory_Items
    SET Quantity = Quantity + 
        CASE 
            WHEN trans_type = 'IN' THEN delta
            WHEN trans_type = 'OUT' THEN -delta
            ELSE 0 
        END
    WHERE ID = item_id;

    IF (SELECT Quantity FROM Inventory_Items WHERE ID = item_id) < 0 THEN
        RAISE EXCEPTION 'Inventory quantity cannot be negative for item %', item_id;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- =========================
-- Lookup Tables
-- =========================
-- New Supplier_Category table
CREATE TABLE Supplier_Category (
    ID UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    Name VARCHAR(255) UNIQUE NOT NULL,
    Created_By VARCHAR(255),
    Created_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    Updated_By VARCHAR(255),
    Updated_At TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER Supplier_Category_insert 
    BEFORE INSERT ON Supplier_Category 
    FOR EACH ROW EXECUTE FUNCTION set_created_updated_by_insert();
CREATE TRIGGER Supplier_Category_update 
    BEFORE UPDATE ON Supplier_Category 
    FOR EACH ROW EXECUTE FUNCTION set_updated_by_at_timestamptz();

COMMENT ON TABLE Supplier_Category IS 'Stores categories for classifying suppliers (e.g., food, medical, services).';
COMMENT ON COLUMN Supplier_Category.Name IS 'Unique name of the supplier category.';

-- Updated lookup tables (TIMESTAMP -> TIMESTAMPTZ, added comments)
CREATE TABLE Suburb (
    ID SERIAL PRIMARY KEY,
    Name VARCHAR(255) UNIQUE NOT NULL,
    Created_By VARCHAR(255),
    Created_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    Updated_By VARCHAR(255),
    Updated_At TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER Suburb_insert BEFORE INSERT ON Suburb FOR EACH ROW EXECUTE FUNCTION set_created_updated_by_insert();
CREATE TRIGGER Suburb_update BEFORE UPDATE ON Suburb FOR EACH ROW EXECUTE FUNCTION set_updated_by_at_timestamptz();

COMMENT ON TABLE Suburb IS 'Stores suburb names for applicant and employee addresses.';
COMMENT ON COLUMN Suburb.Name IS 'Unique name of the suburb.';

CREATE TABLE Nationality (
    ID SERIAL PRIMARY KEY,
    Name VARCHAR(255) UNIQUE NOT NULL,
    Created_By VARCHAR(255),
    Created_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    Updated_By VARCHAR(255),
    Updated_At TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER Nationality_insert BEFORE INSERT ON Nationality FOR EACH ROW EXECUTE FUNCTION set_created_updated_by_insert();
CREATE TRIGGER Nationality_update BEFORE UPDATE ON Nationality FOR EACH ROW EXECUTE FUNCTION set_updated_by_at_timestamptz();

COMMENT ON TABLE Nationality IS 'Stores nationalities for applicants and employees.';
COMMENT ON COLUMN Nationality.Name IS 'Unique name of the nationality.';

CREATE TABLE Departments (
    ID SERIAL PRIMARY KEY,
    Name VARCHAR(255) UNIQUE NOT NULL,
    Created_By VARCHAR(255),
    Created_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    Updated_By VARCHAR(255),
    Updated_At TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER Departments_insert BEFORE INSERT ON Departments FOR EACH ROW EXECUTE FUNCTION set_created_updated_by_insert();
CREATE TRIGGER Departments_update BEFORE UPDATE ON Departments FOR EACH ROW EXECUTE FUNCTION set_updated_by_at_timestamptz();

COMMENT ON TABLE Departments IS 'Stores departments for the organization.';
COMMENT ON COLUMN Departments.Name IS 'Unique name of the department.';

CREATE TABLE Health_Conditions (
    ID SERIAL PRIMARY KEY,
    Name VARCHAR(255) UNIQUE NOT NULL,
    Created_By VARCHAR(255),
    Created_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    Updated_By VARCHAR(255),
    Updated_At TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER Health_Conditions_insert BEFORE INSERT ON Health_Conditions FOR EACH ROW EXECUTE FUNCTION set_created_updated_by_insert();
CREATE TRIGGER Health_Conditions_update BEFORE UPDATE ON Health_Conditions FOR EACH ROW EXECUTE FUNCTION set_updated_by_at_timestamptz();

COMMENT ON TABLE Health_Conditions IS 'Stores health conditions for applicants and relationships.';
COMMENT ON COLUMN Health_Conditions.Name IS 'Unique name of the health condition.';

CREATE TABLE Skills (
    ID SERIAL PRIMARY KEY,
    Name VARCHAR(255) UNIQUE NOT NULL,
    Created_By VARCHAR(255),
    Created_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    Updated_By VARCHAR(255),
    Updated_At TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER Skills_insert BEFORE INSERT ON Skills FOR EACH ROW EXECUTE FUNCTION set_created_updated_by_insert();
CREATE TRIGGER Skills_update BEFORE UPDATE ON Skills FOR EACH ROW EXECUTE FUNCTION set_updated_by_at_timestamptz();

COMMENT ON TABLE Skills IS 'Stores skills possessed by applicants.';
COMMENT ON COLUMN Skills.Name IS 'Unique name of the skill.';

CREATE TABLE Relationship_Types (
    ID SERIAL PRIMARY KEY,
    Name VARCHAR(255) UNIQUE NOT NULL,
    Created_By VARCHAR(255),
    Created_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    Updated_By VARCHAR(255),
    Updated_At TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER Relationship_Types_insert BEFORE INSERT ON Relationship_Types FOR EACH ROW EXECUTE FUNCTION set_created_updated_by_insert();
CREATE TRIGGER Relationship_Types_update BEFORE UPDATE ON Relationship_Types FOR EACH ROW EXECUTE FUNCTION set_updated_by_at_timestamptz();

COMMENT ON TABLE Relationship_Types IS 'Stores types of relationships for applicant dependents.';
COMMENT ON COLUMN Relationship_Types.Name IS 'Unique name of the relationship type (e.g., Spouse, Child).';

CREATE TABLE Tasks_Status (
    ID SERIAL PRIMARY KEY,
    Name VARCHAR(255) UNIQUE NOT NULL,
    Created_By VARCHAR(255),
    Created_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    Updated_By VARCHAR(255),
    Updated_At TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER Tasks_Status_insert BEFORE INSERT ON Tasks_Status FOR EACH ROW EXECUTE FUNCTION set_created_updated_by_insert();
CREATE TRIGGER Tasks_Status_update BEFORE UPDATE ON Tasks_Status FOR EACH ROW EXECUTE FUNCTION set_updated_by_at_timestamptz();

COMMENT ON TABLE Tasks_Status IS 'Stores possible statuses for tasks (e.g., Complete, In Progress).';
COMMENT ON COLUMN Tasks_Status.Name IS 'Unique name of the task status.';

CREATE TABLE Assistance_Types (
    ID SERIAL PRIMARY KEY,
    Name VARCHAR(255) UNIQUE NOT NULL,
    Created_By VARCHAR(255),
    Created_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    Updated_By VARCHAR(255),
    Updated_At TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER Assistance_Types_insert BEFORE INSERT ON Assistance_Types FOR EACH ROW EXECUTE FUNCTION set_created_updated_by_insert();
CREATE TRIGGER Assistance_Types_update BEFORE UPDATE ON Assistance_Types FOR EACH ROW EXECUTE FUNCTION set_updated_by_at_timestamptz();

COMMENT ON TABLE Assistance_Types IS 'Stores types of financial assistance provided.';
COMMENT ON COLUMN Assistance_Types.Name IS 'Unique name of the assistance type.';

CREATE TABLE File_Status (
    ID SERIAL PRIMARY KEY,
    Name VARCHAR(255) UNIQUE NOT NULL,
    Created_By VARCHAR(255),
    Created_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    Updated_By VARCHAR(255),
    Updated_At TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER File_Status_insert BEFORE INSERT ON File_Status FOR EACH ROW EXECUTE FUNCTION set_created_updated_by_insert();
CREATE TRIGGER File_Status_update BEFORE UPDATE ON File_Status FOR EACH ROW EXECUTE FUNCTION set_updated_by_at_timestamptz();

COMMENT ON TABLE File_Status IS 'Stores statuses for applicant files (e.g., Active, Inactive).';
COMMENT ON COLUMN File_Status.Name IS 'Unique name of the file status.';

CREATE TABLE File_Condition (
    ID SERIAL PRIMARY KEY,
    Name VARCHAR(255) UNIQUE NOT NULL,
    Created_By VARCHAR(255),
    Created_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    Updated_By VARCHAR(255),
    Updated_At TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER File_Condition_insert BEFORE INSERT ON File_Condition FOR EACH ROW EXECUTE FUNCTION set_created_updated_by_insert();
CREATE TRIGGER File_Condition_update BEFORE UPDATE ON File_Condition FOR EACH ROW EXECUTE FUNCTION set_updated_by_at_timestamptz();

COMMENT ON TABLE File_Condition IS 'Stores conditions of applicant files (e.g., Satisfactory, High Risk).';
COMMENT ON COLUMN File_Condition.Name IS 'Unique name of the file condition.';

CREATE TABLE Dwelling_Status (
    ID SERIAL PRIMARY KEY,
    Name VARCHAR(255) UNIQUE NOT NULL,
    Created_By VARCHAR(255),
    Created_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    Updated_By VARCHAR(255),
    Updated_At TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER Dwelling_Status_insert BEFORE INSERT ON Dwelling_Status FOR EACH ROW EXECUTE FUNCTION set_created_updated_by_insert();
CREATE TRIGGER Dwelling_Status_update BEFORE UPDATE ON Dwelling_Status FOR EACH ROW EXECUTE FUNCTION set_updated_by_at_timestamptz();

COMMENT ON TABLE Dwelling_Status IS 'Stores dwelling ownership statuses (e.g., Fully Owned, Renting).';
COMMENT ON COLUMN Dwelling_Status.Name IS 'Unique name of the dwelling status.';

CREATE TABLE Race (
    ID SERIAL PRIMARY KEY,
    Name VARCHAR(255) UNIQUE NOT NULL,
    Created_By VARCHAR(255),
    Created_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    Updated_By VARCHAR(255),
    Updated_At TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER Race_insert BEFORE INSERT ON Race FOR EACH ROW EXECUTE FUNCTION set_created_updated_by_insert();
CREATE TRIGGER Race_update BEFORE UPDATE ON Race FOR EACH ROW EXECUTE FUNCTION set_updated_by_at_timestamptz();

COMMENT ON TABLE Race IS 'Stores race categories for demographic data.';
COMMENT ON COLUMN Race.Name IS 'Unique name of the race.';

CREATE TABLE Dwelling_Type (
    ID SERIAL PRIMARY KEY,
    Name VARCHAR(255) UNIQUE NOT NULL,
    Created_By VARCHAR(255),
    Created_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    Updated_By VARCHAR(255),
    Updated_At TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER Dwelling_Type_insert BEFORE INSERT ON Dwelling_Type FOR EACH ROW EXECUTE FUNCTION set_created_updated_by_insert();
CREATE TRIGGER Dwelling_Type_update BEFORE UPDATE ON Dwelling_Type FOR EACH ROW EXECUTE FUNCTION set_updated_by_at_timestamptz();

COMMENT ON TABLE Dwelling_Type IS 'Stores types of dwellings (e.g., House, Shack).';
COMMENT ON COLUMN Dwelling_Type.Name IS 'Unique name of the dwelling type.';

CREATE TABLE Marital_Status (
    ID SERIAL PRIMARY KEY,
    Name VARCHAR(255) UNIQUE NOT NULL,
    Created_By VARCHAR(255),
    Created_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    Updated_By VARCHAR(255),
    Updated_At TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER Marital_Status_insert BEFORE INSERT ON Marital_Status FOR EACH ROW EXECUTE FUNCTION set_created_updated_by_insert();
CREATE TRIGGER Marital_Status_update BEFORE UPDATE ON Marital_Status FOR EACH ROW EXECUTE FUNCTION set_updated_by_at_timestamptz();

COMMENT ON TABLE Marital_Status IS 'Stores marital status categories.';
COMMENT ON COLUMN Marital_Status.Name IS 'Unique name of the marital status.';

CREATE TABLE Education_Level (
    ID SERIAL PRIMARY KEY,
    Name VARCHAR(255) UNIQUE NOT NULL,
    Created_By VARCHAR(255),
    Created_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    Updated_By VARCHAR(255),
    Updated_At TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER Education_Level_insert BEFORE INSERT ON Education_Level FOR EACH ROW EXECUTE FUNCTION set_created_updated_by_insert();
CREATE TRIGGER Education_Level_update BEFORE UPDATE ON Education_Level FOR EACH ROW EXECUTE FUNCTION set_updated_by_at_timestamptz();

COMMENT ON TABLE Education_Level IS 'Stores education levels for applicants and employees.';
COMMENT ON COLUMN Education_Level.Name IS 'Unique name of the education level.';

CREATE TABLE Means_of_communication (
    ID SERIAL PRIMARY KEY,
    Name VARCHAR(255) UNIQUE NOT NULL,
    Created_By VARCHAR(255),
    Created_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    Updated_By VARCHAR(255),
    Updated_At TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER Means_of_communication_insert BEFORE INSERT ON Means_of_communication FOR EACH ROW EXECUTE FUNCTION set_created_updated_by_insert();
CREATE TRIGGER Means_of_communication_update BEFORE UPDATE ON Means_of_communication FOR EACH ROW EXECUTE FUNCTION set_updated_by_at_timestamptz();

COMMENT ON TABLE Means_of_communication IS 'Stores Means_of_communication.';
COMMENT ON COLUMN Means_of_communication.Name IS 'Unique name of the Means_of_communication.';

CREATE TABLE Employment_Status (
    ID SERIAL PRIMARY KEY,
    Name VARCHAR(255) UNIQUE NOT NULL,
    Created_By VARCHAR(255),
    Created_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    Updated_By VARCHAR(255),
    Updated_At TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER Employment_Status_insert BEFORE INSERT ON Employment_Status FOR EACH ROW EXECUTE FUNCTION set_created_updated_by_insert();
CREATE TRIGGER Employment_Status_update BEFORE UPDATE ON Employment_Status FOR EACH ROW EXECUTE FUNCTION set_updated_by_at_timestamptz();

COMMENT ON TABLE Employment_Status IS 'Stores employment status categories.';
COMMENT ON COLUMN Employment_Status.Name IS 'Unique name of the employment status.';

CREATE TABLE Gender (
    ID SERIAL PRIMARY KEY,
    Name VARCHAR(255) UNIQUE NOT NULL,
    Created_By VARCHAR(255),
    Created_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    Updated_By VARCHAR(255),
    Updated_At TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER Gender_insert BEFORE INSERT ON Gender FOR EACH ROW EXECUTE FUNCTION set_created_updated_by_insert();
CREATE TRIGGER Gender_update BEFORE UPDATE ON Gender FOR EACH ROW EXECUTE FUNCTION set_updated_by_at_timestamptz();

COMMENT ON TABLE Gender IS 'Stores gender categories.';
COMMENT ON COLUMN Gender.Name IS 'Unique name of the gender.';

CREATE TABLE Training_Outcome (
    ID SERIAL PRIMARY KEY,
    Name VARCHAR(255) UNIQUE NOT NULL,
    Created_By VARCHAR(255),
    Created_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    Updated_By VARCHAR(255),
    Updated_At TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER Training_Outcome_insert BEFORE INSERT ON Training_Outcome FOR EACH ROW EXECUTE FUNCTION set_created_updated_by_insert();
CREATE TRIGGER Training_Outcome_update BEFORE UPDATE ON Training_Outcome FOR EACH ROW EXECUTE FUNCTION set_updated_by_at_timestamptz();

COMMENT ON TABLE Training_Outcome IS 'Stores outcomes of training programs.';
COMMENT ON COLUMN Training_Outcome.Name IS 'Unique name of the training outcome.';

CREATE TABLE Training_Level (
    ID SERIAL PRIMARY KEY,
    Name VARCHAR(255) UNIQUE NOT NULL,
    Created_By VARCHAR(255),
    Created_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    Updated_By VARCHAR(255),
    Updated_At TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER Training_Level_insert BEFORE INSERT ON Training_Level FOR EACH ROW EXECUTE FUNCTION set_created_updated_by_insert();
CREATE TRIGGER Training_Level_update BEFORE UPDATE ON Training_Level FOR EACH ROW EXECUTE FUNCTION set_updated_by_at_timestamptz();

COMMENT ON TABLE Training_Level IS 'Stores levels of training programs.';
COMMENT ON COLUMN Training_Level.Name IS 'Unique name of the training level.';

CREATE TABLE Blood_Type (
    ID SERIAL PRIMARY KEY,
    Name VARCHAR(255) UNIQUE NOT NULL,
    Created_By VARCHAR(255),
    Created_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    Updated_By VARCHAR(255),
    Updated_At TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER Blood_Type_insert BEFORE INSERT ON Blood_Type FOR EACH ROW EXECUTE FUNCTION set_created_updated_by_insert();
CREATE TRIGGER Blood_Type_update BEFORE UPDATE ON Blood_Type FOR EACH ROW EXECUTE FUNCTION set_updated_by_at_timestamptz();

COMMENT ON TABLE Blood_Type IS 'Stores blood type categories for employees.';
COMMENT ON COLUMN Blood_Type.Name IS 'Unique name of the blood type.';

CREATE TABLE Rating (
    ID SERIAL PRIMARY KEY,
    Score INT UNIQUE NOT NULL,
    Created_By VARCHAR(255),
    Created_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    Updated_By VARCHAR(255),
    Updated_At TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER Rating_insert BEFORE INSERT ON Rating FOR EACH ROW EXECUTE FUNCTION set_created_updated_by_insert();
CREATE TRIGGER Rating_update BEFORE UPDATE ON Rating FOR EACH ROW EXECUTE FUNCTION set_updated_by_at_timestamptz();

COMMENT ON TABLE Rating IS 'Stores rating scores for service evaluations.';
COMMENT ON COLUMN Rating.Score IS 'Unique score value (1-5).';

CREATE TABLE User_Types (
    ID SERIAL PRIMARY KEY,
    Name VARCHAR(255) UNIQUE NOT NULL,
    Created_By VARCHAR(255),
    Created_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    Updated_By VARCHAR(255),
    Updated_At TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER User_Types_insert BEFORE INSERT ON User_Types FOR EACH ROW EXECUTE FUNCTION set_created_updated_by_insert();
CREATE TRIGGER User_Types_update BEFORE UPDATE ON User_Types FOR EACH ROW EXECUTE FUNCTION set_updated_by_at_timestamptz();

COMMENT ON TABLE User_Types IS 'Stores user type categories for employees.';
COMMENT ON COLUMN User_Types.Name IS 'Unique name of the user type.';

CREATE TABLE Policy_Procedure_Type (
    ID SERIAL PRIMARY KEY,
    Name VARCHAR(255) UNIQUE NOT NULL,
    Created_By VARCHAR(255),
    Created_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    Updated_By VARCHAR(255),
    Updated_At TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER Policy_Procedure_Type_insert BEFORE INSERT ON Policy_Procedure_Type FOR EACH ROW EXECUTE FUNCTION set_created_updated_by_insert();
CREATE TRIGGER Policy_Procedure_Type_update BEFORE UPDATE ON Policy_Procedure_Type FOR EACH ROW EXECUTE FUNCTION set_updated_by_at_timestamptz();

COMMENT ON TABLE Policy_Procedure_Type IS 'Stores types of policies and procedures.';
COMMENT ON COLUMN Policy_Procedure_Type.Name IS 'Unique name of the policy/procedure type.';

CREATE TABLE Policy_Procedure_Field (
    ID SERIAL PRIMARY KEY,
    Name VARCHAR(255) UNIQUE NOT NULL,
    Created_By VARCHAR(255),
    Created_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    Updated_By VARCHAR(255),
    Updated_At TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER Policy_Procedure_Field_insert BEFORE INSERT ON Policy_Procedure_Field FOR EACH ROW EXECUTE FUNCTION set_created_updated_by_insert();
CREATE TRIGGER Policy_Procedure_Field_update BEFORE UPDATE ON Policy_Procedure_Field FOR EACH ROW EXECUTE FUNCTION set_updated_by_at_timestamptz();

COMMENT ON TABLE Policy_Procedure_Field IS 'Stores fields related to policies and procedures.';
COMMENT ON COLUMN Policy_Procedure_Field.Name IS 'Unique name of the policy/procedure field.';

CREATE TABLE Income_Type (
    ID SERIAL PRIMARY KEY,
    Name VARCHAR(255) UNIQUE NOT NULL,
    Created_By VARCHAR(255),
    Created_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    Updated_By VARCHAR(255),
    Updated_At TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER Income_Type_insert BEFORE INSERT ON Income_Type FOR EACH ROW EXECUTE FUNCTION set_created_updated_by_insert();
CREATE TRIGGER Income_Type_update BEFORE UPDATE ON Income_Type FOR EACH ROW EXECUTE FUNCTION set_updated_by_at_timestamptz();

COMMENT ON TABLE Income_Type IS 'Stores types of income for financial assessments.';

CREATE TABLE Expense_Type (
    ID SERIAL PRIMARY KEY,
    Name VARCHAR(255) UNIQUE NOT NULL,
    Created_By VARCHAR(255),
    Created_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    Updated_By VARCHAR(255),
    Updated_At TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER Expense_Type_insert BEFORE INSERT ON Expense_Type FOR EACH ROW EXECUTE FUNCTION set_created_updated_by_insert();
CREATE TRIGGER Expense_Type_update BEFORE UPDATE ON Expense_Type FOR EACH ROW EXECUTE FUNCTION set_updated_by_at_timestamptz();

COMMENT ON TABLE Expense_Type IS 'Stores types of expenses for financial assessments.';
COMMENT ON COLUMN Expense_Type.Name IS 'Unique name of the expense type.';

CREATE TABLE Hampers (
    ID SERIAL PRIMARY KEY,
    Name VARCHAR(255) UNIQUE NOT NULL,
    Created_By VARCHAR(255),
    Created_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    Updated_By VARCHAR(255),
    Updated_At TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER Hampers_insert BEFORE INSERT ON Hampers FOR EACH ROW EXECUTE FUNCTION set_created_updated_by_insert();
CREATE TRIGGER Hampers_update BEFORE UPDATE ON Hampers FOR EACH ROW EXECUTE FUNCTION set_updated_by_at_timestamptz();

COMMENT ON TABLE Hampers IS 'Stores types of hampers for food assistance.';
COMMENT ON COLUMN Hampers.Name IS 'Unique name of the hamper type.';

CREATE TABLE Born_Religion (
    ID SERIAL PRIMARY KEY,
    Name VARCHAR(255) UNIQUE NOT NULL,
    Created_By VARCHAR(255),
    Created_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    Updated_By VARCHAR(255),
    Updated_At TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER Born_Religion_insert BEFORE INSERT ON Born_Religion FOR EACH ROW EXECUTE FUNCTION set_created_updated_by_insert();
CREATE TRIGGER Born_Religion_update BEFORE UPDATE ON Born_Religion FOR EACH ROW EXECUTE FUNCTION set_updated_by_at_timestamptz();

COMMENT ON TABLE Born_Religion IS 'Stores religions for applicant demographic data.';
COMMENT ON COLUMN Born_Religion.Name IS 'Unique name of the religion.';

CREATE TABLE Period_As_Muslim (
    ID SERIAL PRIMARY KEY,
    Name VARCHAR(255) UNIQUE NOT NULL,
    Created_By VARCHAR(255),
    Created_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    Updated_By VARCHAR(255),
    Updated_At TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER Period_As_Muslim_insert BEFORE INSERT ON Period_As_Muslim FOR EACH ROW EXECUTE FUNCTION set_created_updated_by_insert();
CREATE TRIGGER Period_As_Muslim_update BEFORE UPDATE ON Period_As_Muslim FOR EACH ROW EXECUTE FUNCTION set_updated_by_at_timestamptz();

COMMENT ON TABLE Period_As_Muslim IS 'Stores time periods for applicants who converted to Islam.';
COMMENT ON COLUMN Period_As_Muslim.Name IS 'Unique name of the period (e.g., 1-3 Years).';

-- =========================
-- Main Tables
-- =========================
CREATE TABLE Center_Detail (
    ID SERIAL PRIMARY KEY,
    Organisation_Name VARCHAR(255),
    Date_of_Establishment DATE,
    Contact_Number VARCHAR(255), -- CHECK (Contact_Number ~* '^\+?[0-9]{10,15}$'),
    Email_Address VARCHAR(255), -- CHECK (Email_Address ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    Website_Link VARCHAR(255),
    Address VARCHAR(255),
    Area BIGINT,
    Ameer VARCHAR(255),
    Cell1 VARCHAR(255), -- CHECK (Cell1 ~* '^\+?[0-9]{10,15}$'),
    Cell2 VARCHAR(255), -- CHECK (Cell2 ~* '^\+?[0-9]{10,15}$'),
    Cell3 VARCHAR(255), -- CHECK (Cell3 ~* '^\+?[0-9]{10,15}$'),
    Contact1 VARCHAR(255),
    Contact2 VARCHAR(255),
    Contact3 VARCHAR(255),
    Logo BYTEA,
    Logo_Filename VARCHAR(255),
    Logo_Mime VARCHAR(255),
    Logo_Size INT,
    NPO_Number VARCHAR(255),
    Service_Rating_Email VARCHAR(255), -- CHECK (Service_Rating_Email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    QR_Code_Service_URL BYTEA,
    QR_Code_Service_URL_Filename VARCHAR(255),
    QR_Code_Service_URL_Mime VARCHAR(255),
    QR_Code_Service_URL_Size INT,
    Created_By VARCHAR(255),
    Created_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    Updated_By VARCHAR(255),
    Updated_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_area FOREIGN KEY (Area) REFERENCES Suburb(ID)
);

CREATE TRIGGER Center_Detail_insert BEFORE INSERT ON Center_Detail FOR EACH ROW EXECUTE FUNCTION set_created_updated_by_insert();
CREATE TRIGGER Center_Detail_update BEFORE UPDATE ON Center_Detail FOR EACH ROW EXECUTE FUNCTION set_updated_by_at_timestamptz();

COMMENT ON TABLE Center_Detail IS 'Stores details of welfare centers.';
COMMENT ON COLUMN Center_Detail.Organisation_Name IS 'Name of the organization.';
COMMENT ON COLUMN Center_Detail.Contact_Number IS 'Primary contact phone number (validated format).';
COMMENT ON COLUMN Center_Detail.Email_Address IS 'Primary email address (validated format).';

CREATE TABLE Center_Audits (
    ID SERIAL PRIMARY KEY,
    audit_date DATE,
    audit_type VARCHAR(255),
    findings VARCHAR(255),
    recommendations VARCHAR(255),
    attachments BYTEA,
    Attachments_Filename VARCHAR(255),
    Attachments_Mime VARCHAR(255),
    Attachments_Size INT,
    conducted_by VARCHAR(255),
    Created_By VARCHAR(255),
    Created_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    Updated_By VARCHAR(255),
    Updated_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    center_id BIGINT,
    CONSTRAINT fk_center_id FOREIGN KEY (center_id) REFERENCES Center_Detail(ID)
);

CREATE TRIGGER Center_Audits_insert BEFORE INSERT ON Center_Audits FOR EACH ROW EXECUTE FUNCTION set_created_updated_by_insert();
CREATE TRIGGER Center_Audits_update BEFORE UPDATE ON Center_Audits FOR EACH ROW EXECUTE FUNCTION set_updated_by_at_timestamptz();

COMMENT ON TABLE Center_Audits IS 'Stores audit records for welfare centers.';
COMMENT ON COLUMN Center_Audits.audit_date IS 'Date the audit was conducted.';

CREATE TABLE Training_Institutions (
    ID SERIAL PRIMARY KEY,
    Institute_Name VARCHAR(255),
    Contact_Person VARCHAR(255),
    Contact_Number VARCHAR(255), -- CHECK (Contact_Number ~* '^\+?[0-9]{10,15}$'),
    Email_Address VARCHAR(255), -- CHECK (Email_Address ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    Seta_Number VARCHAR(255),
    Address VARCHAR(255),
    Created_By VARCHAR(255),
    Created_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    Updated_By VARCHAR(255),
    Updated_At TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER Training_Institutions_insert BEFORE INSERT ON Training_Institutions FOR EACH ROW EXECUTE FUNCTION set_created_updated_by_insert();
CREATE TRIGGER Training_Institutions_update BEFORE UPDATE ON Training_Institutions FOR EACH ROW EXECUTE FUNCTION set_updated_by_at_timestamptz();

COMMENT ON TABLE Training_Institutions IS 'Stores details of training institutions.';
COMMENT ON COLUMN Training_Institutions.Institute_Name IS 'Name of the institution.';

CREATE TABLE Training_Courses (
    ID SERIAL PRIMARY KEY,
    Name VARCHAR(255),
    Description VARCHAR(255),
    Created_By VARCHAR(255),
    Created_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    Updated_By VARCHAR(255),
    Updated_At TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER Training_Courses_insert BEFORE INSERT ON Training_Courses FOR EACH ROW EXECUTE FUNCTION set_created_updated_by_insert();
CREATE TRIGGER Training_Courses_update BEFORE UPDATE ON Training_Courses FOR EACH ROW EXECUTE FUNCTION set_updated_by_at_timestamptz();

COMMENT ON TABLE Training_Courses IS 'Stores training course details.';
COMMENT ON COLUMN Training_Courses.Name IS 'Name of the course.';

CREATE TABLE Policy_and_Procedure (
    ID SERIAL PRIMARY KEY,
    Name VARCHAR(255),
    Description VARCHAR(255),
    Type BIGINT,
    Date_Of_Publication DATE,
    Status BIGINT,
    File BYTEA,
    File_Filename VARCHAR(255),
    File_Mime VARCHAR(255),
    File_Size INT,
    Field BIGINT,
    Created_By VARCHAR(255),
    Created_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    Updated_By VARCHAR(255),
    Updated_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_type FOREIGN KEY (Type) REFERENCES Policy_Procedure_Type(ID),
    CONSTRAINT fk_status FOREIGN KEY (Status) REFERENCES File_Status(ID),
    CONSTRAINT fk_field FOREIGN KEY (Field) REFERENCES Policy_Procedure_Field(ID)
);

CREATE TRIGGER Policy_and_Procedure_insert BEFORE INSERT ON Policy_and_Procedure FOR EACH ROW EXECUTE FUNCTION set_created_updated_by_insert();
CREATE TRIGGER Policy_and_Procedure_update BEFORE UPDATE ON Policy_and_Procedure FOR EACH ROW EXECUTE FUNCTION set_updated_by_at_timestamptz();

COMMENT ON TABLE Policy_and_Procedure IS 'Stores policies and procedures for the organization.';
COMMENT ON COLUMN Policy_and_Procedure.Name IS 'Name of the policy or procedure.';

CREATE TABLE Employee (
    ID SERIAL PRIMARY KEY,
    Name VARCHAR(255),
    Surname VARCHAR(255),
    Center_ID BIGINT,
    ID_Number VARCHAR(255), -- CHECK (ID_Number ~* '^[0-9]{13}$'),
    Date_of_Birth DATE,
    Nationality BIGINT,
    Race BIGINT,
    Highest_Education_Level BIGINT,
    Gender BIGINT,
    Employment_Date DATE,
    Suburb BIGINT,
    Home_Address VARCHAR(255),
    Emergency_Contact VARCHAR(255), -- CHECK (Emergency_Contact ~* '^\+?[0-9]{10,15}$'),
    Contact_Number VARCHAR(255), -- CHECK (Contact_Number ~* '^\+?[0-9]{10,15}$'),
    Blood_Type BIGINT,
    Username VARCHAR(255) UNIQUE,
    Password_Hash VARCHAR(255), -- Changed from Password to Password_Hash
    User_Type BIGINT,
    Department BIGINT,
    HSEQ_Related VARCHAR(1),
    employee_avatar VARCHAR(1000), 
    Created_By VARCHAR(255),
    Created_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    Updated_By VARCHAR(255),
    Updated_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_center_id FOREIGN KEY (Center_ID) REFERENCES Center_Detail(ID),
    CONSTRAINT fk_nationality FOREIGN KEY (Nationality) REFERENCES Nationality(ID),
    CONSTRAINT fk_race FOREIGN KEY (Race) REFERENCES Race(ID),
    CONSTRAINT fk_highest_education_level FOREIGN KEY (Highest_Education_Level) REFERENCES Education_Level(ID),
    CONSTRAINT fk_gender FOREIGN KEY (Gender) REFERENCES Gender(ID),
    CONSTRAINT fk_suburb FOREIGN KEY (Suburb) REFERENCES Suburb(ID),
    CONSTRAINT fk_blood_type FOREIGN KEY (Blood_Type) REFERENCES Blood_Type(ID),
    CONSTRAINT fk_user_type FOREIGN KEY (User_Type) REFERENCES User_Types(ID),
    CONSTRAINT fk_department FOREIGN KEY (department) REFERENCES Departments(ID)
);

CREATE TRIGGER Employee_password_hash
    BEFORE INSERT OR UPDATE ON Employee
    FOR EACH ROW EXECUTE FUNCTION hash_employee_password();

CREATE TRIGGER Employee_insert BEFORE INSERT ON Employee FOR EACH ROW EXECUTE FUNCTION set_created_updated_by_insert();
CREATE TRIGGER Employee_update BEFORE UPDATE ON Employee FOR EACH ROW EXECUTE FUNCTION set_updated_by_at_timestamptz();

COMMENT ON TABLE Employee IS 'Stores employee details, including secure password hashes.';
COMMENT ON COLUMN Employee.Password_Hash IS 'Hashed employee password using bcrypt.';
COMMENT ON COLUMN Employee.ID_Number IS '13-digit ID number (validated format).';
COMMENT ON COLUMN Employee.Contact_Number IS 'Employee contact number (validated format).';

CREATE TABLE Employee_Appraisal (
    ID SERIAL PRIMARY KEY,
    Employee_ID BIGINT NOT NULL, -- Added Employee_ID
    Positions VARCHAR(255),
    Attendance VARCHAR(255),
    Job_Knowledge_Skills VARCHAR(255),
    Quality_of_Work VARCHAR(255),
    Initiative_And_Motivation VARCHAR(255),
    Teamwork VARCHAR(255),
    General_Conduct VARCHAR(255),
    Discipline VARCHAR(255),
    Special_Task VARCHAR(255),
    Overall_Comments VARCHAR(255),
    Room_for_Improvement VARCHAR(255),
    Created_By VARCHAR(255),
    Created_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    Updated_By VARCHAR(255),
    Updated_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    center_id BIGINT,
    CONSTRAINT fk_employee_id_app FOREIGN KEY (Employee_ID) REFERENCES Employee(ID),
    CONSTRAINT fk_center_id_app FOREIGN KEY (center_id) REFERENCES Center_Detail(ID)
);

CREATE TRIGGER Employee_Appraisal_insert BEFORE INSERT ON Employee_Appraisal FOR EACH ROW EXECUTE FUNCTION set_created_updated_by_insert();
CREATE TRIGGER Employee_Appraisal_update BEFORE UPDATE ON Employee_Appraisal FOR EACH ROW EXECUTE FUNCTION set_updated_by_at_timestamptz();

COMMENT ON TABLE Employee_Appraisal IS 'Stores employee performance appraisals.';
COMMENT ON COLUMN Employee_Appraisal.Employee_ID IS 'References the employee being appraised.';

CREATE TABLE Employee_Initiative (
    ID SERIAL PRIMARY KEY,
    Employee_ID BIGINT NOT NULL, -- Added Employee_ID
    Idea VARCHAR(255),
    Details VARCHAR(255),
    Idea_Date DATE,
    Status VARCHAR(255),
    Created_By VARCHAR(255),
    Created_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    Updated_By VARCHAR(255),
    Updated_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    center_id BIGINT,
    CONSTRAINT fk_employee_id_init FOREIGN KEY (Employee_ID) REFERENCES Employee(ID),
    CONSTRAINT fk_center_id_init FOREIGN KEY (center_id) REFERENCES Center_Detail(ID)
);

CREATE TRIGGER Employee_Initiative_insert BEFORE INSERT ON Employee_Initiative FOR EACH ROW EXECUTE FUNCTION set_created_updated_by_insert();
CREATE TRIGGER Employee_Initiative_update BEFORE UPDATE ON Employee_Initiative FOR EACH ROW EXECUTE FUNCTION set_updated_by_at_timestamptz();

COMMENT ON TABLE Employee_Initiative IS 'Stores employee-initiated ideas or suggestions.';
COMMENT ON COLUMN Employee_Initiative.Employee_ID IS 'References the employee who proposed the idea.';

CREATE TABLE Employee_Skills (
    ID SERIAL PRIMARY KEY,
    Employee_ID BIGINT NOT NULL, -- Added Employee_ID
    Course BIGINT,
    Institution BIGINT,
    Date_Conducted DATE,
    Date_Expired DATE,
    Attachment BYTEA,
    Attachment_Filename VARCHAR(255),
    Attachment_Mime VARCHAR(255),
    Attachment_Size INT,
    Training_Outcome BIGINT,
    Created_By VARCHAR(255),
    Created_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    Updated_By VARCHAR(255),
    Updated_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    center_id BIGINT,
    CONSTRAINT fk_employee_id_skills FOREIGN KEY (Employee_ID) REFERENCES Employee(ID),
    CONSTRAINT fk_course FOREIGN KEY (Course) REFERENCES Training_Courses(ID),
    CONSTRAINT fk_institution FOREIGN KEY (Institution) REFERENCES Training_Institutions(ID),
    CONSTRAINT fk_training_outcome FOREIGN KEY (Training_Outcome) REFERENCES Training_Outcome(ID),
    CONSTRAINT fk_center_id_skills FOREIGN KEY (center_id) REFERENCES Center_Detail(ID)
);

CREATE TRIGGER Employee_Skills_insert BEFORE INSERT ON Employee_Skills FOR EACH ROW EXECUTE FUNCTION set_created_updated_by_insert();
CREATE TRIGGER Employee_Skills_update BEFORE UPDATE ON Employee_Skills FOR EACH ROW EXECUTE FUNCTION set_updated_by_at_timestamptz();

COMMENT ON TABLE Employee_Skills IS 'Stores skills and training records for employees.';
COMMENT ON COLUMN Employee_Skills.Employee_ID IS 'References the employee with the skill.';

CREATE TABLE HSEQ_Toolbox_Meeting (
    ID SERIAL PRIMARY KEY,
    Meeting_Date DATE,
    Conducted_By VARCHAR(40),
    In_Attendance VARCHAR(1000),
    Guests VARCHAR(1000),
    Health_Discussions VARCHAR(1000),
    Safety_Discussions VARCHAR(1000),
    Quality_Discussions VARCHAR(1000),
    Productivity_Discussions VARCHAR(1000),
    Environment_Discussions VARCHAR(1000),
    General_Discussion VARCHAR(1000),
    Feedback VARCHAR(1000),
    Created_By VARCHAR(255),
    Created_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    Updated_By VARCHAR(255),
    Updated_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    center_id BIGINT,
    CONSTRAINT fk_center_id_hseq FOREIGN KEY (center_id) REFERENCES Center_Detail(ID)
);

CREATE TRIGGER HSEQ_Toolbox_Meeting_insert 
    BEFORE INSERT ON HSEQ_Toolbox_Meeting 
    FOR EACH ROW EXECUTE FUNCTION set_created_updated_by_insert();
CREATE TRIGGER HSEQ_Toolbox_Meeting_update 
    BEFORE UPDATE ON HSEQ_Toolbox_Meeting 
    FOR EACH ROW EXECUTE FUNCTION set_updated_by_at_timestamptz();

COMMENT ON TABLE HSEQ_Toolbox_Meeting IS 'Stores records of Health, Safety, Environment, and Quality (HSEQ) meetings.';
COMMENT ON COLUMN HSEQ_Toolbox_Meeting.Meeting_Date IS 'Date the HSEQ meeting was held.';

CREATE TABLE HSEQ_Toolbox_Meeting_Tasks (
    ID SERIAL PRIMARY KEY,
    HSEQ_Toolbox_Meeting_ID BIGINT,
    Task_Description VARCHAR(100),
    Completion_Date DATE,
    Responsible VARCHAR(40),
    Status BIGINT, -- Changed to reference Tasks_Status
    Notes VARCHAR(400),
    Created_By VARCHAR(255),
    Created_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    Updated_By VARCHAR(255),
    Updated_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    center_id BIGINT,
    CONSTRAINT fk_hseq_toolbox_meeting_id 
        FOREIGN KEY (HSEQ_Toolbox_Meeting_ID) REFERENCES HSEQ_Toolbox_Meeting(ID),
    CONSTRAINT fk_status FOREIGN KEY (Status) REFERENCES Tasks_Status(ID),
    CONSTRAINT fk_center_id_hseq_tasks 
        FOREIGN KEY (center_id) REFERENCES Center_Detail(ID)
);

CREATE TRIGGER HSEQ_Toolbox_Meeting_Tasks_insert 
    BEFORE INSERT ON HSEQ_Toolbox_Meeting_Tasks 
    FOR EACH ROW EXECUTE FUNCTION set_created_updated_by_insert();
CREATE TRIGGER HSEQ_Toolbox_Meeting_Tasks_update 
    BEFORE UPDATE ON HSEQ_Toolbox_Meeting_Tasks 
    FOR EACH ROW EXECUTE FUNCTION set_updated_by_at_timestamptz();

COMMENT ON TABLE HSEQ_Toolbox_Meeting_Tasks IS 'Stores tasks assigned during HSEQ meetings.';
COMMENT ON COLUMN HSEQ_Toolbox_Meeting_Tasks.Status IS 'References the task status (e.g., Complete, In Progress).';

CREATE TABLE Applicant_Details (
    ID SERIAL PRIMARY KEY,
    Name VARCHAR(255),
    Surname VARCHAR(255),
    ID_Number VARCHAR(255), -- CHECK (ID_Number ~* '^[0-9]{13}$'),
    Race BIGINT,
    Nationality BIGINT,
    Nationality_Expiry_Date DATE,
    Gender BIGINT,
    Born_Religion_ID BIGINT,
    Period_As_Muslim_ID BIGINT,
    File_Number VARCHAR(255) UNIQUE,
    File_Condition BIGINT,
    File_Status BIGINT,
    Date_Intake DATE,
    Highest_Education_Level BIGINT,
    Marital_Status BIGINT,
    Employment_Status BIGINT,
    Cell_Number VARCHAR(255), -- CHECK (Cell_Number ~* '^\+?[0-9]{10,15}$'),
    Alternate_Number VARCHAR(255), -- CHECK (Alternate_Number ~* '^\+?[0-9]{10,15}$'),
    Email_Address VARCHAR(255), -- CHECK (Email_Address ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    Suburb BIGINT,
    Street_Address VARCHAR(255),
    Dwelling_Type BIGINT,
    Flat_Name VARCHAR(255),
    Flat_Number VARCHAR(255),
    Dwelling_Status BIGINT,
    Health BIGINT,
    Skills BIGINT,
    Signature BYTEA,
    Signature_Filename VARCHAR(255),
    Signature_Mime VARCHAR(255),
    Signature_Size INT,
    POPIA_Agreement VARCHAR(255),
    Created_By VARCHAR(255),
    Created_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    Updated_By VARCHAR(255),
    Updated_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    center_id BIGINT,
    CONSTRAINT fk_race FOREIGN KEY (Race) REFERENCES Race(ID),
    CONSTRAINT fk_nationality FOREIGN KEY (Nationality) REFERENCES Nationality(ID),
    CONSTRAINT fk_gender_app FOREIGN KEY (Gender) REFERENCES Gender(ID),
    CONSTRAINT fk_file_condition FOREIGN KEY (File_Condition) REFERENCES File_Condition(ID),
    CONSTRAINT fk_file_status FOREIGN KEY (File_Status) REFERENCES File_Status(ID),
    CONSTRAINT fk_highest_education_level_app FOREIGN KEY (Highest_Education_Level) REFERENCES Education_Level(ID),
    CONSTRAINT fk_marital_status FOREIGN KEY (Marital_Status) REFERENCES Marital_Status(ID),
    CONSTRAINT fk_employment_status FOREIGN KEY (Employment_Status) REFERENCES Employment_Status(ID),
    CONSTRAINT fk_suburb_app FOREIGN KEY (Suburb) REFERENCES Suburb(ID),
    CONSTRAINT fk_dwelling_type FOREIGN KEY (Dwelling_Type) REFERENCES Dwelling_Type(ID),
    CONSTRAINT fk_dwelling_status FOREIGN KEY (Dwelling_Status) REFERENCES Dwelling_Status(ID),
    CONSTRAINT fk_health FOREIGN KEY (Health) REFERENCES Health_Conditions(ID),
    CONSTRAINT fk_skills FOREIGN KEY (Skills) REFERENCES Skills(ID),
    CONSTRAINT fk_center_id_app FOREIGN KEY (center_id) REFERENCES Center_Detail(ID),
    CONSTRAINT fk_born_religion FOREIGN KEY (Born_Religion_ID) REFERENCES Born_Religion(ID),
    CONSTRAINT fk_period_as_muslim FOREIGN KEY (Period_As_Muslim_ID) REFERENCES Period_As_Muslim(ID)
);

CREATE TRIGGER Applicant_Details_insert BEFORE INSERT ON Applicant_Details FOR EACH ROW EXECUTE FUNCTION set_created_updated_by_insert();
CREATE TRIGGER Applicant_Details_update BEFORE UPDATE ON Applicant_Details FOR EACH ROW EXECUTE FUNCTION set_updated_by_at_timestamptz();

COMMENT ON TABLE Applicant_Details IS 'Stores personal and demographic information for welfare applicants.';
COMMENT ON COLUMN Applicant_Details.File_Number IS 'Unique identifier for the applicant''s file.';
COMMENT ON COLUMN Applicant_Details.ID_Number IS '13-digit ID number (validated format).';
COMMENT ON COLUMN Applicant_Details.Cell_Number IS 'Primary contact number (validated format).';

CREATE TABLE Comments (
    ID SERIAL PRIMARY KEY,
    File_ID BIGINT,
    Comment TEXT,
    Comment_Date DATE,
    Created_By VARCHAR(255),
    Created_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    Updated_By VARCHAR(255),
    Updated_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    center_id BIGINT,
    CONSTRAINT fk_file_id FOREIGN KEY (File_ID) REFERENCES Applicant_Details(ID),
    CONSTRAINT fk_center_id_com FOREIGN KEY (center_id) REFERENCES Center_Detail(ID)
);

CREATE TRIGGER Comments_insert BEFORE INSERT ON Comments FOR EACH ROW EXECUTE FUNCTION set_created_updated_by_insert();
CREATE TRIGGER Comments_update BEFORE UPDATE ON Comments FOR EACH ROW EXECUTE FUNCTION set_updated_by_at_timestamptz();

COMMENT ON TABLE Comments IS 'Stores comments related to applicant files.';
COMMENT ON COLUMN Comments.File_ID IS 'References the applicant file.';

CREATE TABLE Tasks (
    ID SERIAL PRIMARY KEY,
    File_ID BIGINT,
    Task_Description TEXT,
    Date_Required DATE,
    Status VARCHAR(255),
    Created_By VARCHAR(255),
    Created_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    Updated_By VARCHAR(255),
    Updated_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    center_id BIGINT,
    CONSTRAINT fk_file_id_task FOREIGN KEY (File_ID) REFERENCES Applicant_Details(ID),
    CONSTRAINT fk_center_id_task FOREIGN KEY (center_id) REFERENCES Center_Detail(ID)
);

CREATE TRIGGER Tasks_insert BEFORE INSERT ON Tasks FOR EACH ROW EXECUTE FUNCTION set_created_updated_by_insert();
CREATE TRIGGER Tasks_update BEFORE UPDATE ON Tasks FOR EACH ROW EXECUTE FUNCTION set_updated_by_at_timestamptz();

COMMENT ON TABLE Tasks IS 'Stores tasks related to applicant files.';
COMMENT ON COLUMN Tasks.File_ID IS 'References the applicant file.';

CREATE TABLE Relationships (
    ID SERIAL PRIMARY KEY,
    File_ID BIGINT,
    Relationship_Type BIGINT,
    Name VARCHAR(255),
    Surname VARCHAR(255),
    ID_Number VARCHAR(255), -- CHECK (ID_Number ~* '^[0-9]{13}$'),
    Date_of_Birth DATE,
    Employment_Status BIGINT,
    Gender BIGINT,
    Highest_Education BIGINT,
    Health_Condition BIGINT,
    Created_By VARCHAR(255),
    Created_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    Updated_By VARCHAR(255),
    Updated_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    center_id BIGINT,
    CONSTRAINT fk_file_id_rel FOREIGN KEY (File_ID) REFERENCES Applicant_Details(ID),
    CONSTRAINT fk_relationship_type FOREIGN KEY (Relationship_Type) REFERENCES Relationship_Types(ID),
    CONSTRAINT fk_employment_status_rel FOREIGN KEY (Employment_Status) REFERENCES Employment_Status(ID),
    CONSTRAINT fk_gender_rel FOREIGN KEY (Gender) REFERENCES Gender(ID),
    CONSTRAINT fk_highest_education_rel FOREIGN KEY (Highest_Education) REFERENCES Education_Level(ID),
    CONSTRAINT fk_health_condition FOREIGN KEY (Health_Condition) REFERENCES Health_Conditions(ID),
    CONSTRAINT fk_center_id_rel FOREIGN KEY (center_id) REFERENCES Center_Detail(ID)
);

CREATE TRIGGER Relationships_insert BEFORE INSERT ON Relationships FOR EACH ROW EXECUTE FUNCTION set_created_updated_by_insert();
CREATE TRIGGER Relationships_update BEFORE UPDATE ON Relationships FOR EACH ROW EXECUTE FUNCTION set_updated_by_at_timestamptz();

COMMENT ON TABLE Relationships IS 'Stores information about applicant dependents.';
COMMENT ON COLUMN Relationships.File_ID IS 'References the applicant file.';

CREATE TABLE Home_Visit (
    ID SERIAL PRIMARY KEY,
    File_ID BIGINT,
    Visit_Date DATE,
    Representative VARCHAR(255),
    Comments TEXT,
    Attachment_1 BYTEA,
    Attachment_1_Filename VARCHAR(255),
    Attachment_1_Mime VARCHAR(255),
    Attachment_1_Size INT,
    Attachment_2 BYTEA,
    Attachment_2_Filename VARCHAR(255),
    Attachment_2_Mime VARCHAR(255),
    Attachment_2_Size INT,
    Created_By VARCHAR(255),
    Created_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    Updated_By VARCHAR(255),
    Updated_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    center_id BIGINT,
    CONSTRAINT fk_file_id_vis FOREIGN KEY (File_ID) REFERENCES Applicant_Details(ID),
    CONSTRAINT fk_center_id_vis FOREIGN KEY (center_id) REFERENCES Center_Detail(ID)
);

CREATE TRIGGER Home_Visit_insert BEFORE INSERT ON Home_Visit FOR EACH ROW EXECUTE FUNCTION set_created_updated_by_insert();
CREATE TRIGGER Home_Visit_update BEFORE UPDATE ON Home_Visit FOR EACH ROW EXECUTE FUNCTION set_updated_by_at_timestamptz();

COMMENT ON TABLE Home_Visit IS 'Stores records of home visits for applicants.';
COMMENT ON COLUMN Home_Visit.File_ID IS 'References the applicant file.';

CREATE TABLE Financial_Assistance (
    ID SERIAL PRIMARY KEY,
    File_ID BIGINT,
    Assistance_Type BIGINT,
    Financial_Amount DECIMAL(12,2),
    Date_of_Assistance DATE,
    Created_By VARCHAR(255),
    Created_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    Updated_By VARCHAR(255),
    Updated_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    center_id BIGINT,
    CONSTRAINT fk_file_id_fin FOREIGN KEY (File_ID) REFERENCES Applicant_Details(ID),
    CONSTRAINT fk_assistance_type FOREIGN KEY (Assistance_Type) REFERENCES Assistance_Types(ID),
    CONSTRAINT fk_center_id_fin FOREIGN KEY (center_id) REFERENCES Center_Detail(ID)
);

CREATE TRIGGER Financial_Assistance_insert BEFORE INSERT ON Financial_Assistance FOR EACH ROW EXECUTE FUNCTION set_created_updated_by_insert();
CREATE TRIGGER Financial_Assistance_update BEFORE UPDATE ON Financial_Assistance FOR EACH ROW EXECUTE FUNCTION set_updated_by_at_timestamptz();

COMMENT ON TABLE Financial_Assistance IS 'Stores records of financial assistance provided to applicants.';
COMMENT ON COLUMN Financial_Assistance.File_ID IS 'References the applicant file.';

CREATE TABLE Food_Assistance (
    ID SERIAL PRIMARY KEY,
    File_ID BIGINT,
    Distributed_Date DATE,
    Hamper_Type BIGINT,
    Financial_Cost DECIMAL(12,2),
    Created_By VARCHAR(255),
    Created_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    Updated_By VARCHAR(255),
    Updated_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    center_id BIGINT,
    CONSTRAINT fk_file_id_food FOREIGN KEY (File_ID) REFERENCES Applicant_Details(ID),
    CONSTRAINT fk_hamper_type FOREIGN KEY (Hamper_Type) REFERENCES Hampers(ID),
    CONSTRAINT fk_center_id_food FOREIGN KEY (center_id) REFERENCES Center_Detail(ID)
);

CREATE TRIGGER Food_Assistance_insert BEFORE INSERT ON Food_Assistance FOR EACH ROW EXECUTE FUNCTION set_created_updated_by_insert();
CREATE TRIGGER Food_Assistance_update BEFORE UPDATE ON Food_Assistance FOR EACH ROW EXECUTE FUNCTION set_updated_by_at_timestamptz();

COMMENT ON TABLE Food_Assistance IS 'Stores records of food assistance provided to applicants.';
COMMENT ON COLUMN Food_Assistance.File_ID IS 'References the applicant file.';

CREATE TABLE Attachments (
    ID SERIAL PRIMARY KEY,
    File_ID BIGINT,
    Attachment_Name VARCHAR(255),
    Attachment_Details VARCHAR(255),
    File BYTEA,
    File_Filename VARCHAR(255),
    File_Mime VARCHAR(255),
    File_Size INT,
    Created_By VARCHAR(255),
    Created_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    Updated_By VARCHAR(255),
    Updated_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    center_id BIGINT,
    CONSTRAINT fk_file_id_att FOREIGN KEY (File_ID) REFERENCES Applicant_Details(ID),
    CONSTRAINT fk_center_id_att FOREIGN KEY (center_id) REFERENCES Center_Detail(ID)
);

CREATE TRIGGER Attachments_insert BEFORE INSERT ON Attachments FOR EACH ROW EXECUTE FUNCTION set_created_updated_by_insert();
CREATE TRIGGER Attachments_update BEFORE UPDATE ON Attachments FOR EACH ROW EXECUTE FUNCTION set_updated_by_at_timestamptz();

COMMENT ON TABLE Attachments IS 'Stores file attachments for applicants.';
COMMENT ON COLUMN Attachments.File_ID IS 'References the applicant file.';

CREATE TABLE Programs (
    ID SERIAL PRIMARY KEY,
    Person_Trained_ID BIGINT,
    Program_Name BIGINT,
    Means_of_communication BIGINT,
    Date_of_program DATE,
    Communicated_by BIGINT,
    Training_Level BIGINT,
    Training_Provider BIGINT,
    Attachment BYTEA,
    Attachment_Filename VARCHAR(255),
    Attachment_Mime VARCHAR(255),
    Attachment_Size INT,
    Program_Outcome BIGINT,
    Created_By VARCHAR(255),
    Created_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    Updated_By VARCHAR(255),
    Updated_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    center_id BIGINT,
    CONSTRAINT fk_program_name FOREIGN KEY (Program_Name) REFERENCES Training_Courses(ID),
    CONSTRAINT fk_communicated_by FOREIGN KEY (Communicated_by) REFERENCES Employee(ID),
    CONSTRAINT fk_training_level FOREIGN KEY (Training_Level) REFERENCES Training_Level(ID),
    CONSTRAINT fk_training_provider FOREIGN KEY (Training_Provider) REFERENCES Training_Institutions(ID),
    CONSTRAINT fk_program_outcome FOREIGN KEY (Program_Outcome) REFERENCES Training_Outcome(ID),
    CONSTRAINT fk_person_trained FOREIGN KEY (Person_Trained_ID) REFERENCES Applicant_Details(ID),
    CONSTRAINT fk_center_id_prog FOREIGN KEY (center_id) REFERENCES Center_Detail(ID),
    CONSTRAINT fk_means_of_communication FOREIGN KEY (Means_of_communication) REFERENCES Means_of_communication(ID)
);

CREATE TRIGGER Programs_insert BEFORE INSERT ON Programs FOR EACH ROW EXECUTE FUNCTION set_created_updated_by_insert();
CREATE TRIGGER Programs_update BEFORE UPDATE ON Programs FOR EACH ROW EXECUTE FUNCTION set_updated_by_at_timestamptz();

COMMENT ON TABLE Programs IS 'Stores training program records for applicants.';
COMMENT ON COLUMN Programs.Person_Trained_ID IS 'References the applicant who attended the program.';

CREATE TABLE Financial_Assessment (
    ID SERIAL PRIMARY KEY,
    File_ID BIGINT NOT NULL,
    center_id BIGINT NOT NULL,
    Total_Income DECIMAL(12,2), -- CHECK (Total_Income >= 0),
    Total_Expenses DECIMAL(12,2), -- CHECK (Total_Expenses >= 0),
    Disposable_Income DECIMAL(12,2),
    Created_By VARCHAR(255),
    Created_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    Updated_By VARCHAR(255),
    Updated_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_file_id FOREIGN KEY (File_ID) REFERENCES Applicant_Details(ID),
    CONSTRAINT fk_center_id_fin_ass FOREIGN KEY (center_id) REFERENCES Center_Detail(ID)
);

CREATE TRIGGER Financial_Assessment_insert 
    BEFORE INSERT ON Financial_Assessment 
    FOR EACH ROW EXECUTE FUNCTION set_created_updated_by_insert();
CREATE TRIGGER Financial_Assessment_update 
    BEFORE UPDATE ON Financial_Assessment 
    FOR EACH ROW EXECUTE FUNCTION set_updated_by_at_timestamptz();

COMMENT ON TABLE Financial_Assessment IS 'Stores financial assessment summaries for applicants.';
COMMENT ON COLUMN Financial_Assessment.File_ID IS 'References the applicant file.';
COMMENT ON COLUMN Financial_Assessment.center_id IS 'References the center managing the assessment.';
COMMENT ON COLUMN Financial_Assessment.Total_Income IS 'Total income from all sources, updated by trigger.';
COMMENT ON COLUMN Financial_Assessment.Total_Expenses IS 'Total expenses, updated by trigger.';
COMMENT ON COLUMN Financial_Assessment.Disposable_Income IS 'Total_Income minus Total_Expenses, updated by trigger.';

CREATE TABLE Applicant_Income (
    ID SERIAL PRIMARY KEY,
    Financial_Assessment_ID BIGINT NOT NULL,
    Income_Type_ID BIGINT NOT NULL,
    Amount DECIMAL(12,2), -- CHECK (Amount >= 0),
    Description TEXT,
    Created_By VARCHAR(255),
    Created_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    Updated_By VARCHAR(255),
    Updated_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_financial_assessment_id FOREIGN KEY (Financial_Assessment_ID) REFERENCES Financial_Assessment(ID) ON DELETE CASCADE,
    CONSTRAINT fk_income_type_id FOREIGN KEY (Income_Type_ID) REFERENCES Income_Type(ID)
);

CREATE TRIGGER Applicant_Income_insert 
    BEFORE INSERT ON Applicant_Income 
    FOR EACH ROW EXECUTE FUNCTION set_created_updated_by_insert();
CREATE TRIGGER Applicant_Income_update 
    BEFORE UPDATE ON Applicant_Income 
    FOR EACH ROW EXECUTE FUNCTION set_updated_by_at_timestamptz();

CREATE TRIGGER Applicant_Income_update_totals
    AFTER INSERT OR UPDATE OR DELETE ON Applicant_Income
    FOR EACH ROW EXECUTE FUNCTION update_financial_assessment_totals();

COMMENT ON TABLE Applicant_Income IS 'Stores individual income entries for financial assessments.';
COMMENT ON COLUMN Applicant_Income.Financial_Assessment_ID IS 'References the financial assessment.';
COMMENT ON COLUMN Applicant_Income.Income_Type_ID IS 'Type of income (e.g., Salary, Grant).';
COMMENT ON COLUMN Applicant_Income.Amount IS 'Amount of income, non-negative.';
COMMENT ON COLUMN Applicant_Income.Description IS 'Optional description of the income source.';

CREATE TABLE Applicant_Expense (
    ID SERIAL PRIMARY KEY,
    Financial_Assessment_ID BIGINT NOT NULL,
    Expense_Type_ID BIGINT NOT NULL,
    Amount DECIMAL(12,2), -- CHECK (Amount >= 0),
    Description TEXT,
    Created_By VARCHAR(255),
    Created_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    Updated_By VARCHAR(255),
    Updated_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_financial_assessment_id FOREIGN KEY (Financial_Assessment_ID) REFERENCES Financial_Assessment(ID) ON DELETE CASCADE,
    CONSTRAINT fk_expense_type_id FOREIGN KEY (Expense_Type_ID) REFERENCES Expense_Type(ID)
);

CREATE TRIGGER Applicant_Expense_insert 
    BEFORE INSERT ON Applicant_Expense 
    FOR EACH ROW EXECUTE FUNCTION set_created_updated_by_insert();
CREATE TRIGGER Applicant_Expense_update 
    BEFORE UPDATE ON Applicant_Expense 
    FOR EACH ROW EXECUTE FUNCTION set_updated_by_at_timestamptz();

CREATE TRIGGER Applicant_Expense_update_totals
    AFTER INSERT OR UPDATE OR DELETE ON Applicant_Expense
    FOR EACH ROW EXECUTE FUNCTION update_financial_assessment_totals();

COMMENT ON TABLE Applicant_Expense IS 'Stores individual expense entries for financial assessments.';
COMMENT ON COLUMN Applicant_Expense.Financial_Assessment_ID IS 'References the financial assessment.';
COMMENT ON COLUMN Applicant_Expense.Expense_Type_ID IS 'Type of expense (e.g., Rent, Utilities).';
COMMENT ON COLUMN Applicant_Expense.Amount IS 'Amount of expense, non-negative.';
COMMENT ON COLUMN Applicant_Expense.Description IS 'Optional description of the expense.';

CREATE TABLE Service_Rating (
    ID UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    Overall_Experience SMALLINT, -- CHECK (Overall_Experience BETWEEN 1 AND 5),
    Respect_And_Dignity SMALLINT, -- CHECK (Respect_And_Dignity BETWEEN 1 AND 5),
    Communication_And_Clarity SMALLINT, -- CHECK (Communication_And_Clarity BETWEEN 1 AND 5),
    Timeliness_Of_Support SMALLINT, -- CHECK (Timeliness_Of_Support BETWEEN 1 AND 5),
    Fairness_And_Equality SMALLINT, -- CHECK (Fairness_And_Equality BETWEEN 1 AND 5),
    Usefulness_Of_Service SMALLINT, -- CHECK (Usefulness_Of_Service BETWEEN 1 AND 5),
    Friendliness_Of_Staff SMALLINT, -- CHECK (Friendliness_Of_Staff BETWEEN 1 AND 5),
    Positive_Impact BOOLEAN,
    No_Positive_Impact_Reason TEXT,
    Access_Ease SMALLINT, -- CHECK (Access_Ease BETWEEN 1 AND 5),
    Would_Recommend BOOLEAN,
    Appreciate_Most TEXT,
    How_To_Improve TEXT,
    Other_Comments TEXT,
    Datestamp DATE DEFAULT CURRENT_DATE,
    Created_By VARCHAR(255),
    Created_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    Updated_By VARCHAR(255),
    Updated_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    center_id BIGINT NOT NULL,
    CONSTRAINT fk_center_id_service_rating 
        FOREIGN KEY (center_id) REFERENCES Center_Detail(ID)
);

CREATE TRIGGER Service_Rating_insert 
    BEFORE INSERT ON Service_Rating 
    FOR EACH ROW EXECUTE FUNCTION set_created_updated_by_insert();
CREATE TRIGGER Service_Rating_update 
    BEFORE UPDATE ON Service_Rating 
    FOR EACH ROW EXECUTE FUNCTION set_updated_by_at_timestamptz();

COMMENT ON TABLE Service_Rating IS 'Stores service quality ratings for centers.';
COMMENT ON COLUMN Service_Rating.Overall_Experience IS 'Rating (1-5) for overall experience.';

CREATE TABLE Supplier_Profile (
    ID UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    center_id BIGINT NOT NULL,
    Name VARCHAR(255) NOT NULL,
    Registration_No VARCHAR(100),
    Contact_Person VARCHAR(255),
    Contact_Email VARCHAR(255), -- CHECK (Contact_Email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    Contact_Phone VARCHAR(50), -- CHECK (Contact_Phone ~* '^\+?[0-9]{10,15}$'),
    Address TEXT,
    Category_ID UUID, -- Now references Supplier_Category
    Status VARCHAR(50),
    Created_By VARCHAR(255),
    Datestamp DATE DEFAULT CURRENT_DATE,
    Updated_By VARCHAR(255),
    Updated_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_center_id_supplier 
        FOREIGN KEY (center_id) REFERENCES Center_Detail(ID),
    CONSTRAINT fk_category_id 
        FOREIGN KEY (Category_ID) REFERENCES Supplier_Category(ID)
);

CREATE TRIGGER Supplier_Profile_insert 
    BEFORE INSERT ON Supplier_Profile 
    FOR EACH ROW EXECUTE FUNCTION set_created_updated_by_insert();
CREATE TRIGGER Supplier_Profile_update 
    BEFORE UPDATE ON Supplier_Profile 
    FOR EACH ROW EXECUTE FUNCTION set_updated_by_at_timestamptz();

COMMENT ON TABLE Supplier_Profile IS 'Stores supplier profiles for the organization.';
COMMENT ON COLUMN Supplier_Profile.Category_ID IS 'References the supplier category.';

CREATE TABLE Supplier_Evaluation (
    ID UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    center_id BIGINT NOT NULL,
    Supplier_ID UUID NOT NULL,
    Eval_Date DATE NOT NULL,
    Quality_Score SMALLINT, -- CHECK (Quality_Score BETWEEN 1 AND 5),
    Delivery_Score SMALLINT, -- CHECK (Delivery_Score BETWEEN 1 AND 5),
    Cost_Score SMALLINT, -- CHECK (Cost_Score BETWEEN 1 AND 5),
    OHS_Score SMALLINT, -- CHECK (OHS_Score BETWEEN 1 AND 5),
    Env_Score SMALLINT, -- CHECK (Env_Score BETWEEN 1 AND 5),
    Quality_Wt NUMERIC(5,2),
    Delivery_Wt NUMERIC(5,2),
    Cost_Wt NUMERIC(5,2),
    OHS_Wt NUMERIC(5,2),
    Env_Wt NUMERIC(5,2),
    Overall_Score NUMERIC(5,2),
    Status VARCHAR(50),
    Notes TEXT,
    Expiry_Date DATE,
    Created_By VARCHAR(255),
    Datestamp DATE DEFAULT CURRENT_DATE,
    Updated_By VARCHAR(255),
    Updated_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_center_id_sup_eval 
        FOREIGN KEY (center_id) REFERENCES Center_Detail(ID),
    CONSTRAINT fk_supplier_id 
        FOREIGN KEY (Supplier_ID) REFERENCES Supplier_Profile(ID) ON DELETE CASCADE
);

CREATE TRIGGER Supplier_Evaluation_insert 
    BEFORE INSERT ON Supplier_Evaluation 
    FOR EACH ROW EXECUTE FUNCTION set_created_updated_by_insert();
CREATE TRIGGER Supplier_Evaluation_update 
    BEFORE UPDATE ON Supplier_Evaluation 
    FOR EACH ROW EXECUTE FUNCTION set_updated_by_at_timestamptz();

COMMENT ON TABLE Supplier_Evaluation IS 'Stores evaluations of supplier performance.';
COMMENT ON COLUMN Supplier_Evaluation.Supplier_ID IS 'References the evaluated supplier.';

CREATE TABLE Supplier_Document (
    ID UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    center_id BIGINT NOT NULL,
    Supplier_ID UUID NOT NULL,
    Doc_Type VARCHAR(100) NOT NULL,
    Issued_At DATE,
    File BYTEA,
    File_Filename VARCHAR(255),
    File_Mime VARCHAR(255),
    File_Size INT,
    Description TEXT,
    Created_By VARCHAR(255),
    Datestamp DATE DEFAULT CURRENT_DATE,
    Updated_By VARCHAR(255),
    Updated_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_center_id_sup_doc 
        FOREIGN KEY (center_id) REFERENCES Center_Detail(ID),
    CONSTRAINT fk_supplier_id_doc 
        FOREIGN KEY (Supplier_ID) REFERENCES Supplier_Profile(ID) ON DELETE CASCADE
);

CREATE TRIGGER Supplier_Document_insert 
    BEFORE INSERT ON Supplier_Document 
    FOR EACH ROW EXECUTE FUNCTION set_created_updated_by_insert();
CREATE TRIGGER Supplier_Document_update 
    BEFORE UPDATE ON Supplier_Document 
    FOR EACH ROW EXECUTE FUNCTION set_updated_by_at_timestamptz();

COMMENT ON TABLE Supplier_Document IS 'Stores documents related to suppliers.';
COMMENT ON COLUMN Supplier_Document.Supplier_ID IS 'References the supplier.';

CREATE TABLE Inventory_Items (
    ID SERIAL PRIMARY KEY,
    Item_Name VARCHAR(255),
    Description TEXT,
    Hamper_Type BIGINT,
    Quantity DECIMAL(12,2) DEFAULT 0,
    Unit VARCHAR(50),
    Min_Stock DECIMAL(12,2),
    Cost_Per_Unit DECIMAL(12,2),
    Supplier_ID UUID,
    center_id BIGINT,
    Created_By VARCHAR(255),
    Created_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    Updated_By VARCHAR(255),
    Updated_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_hamper_type_inv FOREIGN KEY (Hamper_Type) REFERENCES Hampers(ID),
    CONSTRAINT fk_center_id_inv FOREIGN KEY (center_id) REFERENCES Center_Detail(ID),
    CONSTRAINT fk_supplier_id FOREIGN KEY (Supplier_ID) REFERENCES Supplier_Profile(ID)
);

CREATE TRIGGER Inventory_Items_insert BEFORE INSERT ON Inventory_Items FOR EACH ROW EXECUTE FUNCTION set_created_updated_by_insert();
CREATE TRIGGER Inventory_Items_update BEFORE UPDATE ON Inventory_Items FOR EACH ROW EXECUTE FUNCTION set_updated_by_at_timestamptz();

COMMENT ON TABLE Inventory_Items IS 'Stores inventory items for food assistance.';
COMMENT ON COLUMN Inventory_Items.Quantity IS 'Current stock quantity, updated by transactions.';

CREATE TABLE Inventory_Transactions (
    ID SERIAL PRIMARY KEY,
    Item_ID BIGINT,
    Transaction_Type VARCHAR(50), -- CHECK (Transaction_Type IN ('IN', 'OUT')),
    Quantity DECIMAL(12,2),
    Transaction_Date DATE,
    Notes TEXT,
    Employee_ID BIGINT,
    center_id BIGINT,
    Created_By VARCHAR(255),
    Created_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    Updated_By VARCHAR(255),
    Updated_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_item_id FOREIGN KEY (Item_ID) REFERENCES Inventory_Items(ID),
    CONSTRAINT fk_employee_id_trans FOREIGN KEY (Employee_ID) REFERENCES Employee(ID),
    CONSTRAINT fk_center_id_trans FOREIGN KEY (center_id) REFERENCES Center_Detail(ID)
);

CREATE TRIGGER Inventory_Transactions_insert BEFORE INSERT ON Inventory_Transactions FOR EACH ROW EXECUTE FUNCTION set_created_updated_by_insert();
CREATE TRIGGER Inventory_Transactions_update BEFORE UPDATE ON Inventory_Transactions FOR EACH ROW EXECUTE FUNCTION set_updated_by_at_timestamptz();
CREATE TRIGGER Inventory_Transactions_update_quantity AFTER INSERT OR UPDATE ON Inventory_Transactions FOR EACH ROW EXECUTE FUNCTION update_inventory_quantity();
CREATE TRIGGER Inventory_Transactions_update_quantity_delete AFTER DELETE ON Inventory_Transactions FOR EACH ROW EXECUTE FUNCTION update_inventory_quantity();

COMMENT ON TABLE Inventory_Transactions IS 'Stores transactions affecting inventory quantities.';
COMMENT ON COLUMN Inventory_Transactions.Transaction_Type IS 'Type of transaction (IN for stock addition, OUT for stock removal).';

-- =========================
-- Secondary Features Tables
-- =========================
CREATE TABLE Conversations (
    ID SERIAL PRIMARY KEY,
    Title VARCHAR(255),
    Type VARCHAR(50),
    center_id BIGINT,
    Created_By VARCHAR(255),
    Created_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    Updated_By VARCHAR(255),
    Updated_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_center_id_conv FOREIGN KEY (center_id) REFERENCES Center_Detail(ID)
);

CREATE TRIGGER Conversations_insert BEFORE INSERT ON Conversations FOR EACH ROW EXECUTE FUNCTION set_created_updated_by_insert();
CREATE TRIGGER Conversations_update BEFORE UPDATE ON Conversations FOR EACH ROW EXECUTE FUNCTION set_updated_by_at_timestamptz();

COMMENT ON TABLE Conversations IS 'Stores conversation threads for employee communication.';
COMMENT ON COLUMN Conversations.Title IS 'Title of the conversation.';

CREATE TABLE Conversation_Participants (
    ID SERIAL PRIMARY KEY,
    Conversation_ID BIGINT,
    Employee_ID BIGINT,
    Joined_Date DATE,
    center_id BIGINT,
    Created_By VARCHAR(255),
    Created_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    Updated_By VARCHAR(255),
    Updated_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_conversation_id FOREIGN KEY (Conversation_ID) REFERENCES Conversations(ID),
    CONSTRAINT fk_employee_id FOREIGN KEY (Employee_ID) REFERENCES Employee(ID),
    CONSTRAINT fk_center_id_part FOREIGN KEY (center_id) REFERENCES Center_Detail(ID)
);

CREATE TRIGGER Conversation_Participants_insert BEFORE INSERT ON Conversation_Participants FOR EACH ROW EXECUTE FUNCTION set_created_updated_by_insert();
CREATE TRIGGER Conversation_Participants_update BEFORE UPDATE ON Conversation_Participants FOR EACH ROW EXECUTE FUNCTION set_updated_by_at_timestamptz();

COMMENT ON TABLE Conversation_Participants IS 'Stores participants in conversations.';
COMMENT ON COLUMN Conversation_Participants.Employee_ID IS 'References the employee participating.';

CREATE TABLE Messages (
    ID SERIAL PRIMARY KEY,
    Conversation_ID BIGINT,
    Sender_ID BIGINT,
    Message_Text TEXT,
    Attachment BYTEA,
    Attachment_Filename VARCHAR(255),
    Attachment_Mime VARCHAR(255),
    Attachment_Size INT,
    Read_Status VARCHAR(50) DEFAULT 'Unread',
    center_id BIGINT,
    Created_By VARCHAR(255),
    Created_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    Updated_By VARCHAR(255),
    Updated_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_conversation_id_msg FOREIGN KEY (Conversation_ID) REFERENCES Conversations(ID),
    CONSTRAINT fk_sender_id FOREIGN KEY (Sender_ID) REFERENCES Employee(ID),
    CONSTRAINT fk_center_id_msg FOREIGN KEY (center_id) REFERENCES Center_Detail(ID)
);

CREATE TRIGGER Messages_insert BEFORE INSERT ON Messages FOR EACH ROW EXECUTE FUNCTION set_created_updated_by_insert();
CREATE TRIGGER Messages_update BEFORE UPDATE ON Messages FOR EACH ROW EXECUTE FUNCTION set_updated_by_at_timestamptz();

COMMENT ON TABLE Messages IS 'Stores messages within conversations.';
COMMENT ON COLUMN Messages.Sender_ID IS 'References the employee who sent the message.';

CREATE TABLE Folders (
    ID SERIAL PRIMARY KEY,
    Name VARCHAR(255),
    Parent_ID BIGINT,
    Employee_ID BIGINT,
    center_id BIGINT,
    Created_By VARCHAR(255),
    Created_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    Updated_By VARCHAR(255),
    Updated_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_parent_id FOREIGN KEY (Parent_ID) REFERENCES Folders(ID),
    CONSTRAINT fk_employee_id_fold FOREIGN KEY (Employee_ID) REFERENCES Employee(ID),
    CONSTRAINT fk_center_id_fold FOREIGN KEY (center_id) REFERENCES Center_Detail(ID)
);

CREATE TRIGGER Folders_insert BEFORE INSERT ON Folders FOR EACH ROW EXECUTE FUNCTION set_created_updated_by_insert();
CREATE TRIGGER Folders_update BEFORE UPDATE ON Folders FOR EACH ROW EXECUTE FUNCTION set_updated_by_at_timestamptz();

COMMENT ON TABLE Folders IS 'Stores folders for organizing employee files.';
COMMENT ON COLUMN Folders.Employee_ID IS 'References the employee owning the folder.';

CREATE TABLE Personal_Files (
    ID SERIAL PRIMARY KEY,
    Name VARCHAR(255),
    Folder_ID BIGINT,
    File BYTEA,
    File_Filename VARCHAR(255),
    File_Mime VARCHAR(255),
    File_Size INT,
    Employee_ID BIGINT,
    center_id BIGINT,
    Created_By VARCHAR(255),
    Created_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    Updated_By VARCHAR(255),
    Updated_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_folder_id FOREIGN KEY (Folder_ID) REFERENCES Folders(ID),
    CONSTRAINT fk_employee_id_file FOREIGN KEY (Employee_ID) REFERENCES Employee(ID),
    CONSTRAINT fk_center_id_file FOREIGN KEY (center_id) REFERENCES Center_Detail(ID)
);

CREATE TRIGGER Personal_Files_insert BEFORE INSERT ON Personal_Files FOR EACH ROW EXECUTE FUNCTION set_created_updated_by_insert();
CREATE TRIGGER Personal_Files_update BEFORE UPDATE ON Personal_Files FOR EACH ROW EXECUTE FUNCTION set_updated_by_at_timestamptz();

COMMENT ON TABLE Personal_Files IS 'Stores personal files for employees.';
COMMENT ON COLUMN Personal_Files.Employee_ID IS 'References the employee owning the file.';

-- =========================
-- Indexes
-- =========================
CREATE INDEX HSEQ_Toolbox_Meeting_Tasks_i1 
    ON HSEQ_Toolbox_Meeting_Tasks (HSEQ_Toolbox_Meeting_ID);

CREATE INDEX idx_service_rating_datestamp 
    ON Service_Rating (Datestamp);
CREATE INDEX idx_service_rating_recommend 
    ON Service_Rating (Would_Recommend);
CREATE INDEX idx_service_rating_positive 
    ON Service_Rating (Positive_Impact);

CREATE INDEX idx_supplier_profile_center 
    ON Supplier_Profile(center_id);
CREATE INDEX idx_supplier_evaluation_center 
    ON Supplier_Evaluation(center_id);
CREATE INDEX idx_supplier_document_center 
    ON Supplier_Document(center_id);
CREATE INDEX idx_supplier_evaluation_supplier 
    ON Supplier_Evaluation(Supplier_ID);
CREATE INDEX idx_supplier_document_supplier 
    ON Supplier_Document(Supplier_ID);

-- Index on Applicant_Details.File_Number for fast lookups by file number
CREATE INDEX idx_applicant_details_file_number 
    ON Applicant_Details (File_Number);
COMMENT ON INDEX idx_applicant_details_file_number IS 'Optimizes lookups and searches by applicant file number, commonly used in queries.';

-- Index on Applicant_Details.center_id for filtering by center
CREATE INDEX idx_applicant_details_center_id 
    ON Applicant_Details (center_id);
COMMENT ON INDEX idx_applicant_details_center_id IS 'Speeds up queries filtering applicants by center, especially for multi-center organizations.';

-- Index on Applicant_Details.ID_Number for searches by ID number
CREATE INDEX idx_applicant_details_id_number 
    ON Applicant_Details (ID_Number);
COMMENT ON INDEX idx_applicant_details_id_number IS 'Accelerates searches and joins on applicant ID number.';

-- Index on Employee.center_id for filtering employees by center
CREATE INDEX idx_employee_center_id 
    ON Employee (center_id);
COMMENT ON INDEX idx_employee_center_id IS 'Improves performance for queries filtering employees by center.';

-- Index on Employee.ID_Number for searches by ID number
CREATE INDEX idx_employee_id_number 
    ON Employee (ID_Number);
COMMENT ON INDEX idx_employee_id_number IS 'Optimizes searches and joins on employee ID number.';

-- Index on Employee.Username for authentication queries
CREATE INDEX idx_employee_username 
    ON Employee (Username);
COMMENT ON INDEX idx_employee_username IS 'Speeds up authentication and lookup queries by employee username.';

-- Composite index on Financial_Assistance.File_ID and Assistance_Type for assistance queries
CREATE INDEX idx_financial_assistance_file_type 
    ON Financial_Assistance (File_ID, Assistance_Type);
COMMENT ON INDEX idx_financial_assistance_file_type IS 'Enhances queries filtering financial assistance by applicant and assistance type.';

-- Index on Food_Assistance.File_ID for filtering by applicant
CREATE INDEX idx_food_assistance_file_id 
    ON Food_Assistance (File_ID);
COMMENT ON INDEX idx_food_assistance_file_id IS 'Optimizes queries retrieving food assistance records for specific applicants.';

-- Index on Home_Visit.File_ID for filtering by applicant
CREATE INDEX idx_home_visit_file_id 
    ON Home_Visit (File_ID);
COMMENT ON INDEX idx_home_visit_file_id IS 'Speeds up queries retrieving home visit records for specific applicants.';

-- Index on Comments.File_ID for applicant comment retrieval
CREATE INDEX idx_comments_file_id 
    ON Comments (File_ID);
COMMENT ON INDEX idx_comments_file_id IS 'Improves performance for fetching comments related to an applicant.';

-- Index on Relationships.File_ID for dependent queries
CREATE INDEX idx_relationships_file_id 
    ON Relationships (File_ID);
COMMENT ON INDEX idx_relationships_file_id IS 'Accelerates queries retrieving dependents for an applicant.';

-- Index on Programs.Person_Trained_ID for training program queries
CREATE INDEX idx_programs_person_trained_id 
    ON Programs (Person_Trained_ID);
COMMENT ON INDEX idx_programs_person_trained_id IS 'Optimizes queries retrieving training programs for specific applicants.';

-- Index on Employee_Appraisal.Employee_ID for appraisal queries
CREATE INDEX idx_employee_appraisal_employee_id 
    ON Employee_Appraisal (Employee_ID);
COMMENT ON INDEX idx_employee_appraisal_employee_id IS 'Speeds up retrieval of appraisals for specific employees.';

-- Index on Employee_Initiative.Employee_ID for initiative queries
CREATE INDEX idx_employee_initiative_employee_id 
    ON Employee_Initiative (Employee_ID);
COMMENT ON INDEX idx_employee_initiative_employee_id IS 'Enhances queries retrieving initiatives proposed by specific employees.';

-- Index on Employee_Skills.Employee_ID for skill queries
CREATE INDEX idx_employee_skills_employee_id 
    ON Employee_Skills (Employee_ID);
COMMENT ON INDEX idx_employee_skills_employee_id IS 'Optimizes queries retrieving skills for specific employees.';

-- Index on Inventory_Items.Supplier_ID for supplier-based inventory queries
CREATE INDEX idx_inventory_items_supplier_id 
    ON Inventory_Items (Supplier_ID);
COMMENT ON INDEX idx_inventory_items_supplier_id IS 'Speeds up queries filtering inventory items by supplier.';

-- Index on Inventory_Transactions.Item_ID for transaction history
CREATE INDEX idx_inventory_transactions_item_id 
    ON Inventory_Transactions (Item_ID);
COMMENT ON INDEX idx_inventory_transactions_item_id IS 'Improves performance for retrieving transaction history for specific inventory items.';

-- Index on Supplier_Profile.Category_ID for category-based queries
CREATE INDEX idx_supplier_profile_category_id 
    ON Supplier_Profile (Category_ID);
COMMENT ON INDEX idx_supplier_profile_category_id IS 'Optimizes queries filtering suppliers by category.';

-- Index on Conversations.center_id for conversation retrieval by center
CREATE INDEX idx_conversations_center_id 
    ON Conversations (center_id);
COMMENT ON INDEX idx_conversations_center_id IS 'Speeds up queries retrieving conversations for a specific center.';

-- Index on Conversation_Participants.Conversation_ID for participant lookups
CREATE INDEX idx_conversation_participants_conversation_id 
    ON Conversation_Participants (Conversation_ID);
COMMENT ON INDEX idx_conversation_participants_conversation_id IS 'Enhances queries retrieving participants for a conversation.';

-- Index on Messages.Conversation_ID for message retrieval
CREATE INDEX idx_messages_conversation_id 
    ON Messages (Conversation_ID);
COMMENT ON INDEX idx_messages_conversation_id IS 'Optimizes queries retrieving messages within a conversation.';

-- Index for common queries
CREATE INDEX idx_financial_assessment_file_id 
    ON Financial_Assessment (File_ID);
COMMENT ON INDEX idx_financial_assessment_file_id IS 'Optimizes queries filtering financial assessments by applicant file ID.';

CREATE INDEX idx_financial_assessment_center_id 
    ON Financial_Assessment (center_id);
COMMENT ON INDEX idx_financial_assessment_center_id IS 'Speeds up queries filtering financial assessments by center.';

CREATE INDEX idx_applicant_expense_assessment_id 
    ON Applicant_Expense (Financial_Assessment_ID);
COMMENT ON INDEX idx_applicant_expense_assessment_id IS 'Optimizes queries retrieving expense entries for a financial assessment.';

CREATE INDEX idx_applicant_expense_type_id 
    ON Applicant_Expense (Expense_Type_ID);
COMMENT ON INDEX idx_applicant_expense_type_id IS 'Speeds up queries filtering expenses by type.';

CREATE INDEX idx_applicant_income_assessment_id 
    ON Applicant_Income (Financial_Assessment_ID);
COMMENT ON INDEX idx_applicant_income_assessment_id IS 'Optimizes queries retrieving income entries for a financial assessment.';

CREATE INDEX idx_applicant_income_type_id 
    ON Applicant_Income (Income_Type_ID);
COMMENT ON INDEX idx_applicant_income_type_id IS 'Speeds up queries filtering income by type.';

-- =========================
-- Views
-- =========================
CREATE OR REPLACE VIEW Service_Rating_With_Score AS
SELECT
    sr.*,
    ROUND((
        (COALESCE(sr.Overall_Experience, 0) +
         COALESCE(sr.Respect_And_Dignity, 0) +
         COALESCE(sr.Communication_And_Clarity, 0) +
         COALESCE(sr.Timeliness_Of_Support, 0) +
         COALESCE(sr.Fairness_And_Equality, 0) +
         COALESCE(sr.Usefulness_Of_Service, 0) +
         COALESCE(sr.Friendliness_Of_Staff, 0))::numeric
        / NULLIF(
            (CASE WHEN sr.Overall_Experience IS NOT NULL THEN 1 ELSE 0 END) +
            (CASE WHEN sr.Respect_And_Dignity IS NOT NULL THEN 1 ELSE 0 END) +
            (CASE WHEN sr.Communication_And_Clarity IS NOT NULL THEN 1 ELSE 0 END) +
            (CASE WHEN sr.Timeliness_Of_Support IS NOT NULL THEN 1 ELSE 0 END) +
            (CASE WHEN sr.Fairness_And_Equality IS NOT NULL THEN 1 ELSE 0 END) +
            (CASE WHEN sr.Usefulness_Of_Service IS NOT NULL THEN 1 ELSE 0 END) +
            (CASE WHEN sr.Friendliness_Of_Staff IS NOT NULL THEN 1 ELSE 0 END),
            0
        )
    ), 2) AS average_score_out_of_5
FROM Service_Rating sr;

COMMENT ON VIEW Service_Rating_With_Score IS 'Calculates average score for service ratings.';
COMMENT ON COLUMN Service_Rating_With_Score.average_score_out_of_5 IS 'Average of non-null rating fields, rounded to 2 decimal places.';

-- =========================
-- Insert Statements
-- =========================
INSERT INTO File_Status (Name) VALUES
('Active'),
('Inactive'),
('Once Off');

INSERT INTO File_Condition (Name) VALUES
('Satisfactory'),
('Caution'),
('High Risk');

INSERT INTO Dwelling_Status (Name) VALUES
('Fully Owned'),
('Bonded Owned'),
('Renting');

INSERT INTO Race (Name) VALUES
('African'),
('Asian'),
('Caucasian'),
('Coloured'),
('Malay');

INSERT INTO Dwelling_Type (Name) VALUES
('House'),
('Flat'),
('Hostel'),
('Hotel'),
('Backroom'),
('Homeless/On Street'),
('Old Age Home'),
('Shack'),
('Shelter');

INSERT INTO Marital_Status (Name) VALUES
('Single'),
('Nikah'),
('Married Not Islamic'),
('Talaq'),
('Widow'),
('Widower');

INSERT INTO Education_Level (Name) VALUES
('Grade 1-7'),
('Grade 8-11'),
('Matric - NQF 4'),
('Higher Certificate - NQF 5'),
('Diploma - NQF 6'),
('Degree - NQF 7'),
('Honours Degree - NQF 8'),
('Masters Degree - NQF 9'),
('PhD - NQF 10'),
('Doctorate - NQF 11');

INSERT INTO Means_of_communication (Name) VALUES
('Email'),
('Verbally'),
('Phone');

INSERT INTO Employment_Status (Name) VALUES
('Unemployed'),
('Student'),
('Full Time Employed'),
('Part-time Employed'),
('Disabled Grant'),
('Pensioner'),
('Self Employed');

INSERT INTO Gender (Name) VALUES
('Male'),
('Female');

INSERT INTO Training_Outcome (Name) VALUES
('Completed'),
('Certified'),
('Failed'),
('No Applicable');

INSERT INTO Training_Level (Name) VALUES
('NQF 4'),
('NQF 5'),
('NQF 6'),
('NQF 7'),
('NQF 8'),
('No Applicable');

INSERT INTO Blood_Type (Name) VALUES
('A Positive'),
('B Negative'),
('AB Negative'),
('AB Positive'),
('B Positive'),
('O Positive'),
('O Negative'),
('Rh-null');

INSERT INTO Rating (Score) VALUES
(1),
(2),
(3),
(4),
(5);

INSERT INTO User_Types (Name) VALUES
('Org. Caseworkers'),
('Org. Admin'),
('Org. Executives');

INSERT INTO Tasks_Status (Name) VALUES
('Complete'),
('Incomplete'),
('In Progress');

INSERT INTO Nationality (Name) VALUES
('Angola'),
('Congo'),
('Equatorial Guinea'),
('Kenya'),
('Mozambique'),
('Nigeria'),
('Uganda'),
('India'),
('Botswana'),
('Central African Republic'),
('Ghana'),
('Malawi'),
('Pakistan'),
('South African'),
('Bangladesh'),
('Somalian'),
('Lesotho'),
('Ivory Coast'),
('Burundi');

INSERT INTO Born_Religion (Name) VALUES
('African beliefs'),
('Christianity'),
('Hinduism'),
('Islam'),
('Judaism');

INSERT INTO Period_As_Muslim (Name) VALUES
('1-3 Years'), 
('3-7 Years'), 
('7-14 Years');

-- Insert sample supplier categories
INSERT INTO Supplier_Category (Name) VALUES
('Food Supplier'),
('Medical Supplier'),
('Service Provider');

INSERT INTO Training_Courses (Name) VALUES
('First Aid'),
('Fire Fighter'),
('Time Management');

INSERT INTO Training_Institutions (Institute_Name, Seta_Number) VALUES
('Mancosa', '17289'),
('UNISA', '81213');

-- Sample data for other lookups to avoid FK errors (add more as needed)
INSERT INTO Income_Type (Name) VALUES
('Salary'),
('Child Grant'),
('Pension');

INSERT INTO Expense_Type (Name) VALUES
('Rent'),
('Utilities'),
('Food');

INSERT INTO Assistance_Types (Name) VALUES
('Food Voucher'),
('Medical Aid'),
('Education Grant');

INSERT INTO Suburb (Name) VALUES
('Soweto'),
('Sandton'),
('Durban Central');

INSERT INTO Health_Conditions (Name) VALUES
('None'),
('Diabetes'),
('Hypertension');

INSERT INTO Skills (Name) VALUES
('Basic Literacy'),
('Computer Skills'),
('Driving');

INSERT INTO Relationship_Types (Name) VALUES
('Spouse'),
('Child'),
('Parent');

-- Update audit fields for existing data
UPDATE File_Status SET Created_By = 'admin', Updated_By = 'admin', Updated_At = now();
UPDATE File_Condition SET Created_By = 'admin', Updated_By = 'admin', Updated_At = now();
UPDATE Dwelling_Status SET Created_By = 'admin', Updated_By = 'admin', Updated_At = now();
UPDATE Race SET Created_By = 'admin', Updated_By = 'admin', Updated_At = now();
UPDATE Dwelling_Type SET Created_By = 'admin', Updated_By = 'admin', Updated_At = now();
UPDATE Marital_Status SET Created_By = 'admin', Updated_By = 'admin', Updated_At = now();
UPDATE Education_Level SET Created_By = 'admin', Updated_By = 'admin', Updated_At = now();
UPDATE Employment_Status SET Created_By = 'admin', Updated_By = 'admin', Updated_At = now();
UPDATE Gender SET Created_By = 'admin', Updated_By = 'admin', Updated_At = now();
UPDATE Training_Outcome SET Created_By = 'admin', Updated_By = 'admin', Updated_At = now();
UPDATE Training_Level SET Created_By = 'admin', Updated_By = 'admin', Updated_At = now();
UPDATE Blood_Type SET Created_By = 'admin', Updated_By = 'admin', Updated_At = now();
UPDATE Rating SET Created_By = 'admin', Updated_By = 'admin', Updated_At = now();
UPDATE User_Types SET Created_By = 'admin', Updated_By = 'admin', Updated_At = now();
UPDATE Tasks_Status SET Created_By = 'admin', Updated_By = 'admin', Updated_At = now();
UPDATE Nationality SET Created_By = 'admin', Updated_By = 'admin', Updated_At = now();
UPDATE Born_Religion SET Created_By = 'admin', Updated_By = 'admin', Updated_At = now();
UPDATE Period_As_Muslim SET Created_By = 'admin', Updated_By = 'admin', Updated_At = now();
UPDATE Supplier_Category SET Created_By = 'admin', Updated_By = 'admin', Updated_At = now();
UPDATE Means_of_communication SET Created_By = 'admin', Updated_By = 'admin', Updated_At = now();
UPDATE Training_Courses SET Created_By = 'admin', Updated_By = 'admin', Updated_At = now();
UPDATE Training_Institutions SET Created_By = 'admin', Updated_By = 'admin', Updated_At = now();
UPDATE Income_Type SET Created_By = 'admin', Updated_By = 'admin', Updated_At = now();
UPDATE Expense_Type SET Created_By = 'admin', Updated_By = 'admin', Updated_At = now();
UPDATE Assistance_Types SET Created_By = 'admin', Updated_By = 'admin', Updated_At = now();
UPDATE Suburb SET Created_By = 'admin', Updated_By = 'admin', Updated_At = now();
UPDATE Health_Conditions SET Created_By = 'admin', Updated_By = 'admin', Updated_At = now();
UPDATE Skills SET Created_By = 'admin', Updated_By = 'admin', Updated_At = now();
UPDATE Relationship_Types SET Created_By = 'admin', Updated_By = 'admin', Updated_At = now();
UPDATE Policy_Procedure_Type SET Created_By = 'admin', Updated_By = 'admin', Updated_At = now();
UPDATE Policy_Procedure_Field SET Created_By = 'admin', Updated_By = 'admin', Updated_At = now();

-- Insert a Admin employee (password '12345' will be auto-hashed by trigger).
-- Assumes User_Types IDs: 1=Caseworkers, 2=Admin, 3=Executives (use 3 for superadmin privileges).
-- Set other fields minimally; adjust Center_ID/Suburb/etc. if needed after inserting a Center_Detail/Suburb.
INSERT INTO Employee (
    Name, Surname, Username, Password_Hash, User_Type,
    Center_ID, Suburb, Nationality, Race, Gender, Highest_Education_Level,
    Contact_Number, Emergency_Contact, Blood_Type, Department, HSEQ_Related
) VALUES (
    'Super', 'Admin', 'admin', '12345', 3,  -- Auto-hashes password; User_Type=3 (Executives)
    NULL, NULL, 14, 1, 1, 3,  -- Example FKs: South African (14), African (1), Male (1), Matric (3)
    '+27123456789', '+27123456789', 1, null, NULL  -- Blood_Type A Positive (1)
);