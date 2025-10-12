-- =========================
-- Main Tables
-- =========================
CREATE TABLE Center_Detail (
    ID SERIAL PRIMARY KEY,
    Organisation_Name VARCHAR(255),
    Date_of_Establishment DATE,
    Contact_Number VARCHAR(255) CHECK (Contact_Number ~* '^\+?[0-9]{10,15}$'),
    Email_Address VARCHAR(255) CHECK (Email_Address ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    Website_Link VARCHAR(255),
    Address VARCHAR(255),
    Area BIGINT,
    Ameer VARCHAR(255),
    Cell1 VARCHAR(255) CHECK (Cell1 ~* '^\+?[0-9]{10,15}$'),
    Cell2 VARCHAR(255) CHECK (Cell2 ~* '^\+?[0-9]{10,15}$'),
    Cell3 VARCHAR(255) CHECK (Cell3 ~* '^\+?[0-9]{10,15}$'),
    Contact1 VARCHAR(255),
    Contact2 VARCHAR(255),
    Contact3 VARCHAR(255),
    Logo BYTEA,
    logo_filename VARCHAR(255),
    logo_mime VARCHAR(255),
    logo_size INT,
    NPO_Number VARCHAR(255),
    Service_Rating_Email VARCHAR(255) CHECK (Service_Rating_Email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    QR_Code_Service_URL BYTEA,
    Created_By VARCHAR(255),
    Created_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    Updated_By VARCHAR(255),
    Updated_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_area FOREIGN KEY (Area) REFERENCES Suburb(ID)
);

-- CREATE TRIGGER Center_Detail_insert BEFORE INSERT ON Center_Detail FOR EACH ROW EXECUTE FUNCTION set_created_updated_by_insert();
-- CREATE TRIGGER Center_Detail_update BEFORE UPDATE ON Center_Detail FOR EACH ROW EXECUTE FUNCTION set_updated_by_at_timestamptz();

-- COMMENT ON TABLE Center_Detail IS 'Stores details of welfare centers.';
-- COMMENT ON COLUMN Center_Detail.Organisation_Name IS 'Name of the organization.';
-- COMMENT ON COLUMN Center_Detail.Contact_Number IS 'Primary contact phone number (validated format).';
-- COMMENT ON COLUMN Center_Detail.Email_Address IS 'Primary email address (validated format).';

CREATE TABLE Center_Audits (
    ID SERIAL PRIMARY KEY,
    audit_date DATE,
    audit_type VARCHAR(255),
    findings VARCHAR(255),
    recommendations VARCHAR(255),
    attachments BYTEA,
    attachment_filename VARCHAR(255),
    attachment_mime VARCHAR(255),
    attachment_size INT,
    conducted_by VARCHAR(255),
    Created_By VARCHAR(255),
    Created_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    Updated_By VARCHAR(255),
    Updated_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    center_id BIGINT,
    CONSTRAINT fk_center_id FOREIGN KEY (center_id) REFERENCES Center_Detail(ID)
);

-- CREATE TRIGGER Center_Audits_insert BEFORE INSERT ON Center_Audits FOR EACH ROW EXECUTE FUNCTION set_created_updated_by_insert();
-- CREATE TRIGGER Center_Audits_update BEFORE UPDATE ON Center_Audits FOR EACH ROW EXECUTE FUNCTION set_updated_by_at_timestamptz();

-- COMMENT ON TABLE Center_Audits IS 'Stores audit records for welfare centers.';
-- COMMENT ON COLUMN Center_Audits.audit_date IS 'Date the audit was conducted.';

CREATE TABLE Training_Institutions (
    ID SERIAL PRIMARY KEY,
    Institute_Name VARCHAR(255),
    Contact_Person VARCHAR(255),
    Contact_Number VARCHAR(255) CHECK (Contact_Number ~* '^\+?[0-9]{10,15}$'),
    Email_Address VARCHAR(255) CHECK (Email_Address ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    Seta_Number VARCHAR(255),
    Address VARCHAR(255),
    Created_By VARCHAR(255),
    Created_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    Updated_By VARCHAR(255),
    Updated_At TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- CREATE TRIGGER Training_Institutions_insert BEFORE INSERT ON Training_Institutions FOR EACH ROW EXECUTE FUNCTION set_created_updated_by_insert();
-- CREATE TRIGGER Training_Institutions_update BEFORE UPDATE ON Training_Institutions FOR EACH ROW EXECUTE FUNCTION set_updated_by_at_timestamptz();

-- COMMENT ON TABLE Training_Institutions IS 'Stores details of training institutions.';
-- COMMENT ON COLUMN Training_Institutions.Institute_Name IS 'Name of the institution.';

CREATE TABLE Training_Courses (
    ID SERIAL PRIMARY KEY,
    Name VARCHAR(255),
    Description VARCHAR(255),
    Created_By VARCHAR(255),
    Created_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    Updated_By VARCHAR(255),
    Updated_At TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- CREATE TRIGGER Training_Courses_insert BEFORE INSERT ON Training_Courses FOR EACH ROW EXECUTE FUNCTION set_created_updated_by_insert();
-- CREATE TRIGGER Training_Courses_update BEFORE UPDATE ON Training_Courses FOR EACH ROW EXECUTE FUNCTION set_updated_by_at_timestamptz();

-- COMMENT ON TABLE Training_Courses IS 'Stores training course details.';
-- COMMENT ON COLUMN Training_Courses.Name IS 'Name of the course.';

CREATE TABLE Policy_and_Procedure (
    ID SERIAL PRIMARY KEY,
    Name VARCHAR(255),
    Description VARCHAR(255),
    Type BIGINT,
    Date_Of_Publication DATE,
    Status BIGINT,
    File BYTEA,
    Field BIGINT,
    Created_By VARCHAR(255),
    Created_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    Updated_By VARCHAR(255),
    Updated_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_type FOREIGN KEY (Type) REFERENCES Policy_Procedure_Type(ID),
    CONSTRAINT fk_status FOREIGN KEY (Status) REFERENCES File_Status(ID),
    CONSTRAINT fk_field FOREIGN KEY (Field) REFERENCES Policy_Procedure_Field(ID)
);

-- CREATE TRIGGER Policy_and_Procedure_insert BEFORE INSERT ON Policy_and_Procedure FOR EACH ROW EXECUTE FUNCTION set_created_updated_by_insert();
-- CREATE TRIGGER Policy_and_Procedure_update BEFORE UPDATE ON Policy_and_Procedure FOR EACH ROW EXECUTE FUNCTION set_updated_by_at_timestamptz();

-- COMMENT ON TABLE Policy_and_Procedure IS 'Stores policies and procedures for the organization.';
-- COMMENT ON COLUMN Policy_and_Procedure.Name IS 'Name of the policy or procedure.';

CREATE TABLE Employee (
    ID SERIAL PRIMARY KEY,
    Name VARCHAR(255),
    Surname VARCHAR(255),
    Center_ID BIGINT,
    ID_Number VARCHAR(255) CHECK (ID_Number ~* '^[0-9]{13}$'),
    Date_of_Birth DATE,
    Nationality BIGINT,
    Race BIGINT,
    Highest_Education_Level BIGINT,
    Gender BIGINT,
    Employment_Date DATE,
    Suburb BIGINT,
    Home_Address VARCHAR(255),
    Emergency_Contact VARCHAR(255) CHECK (Emergency_Contact ~* '^\+?[0-9]{10,15}$'),
    Contact_Number VARCHAR(255) CHECK (Contact_Number ~* '^\+?[0-9]{10,15}$'),
    Blood_Type BIGINT,
    Username VARCHAR(255) UNIQUE,
    Password_Hash VARCHAR(255), -- Changed from Password to Password_Hash
    User_Type BIGINT,
    Department BIGINT,
    HSEQ_Related VARCHAR(255),
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

-- CREATE TRIGGER Employee_password_hash
    BEFORE INSERT OR UPDATE ON Employee
    FOR EACH ROW EXECUTE FUNCTION hash_employee_password();

-- CREATE TRIGGER Employee_insert BEFORE INSERT ON Employee FOR EACH ROW EXECUTE FUNCTION set_created_updated_by_insert();
-- CREATE TRIGGER Employee_update BEFORE UPDATE ON Employee FOR EACH ROW EXECUTE FUNCTION set_updated_by_at_timestamptz();

-- COMMENT ON TABLE Employee IS 'Stores employee details, including secure password hashes.';
-- COMMENT ON COLUMN Employee.Password_Hash IS 'Hashed employee password using bcrypt.';
-- COMMENT ON COLUMN Employee.ID_Number IS '13-digit ID number (validated format).';
-- COMMENT ON COLUMN Employee.Contact_Number IS 'Employee contact number (validated format).';

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

-- CREATE TRIGGER Employee_Appraisal_insert BEFORE INSERT ON Employee_Appraisal FOR EACH ROW EXECUTE FUNCTION set_created_updated_by_insert();
-- CREATE TRIGGER Employee_Appraisal_update BEFORE UPDATE ON Employee_Appraisal FOR EACH ROW EXECUTE FUNCTION set_updated_by_at_timestamptz();

-- COMMENT ON TABLE Employee_Appraisal IS 'Stores employee performance appraisals.';
-- COMMENT ON COLUMN Employee_Appraisal.Employee_ID IS 'References the employee being appraised.';

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

-- CREATE TRIGGER Employee_Initiative_insert BEFORE INSERT ON Employee_Initiative FOR EACH ROW EXECUTE FUNCTION set_created_updated_by_insert();
-- CREATE TRIGGER Employee_Initiative_update BEFORE UPDATE ON Employee_Initiative FOR EACH ROW EXECUTE FUNCTION set_updated_by_at_timestamptz();

-- COMMENT ON TABLE Employee_Initiative IS 'Stores employee-initiated ideas or suggestions.';
-- COMMENT ON COLUMN Employee_Initiative.Employee_ID IS 'References the employee who proposed the idea.';

CREATE TABLE Employee_Skills (
    ID SERIAL PRIMARY KEY,
    Employee_ID BIGINT NOT NULL, -- Added Employee_ID
    Course BIGINT,
    Institution BIGINT,
    Date_Conducted DATE,
    Date_Expired DATE,
    Attachment BYTEA,
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

-- CREATE TRIGGER Employee_Skills_insert BEFORE INSERT ON Employee_Skills FOR EACH ROW EXECUTE FUNCTION set_created_updated_by_insert();
-- CREATE TRIGGER Employee_Skills_update BEFORE UPDATE ON Employee_Skills FOR EACH ROW EXECUTE FUNCTION set_updated_by_at_timestamptz();

-- COMMENT ON TABLE Employee_Skills IS 'Stores skills and training records for employees.';
-- COMMENT ON COLUMN Employee_Skills.Employee_ID IS 'References the employee with the skill.';

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

-- CREATE TRIGGER HSEQ_Toolbox_Meeting_insert 
    BEFORE INSERT ON HSEQ_Toolbox_Meeting 
    FOR EACH ROW EXECUTE FUNCTION set_created_updated_by_insert();
-- CREATE TRIGGER HSEQ_Toolbox_Meeting_update 
    BEFORE UPDATE ON HSEQ_Toolbox_Meeting 
    FOR EACH ROW EXECUTE FUNCTION set_updated_by_at_timestamptz();

-- COMMENT ON TABLE HSEQ_Toolbox_Meeting IS 'Stores records of Health, Safety, Environment, and Quality (HSEQ) meetings.';
-- COMMENT ON COLUMN HSEQ_Toolbox_Meeting.Meeting_Date IS 'Date the HSEQ meeting was held.';

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

-- CREATE TRIGGER HSEQ_Toolbox_Meeting_Tasks_insert 
    BEFORE INSERT ON HSEQ_Toolbox_Meeting_Tasks 
    FOR EACH ROW EXECUTE FUNCTION set_created_updated_by_insert();
-- CREATE TRIGGER HSEQ_Toolbox_Meeting_Tasks_update 
    BEFORE UPDATE ON HSEQ_Toolbox_Meeting_Tasks 
    FOR EACH ROW EXECUTE FUNCTION set_updated_by_at_timestamptz();

-- COMMENT ON TABLE HSEQ_Toolbox_Meeting_Tasks IS 'Stores tasks assigned during HSEQ meetings.';
-- COMMENT ON COLUMN HSEQ_Toolbox_Meeting_Tasks.Status IS 'References the task status (e.g., Complete, In Progress).';

CREATE TABLE Applicant_Details (
    ID SERIAL PRIMARY KEY,
    Name VARCHAR(255),
    Surname VARCHAR(255),
    ID_Number VARCHAR(255) CHECK (ID_Number ~* '^[0-9]{13}$'),
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
    Cell_Number VARCHAR(255) CHECK (Cell_Number ~* '^\+?[0-9]{10,15}$'),
    Alternate_Number VARCHAR(255) CHECK (Alternate_Number ~* '^\+?[0-9]{10,15}$'),
    Email_Address VARCHAR(255) CHECK (Email_Address ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    Suburb BIGINT,
    Street_Address VARCHAR(255),
    Dwelling_Type BIGINT,
    Flat_Name VARCHAR(255),
    Flat_Number VARCHAR(255),
    Dwelling_Status BIGINT,
    Health BIGINT,
    Skills BIGINT,
    Signature BYTEA,
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

-- CREATE TRIGGER Applicant_Details_insert BEFORE INSERT ON Applicant_Details FOR EACH ROW EXECUTE FUNCTION set_created_updated_by_insert();
-- CREATE TRIGGER Applicant_Details_update BEFORE UPDATE ON Applicant_Details FOR EACH ROW EXECUTE FUNCTION set_updated_by_at_timestamptz();

-- COMMENT ON TABLE Applicant_Details IS 'Stores personal and demographic information for welfare applicants.';
-- COMMENT ON COLUMN Applicant_Details.File_Number IS 'Unique identifier for the applicant''s file.';
-- COMMENT ON COLUMN Applicant_Details.ID_Number IS '13-digit ID number (validated format).';
-- COMMENT ON COLUMN Applicant_Details.Cell_Number IS 'Primary contact number (validated format).';

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

-- CREATE TRIGGER Comments_insert BEFORE INSERT ON Comments FOR EACH ROW EXECUTE FUNCTION set_created_updated_by_insert();
-- CREATE TRIGGER Comments_update BEFORE UPDATE ON Comments FOR EACH ROW EXECUTE FUNCTION set_updated_by_at_timestamptz();

-- COMMENT ON TABLE Comments IS 'Stores comments related to applicant files.';
-- COMMENT ON COLUMN Comments.File_ID IS 'References the applicant file.';

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

-- CREATE TRIGGER Tasks_insert BEFORE INSERT ON Tasks FOR EACH ROW EXECUTE FUNCTION set_created_updated_by_insert();
-- CREATE TRIGGER Tasks_update BEFORE UPDATE ON Tasks FOR EACH ROW EXECUTE FUNCTION set_updated_by_at_timestamptz();

-- COMMENT ON TABLE Tasks IS 'Stores tasks related to applicant files.';
-- COMMENT ON COLUMN Tasks.File_ID IS 'References the applicant file.';

CREATE TABLE Relationships (
    ID SERIAL PRIMARY KEY,
    File_ID BIGINT,
    Relationship_Type BIGINT,
    Name VARCHAR(255),
    Surname VARCHAR(255),
    ID_Number VARCHAR(255) CHECK (ID_Number ~* '^[0-9]{13}$'),
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

-- CREATE TRIGGER Relationships_insert BEFORE INSERT ON Relationships FOR EACH ROW EXECUTE FUNCTION set_created_updated_by_insert();
-- CREATE TRIGGER Relationships_update BEFORE UPDATE ON Relationships FOR EACH ROW EXECUTE FUNCTION set_updated_by_at_timestamptz();

-- COMMENT ON TABLE Relationships IS 'Stores information about applicant dependents.';
-- COMMENT ON COLUMN Relationships.File_ID IS 'References the applicant file.';

CREATE TABLE Home_Visit (
    ID SERIAL PRIMARY KEY,
    File_ID BIGINT,
    Visit_Date DATE,
    Representative VARCHAR(255),
    Comments TEXT,
    Attachment_1 BYTEA,
    Attachment_2 BYTEA,
    Created_By VARCHAR(255),
    Created_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    Updated_By VARCHAR(255),
    Updated_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    center_id BIGINT,
    CONSTRAINT fk_file_id_vis FOREIGN KEY (File_ID) REFERENCES Applicant_Details(ID),
    CONSTRAINT fk_center_id_vis FOREIGN KEY (center_id) REFERENCES Center_Detail(ID)
);

-- CREATE TRIGGER Home_Visit_insert BEFORE INSERT ON Home_Visit FOR EACH ROW EXECUTE FUNCTION set_created_updated_by_insert();
-- CREATE TRIGGER Home_Visit_update BEFORE UPDATE ON Home_Visit FOR EACH ROW EXECUTE FUNCTION set_updated_by_at_timestamptz();

-- COMMENT ON TABLE Home_Visit IS 'Stores records of home visits for applicants.';
-- COMMENT ON COLUMN Home_Visit.File_ID IS 'References the applicant file.';

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

-- CREATE TRIGGER Financial_Assistance_insert BEFORE INSERT ON Financial_Assistance FOR EACH ROW EXECUTE FUNCTION set_created_updated_by_insert();
-- CREATE TRIGGER Financial_Assistance_update BEFORE UPDATE ON Financial_Assistance FOR EACH ROW EXECUTE FUNCTION set_updated_by_at_timestamptz();

-- COMMENT ON TABLE Financial_Assistance IS 'Stores records of financial assistance provided to applicants.';
-- COMMENT ON COLUMN Financial_Assistance.File_ID IS 'References the applicant file.';

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

-- CREATE TRIGGER Food_Assistance_insert BEFORE INSERT ON Food_Assistance FOR EACH ROW EXECUTE FUNCTION set_created_updated_by_insert();
-- CREATE TRIGGER Food_Assistance_update BEFORE UPDATE ON Food_Assistance FOR EACH ROW EXECUTE FUNCTION set_updated_by_at_timestamptz();

-- COMMENT ON TABLE Food_Assistance IS 'Stores records of food assistance provided to applicants.';
-- COMMENT ON COLUMN Food_Assistance.File_ID IS 'References the applicant file.';

CREATE TABLE Attachments (
    ID SERIAL PRIMARY KEY,
    File_ID BIGINT,
    Attachment_Name VARCHAR(255),
    Attachment_Details VARCHAR(255),
    File BYTEA,
    Created_By VARCHAR(255),
    Created_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    Updated_By VARCHAR(255),
    Updated_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    center_id BIGINT,
    CONSTRAINT fk_file_id_att FOREIGN KEY (File_ID) REFERENCES Applicant_Details(ID),
    CONSTRAINT fk_center_id_att FOREIGN KEY (center_id) REFERENCES Center_Detail(ID)
);

-- CREATE TRIGGER Attachments_insert BEFORE INSERT ON Attachments FOR EACH ROW EXECUTE FUNCTION set_created_updated_by_insert();
-- CREATE TRIGGER Attachments_update BEFORE UPDATE ON Attachments FOR EACH ROW EXECUTE FUNCTION set_updated_by_at_timestamptz();

-- COMMENT ON TABLE Attachments IS 'Stores file attachments for applicants.';
-- COMMENT ON COLUMN Attachments.File_ID IS 'References the applicant file.';

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

-- CREATE TRIGGER Programs_insert BEFORE INSERT ON Programs FOR EACH ROW EXECUTE FUNCTION set_created_updated_by_insert();
-- CREATE TRIGGER Programs_update BEFORE UPDATE ON Programs FOR EACH ROW EXECUTE FUNCTION set_updated_by_at_timestamptz();

-- COMMENT ON TABLE Programs IS 'Stores training program records for applicants.';
-- COMMENT ON COLUMN Programs.Person_Trained_ID IS 'References the applicant who attended the program.';

CREATE TABLE Financial_Assessment (
    ID SERIAL PRIMARY KEY,
    File_ID BIGINT NOT NULL,
    center_id BIGINT NOT NULL,
    Total_Income DECIMAL(12,2) CHECK (Total_Income >= 0),
    Total_Expenses DECIMAL(12,2) CHECK (Total_Expenses >= 0),
    Disposable_Income DECIMAL(12,2),
    Created_By VARCHAR(255),
    Created_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    Updated_By VARCHAR(255),
    Updated_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_file_id FOREIGN KEY (File_ID) REFERENCES Applicant_Details(ID),
    CONSTRAINT fk_center_id_fin_ass FOREIGN KEY (center_id) REFERENCES Center_Detail(ID)
);

-- CREATE TRIGGER Financial_Assessment_insert 
    BEFORE INSERT ON Financial_Assessment 
    FOR EACH ROW EXECUTE FUNCTION set_created_updated_by_insert();
-- CREATE TRIGGER Financial_Assessment_update 
    BEFORE UPDATE ON Financial_Assessment 
    FOR EACH ROW EXECUTE FUNCTION set_updated_by_at_timestamptz();

-- COMMENT ON TABLE Financial_Assessment IS 'Stores financial assessment summaries for applicants.';
-- COMMENT ON COLUMN Financial_Assessment.File_ID IS 'References the applicant file.';
-- COMMENT ON COLUMN Financial_Assessment.center_id IS 'References the center managing the assessment.';
-- COMMENT ON COLUMN Financial_Assessment.Total_Income IS 'Total income from all sources, updated by trigger.';
-- COMMENT ON COLUMN Financial_Assessment.Total_Expenses IS 'Total expenses, updated by trigger.';
-- COMMENT ON COLUMN Financial_Assessment.Disposable_Income IS 'Total_Income minus Total_Expenses, updated by trigger.';

CREATE TABLE Applicant_Income (
    ID SERIAL PRIMARY KEY,
    Financial_Assessment_ID BIGINT NOT NULL,
    Income_Type_ID BIGINT NOT NULL,
    Amount DECIMAL(12,2) CHECK (Amount >= 0),
    Description TEXT,
    Created_By VARCHAR(255),
    Created_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    Updated_By VARCHAR(255),
    Updated_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_financial_assessment_id FOREIGN KEY (Financial_Assessment_ID) REFERENCES Financial_Assessment(ID) ON DELETE CASCADE,
    CONSTRAINT fk_income_type_id FOREIGN KEY (Income_Type_ID) REFERENCES Income_Type(ID)
);

-- CREATE TRIGGER Applicant_Income_insert 
    BEFORE INSERT ON Applicant_Income 
    FOR EACH ROW EXECUTE FUNCTION set_created_updated_by_insert();
-- CREATE TRIGGER Applicant_Income_update 
    BEFORE UPDATE ON Applicant_Income 
    FOR EACH ROW EXECUTE FUNCTION set_updated_by_at_timestamptz();

-- CREATE TRIGGER Applicant_Income_update_totals
    AFTER INSERT OR UPDATE OR DELETE ON Applicant_Income
    FOR EACH ROW EXECUTE FUNCTION update_financial_assessment_totals();

-- COMMENT ON TABLE Applicant_Income IS 'Stores individual income entries for financial assessments.';
-- COMMENT ON COLUMN Applicant_Income.Financial_Assessment_ID IS 'References the financial assessment.';
-- COMMENT ON COLUMN Applicant_Income.Income_Type_ID IS 'Type of income (e.g., Salary, Grant).';
-- COMMENT ON COLUMN Applicant_Income.Amount IS 'Amount of income, non-negative.';
-- COMMENT ON COLUMN Applicant_Income.Description IS 'Optional description of the income source.';

CREATE TABLE Applicant_Expense (
    ID SERIAL PRIMARY KEY,
    Financial_Assessment_ID BIGINT NOT NULL,
    Expense_Type_ID BIGINT NOT NULL,
    Amount DECIMAL(12,2) CHECK (Amount >= 0),
    Description TEXT,
    Created_By VARCHAR(255),
    Created_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    Updated_By VARCHAR(255),
    Updated_At TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_financial_assessment_id FOREIGN KEY (Financial_Assessment_ID) REFERENCES Financial_Assessment(ID) ON DELETE CASCADE,
    CONSTRAINT fk_expense_type_id FOREIGN KEY (Expense_Type_ID) REFERENCES Expense_Type(ID)
);

-- CREATE TRIGGER Applicant_Expense_insert 
    BEFORE INSERT ON Applicant_Expense 
    FOR EACH ROW EXECUTE FUNCTION set_created_updated_by_insert();
-- CREATE TRIGGER Applicant_Expense_update 
    BEFORE UPDATE ON Applicant_Expense 
    FOR EACH ROW EXECUTE FUNCTION set_updated_by_at_timestamptz();

-- CREATE TRIGGER Applicant_Expense_update_totals
    AFTER INSERT OR UPDATE OR DELETE ON Applicant_Expense
    FOR EACH ROW EXECUTE FUNCTION update_financial_assessment_totals();

-- COMMENT ON TABLE Applicant_Expense IS 'Stores individual expense entries for financial assessments.';
-- COMMENT ON COLUMN Applicant_Expense.Financial_Assessment_ID IS 'References the financial assessment.';
-- COMMENT ON COLUMN Applicant_Expense.Expense_Type_ID IS 'Type of expense (e.g., Rent, Utilities).';
-- COMMENT ON COLUMN Applicant_Expense.Amount IS 'Amount of expense, non-negative.';
-- COMMENT ON COLUMN Applicant_Expense.Description IS 'Optional description of the expense.';

CREATE TABLE Service_Rating (
    ID UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    Overall_Experience SMALLINT CHECK (Overall_Experience BETWEEN 1 AND 5),
    Respect_And_Dignity SMALLINT CHECK (Respect_And_Dignity BETWEEN 1 AND 5),
    Communication_And_Clarity SMALLINT CHECK (Communication_And_Clarity BETWEEN 1 AND 5),
    Timeliness_Of_Support SMALLINT CHECK (Timeliness_Of_Support BETWEEN 1 AND 5),
    Fairness_And_Equality SMALLINT CHECK (Fairness_And_Equality BETWEEN 1 AND 5),
    Usefulness_Of_Service SMALLINT CHECK (Usefulness_Of_Service BETWEEN 1 AND 5),
    Friendliness_Of_Staff SMALLINT CHECK (Friendliness_Of_Staff BETWEEN 1 AND 5),
    Positive_Impact BOOLEAN,
    No_Positive_Impact_Reason TEXT,
    Access_Ease SMALLINT CHECK (Access_Ease BETWEEN 1 AND 5),
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

-- CREATE TRIGGER Service_Rating_insert 
    BEFORE INSERT ON Service_Rating 
    FOR EACH ROW EXECUTE FUNCTION set_created_updated_by_insert();
-- CREATE TRIGGER Service_Rating_update 
    BEFORE UPDATE ON Service_Rating 
    FOR EACH ROW EXECUTE FUNCTION set_updated_by_at_timestamptz();

-- COMMENT ON TABLE Service_Rating IS 'Stores service quality ratings for centers.';
-- COMMENT ON COLUMN Service_Rating.Overall_Experience IS 'Rating (1-5) for overall experience.';

CREATE TABLE Supplier_Profile (
    ID UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    center_id BIGINT NOT NULL,
    Name VARCHAR(255) NOT NULL,
    Registration_No VARCHAR(100),
    Contact_Person VARCHAR(255),
    Contact_Email VARCHAR(255) CHECK (Contact_Email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    Contact_Phone VARCHAR(50) CHECK (Contact_Phone ~* '^\+?[0-9]{10,15}$'),
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

-- CREATE TRIGGER Supplier_Profile_insert 
    BEFORE INSERT ON Supplier_Profile 
    FOR EACH ROW EXECUTE FUNCTION set_created_updated_by_insert();
-- CREATE TRIGGER Supplier_Profile_update 
    BEFORE UPDATE ON Supplier_Profile 
    FOR EACH ROW EXECUTE FUNCTION set_updated_by_at_timestamptz();

-- COMMENT ON TABLE Supplier_Profile IS 'Stores supplier profiles for the organization.';
-- COMMENT ON COLUMN Supplier_Profile.Category_ID IS 'References the supplier category.';

CREATE TABLE Supplier_Evaluation (
    ID UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    center_id BIGINT NOT NULL,
    Supplier_ID UUID NOT NULL,
    Eval_Date DATE NOT NULL,
    Quality_Score SMALLINT CHECK (Quality_Score BETWEEN 1 AND 5),
    Delivery_Score SMALLINT CHECK (Delivery_Score BETWEEN 1 AND 5),
    Cost_Score SMALLINT CHECK (Cost_Score BETWEEN 1 AND 5),
    OHS_Score SMALLINT CHECK (OHS_Score BETWEEN 1 AND 5),
    Env_Score SMALLINT CHECK (Env_Score BETWEEN 1 AND 5),
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

-- CREATE TRIGGER Supplier_Evaluation_insert 
    BEFORE INSERT ON Supplier_Evaluation 
    FOR EACH ROW EXECUTE FUNCTION set_created_updated_by_insert();
-- CREATE TRIGGER Supplier_Evaluation_update 
    BEFORE UPDATE ON Supplier_Evaluation 
    FOR EACH ROW EXECUTE FUNCTION set_updated_by_at_timestamptz();

-- COMMENT ON TABLE Supplier_Evaluation IS 'Stores evaluations of supplier performance.';
-- COMMENT ON COLUMN Supplier_Evaluation.Supplier_ID IS 'References the evaluated supplier.';

CREATE TABLE Supplier_Document (
    ID UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    center_id BIGINT NOT NULL,
    Supplier_ID UUID NOT NULL,
    Doc_Type VARCHAR(100) NOT NULL,
    Issued_At DATE,
    File BYTEA,
    Mime_Type VARCHAR(100),
    File_Size INTEGER,
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

-- CREATE TRIGGER Supplier_Document_insert 
    BEFORE INSERT ON Supplier_Document 
    FOR EACH ROW EXECUTE FUNCTION set_created_updated_by_insert();
-- CREATE TRIGGER Supplier_Document_update 
    BEFORE UPDATE ON Supplier_Document 
    FOR EACH ROW EXECUTE FUNCTION set_updated_by_at_timestamptz();

-- COMMENT ON TABLE Supplier_Document IS 'Stores documents related to suppliers.';
-- COMMENT ON COLUMN Supplier_Document.Supplier_ID IS 'References the supplier.';

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

-- CREATE TRIGGER Inventory_Items_insert BEFORE INSERT ON Inventory_Items FOR EACH ROW EXECUTE FUNCTION set_created_updated_by_insert();
-- CREATE TRIGGER Inventory_Items_update BEFORE UPDATE ON Inventory_Items FOR EACH ROW EXECUTE FUNCTION set_updated_by_at_timestamptz();

-- COMMENT ON TABLE Inventory_Items IS 'Stores inventory items for food assistance.';
-- COMMENT ON COLUMN Inventory_Items.Quantity IS 'Current stock quantity, updated by transactions.';

CREATE TABLE Inventory_Transactions (
    ID SERIAL PRIMARY KEY,
    Item_ID BIGINT,
    Transaction_Type VARCHAR(50) CHECK (Transaction_Type IN ('IN', 'OUT')),
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

-- CREATE TRIGGER Inventory_Transactions_insert BEFORE INSERT ON Inventory_Transactions FOR EACH ROW EXECUTE FUNCTION set_created_updated_by_insert();
-- CREATE TRIGGER Inventory_Transactions_update BEFORE UPDATE ON Inventory_Transactions FOR EACH ROW EXECUTE FUNCTION set_updated_by_at_timestamptz();
-- CREATE TRIGGER Inventory_Transactions_update_quantity AFTER INSERT OR UPDATE ON Inventory_Transactions FOR EACH ROW EXECUTE FUNCTION update_inventory_quantity();
-- CREATE TRIGGER Inventory_Transactions_update_quantity_delete AFTER DELETE ON Inventory_Transactions FOR EACH ROW EXECUTE FUNCTION update_inventory_quantity();

-- COMMENT ON TABLE Inventory_Transactions IS 'Stores transactions affecting inventory quantities.';
-- COMMENT ON COLUMN Inventory_Transactions.Transaction_Type IS 'Type of transaction (IN for stock addition, OUT for stock removal).';

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

-- CREATE TRIGGER Conversations_insert BEFORE INSERT ON Conversations FOR EACH ROW EXECUTE FUNCTION set_created_updated_by_insert();
-- CREATE TRIGGER Conversations_update BEFORE UPDATE ON Conversations FOR EACH ROW EXECUTE FUNCTION set_updated_by_at_timestamptz();

-- COMMENT ON TABLE Conversations IS 'Stores conversation threads for employee communication.';
-- COMMENT ON COLUMN Conversations.Title IS 'Title of the conversation.';

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

-- CREATE TRIGGER Conversation_Participants_insert BEFORE INSERT ON Conversation_Participants FOR EACH ROW EXECUTE FUNCTION set_created_updated_by_insert();
-- CREATE TRIGGER Conversation_Participants_update BEFORE UPDATE ON Conversation_Participants FOR EACH ROW EXECUTE FUNCTION set_updated_by_at_timestamptz();

-- COMMENT ON TABLE Conversation_Participants IS 'Stores participants in conversations.';
-- COMMENT ON COLUMN Conversation_Participants.Employee_ID IS 'References the employee participating.';

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

-- CREATE TRIGGER Messages_insert BEFORE INSERT ON Messages FOR EACH ROW EXECUTE FUNCTION set_created_updated_by_insert();
-- CREATE TRIGGER Messages_update BEFORE UPDATE ON Messages FOR EACH ROW EXECUTE FUNCTION set_updated_by_at_timestamptz();

-- COMMENT ON TABLE Messages IS 'Stores messages within conversations.';
-- COMMENT ON COLUMN Messages.Sender_ID IS 'References the employee who sent the message.';

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

-- CREATE TRIGGER Folders_insert BEFORE INSERT ON Folders FOR EACH ROW EXECUTE FUNCTION set_created_updated_by_insert();
-- CREATE TRIGGER Folders_update BEFORE UPDATE ON Folders FOR EACH ROW EXECUTE FUNCTION set_updated_by_at_timestamptz();

-- COMMENT ON TABLE Folders IS 'Stores folders for organizing employee files.';
-- COMMENT ON COLUMN Folders.Employee_ID IS 'References the employee owning the folder.';

CREATE TABLE Personal_Files (
    ID SERIAL PRIMARY KEY,
    Name VARCHAR(255),
    Folder_ID BIGINT,
    File BYTEA,
    Filename VARCHAR(255),
    Mime VARCHAR(255),
    Size INT,
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

-- CREATE TRIGGER Personal_Files_insert BEFORE INSERT ON Personal_Files FOR EACH ROW EXECUTE FUNCTION set_created_updated_by_insert();
-- CREATE TRIGGER Personal_Files_update BEFORE UPDATE ON Personal_Files FOR EACH ROW EXECUTE FUNCTION set_updated_by_at_timestamptz();

-- COMMENT ON TABLE Personal_Files IS 'Stores personal files for employees.';
-- COMMENT ON COLUMN Personal_Files.Employee_ID IS 'References the employee owning the file.';