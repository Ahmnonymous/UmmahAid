-- PostgreSQL Schema for Welfare Application
-- Updated to implement recommendations: Supplier_Category table, TIMESTAMPTZ standardization, secure password storage,
-- Employee_ID relationships, validation, HSEQ status consistency, inventory triggers, and documentation.
-- Removed set_created_updated_by_insert() and set_updated_by_at_timestamptz() triggers as they are handled by the application.
-- Aligned code for consistent formatting and readability.

-- Extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Trigger Functions
CREATE OR REPLACE FUNCTION hash_employee_password()
RETURNS TRIGGER AS $$
BEGIN
    -- Only hash on INSERT when a plain password is provided
    IF TG_OP = 'INSERT' THEN
        IF NEW.Password_Hash IS NOT NULL AND NEW.Password_Hash !~ '^\$2[aby]\$\d\d\$' THEN
            NEW.Password_Hash := crypt(NEW.Password_Hash, gen_salt('bf'));
        END IF;
        RETURN NEW;
    END IF;

    -- Only hash on UPDATE if the password actually changed and is not already bcrypt
    IF TG_OP = 'UPDATE' THEN
        IF NEW.Password_Hash IS DISTINCT FROM OLD.Password_Hash THEN
            IF NEW.Password_Hash IS NOT NULL AND NEW.Password_Hash !~ '^\$2[aby]\$\d\d\$' THEN
                NEW.Password_Hash := crypt(NEW.Password_Hash, gen_salt('bf'));
            END IF;
        END IF;
        RETURN NEW;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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
    WHERE fa.ID = COALESCE(NEW.Financial_Assessment_ID, OLD.Financial_Assessment_ID);
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

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

-- Lookup Tables
CREATE TABLE Supplier_Category (
    ID UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    Name VARCHAR(255) UNIQUE NOT NULL,
    Created_By VARCHAR(255),
    Created_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    Updated_By VARCHAR(255),
    Updated_At TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE Suburb (
    ID SERIAL PRIMARY KEY,
    Name VARCHAR(255) UNIQUE NOT NULL,
    Created_By VARCHAR(255),
    Created_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    Updated_By VARCHAR(255),
    Updated_At TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE Nationality (
    ID SERIAL PRIMARY KEY,
    Name VARCHAR(255) UNIQUE NOT NULL,
    Created_By VARCHAR(255),
    Created_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    Updated_By VARCHAR(255),
    Updated_At TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE Departments (
    ID SERIAL PRIMARY KEY,
    Name VARCHAR(255) UNIQUE NOT NULL,
    Created_By VARCHAR(255),
    Created_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    Updated_By VARCHAR(255),
    Updated_At TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE Health_Conditions (
    ID SERIAL PRIMARY KEY,
    Name VARCHAR(255) UNIQUE NOT NULL,
    Created_By VARCHAR(255),
    Created_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    Updated_By VARCHAR(255),
    Updated_At TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE Skills (
    ID SERIAL PRIMARY KEY,
    Name VARCHAR(255) UNIQUE NOT NULL,
    Created_By VARCHAR(255),
    Created_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    Updated_By VARCHAR(255),
    Updated_At TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE Relationship_Types (
    ID SERIAL PRIMARY KEY,
    Name VARCHAR(255) UNIQUE NOT NULL,
    Created_By VARCHAR(255),
    Created_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    Updated_By VARCHAR(255),
    Updated_At TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE Tasks_Status (
    ID SERIAL PRIMARY KEY,
    Name VARCHAR(255) UNIQUE NOT NULL,
    Created_By VARCHAR(255),
    Created_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    Updated_By VARCHAR(255),
    Updated_At TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE Assistance_Types (
    ID SERIAL PRIMARY KEY,
    Name VARCHAR(255) UNIQUE NOT NULL,
    Created_By VARCHAR(255),
    Created_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    Updated_By VARCHAR(255),
    Updated_At TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE File_Status (
    ID SERIAL PRIMARY KEY,
    Name VARCHAR(255) UNIQUE NOT NULL,
    Created_By VARCHAR(255),
    Created_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    Updated_By VARCHAR(255),
    Updated_At TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE File_Condition (
    ID SERIAL PRIMARY KEY,
    Name VARCHAR(255) UNIQUE NOT NULL,
    Created_By VARCHAR(255),
    Created_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    Updated_By VARCHAR(255),
    Updated_At TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE Dwelling_Status (
    ID SERIAL PRIMARY KEY,
    Name VARCHAR(255) UNIQUE NOT NULL,
    Created_By VARCHAR(255),
    Created_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    Updated_By VARCHAR(255),
    Updated_At TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE Race (
    ID SERIAL PRIMARY KEY,
    Name VARCHAR(255) UNIQUE NOT NULL,
    Created_By VARCHAR(255),
    Created_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    Updated_By VARCHAR(255),
    Updated_At TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE Dwelling_Type (
    ID SERIAL PRIMARY KEY,
    Name VARCHAR(255) UNIQUE NOT NULL,
    Created_By VARCHAR(255),
    Created_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    Updated_By VARCHAR(255),
    Updated_At TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE Marital_Status (
    ID SERIAL PRIMARY KEY,
    Name VARCHAR(255) UNIQUE NOT NULL,
    Created_By VARCHAR(255),
    Created_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    Updated_By VARCHAR(255),
    Updated_At TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE Education_Level (
    ID SERIAL PRIMARY KEY,
    Name VARCHAR(255) UNIQUE NOT NULL,
    Created_By VARCHAR(255),
    Created_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    Updated_By VARCHAR(255),
    Updated_At TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE Means_of_communication (
    ID SERIAL PRIMARY KEY,
    Name VARCHAR(255) UNIQUE NOT NULL,
    Created_By VARCHAR(255),
    Created_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    Updated_By VARCHAR(255),
    Updated_At TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE Employment_Status (
    ID SERIAL PRIMARY KEY,
    Name VARCHAR(255) UNIQUE NOT NULL,
    Created_By VARCHAR(255),
    Created_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    Updated_By VARCHAR(255),
    Updated_At TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE Gender (
    ID SERIAL PRIMARY KEY,
    Name VARCHAR(255) UNIQUE NOT NULL,
    Created_By VARCHAR(255),
    Created_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    Updated_By VARCHAR(255),
    Updated_At TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE Training_Outcome (
    ID SERIAL PRIMARY KEY,
    Name VARCHAR(255) UNIQUE NOT NULL,
    Created_By VARCHAR(255),
    Created_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    Updated_By VARCHAR(255),
    Updated_At TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE Training_Level (
    ID SERIAL PRIMARY KEY,
    Name VARCHAR(255) UNIQUE NOT NULL,
    Created_By VARCHAR(255),
    Created_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    Updated_By VARCHAR(255),
    Updated_At TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE Blood_Type (
    ID SERIAL PRIMARY KEY,
    Name VARCHAR(255) UNIQUE NOT NULL,
    Created_By VARCHAR(255),
    Created_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    Updated_By VARCHAR(255),
    Updated_At TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE Rating (
    ID SERIAL PRIMARY KEY,
    Score INT UNIQUE NOT NULL,
    Created_By VARCHAR(255),
    Created_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    Updated_By VARCHAR(255),
    Updated_At TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE User_Types (
    ID SERIAL PRIMARY KEY,
    Name VARCHAR(255) UNIQUE NOT NULL,
    Created_By VARCHAR(255),
    Created_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    Updated_By VARCHAR(255),
    Updated_At TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE Policy_Procedure_Type (
    ID SERIAL PRIMARY KEY,
    Name VARCHAR(255) UNIQUE NOT NULL,
    Created_By VARCHAR(255),
    Created_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    Updated_By VARCHAR(255),
    Updated_At TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE Policy_Procedure_Field (
    ID SERIAL PRIMARY KEY,
    Name VARCHAR(255) UNIQUE NOT NULL,
    Created_By VARCHAR(255),
    Created_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    Updated_By VARCHAR(255),
    Updated_At TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE Income_Type (
    ID SERIAL PRIMARY KEY,
    Name VARCHAR(255) UNIQUE NOT NULL,
    Created_By VARCHAR(255),
    Created_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    Updated_By VARCHAR(255),
    Updated_At TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE Expense_Type (
    ID SERIAL PRIMARY KEY,
    Name VARCHAR(255) UNIQUE NOT NULL,
    Created_By VARCHAR(255),
    Created_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    Updated_By VARCHAR(255),
    Updated_At TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE Hampers (
    ID SERIAL PRIMARY KEY,
    Name VARCHAR(255) UNIQUE NOT NULL,
    Created_By VARCHAR(255),
    Created_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    Updated_By VARCHAR(255),
    Updated_At TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE Born_Religion (
    ID SERIAL PRIMARY KEY,
    Name VARCHAR(255) UNIQUE NOT NULL,
    Created_By VARCHAR(255),
    Created_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    Updated_By VARCHAR(255),
    Updated_At TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE Period_As_Muslim (
    ID SERIAL PRIMARY KEY,
    Name VARCHAR(255) UNIQUE NOT NULL,
    Created_By VARCHAR(255),
    Created_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    Updated_By VARCHAR(255),
    Updated_At TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Main Tables
CREATE TABLE Center_Detail (
    ID SERIAL PRIMARY KEY,
    Organisation_Name VARCHAR(255),
    Date_of_Establishment DATE,
    Contact_Number VARCHAR(255),
    Email_Address VARCHAR(255),
    Website_Link VARCHAR(255),
    Address VARCHAR(255),
    Area BIGINT,
    Ameer VARCHAR(255),
    Cell1 VARCHAR(255),
    Cell2 VARCHAR(255),
    Cell3 VARCHAR(255),
    Contact1 VARCHAR(255),
    Contact2 VARCHAR(255),
    Contact3 VARCHAR(255),
    Logo BYTEA,
    Logo_Filename VARCHAR(255),
    Logo_Mime VARCHAR(255),
    Logo_Size INT,
    NPO_Number VARCHAR(255),
    Service_Rating_Email VARCHAR(255),
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

CREATE TABLE Training_Institutions (
    ID SERIAL PRIMARY KEY,
    Institute_Name VARCHAR(255),
    Contact_Person VARCHAR(255),
    Contact_Number VARCHAR(255),
    Email_Address VARCHAR(255),
    Seta_Number VARCHAR(255),
    Address VARCHAR(255),
    Created_By VARCHAR(255),
    Created_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    Updated_By VARCHAR(255),
    Updated_At TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE Training_Courses (
    ID SERIAL PRIMARY KEY,
    Name VARCHAR(255),
    Description VARCHAR(255),
    Created_By VARCHAR(255),
    Created_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    Updated_By VARCHAR(255),
    Updated_At TIMESTAMPTZ NOT NULL DEFAULT now()
);

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

CREATE TABLE Employee (
    ID SERIAL PRIMARY KEY,
    Name VARCHAR(255),
    Surname VARCHAR(255),
    Center_ID BIGINT,
    ID_Number VARCHAR(255),
    Date_of_Birth DATE,
    Nationality BIGINT,
    Race BIGINT,
    Highest_Education_Level BIGINT,
    Gender BIGINT,
    Employment_Date DATE,
    Suburb BIGINT,
    Home_Address VARCHAR(255),
    Emergency_Contact VARCHAR(255),
    Contact_Number VARCHAR(255),
    Blood_Type BIGINT,
    Username VARCHAR(255) UNIQUE,
    Password_Hash VARCHAR(255),
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
    CONSTRAINT fk_department FOREIGN KEY (Department) REFERENCES Departments(ID)
);

CREATE TRIGGER Employee_password_hash
    BEFORE INSERT OR UPDATE ON Employee
    FOR EACH ROW EXECUTE FUNCTION hash_employee_password();

CREATE TABLE Employee_Appraisal (
    ID SERIAL PRIMARY KEY,
    Employee_ID BIGINT NOT NULL,
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

CREATE TABLE Employee_Initiative (
    ID SERIAL PRIMARY KEY,
    Employee_ID BIGINT NOT NULL,
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

CREATE TABLE Employee_Skills (
    ID SERIAL PRIMARY KEY,
    Employee_ID BIGINT NOT NULL,
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

CREATE TABLE HSEQ_Toolbox_Meeting_Tasks (
    ID SERIAL PRIMARY KEY,
    HSEQ_Toolbox_Meeting_ID BIGINT,
    Task_Description VARCHAR(100),
    Completion_Date DATE,
    Responsible VARCHAR(40),
    Status BIGINT,
    Notes VARCHAR(400),
    Created_By VARCHAR(255),
    Created_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    Updated_By VARCHAR(255),
    Updated_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    center_id BIGINT,
    CONSTRAINT fk_hseq_toolbox_meeting_id FOREIGN KEY (HSEQ_Toolbox_Meeting_ID) REFERENCES HSEQ_Toolbox_Meeting(ID),
    CONSTRAINT fk_status FOREIGN KEY (Status) REFERENCES Tasks_Status(ID),
    CONSTRAINT fk_center_id_hseq_tasks FOREIGN KEY (center_id) REFERENCES Center_Detail(ID)
);

CREATE TABLE Applicant_Details (
    ID SERIAL PRIMARY KEY,
    Name VARCHAR(255),
    Surname VARCHAR(255),
    ID_Number VARCHAR(255),
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
    Cell_Number VARCHAR(255),
    Alternate_Number VARCHAR(255),
    Email_Address VARCHAR(255),
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

CREATE TABLE Relationships (
    ID SERIAL PRIMARY KEY,
    File_ID BIGINT,
    Relationship_Type BIGINT,
    Name VARCHAR(255),
    Surname VARCHAR(255),
    ID_Number VARCHAR(255),
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

CREATE TABLE Applicant_Income (
    ID SERIAL PRIMARY KEY,
    Financial_Assessment_ID BIGINT NOT NULL,
    Income_Type_ID BIGINT NOT NULL,
    Amount DECIMAL(12,2),
    Description TEXT,
    Created_By VARCHAR(255),
    Created_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    Updated_By VARCHAR(255),
    Updated_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_income_type_id FOREIGN KEY (Income_Type_ID) REFERENCES Income_Type(ID)
);

CREATE TABLE Applicant_Expense (
    ID SERIAL PRIMARY KEY,
    Financial_Assessment_ID BIGINT NOT NULL,
    Expense_Type_ID BIGINT NOT NULL,
    Amount DECIMAL(12,2),
    Description TEXT,
    Created_By VARCHAR(255),
    Created_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    Updated_By VARCHAR(255),
    Updated_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_expense_type_id FOREIGN KEY (Expense_Type_ID) REFERENCES Expense_Type(ID)
);

CREATE TABLE Financial_Assessment (
    ID SERIAL PRIMARY KEY,
    File_ID BIGINT NOT NULL,
    center_id BIGINT NOT NULL,
    Total_Income DECIMAL(12,2),
    Total_Expenses DECIMAL(12,2),
    Disposable_Income DECIMAL(12,2),
    Created_By VARCHAR(255),
    Created_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    Updated_By VARCHAR(255),
    Updated_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_file_id FOREIGN KEY (File_ID) REFERENCES Applicant_Details(ID),
    CONSTRAINT fk_center_id_fin_ass FOREIGN KEY (center_id) REFERENCES Center_Detail(ID)
);

CREATE TRIGGER Financial_Assessment_update_totals
    AFTER INSERT OR UPDATE OR DELETE ON Applicant_Income
    FOR EACH ROW EXECUTE FUNCTION update_financial_assessment_totals();

CREATE TRIGGER Applicant_Expense_update_totals
    AFTER INSERT OR UPDATE OR DELETE ON Applicant_Expense
    FOR EACH ROW EXECUTE FUNCTION update_financial_assessment_totals();

-- Ensure a minimal Financial_Assessment exists for every applicant
CREATE OR REPLACE FUNCTION ensure_financial_assessment_for_applicant()
RETURNS TRIGGER AS $$
BEGIN
    -- Create a placeholder assessment so that later income/expense rows
    -- can automatically roll up via existing triggers
    IF NOT EXISTS (
        SELECT 1 FROM Financial_Assessment WHERE File_ID = NEW.ID
    ) THEN
        INSERT INTO Financial_Assessment (
            File_ID, center_id, Total_Income, Total_Expenses, Disposable_Income, Created_By
        ) VALUES (
            NEW.ID, NEW.center_id, 0, 0, 0, 'Admin'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER Applicant_Details_create_financial_assessment
    AFTER INSERT ON Applicant_Details
    FOR EACH ROW EXECUTE FUNCTION ensure_financial_assessment_for_applicant();

CREATE TABLE Service_Rating (
    ID UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    Overall_Experience SMALLINT,
    Respect_And_Dignity SMALLINT,
    Communication_And_Clarity SMALLINT,
    Timeliness_Of_Support SMALLINT,
    Fairness_And_Equality SMALLINT,
    Usefulness_Of_Service SMALLINT,
    Friendliness_Of_Staff SMALLINT,
    Positive_Impact BOOLEAN,
    No_Positive_Impact_Reason TEXT,
    Access_Ease SMALLINT,
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
    CONSTRAINT fk_center_id_service_rating FOREIGN KEY (center_id) REFERENCES Center_Detail(ID)
);

CREATE TABLE Supplier_Profile (
    ID UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    center_id BIGINT NOT NULL,
    Name VARCHAR(255) NOT NULL,
    Registration_No VARCHAR(100),
    Contact_Person VARCHAR(255),
    Contact_Email VARCHAR(255),
    Contact_Phone VARCHAR(50),
    Address TEXT,
    Category_ID UUID,
    Status VARCHAR(50),
    Created_By VARCHAR(255),
    Datestamp DATE DEFAULT CURRENT_DATE,
    Updated_By VARCHAR(255),
    Updated_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_center_id_supplier FOREIGN KEY (center_id) REFERENCES Center_Detail(ID),
    CONSTRAINT fk_category_id FOREIGN KEY (Category_ID) REFERENCES Supplier_Category(ID)
);

CREATE TABLE Supplier_Evaluation (
    ID UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    center_id BIGINT NOT NULL,
    Supplier_ID UUID NOT NULL,
    Eval_Date DATE NOT NULL,
    Quality_Score SMALLINT,
    Delivery_Score SMALLINT,
    Cost_Score SMALLINT,
    OHS_Score SMALLINT,
    Env_Score SMALLINT,
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
    CONSTRAINT fk_center_id_sup_eval FOREIGN KEY (center_id) REFERENCES Center_Detail(ID),
    CONSTRAINT fk_supplier_id FOREIGN KEY (Supplier_ID) REFERENCES Supplier_Profile(ID) ON DELETE CASCADE
);

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
    CONSTRAINT fk_center_id_sup_doc FOREIGN KEY (center_id) REFERENCES Center_Detail(ID),
    CONSTRAINT fk_supplier_id_doc FOREIGN KEY (Supplier_ID) REFERENCES Supplier_Profile(ID) ON DELETE CASCADE
);

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

CREATE TABLE Inventory_Transactions (
    ID SERIAL PRIMARY KEY,
    Item_ID BIGINT,
    Transaction_Type VARCHAR(50),
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

CREATE TRIGGER Inventory_Transactions_update_quantity
    AFTER INSERT OR UPDATE ON Inventory_Transactions
    FOR EACH ROW EXECUTE FUNCTION update_inventory_quantity();

CREATE TRIGGER Inventory_Transactions_update_quantity_delete
    AFTER DELETE ON Inventory_Transactions
    FOR EACH ROW EXECUTE FUNCTION update_inventory_quantity();

-- Secondary Features Tables
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

-- Indexes
CREATE INDEX HSEQ_Toolbox_Meeting_Tasks_i1 ON HSEQ_Toolbox_Meeting_Tasks (HSEQ_Toolbox_Meeting_ID);
CREATE INDEX idx_service_rating_datestamp ON Service_Rating (Datestamp);
CREATE INDEX idx_service_rating_recommend ON Service_Rating (Would_Recommend);
CREATE INDEX idx_service_rating_positive ON Service_Rating (Positive_Impact);
CREATE INDEX idx_supplier_profile_center ON Supplier_Profile (center_id);
CREATE INDEX idx_supplier_evaluation_center ON Supplier_Evaluation (center_id);
CREATE INDEX idx_supplier_document_center ON Supplier_Document (center_id);
CREATE INDEX idx_supplier_evaluation_supplier ON Supplier_Evaluation (Supplier_ID);
CREATE INDEX idx_supplier_document_supplier ON Supplier_Document (Supplier_ID);
CREATE INDEX idx_applicant_details_file_number ON Applicant_Details (File_Number);
CREATE INDEX idx_applicant_details_center_id ON Applicant_Details (center_id);
CREATE INDEX idx_applicant_details_id_number ON Applicant_Details (ID_Number);
CREATE INDEX idx_employee_center_id ON Employee (center_id);
CREATE INDEX idx_employee_id_number ON Employee (ID_Number);
CREATE INDEX idx_employee_username ON Employee (Username);
CREATE INDEX idx_financial_assistance_file_type ON Financial_Assistance (File_ID, Assistance_Type);
CREATE INDEX idx_food_assistance_file_id ON Food_Assistance (File_ID);
CREATE INDEX idx_home_visit_file_id ON Home_Visit (File_ID);
CREATE INDEX idx_comments_file_id ON Comments (File_ID);
CREATE INDEX idx_relationships_file_id ON Relationships (File_ID);
CREATE INDEX idx_programs_person_trained_id ON Programs (Person_Trained_ID);
CREATE INDEX idx_employee_appraisal_employee_id ON Employee_Appraisal (Employee_ID);
CREATE INDEX idx_employee_initiative_employee_id ON Employee_Initiative (Employee_ID);
CREATE INDEX idx_employee_skills_employee_id ON Employee_Skills (Employee_ID);
CREATE INDEX idx_inventory_items_supplier_id ON Inventory_Items (Supplier_ID);
CREATE INDEX idx_inventory_transactions_item_id ON Inventory_Transactions (Item_ID);
CREATE INDEX idx_supplier_profile_category_id ON Supplier_Profile (Category_ID);
CREATE INDEX idx_conversations_center_id ON Conversations (center_id);
CREATE INDEX idx_conversation_participants_conversation_id ON Conversation_Participants (Conversation_ID);
CREATE INDEX idx_messages_conversation_id ON Messages (Conversation_ID);
CREATE INDEX idx_financial_assessment_file_id ON Financial_Assessment (File_ID);
CREATE INDEX idx_financial_assessment_center_id ON Financial_Assessment (center_id);
CREATE INDEX idx_applicant_expense_assessment_id ON Applicant_Expense (Financial_Assessment_ID);
CREATE INDEX idx_applicant_expense_type_id ON Applicant_Expense (Expense_Type_ID);
CREATE INDEX idx_applicant_income_assessment_id ON Applicant_Income (Financial_Assessment_ID);
CREATE INDEX idx_applicant_income_type_id ON Applicant_Income (Income_Type_ID);

-- Views
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

-- Insert Statements
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
    ('App Admin'),
    ('HQ'),
    ('Org. Admin'),
    ('Org. Executives'),
    ('Org. Caseworkers');

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

INSERT INTO Policy_Procedure_Type (Name) VALUES
    ('Health and Safety'),
    ('Compliance'),
    ('Operational');

INSERT INTO Policy_Procedure_Field (Name) VALUES
    ('Compliance'),
    ('Training'),
    ('Safety Protocols');

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

-- Insert a Admin employee
-- Insert into Center_Detail
INSERT INTO Center_Detail (
    Organisation_Name, Date_of_Establishment, Contact_Number, Email_Address, Address, Area, NPO_Number, Created_By
) VALUES
    ('Welfare Center Alpha', '2020-01-01', '+27123456789', 'center.alpha@example.com', '123 Main St, Soweto', 1, 'NPO-2020-001', 'admin');

-- Insert into Center_Audits
INSERT INTO Center_Audits (
    audit_date, audit_type, findings, recommendations, conducted_by, center_id, Created_By
) VALUES
    ('2024-01-15', 'Financial Audit', 'Compliant with regulations', 'Improve record-keeping', 'Auditor Jane', 1, 'admin');

-- Insert into Policy_and_Procedure
INSERT INTO Policy_and_Procedure (
    Name, Description, Type, Date_Of_Publication, Status, Field, Created_By
) VALUES
    ('Employee Safety Policy', 'Safety guidelines for staff',
     (SELECT ID FROM Policy_Procedure_Type WHERE Name = 'Health and Safety'),
     '2023-06-01',
     (SELECT ID FROM File_Status WHERE Name = 'Active'),
     (SELECT ID FROM Policy_Procedure_Field WHERE Name = 'Compliance'),
     'admin');

INSERT INTO Employee (
    Name, Surname, Username, Password_Hash, User_Type, Center_ID, Suburb, Nationality, Race, Gender, 
    Highest_Education_Level, Contact_Number, Emergency_Contact, Blood_Type, Department, HSEQ_Related
) VALUES (
    'Super', 'Admin', 'admin', '12345', 1,
    1, NULL, 14, 1, 1, 3,
    '+27123456789', '+27123456789', 1, NULL, NULL
);

-- Insert into Employee_Appraisal
INSERT INTO Employee_Appraisal (
    Employee_ID, Positions, Attendance, Job_Knowledge_Skills, Quality_of_Work, Initiative_And_Motivation,
    Teamwork, General_Conduct, Discipline, Special_Task, Overall_Comments, Room_for_Improvement, center_id, Created_By
) VALUES
    (1, 'Case Worker', 'Excellent', 'Proficient', 'High Quality', 'Proactive', 'Collaborative', 'Professional', 'Good', 'None', 'Excellent performance', 'Continue training', 1, 'admin');

-- Insert into Employee_Initiative
INSERT INTO Employee_Initiative (
    Employee_ID, Idea, Details, Idea_Date, Status, center_id, Created_By
) VALUES
    (1, 'Streamline Application Process', 'Automate data entry', '2024-02-01', 'Under Review', 1, 'admin');

-- Insert into Employee_Skills
INSERT INTO Employee_Skills (
    Employee_ID, Course, Institution, Date_Conducted, Date_Expired, Training_Outcome, center_id, Created_By
) VALUES
    (1, 1, 1, '2023-03-01', '2026-03-01', 2, 1, 'admin');

-- Insert into HSEQ_Toolbox_Meeting
INSERT INTO HSEQ_Toolbox_Meeting (
    Meeting_Date, Conducted_By, In_Attendance, Health_Discussions, Safety_Discussions, center_id, Created_By
) VALUES
    ('2024-03-10', 'John Manager', 'Team Alpha, Team Beta', 'Hygiene protocols', 'Fire safety measures', 1, 'admin');

-- Insert into HSEQ_Toolbox_Meeting_Tasks
INSERT INTO HSEQ_Toolbox_Meeting_Tasks (
    HSEQ_Toolbox_Meeting_ID, Task_Description, Completion_Date, Responsible, Status, Notes, center_id, Created_By
) VALUES
    (1, 'Install fire extinguishers', '2024-04-01', 'Safety Officer', 3, 'Urgent task', 1, 'admin');

-- Insert into Applicant_Details
INSERT INTO Applicant_Details (
    Name, Surname, ID_Number, Race, Nationality, Gender, Born_Religion_ID, Period_As_Muslim_ID, File_Number,
    File_Condition, File_Status, Date_Intake, Highest_Education_Level, Marital_Status, Employment_Status,
    Cell_Number, Email_Address, Suburb, Street_Address, Dwelling_Type, Dwelling_Status, Health, Skills, center_id, Created_By
) VALUES
    ('Ahmed', 'raza', '8705051234081', 2, 14, 1, 4, 1, 'APP-2024-001', 1, 1, '2024-01-10', 3, 2, 1,
     '+27812345678', 'ahmed.raza@example.com', 1, '456 Oak St, Soweto', 1, 3, 1, 2, 1, 'admin');

-- Insert into Comments
INSERT INTO Comments (
    File_ID, Comment, Comment_Date, center_id, Created_By
) VALUES
    (1, 'Initial assessment completed', '2024-01-11', 1, 'admin');

-- Insert into Tasks
INSERT INTO Tasks (
    File_ID, Task_Description, Date_Required, Status, center_id, Created_By
) VALUES
    (1, 'Schedule home visit', '2024-02-15', 'In Progress', 1, 'admin');

-- Insert into Relationships
INSERT INTO Relationships (
    File_ID, Relationship_Type, Name, Surname, ID_Number, Date_of_Birth, Employment_Status, Gender,
    Highest_Education, Health_Condition, center_id, Created_By
) VALUES
    (1, 2, 'Aisha', 'raza', '1505051234082', '2015-05-05', 2, 2, 1, 1, 1, 'admin');

-- Insert into Home_Visit
INSERT INTO Home_Visit (
    File_ID, Visit_Date, Representative, Comments, center_id, Created_By
) VALUES
    (1, '2024-02-20', 'Case Worker Jane', 'Stable living conditions', 1, 'admin');

-- Insert into Financial_Assistance
INSERT INTO Financial_Assistance (
    File_ID, Assistance_Type, Financial_Amount, Date_of_Assistance, center_id, Created_By
) VALUES
    (1, 1, 1000.00, '2024-02-25', 1, 'admin');

-- Insert into Hampers
INSERT INTO Hampers (Name, Created_By) VALUES
    ('Basic Food Hamper', 'admin'),
    ('Emergency Food Hamper', 'admin'),
    ('Special Dietary Hamper', 'admin');

-- Insert into Food_Assistance
INSERT INTO Food_Assistance (
    File_ID, Distributed_Date, Hamper_Type, Financial_Cost, center_id, Created_By
) VALUES
    (1, '2024-02-28',
     (SELECT ID FROM Hampers WHERE Name = 'Basic Food Hamper'),
     250.00, 1, 'admin');

-- Insert into Attachments
INSERT INTO Attachments (
    File_ID, Attachment_Name, Attachment_Details, center_id, Created_By
) VALUES
    (1, 'ID Document Scan', 'Applicant ID copy', 1, 'admin');

-- Insert into Programs
INSERT INTO Programs (
    Person_Trained_ID, Program_Name, Means_of_communication, Date_of_program, Communicated_by,
    Training_Level, Training_Provider, Program_Outcome, center_id, Created_By
) VALUES
    (1, 1, 1, '2024-03-01', 1, 1, 1, 2, 1, 'admin');

-- Insert into Service_Rating
INSERT INTO Service_Rating (
    Overall_Experience, Respect_And_Dignity, Communication_And_Clarity, Timeliness_Of_Support, 
    Fairness_And_Equality, Usefulness_Of_Service, Friendliness_Of_Staff, Positive_Impact, 
    Access_Ease, Would_Recommend, Appreciate_Most, How_To_Improve, Other_Comments, center_id, Created_By
) VALUES
    (4, 5, 4, 3, 4, 5, 4, TRUE, 4, TRUE, 'Friendly staff', 'Faster response times', 
     'Great service overall', 1, 'admin');

-- Insert into Supplier_Profile
INSERT INTO Supplier_Profile (
    center_id, Name, Registration_No, Contact_Person, Contact_Email, Contact_Phone, Address, 
    Category_ID, Status, Created_By
) VALUES
    (1, 'Fresh Foods Ltd', 'REG-2023-001', 'John Supplier', 'john@freshfoods.com', '+27123456780', 
     '789 Market St, Sandton',
     (SELECT ID FROM Supplier_Category WHERE Name = 'Food Supplier'), 'Active', 'admin');

-- Insert into Supplier_Evaluation
INSERT INTO Supplier_Evaluation (
    center_id, Supplier_ID, Eval_Date, Quality_Score, Delivery_Score, Cost_Score, OHS_Score, Env_Score,
    Quality_Wt, Delivery_Wt, Cost_Wt, OHS_Wt, Env_Wt, Overall_Score, Status, Notes, Expiry_Date, Created_By
) VALUES
    (1, (SELECT ID FROM Supplier_Profile WHERE Name = 'Fresh Foods Ltd'), '2024-03-15', 4, 5, 3, 4, 4,
     0.30, 0.25, 0.20, 0.15, 0.10, 4.10, 'Approved', 'Reliable supplier', '2025-03-15', 'admin');

-- Insert into Supplier_Document
INSERT INTO Supplier_Document (
    center_id, Supplier_ID, Doc_Type, Issued_At, Description, Created_By
) VALUES
    (1, (SELECT ID FROM Supplier_Profile WHERE Name = 'Fresh Foods Ltd'), 'Tax Clearance', 
     '2024-01-01', 'Tax clearance certificate', 'admin');

-- Insert into Inventory_Items
INSERT INTO Inventory_Items (
    Item_Name, Description, Hamper_Type, Quantity, Unit, Min_Stock, Cost_Per_Unit, Supplier_ID, center_id, Created_By
) VALUES
    ('Rice 5kg', 'Long-grain white rice', 
     (SELECT ID FROM Hampers WHERE Name = 'Basic Food Hamper'), 100.00, 'kg', 20.00, 15.00,
     (SELECT ID FROM Supplier_Profile WHERE Name = 'Fresh Foods Ltd'), 1, 'admin');

-- Insert into Inventory_Transactions
INSERT INTO Inventory_Transactions (
    Item_ID, Transaction_Type, Quantity, Transaction_Date, Notes, Employee_ID, center_id, Created_By
) VALUES
    ((SELECT ID FROM Inventory_Items WHERE Item_Name = 'Rice 5kg'), 'IN', 50.00, '2024-03-20', 
     'Restock from supplier', 1, 1, 'admin');

-- Insert into Conversations
INSERT INTO Conversations (
    Title, Type, center_id, Created_By
) VALUES
    ('Team Coordination', 'Group', 1, 'admin');

-- Insert into Conversation_Participants
INSERT INTO Conversation_Participants (
    Conversation_ID, Employee_ID, Joined_Date, center_id, Created_By
) VALUES
    ((SELECT ID FROM Conversations WHERE Title = 'Team Coordination'), 1, '2024-03-21', 1, 'admin');

-- Insert into Messages
INSERT INTO Messages (
    Conversation_ID, Sender_ID, Message_Text, Read_Status, center_id, Created_By
) VALUES
    ((SELECT ID FROM Conversations WHERE Title = 'Team Coordination'), 1, 
     'Please review the new applicant process.', 'Unread', 1, 'admin');

-- Insert into Folders
INSERT INTO Folders (
    Name, Employee_ID, center_id, Created_By
) VALUES
    ('Case Files 2024', 1, 1, 'admin');

-- Insert into Personal_Files
INSERT INTO Personal_Files (
    Name, Folder_ID, Employee_ID, center_id, Created_By
) VALUES
    ('Performance Review Q1', (SELECT ID FROM Folders WHERE Name = 'Case Files 2024'), 1, 1, 'admin');