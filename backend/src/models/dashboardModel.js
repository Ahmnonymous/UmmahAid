const pool = require('../config/db');

const DURATION_CONFIGS = {
  '1': { key: 'year', interval: 'month', step: '1 month', periods: 12, labelType: 'month' },
  '2': { key: 'month', interval: 'week', step: '1 week', periods: 8, labelType: 'week' },
  '3': { key: 'week', interval: 'day', step: '1 day', periods: 7, labelType: 'day' },
};

const METRIC_DEFINITIONS = [
  {
    key: 'filesCreated',
    label: ' Files Created',
    table: 'personal_files',
    alias: 'pf',
    // icon: 'bx-folder-open',
  },
  {
    key: 'foodAidGiven',
    label: ' Food Aid Given',
    table: 'food_assistance',
    alias: 'fa',
    // icon: 'bx-bowl-hot',
  },
  {
    key: 'financialAidGiven',
    label: ' Financial Aid Given',
    table: 'financial_assistance',
    alias: 'fia',
    // icon: 'bx-wallet',
  },
  {
    key: 'homeVisitsDone',
    label: ' Home Visits Done',
    table: 'home_visit',
    alias: 'hv',
    // icon: 'bx-home-smile',
  },
];

function getDurationConfig(duration) {
  const key = String(duration || '1');
  return DURATION_CONFIGS[key] || DURATION_CONFIGS['1'];
}

function buildCenterCondition(alias, paramIndex) {
  return `($${paramIndex}::int IS NULL OR ${alias}.center_id = $${paramIndex})`;
}

function buildTimeSeriesQuery({ table, alias }, config, centerParamIndex) {
  const { interval, step, periods } = config;
  const centerCondition = buildCenterCondition(alias, centerParamIndex);
  const [stepSizeRaw, stepUnitRaw] = String(step).split(' ');
  const stepSize = Number(stepSizeRaw) || 1;
  const stepUnit = stepUnitRaw || interval;
  const rangeInterval = `${(periods - 1) * stepSize} ${stepUnit}`;

  return `
    WITH config AS (
      SELECT 
        date_trunc('${interval}', CURRENT_DATE) AS current_period_start,
        (date_trunc('${interval}', CURRENT_DATE) - INTERVAL '${rangeInterval}') AS range_start
    ),
    periods AS (
      SELECT generate_series(
        (SELECT range_start FROM config),
        (SELECT current_period_start FROM config),
        INTERVAL '${step}'
      ) AS period_start
    )
    SELECT
      periods.period_start,
      COALESCE(counts.value, 0)::INTEGER AS value
    FROM periods
    LEFT JOIN (
      SELECT
        date_trunc('${interval}', ${alias}.created_at) AS period_start,
        COUNT(*)::INTEGER AS value
      FROM ${table} ${alias}, config
      WHERE ${centerCondition}
        AND ${alias}.created_at >= config.range_start
      GROUP BY 1
    ) counts ON counts.period_start = periods.period_start
    ORDER BY periods.period_start;
  `;
}

function formatPeriodLabel(dateString, config) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return dateString;
  }

  const options = { timeZone: 'UTC' };

  if (config.labelType === 'month') {
    return date.toLocaleString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' });
  }

  if (config.labelType === 'week') {
    const end = new Date(date);
    end.setUTCDate(end.getUTCDate() + 6);
    const startLabel = date.toLocaleString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
    const endLabel = end.toLocaleString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
    return `${startLabel} - ${endLabel}`;
  }

  // Default to day labels
  return date.toLocaleString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
}

const dashboardModel = {
  getApplicantStatistics: async (centerId, isSuperAdmin) => {
    try {
      const hasCenterFilter = !isSuperAdmin && centerId;
      const params = hasCenterFilter ? [centerId] : [];
      const centerFilterCondition = (alias) =>
        hasCenterFilter ? `${alias}.center_id = $1` : 'TRUE';
      const centerFilterAnd = (alias) =>
        hasCenterFilter ? `AND ${alias}.center_id = $1` : '';

      // Get all statistics in parallel
      const [
        nationalityStats,
        genderStats,
        educationStats,
        raceStats,
        suburbStats,
        employmentStats,
        maritalStats,
        fileStatusStats,
        fileConditionStats,
        summaryStats,
        applicantTrendStats,
        foodAidTrendStats,
        homeVisitTrendStats,
        programsTrendStats,
      ] = await Promise.all([
        // Nationality statistics with tenant filter
        pool.query(`
          SELECT 
            n.name as label,
            COUNT(a.id)::INTEGER as value
          FROM applicant_details a
          LEFT JOIN nationality n ON a.nationality = n.id
          WHERE n.name IS NOT NULL ${centerFilterAnd('a')}
          GROUP BY n.id, n.name
          ORDER BY value DESC
        `, params),
        
        // Gender statistics with tenant filter
        pool.query(`
          SELECT 
            g.name as label,
            COUNT(a.id)::INTEGER as value
          FROM applicant_details a
          LEFT JOIN gender g ON a.gender = g.id
          WHERE g.name IS NOT NULL ${centerFilterAnd('a')}
          GROUP BY g.id, g.name
          ORDER BY value DESC
        `, params),
        
        // Education statistics with tenant filter
        pool.query(`
          SELECT 
            e.name as label,
            COUNT(a.id)::INTEGER as value
          FROM applicant_details a
          LEFT JOIN education_level e ON a.highest_education_level = e.id
          WHERE e.name IS NOT NULL ${centerFilterAnd('a')}
          GROUP BY e.id, e.name
          ORDER BY value DESC
        `, params),
        
        // Race statistics with tenant filter
        pool.query(`
          SELECT 
            r.name as label,
            COUNT(a.id)::INTEGER as value
          FROM applicant_details a
          LEFT JOIN race r ON a.race = r.id
          WHERE r.name IS NOT NULL ${centerFilterAnd('a')}
          GROUP BY r.id, r.name
          ORDER BY value DESC
        `, params),
        
        // Suburb statistics with tenant filter
        pool.query(`
          SELECT 
            s.name as label,
            COUNT(a.id)::INTEGER as value
          FROM applicant_details a
          LEFT JOIN suburb s ON a.suburb = s.id
          WHERE s.name IS NOT NULL ${centerFilterAnd('a')}
          GROUP BY s.id, s.name
          ORDER BY value DESC
        `, params),
        
        // Employment Status statistics with tenant filter
        pool.query(`
          SELECT 
            e.name as label,
            COUNT(a.id)::INTEGER as value
          FROM applicant_details a
          LEFT JOIN employment_status e ON a.employment_status = e.id
          WHERE e.name IS NOT NULL ${centerFilterAnd('a')}
          GROUP BY e.id, e.name
          ORDER BY value DESC
        `, params),
        
        // Marital Status statistics with tenant filter
        pool.query(`
          SELECT 
            m.name as label,
            COUNT(a.id)::INTEGER as value
          FROM applicant_details a
          LEFT JOIN marital_status m ON a.marital_status = m.id
          WHERE m.name IS NOT NULL ${centerFilterAnd('a')}
          GROUP BY m.id, m.name
          ORDER BY value DESC
        `, params),
        
        // File Status statistics with tenant filter
        pool.query(`
          SELECT 
            f.name as label,
            COUNT(a.id)::INTEGER as value
          FROM applicant_details a
          LEFT JOIN file_status f ON a.file_status = f.id
          WHERE f.name IS NOT NULL ${centerFilterAnd('a')}
          GROUP BY f.id, f.name
          ORDER BY value DESC
        `, params),
        
        // File Condition statistics with tenant filter
        pool.query(`
          SELECT 
            f.name as label,
            COUNT(a.id)::INTEGER as value
          FROM applicant_details a
          LEFT JOIN file_condition f ON a.file_condition = f.id
          WHERE f.name IS NOT NULL ${centerFilterAnd('a')}
          GROUP BY f.id, f.name
          ORDER BY value DESC
        `, params),
        
        // Summary statistics with tenant filter
        pool.query(`
          SELECT 
            COUNT(*)::INTEGER as total_applicants,
            COUNT(CASE WHEN file_status = (SELECT id FROM file_status WHERE name = 'Active' LIMIT 1) THEN 1 END)::INTEGER as active_applicants,
            COUNT(CASE WHEN created_at >= DATE_TRUNC('month', CURRENT_DATE) THEN 1 END)::INTEGER as new_this_month,
            (SELECT COUNT(*)::INTEGER FROM food_assistance fa WHERE ${centerFilterCondition('fa')}) AS total_food_aid,
            (SELECT COUNT(*)::INTEGER FROM home_visit hv WHERE ${centerFilterCondition('hv')}) AS total_home_visits,
            (SELECT COUNT(*)::INTEGER FROM programs p WHERE ${centerFilterCondition('p')}) AS total_programs
          FROM applicant_details a
          WHERE ${centerFilterCondition('a')}
        `, params),

        // Applicant trend (last 8 months)
        pool.query(`
          WITH months AS (
            SELECT generate_series(
              date_trunc('month', CURRENT_DATE) - INTERVAL '7 months',
              date_trunc('month', CURRENT_DATE),
              INTERVAL '1 month'
            ) AS month_start
          )
          SELECT
            months.month_start,
            COALESCE(counts.value, 0)::INTEGER AS value
          FROM months
          LEFT JOIN (
            SELECT 
              date_trunc('month', a.created_at) AS month_start,
              COUNT(*)::INTEGER AS value
            FROM applicant_details a
            WHERE ${centerFilterCondition('a')}
              AND a.created_at >= date_trunc('month', CURRENT_DATE) - INTERVAL '7 months'
            GROUP BY 1
          ) counts ON counts.month_start = months.month_start
          ORDER BY months.month_start
        `, params),

        // Food aid trend (last 8 months)
        pool.query(`
          WITH months AS (
            SELECT generate_series(
              date_trunc('month', CURRENT_DATE) - INTERVAL '7 months',
              date_trunc('month', CURRENT_DATE),
              INTERVAL '1 month'
            ) AS month_start
          )
          SELECT
            months.month_start,
            COALESCE(counts.value, 0)::INTEGER AS value
          FROM months
          LEFT JOIN (
            SELECT 
              date_trunc('month', fa.created_at) AS month_start,
              COUNT(*)::INTEGER AS value
            FROM food_assistance fa
            WHERE ${centerFilterCondition('fa')}
              AND fa.created_at >= date_trunc('month', CURRENT_DATE) - INTERVAL '7 months'
            GROUP BY 1
          ) counts ON counts.month_start = months.month_start
          ORDER BY months.month_start
        `, params),

        // Home visits trend (last 8 months)
        pool.query(`
          WITH months AS (
            SELECT generate_series(
              date_trunc('month', CURRENT_DATE) - INTERVAL '7 months',
              date_trunc('month', CURRENT_DATE),
              INTERVAL '1 month'
            ) AS month_start
          )
          SELECT
            months.month_start,
            COALESCE(counts.value, 0)::INTEGER AS value
          FROM months
          LEFT JOIN (
            SELECT 
              date_trunc('month', hv.created_at) AS month_start,
              COUNT(*)::INTEGER AS value
            FROM home_visit hv
            WHERE ${centerFilterCondition('hv')}
              AND hv.created_at >= date_trunc('month', CURRENT_DATE) - INTERVAL '7 months'
            GROUP BY 1
          ) counts ON counts.month_start = months.month_start
          ORDER BY months.month_start
        `, params),

        // Programs trend (last 8 months)
        pool.query(`
          WITH months AS (
            SELECT generate_series(
              date_trunc('month', CURRENT_DATE) - INTERVAL '7 months',
              date_trunc('month', CURRENT_DATE),
              INTERVAL '1 month'
            ) AS month_start
          )
          SELECT
            months.month_start,
            COALESCE(counts.value, 0)::INTEGER AS value
          FROM months
          LEFT JOIN (
            SELECT 
              date_trunc('month', p.created_at) AS month_start,
              COUNT(*)::INTEGER AS value
            FROM programs p
            WHERE ${centerFilterCondition('p')}
              AND p.created_at >= date_trunc('month', CURRENT_DATE) - INTERVAL '7 months'
            GROUP BY 1
          ) counts ON counts.month_start = months.month_start
          ORDER BY months.month_start
        `, params),
      ]);

      const mapTrendValues = (rows) => rows.map((row) => Number(row.value) || 0);
      const calculateChange = (series) => {
        if (!Array.isArray(series) || series.length < 2) return null;
        const prev = series[series.length - 2];
        const current = series[series.length - 1];
        if (prev === 0) {
          if (current === 0) return 0;
          return 100;
        }
        return ((current - prev) / prev) * 100;
      };

      const applicantTrendSeries = mapTrendValues(applicantTrendStats.rows);
      const foodAidTrendSeries = mapTrendValues(foodAidTrendStats.rows);
      const homeVisitTrendSeries = mapTrendValues(homeVisitTrendStats.rows);
      const programsTrendSeries = mapTrendValues(programsTrendStats.rows);

      const summaryRow = summaryStats.rows[0] || {
        total_applicants: 0,
        active_applicants: 0,
        new_this_month: 0,
        total_food_aid: 0,
        total_home_visits: 0,
        total_programs: 0,
      };

      return {
        nationality: nationalityStats.rows,
        gender: genderStats.rows,
        education: educationStats.rows,
        race: raceStats.rows,
        suburbs: suburbStats.rows,
        employment: employmentStats.rows,
        marital: maritalStats.rows,
        fileStatus: fileStatusStats.rows,
        fileCondition: fileConditionStats.rows,
        summary: {
          total_applicants: Number(summaryRow.total_applicants) || 0,
          active_applicants: Number(summaryRow.active_applicants) || 0,
          new_this_month: Number(summaryRow.new_this_month) || 0,
          total_food_aid: Number(summaryRow.total_food_aid) || 0,
          total_home_visits: Number(summaryRow.total_home_visits) || 0,
          total_programs: Number(summaryRow.total_programs) || 0,
        },
        trends: {
          applicants: applicantTrendSeries,
          foodAid: foodAidTrendSeries,
          homeVisits: homeVisitTrendSeries,
          programs: programsTrendSeries,
          applicantsChange: calculateChange(applicantTrendSeries),
          foodAidChange: calculateChange(foodAidTrendSeries),
          homeVisitsChange: calculateChange(homeVisitTrendSeries),
          programsChange: calculateChange(programsTrendSeries),
        },
      };
    } catch (err) {
      throw new Error('Error fetching applicant statistics: ' + err.message);
    }
  },

  getStatisticsApplications: async (duration, centerId, hasGlobalAccess) => {
    try {
      const config = getDurationConfig(duration);
      const parsedCenterId = Number(centerId);
      const normalizedCenterId = Number.isFinite(parsedCenterId) ? parsedCenterId : null;
      const centerParam = hasGlobalAccess ? null : normalizedCenterId;
      const params = [centerParam];
      const centerParamIndex = 1;

      const timeSeriesQueries = METRIC_DEFINITIONS.map((metric) =>
        pool.query(buildTimeSeriesQuery(metric, config, centerParamIndex), params)
      );

      const totalsQuery = pool.query(
        `
          SELECT
            (SELECT COUNT(*)::INTEGER FROM ${METRIC_DEFINITIONS[0].table} ${METRIC_DEFINITIONS[0].alias} WHERE ${buildCenterCondition(METRIC_DEFINITIONS[0].alias, centerParamIndex)}) AS files_created_total,
            (SELECT COUNT(*)::INTEGER FROM ${METRIC_DEFINITIONS[1].table} ${METRIC_DEFINITIONS[1].alias} WHERE ${buildCenterCondition(METRIC_DEFINITIONS[1].alias, centerParamIndex)}) AS food_aid_given_total,
            (SELECT COUNT(*)::INTEGER FROM ${METRIC_DEFINITIONS[2].table} ${METRIC_DEFINITIONS[2].alias} WHERE ${buildCenterCondition(METRIC_DEFINITIONS[2].alias, centerParamIndex)}) AS financial_aid_given_total,
            (SELECT COUNT(*)::INTEGER FROM ${METRIC_DEFINITIONS[3].table} ${METRIC_DEFINITIONS[3].alias} WHERE ${buildCenterCondition(METRIC_DEFINITIONS[3].alias, centerParamIndex)}) AS home_visits_done_total
        `,
        params
      );

      const queryResults = await Promise.all([...timeSeriesQueries, totalsQuery]);

      const firstSeriesRows = Array.isArray(queryResults[0]?.rows) ? queryResults[0].rows : [];
      const categories = firstSeriesRows.map((row) => row.period_start instanceof Date
        ? row.period_start.toISOString()
        : new Date(row.period_start).toISOString()
      );
      const formattedCategories = firstSeriesRows.map((row) =>
        formatPeriodLabel(row.period_start, config)
      );

      const metrics = METRIC_DEFINITIONS.map((metric, index) => {
        const seriesRows = queryResults[index].rows || [];
        const data = seriesRows.map((row) => Number(row.value) || 0);
        const rangeTotal = data.reduce((acc, val) => acc + (Number.isFinite(val) ? val : 0), 0);
        return {
          key: metric.key,
          label: metric.label,
          icon: metric.icon,
          data,
          rangeTotal,
        };
      });

      const totalsRow = queryResults[queryResults.length - 1].rows[0] || {};

      const overallTotals = {
        filesCreated: Number(totalsRow.files_created_total) || 0,
        foodAidGiven: Number(totalsRow.food_aid_given_total) || 0,
        financialAidGiven: Number(totalsRow.financial_aid_given_total) || 0,
        homeVisitsDone: Number(totalsRow.home_visits_done_total) || 0,
      };

      return {
        duration: config.key,
        categories,
        categoryLabels: formattedCategories,
        metrics: metrics.map((metric) => ({
          ...metric,
          overallTotal: overallTotals[metric.key] ?? 0,
        })),
      };
    } catch (err) {
      throw new Error('Error fetching dashboard statistics applications: ' + err.message);
    }
  },
};

module.exports = dashboardModel;

