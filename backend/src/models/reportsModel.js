const db = require('../config/db');

class ReportsModel {
    // Applicant Details Report
    static async getApplicantDetails(centerId = null) {
        try {
            let query = `
                SELECT 
                    ad.id,
                    ad.name,
                    ad.surname,
                    ad.id_number,
                    ad.file_number,
                    ad.date_intake,
                    ad.cell_number,
                    ad.alternate_number,
                    ad.email_address,
                    ad.street_address,
                    ad.popia_agreement,
                    ad.race,
                    ad.nationality,
                    ad.gender,
                    ad.file_condition,
                    ad.file_status,
                    ad.highest_education_level,
                    ad.marital_status,
                    ad.employment_status,
                    ad.suburb,
                    ad.dwelling_type,
                    ad.dwelling_status,
                    ad.health,
                    ad.skills,
                    ad.created_by,
                    ad.created_at,
                    -- Join with lookup tables for readable names
                    r.name AS race_name,
                    n.name AS nationality_name,
                    g.name AS gender_name,
                    fc.name AS file_condition_name,
                    fs.name AS file_status_name,
                    el.name AS education_level_name,
                    ms.name AS marital_status_name,
                    es.name AS employment_status_name,
                    s.name AS suburb_name,
                    dt.name AS dwelling_type_name,
                    ds.name AS dwelling_status_name,
                    hc.name AS health_condition_name,
                    sk.name AS skills_name
                FROM applicant_details ad
                LEFT JOIN race r ON ad.race = r.id
                LEFT JOIN nationality n ON ad.nationality = n.id
                LEFT JOIN gender g ON ad.gender = g.id
                LEFT JOIN file_condition fc ON ad.file_condition = fc.id
                LEFT JOIN file_status fs ON ad.file_status = fs.id
                LEFT JOIN education_level el ON ad.highest_education_level = el.id
                LEFT JOIN marital_status ms ON ad.marital_status = ms.id
                LEFT JOIN employment_status es ON ad.employment_status = es.id
                LEFT JOIN suburb s ON ad.suburb = s.id
                LEFT JOIN dwelling_type dt ON ad.dwelling_type = dt.id
                LEFT JOIN dwelling_status ds ON ad.dwelling_status = ds.id
                LEFT JOIN health_conditions hc ON ad.health = hc.id
                LEFT JOIN skills sk ON ad.skills = sk.id
            `;
            
            const params = [];
            if (centerId) {
                query += ` WHERE ad.center_id = $1`;
                params.push(centerId);
            }
            
            query += ` ORDER BY ad.created_at DESC`;
            
            const result = await db.query(query, params);
            return result.rows;
        } catch (error) {
            throw new Error(`Error fetching applicant details: ${error.message}`);
        }
    }

    // Total Financial Assistance Report
    static async getTotalFinancialAssistance(centerId = null) {
        try {
            let query = `
                SELECT 
                    ad.name,
                    ad.surname,
                    ad.file_number,
                    ad.file_condition,
                    ad.file_status,
                    ad.employment_status,
                    ad.health,
                    ad.cell_number,
                    COALESCE(SUM(fa.financial_cost), 0) AS financial_food_assistance,
                    COALESCE(SUM(fin.financial_amount), 0) AS financial_transactions,
                    COALESCE(SUM(fa.financial_cost), 0) + COALESCE(SUM(fin.financial_amount), 0) AS total_financial,
                    -- Join with lookup tables for readable names
                    fc.name AS file_condition_name,
                    fs.name AS file_status_name,
                    es.name AS employment_status_name,
                    hc.name AS health_condition_name
                FROM applicant_details ad
                LEFT JOIN food_assistance fa ON fa.file_id = ad.id
                LEFT JOIN financial_assistance fin ON fin.file_id = ad.id
                LEFT JOIN file_condition fc ON ad.file_condition = fc.id
                LEFT JOIN file_status fs ON ad.file_status = fs.id
                LEFT JOIN employment_status es ON ad.employment_status = es.id
                LEFT JOIN health_conditions hc ON ad.health = hc.id
            `;
            
            const params = [];
            if (centerId) {
                query += ` WHERE ad.center_id = $1`;
                params.push(centerId);
            }
            
            query += `
                GROUP BY
                    ad.name, ad.surname, ad.file_number, ad.cell_number,
                    ad.file_condition, ad.file_status, ad.employment_status, ad.health,
                    fc.name, fs.name, es.name, hc.name
                ORDER BY total_financial DESC
            `;
            
            const result = await db.query(query, params);
            return result.rows;
        } catch (error) {
            throw new Error(`Error fetching total financial assistance: ${error.message}`);
        }
    }

    // Financial Assistance Report
    static async getFinancialAssistance(centerId = null) {
        try {
            let query = `
                SELECT 
                    ad.name,
                    ad.surname,
                    ad.file_number,
                    ad.cell_number,
                    fin.created_by AS assisted_by,
                    fin.financial_amount,
                    fin.assistance_type,
                    fin.date_of_assistance,
                    fin.created_by,
                    fin.created_at,
                    -- Join with lookup tables for readable names
                    at.name AS assistance_type_name
                FROM financial_assistance fin
                INNER JOIN applicant_details ad ON fin.file_id = ad.id
                LEFT JOIN assistance_types at ON fin.assistance_type = at.id
            `;
            
            const params = [];
            if (centerId) {
                query += ` WHERE fin.center_id = $1`;
                params.push(centerId);
            }
            
            query += ` ORDER BY fin.date_of_assistance DESC`;
            
            const result = await db.query(query, params);
            return result.rows;
        } catch (error) {
            throw new Error(`Error fetching financial assistance: ${error.message}`);
        }
    }

    // Food Assistance Report
    static async getFoodAssistance(centerId = null) {
        try {
            let query = `
                SELECT 
                    ad.name,
                    ad.surname,
                    ad.file_number,
                    ad.cell_number,
                    fa.hamper_type,
                    fa.financial_cost,
                    fa.created_by AS assisted_by,
                    fa.distributed_date,
                    fa.created_by,
                    fa.created_at,
                    -- Join with lookup tables for readable names
                    h.name AS hamper_type_name
                FROM food_assistance fa
                INNER JOIN applicant_details ad ON fa.file_id = ad.id
                LEFT JOIN hampers h ON fa.hamper_type = h.id
            `;
            
            const params = [];
            if (centerId) {
                query += ` WHERE fa.center_id = $1`;
                params.push(centerId);
            }
            
            query += ` ORDER BY fa.distributed_date DESC`;
            
            const result = await db.query(query, params);
            return result.rows;
        } catch (error) {
            throw new Error(`Error fetching food assistance: ${error.message}`);
        }
    }

    // Home Visits Report
    static async getHomeVisits(centerId = null) {
        try {
            let query = `
                SELECT 
                    ad.name,
                    ad.surname,
                    ad.file_number,
                    ad.cell_number,
                    hv.visit_date,
                    hv.representative,
                    hv.comments,
                    hv.attachment_1,
                    hv.attachment_2,
                    hv.created_by,
                    hv.created_at
                FROM home_visit hv
                INNER JOIN applicant_details ad ON hv.file_id = ad.id
            `;
            
            const params = [];
            if (centerId) {
                query += ` WHERE hv.center_id = $1`;
                params.push(centerId);
            }
            
            query += ` ORDER BY hv.visit_date DESC`;
            
            const result = await db.query(query, params);
            return result.rows;
        } catch (error) {
            throw new Error(`Error fetching home visits: ${error.message}`);
        }
    }

    // Relationship Report
    static async getRelationshipReport(centerId = null) {
        try {
            let query = `
                SELECT 
                    ad.name,
                    ad.surname,
                    ad.file_number,
                    ad.cell_number,
                    rel.relationship_type,
                    rel.name AS relatives_name,
                    rel.surname AS relatives_surname,
                    rel.employment_status,
                    rel.gender,
                    EXTRACT(YEAR FROM AGE(CURRENT_DATE, rel.date_of_birth)) AS age,
                    rel.highest_education,
                    rel.health_condition,
                    -- Join with lookup tables for readable names
                    rt.name AS relationship_type_name,
                    es.name AS employment_status_name,
                    g.name AS gender_name,
                    el.name AS education_level_name,
                    hc.name AS health_condition_name
                FROM relationships rel
                INNER JOIN applicant_details ad ON rel.file_id = ad.id
                LEFT JOIN relationship_types rt ON rel.relationship_type = rt.id
                LEFT JOIN employment_status es ON rel.employment_status = es.id
                LEFT JOIN gender g ON rel.gender = g.id
                LEFT JOIN education_level el ON rel.highest_education = el.id
                LEFT JOIN health_conditions hc ON rel.health_condition = hc.id
            `;
            
            const params = [];
            if (centerId) {
                query += ` WHERE rel.center_id = $1`;
                params.push(centerId);
            }
            
            query += ` ORDER BY ad.name, rel.name`;
            
            const result = await db.query(query, params);
            return result.rows;
        } catch (error) {
            throw new Error(`Error fetching relationship report: ${error.message}`);
        }
    }

    // Applicant Programs Report
    static async getApplicantPrograms(centerId = null) {
        try {
            let query = `
                SELECT 
                    ad.name,
                    ad.surname,
                    ad.file_number,
                    ad.cell_number,
                    p.program_name,
                    p.date_of_program,
                    p.means_of_communication,
                    p.training_level,
                    p.training_provider,
                    p.program_outcome,
                    p.created_by,
                    p.created_at,
                    -- Join with lookup tables for readable names
                    tc.name AS program_name_name,
                    moc.name AS communication_method_name,
                    tl.name AS training_level_name,
                    ti.institute_name AS training_provider_name,
                    tout.name AS program_outcome_name
                FROM programs p
                INNER JOIN applicant_details ad ON p.person_trained_id = ad.id
                LEFT JOIN training_courses tc ON p.program_name = tc.id
                LEFT JOIN means_of_communication moc ON p.means_of_communication = moc.id
                LEFT JOIN training_level tl ON p.training_level = tl.id
                LEFT JOIN training_institutions ti ON p.training_provider = ti.id
                LEFT JOIN training_outcome tout ON p.program_outcome = tout.id
            `;
            
            const params = [];
            if (centerId) {
                query += ` WHERE p.center_id = $1`;
                params.push(centerId);
            }
            
            query += ` ORDER BY p.date_of_program DESC`;
            
            const result = await db.query(query, params);
            return result.rows;
        } catch (error) {
            throw new Error(`Error fetching applicant programs: ${error.message}`);
        }
    }
}

module.exports = ReportsModel;
